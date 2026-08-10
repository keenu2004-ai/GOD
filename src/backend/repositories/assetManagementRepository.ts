import dbService from '../database/db.js';

export interface CreateAssetDTO {
  asset_name: string;
  category: string;
  serial_number: string;
  value: number;
}

export interface CreateAssetRequestDTO {
  category: string;
  request_type?: string;
  reason: string;
  priority?: string;
  required_date?: string;
  estimated_cost?: number;
}

export class AssetManagementRepository {

  // ─── Master Asset Inventory Engine ──────────────────────────────────────────
  async createAsset(dto: CreateAssetDTO, creatorId: number) {
    const tagNum = Math.floor(100000 + Math.random() * 900000);
    const assetCode = `AST-2026-${tagNum}`;

    const res = await dbService.query(
      `INSERT INTO assets (asset_name, asset_code, category, serial_number, purchase_date, value, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'AVAILABLE') RETURNING *`,
      [dto.asset_name, assetCode, dto.category, dto.serial_number, dto.value]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_CREATED', 'ASSET_MANAGEMENT', $2)`,
      [creatorId, `Created Asset ${dto.asset_name} (${assetCode})`]
    );

    return res.rows[0];
  }

  async getAssets() {
    const res = await dbService.query(
      `SELECT a.*, e.first_name, e.last_name
       FROM assets a
       LEFT JOIN employees e ON a.assigned_to_employee_id = e.id
       ORDER BY a.created_at DESC`
    );
    return res.rows;
  }

