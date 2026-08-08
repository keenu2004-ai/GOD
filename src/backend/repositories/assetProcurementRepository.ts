import dbService from '../database/db.js';

export interface CreateAssetRequestDTO {
  category: string;
  request_type?: string;
  reason: string;
  priority?: string;
  required_date?: string;
  estimated_cost?: number;
}

export class AssetProcurementRepository {

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
       VALUES ($1, 'ASSET_REQUEST_SUBMITTED', 'ASSET_PROCUREMENT', $2)`,
      [employeeId, `Submitted Asset Request ${reqNum} for category '${dto.category}'`]
    );

    return res.rows[0];
  }

  async getAssetRequests(employeeId?: number, isManager = false) {
    let sql = `
      SELECT ar.*, e.first_name, e.last_name, e.employee_code, e.department
      FROM asset_requests ar
      JOIN employees e ON ar.employee_id = e.id
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
       VALUES ($1, 'ASSET_REQUEST_REVIEWED', 'ASSET_PROCUREMENT', $2)`,
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
       VALUES ($1, 'PO_CREATED', 'ASSET_PROCUREMENT', $2)`,
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

  // Automatically register received asset into Master Inventory!
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
      `INSERT INTO assets (asset_name, asset_code, category, serial_number, purchase_date, value, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'AVAILABLE') RETURNING *`,
      [`Procured ${category} (${po.vendor_name})`, assetCode, category, serialNum, po.total_amount]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PO_RECEIVED_INVENTORY_REGISTERED', 'ASSET_PROCUREMENT', $2)`,
      [creatorId, `Received PO ${po.po_number}. Registered asset ${assetCode} into inventory.`]
    );

    return { po_id: poId, registered_asset: assetRes.rows[0] };
  }
}

export const assetProcurementRepository = new AssetProcurementRepository();
