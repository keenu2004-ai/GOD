import { Request, Response } from 'express';
import { assetProcurementService } from '../services/assetProcurementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AssetProcurementController {
  // POST /assets/requests
  async createRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetProcurementService.createAssetRequest(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Asset request submitted successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/requests
  async getRequests(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(user?.role);
      const data = await assetProcurementService.getAssetRequests(user?.id, isManager);
      return res.json(sendSuccess(data, 'Asset requests retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /assets/requests/:id/review
  async reviewRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const data = await assetProcurementService.reviewAssetRequest(id, status, user?.id || 1);
      return res.json(sendSuccess(data, `Request status updated to ${status}`));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /assets/requests/:id/quotations
  async addQuotation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { vendor_name, quotation_amount, delivery_days } = req.body;
      const data = await assetProcurementService.addVendorQuotation(id, vendor_name, quotation_amount, delivery_days);
      return res.status(201).json(sendSuccess(data, 'Vendor quotation added'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/requests/:id/quotations
  async getQuotations(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await assetProcurementService.getVendorQuotations(id);
      return res.json(sendSuccess(data, 'Vendor quotations retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/purchase-orders
  async createPO(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { request_id, vendor_name, total_amount, expected_delivery } = req.body;
      const data = await assetProcurementService.createPurchaseOrder(request_id, vendor_name, total_amount, expected_delivery, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Purchase order generated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/purchase-orders
  async getPOs(req: Request, res: Response) {
    try {
      const data = await assetProcurementService.getPurchaseOrders();
      return res.json(sendSuccess(data, 'Purchase orders retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/purchase-orders/:id/receive
  async receivePO(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await assetProcurementService.receivePurchaseOrder(id, user?.id || 1);
      return res.json(sendSuccess(data, 'PO shipment received & asset auto-registered into master inventory'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const assetProcurementController = new AssetProcurementController();
