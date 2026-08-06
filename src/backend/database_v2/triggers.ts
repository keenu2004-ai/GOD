import { dbConnectionV2 } from './connection.js';

export async function initializeTriggersAndFunctions(): Promise<void> {
  const triggerSQL = `
  -- Function to automatically update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_timestamp_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create timestamp triggers for primary tables
  DO $$ 
  DECLARE 
    t text;
  BEGIN
    FOR t IN 
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
      EXECUTE format('
        DROP TRIGGER IF EXISTS trg_update_timestamp ON %I;
        CREATE TRIGGER trg_update_timestamp
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp_column();
      ', t, t);
    END LOOP;
  END $$;
  `;

  await dbConnectionV2.query(triggerSQL);
}
