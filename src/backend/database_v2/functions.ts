import { dbConnectionV2 } from './connection.js';

export async function initializeFunctions(): Promise<void> {
  const functionsSQL = `
  -- Stored procedure to process attendance punch and automatically handle IN/OUT & status calculation
  CREATE OR REPLACE FUNCTION process_attendance_punch(
    p_employee_id INTEGER,
    p_punch_type VARCHAR(20),
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_device_info VARCHAR
  )
  RETURNS TABLE (attendance_id INTEGER, status VARCHAR, punch_time TIMESTAMP WITH TIME ZONE) AS $$
  DECLARE
    v_today DATE := CURRENT_DATE;
    v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
    v_att_id INTEGER;
    v_existing_punch_in TIMESTAMP WITH TIME ZONE;
    v_calc_hours NUMERIC(4,2);
  BEGIN
    SELECT id, punch_in INTO v_att_id, v_existing_punch_in
    FROM attendance
    WHERE employee_id = p_employee_id AND date = v_today AND deleted_at IS NULL;

    IF v_att_id IS NULL THEN
      INSERT INTO attendance (
        employee_id, date, punch_in, punch_in_latitude, punch_in_longitude, status
      ) VALUES (
        p_employee_id, v_today, v_now, p_latitude, p_longitude, 'PRESENT'
      ) RETURNING id INTO v_att_id;
    ELSIF p_punch_type = 'OUT' THEN
      v_calc_hours := ROUND(EXTRACT(EPOCH FROM (v_now - v_existing_punch_in)) / 3600.0, 2);
      UPDATE attendance
      SET punch_out = v_now,
          punch_out_latitude = p_latitude,
          punch_out_longitude = p_longitude,
          total_hours = v_calc_hours,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = v_att_id;
    END IF;

    -- Record granular log
    INSERT INTO attendance_logs (
      attendance_id, employee_id, punch_time, punch_type, latitude, longitude, device_info
    ) VALUES (
      v_att_id, p_employee_id, v_now, p_punch_type, p_latitude, p_longitude, p_device_info
    );

    RETURN QUERY
    SELECT a.id, a.status, v_now
    FROM attendance a
    WHERE a.id = v_att_id;
  END;
  $$ LANGUAGE plpgsql;

  -- Stored function for automated monthly leave accrual
  CREATE OR REPLACE FUNCTION accrue_monthly_leaves(p_year INTEGER)
  RETURNS INTEGER AS $$
  DECLARE
    v_updated_count INTEGER := 0;
  BEGIN
    UPDATE leave_balances lb
    SET total_allocated = total_allocated + lp.monthly_accrual_rate,
        remaining_days = remaining_days + lp.monthly_accrual_rate,
        updated_at = CURRENT_TIMESTAMP
    FROM leave_policies lp
    WHERE lb.leave_type_id = lp.leave_type_id
      AND lb.year = p_year
      AND lb.deleted_at IS NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
  END;
  $$ LANGUAGE plpgsql;

  -- Universal Soft Delete Stored Function
  CREATE OR REPLACE FUNCTION soft_delete_record(
    p_table_name VARCHAR,
    p_record_id INTEGER,
    p_user_id INTEGER
  )
  RETURNS BOOLEAN AS $$
  BEGIN
    EXECUTE format(
      'UPDATE %I SET deleted_at = CURRENT_TIMESTAMP, updated_by = %L WHERE id = %L AND deleted_at IS NULL',
      p_table_name, p_user_id, p_record_id
    );
    RETURN FOUND;
  END;
  $$ LANGUAGE plpgsql;
  `;

  await dbConnectionV2.query(functionsSQL);
}