  // ─── Asset Assignment & Transfer Engine ────────────────────────────────────
  async assignAsset(assetId: number, employeeId: number, assignerId: number) {
    await dbService.query(
      `UPDATE assets SET status = 'ALLOCATED', assigned_to_employee_id = $1 WHERE id = $2`,
      [employeeId, assetId]
    );

    const assignRes = await dbService.query(
      `INSERT INTO asset_assignments (asset_id, employee_id, assignment_date, status)
       VALUES ($1, $2, CURRENT_DATE, 'ASSIGNED') RETURNING *`,
      [assetId, employeeId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_ASSIGNED', 'ASSET_MANAGEMENT', $2)`,
      [assignerId, `Assigned Asset #${assetId} to Employee #${employeeId}`]
    );

    return assignRes.rows[0];
  }

  async transferAsset(assetId: number, fromEmpId: number, toEmpId: number, reason: string, transferrerId: number) {
    await dbService.query(
      `UPDATE assets SET assigned_to_employee_id = $1 WHERE id = $2`,
      [toEmpId, assetId]
    );

    const transRes = await dbService.query(
      `INSERT INTO asset_transfers (asset_id, from_employee_id, to_employee_id, reason, transferred_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [assetId, fromEmpId, toEmpId, reason, transferrerId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_TRANSFERRED', 'ASSET_MANAGEMENT', $2)`,
      [transferrerId, `Transferred Asset #${assetId} to Employee #${toEmpId}: ${reason}`]
    );

    return transRes.rows[0];
  }

  // ─── My Assigned Assets Self-Service ───────────────────────────────────────
  async getMyAssignedAssets(employeeId: number) {
    const res = await dbService.query(
      `SELECT * FROM assets WHERE assigned_to_employee_id = $1 ORDER BY created_at DESC`,
      [employeeId]
    );
    return res.rows;
  }

  // ─── Employee Asset Request Workflows ────────────────────────────────────
  async createAssetRequest(dto: CreateAssetRequestDTO, employeeId: number) {
    const reqNum = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await dbService.query(
      `INSERT INTO asset_requests (
        request_number, employee_id, category, request_type, reason, priority, required_date, estimated_cost, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUBMITTED') RETURNING *`,
      [
        reqNum, employeeId, dto.category, dto.request_type || 'NEW_ASSET',
        dto.reason, dto.priority || 'NORMAL', dto.required_date || null, dto.estimated_cost || 0
      ]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_REQUEST_SUBMITTED', 'ASSET_MANAGEMENT', $2)`,
      [employeeId, `Submitted Asset Request ${reqNum} for category '${dto.category}'`]
    );

    return res.rows[0];
  }

  async getAssetRequests(employeeId?: number, isManager = false) {
    let sql = `
      SELECT ar.*, e.first_name, e.last_name, e.employee_code, d.name as department_name
      FROM asset_requests ar
      JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    const params: any[] = [];

    if (!isManager && employeeId) {
      sql += ` WHERE ar.employee_id = $1`;
      params.push(employeeId);
    }

    sql += ` ORDER BY ar.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async reviewAssetRequest(requestId: number, status: 'APPROVED' | 'REJECTED' | 'IN_PROCUREMENT', reviewerId: number) {
    const res = await dbService.query(
      `UPDATE asset_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, requestId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_REQUEST_REVIEWED', 'ASSET_MANAGEMENT', $2)`,
      [reviewerId, `Asset Request #${requestId} status set to ${status}`]
    );

    return res.rows[0];
  }

  // ─── Vendor Quotations & Purchase Order Engine ────────────────────────────
  async addVendorQuotation(requestId: number, vendorName: string, amount: number, deliveryDays = 3) {
    const res = await dbService.query(
      `INSERT INTO vendor_quotations (request_id, vendor_name, quotation_amount, delivery_days)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [requestId, vendorName, amount, deliveryDays]
    );
    return res.rows[0];
  }

  async getVendorQuotations(requestId: number) {
    const res = await dbService.query(
      `SELECT * FROM vendor_quotations WHERE request_id = $1 ORDER BY quotation_amount ASC`,
      [requestId]
    );
    return res.rows;
  }

  async createPurchaseOrder(requestId: number, vendorName: string, totalAmount: number, expectedDelivery: string, creatorId: number) {
    const poNum = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await dbService.query(
      `INSERT INTO purchase_orders (po_number, request_id, vendor_name, total_amount, expected_delivery, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'ORDERED', $6) RETURNING *`,
      [poNum, requestId, vendorName, totalAmount, expectedDelivery, creatorId]
    );

    await dbService.query(
      `UPDATE asset_requests SET status = 'IN_PROCUREMENT' WHERE id = $1`,
      [requestId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PO_CREATED', 'ASSET_MANAGEMENT', $2)`,
      [creatorId, `Created Purchase Order ${poNum} for vendor ${vendorName}`]
    );

    return res.rows[0];
  }

  async getPurchaseOrders() {
    const res = await dbService.query(
      `SELECT po.*, ar.request_number, ar.category, ar.employee_id
       FROM purchase_orders po
       LEFT JOIN asset_requests ar ON po.request_id = ar.id
       ORDER BY po.created_at DESC`
    );
    return res.rows;
  }

  async receivePurchaseOrder(poId: number, creatorId: number) {
    const poRes = await dbService.query(`SELECT * FROM purchase_orders WHERE id = $1`, [poId]);
    const po = poRes.rows[0];
    if (!po) throw new Error('Purchase order not found');

    await dbService.query(`UPDATE purchase_orders SET status = 'RECEIVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [poId]);

    let category = 'Laptop';
    let reqEmployeeId = null;

    if (po.request_id) {
      const reqRes = await dbService.query(`SELECT * FROM asset_requests WHERE id = $1`, [po.request_id]);
      if (reqRes.rows[0]) {
        category = reqRes.rows[0].category;
        reqEmployeeId = reqRes.rows[0].employee_id;
        await dbService.query(`UPDATE asset_requests SET status = 'COMPLETED' WHERE id = $1`, [po.request_id]);
      }
    }

    const assetCode = `AST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const serialNum = `SN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const assetRes = await dbService.query(
      `INSERT INTO assets (asset_name, asset_code, category, serial_number, purchase_date, value, status, assigned_to_employee_id)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'AVAILABLE', $6) RETURNING *`,
      [`Procured ${category} (${po.vendor_name})`, assetCode, category, serialNum, po.total_amount, reqEmployeeId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PO_RECEIVED_INVENTORY_REGISTERED', 'ASSET_MANAGEMENT', $2)`,
      [creatorId, `Received PO ${po.po_number}. Registered asset ${assetCode} into inventory.`]
    );

    return { po_id: poId, registered_asset: assetRes.rows[0] };
  }
}

export const assetManagementRepository = new AssetManagementRepository();
