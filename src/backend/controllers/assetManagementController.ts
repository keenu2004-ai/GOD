import { Request, Response } from 'express';
import { assetManagementService } from '../services/assetManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AssetManagementController {
  // POST /assets/create
  async createAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetManagementService.createAsset(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Asset created in inventory'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/all
  async getAssets(req: Request, res: Response) {
    try {
      const data = await assetManagementService.getAssets();
      return res.json(sendSuccess(data, 'Assets inventory retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/assign
  async assignAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { asset_id, employee_id } = req.body;
      const data = await assetManagementService.assignAsset(parseInt(asset_id), parseInt(employee_id), user?.id || 1);
      return res.json(sendSuccess(data, 'Asset assigned to employee'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /assets/transfer
  async transferAsset(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { asset_id, from_employee_id, to_employee_id, reason } = req.body;
      const data = await assetManagementService.transferAsset(
        parseInt(asset_id), parseInt(from_employee_id || '0'), parseInt(to_employee_id), reason, user?.id || 1
      );
      return res.json(sendSuccess(data, 'Asset transferred successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/my-assets
  async getMyAssets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetManagementService.getMyAssignedAssets(user?.id || 1);
      return res.json(sendSuccess(data, 'My assigned assets retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /assets/requests
  async createRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await assetManagementService.createAssetRequest(req.body, user?.id || 1);
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
      const data = await assetManagementService.getAssetRequests(user?.id, isManager);
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
      const data = await assetManagementService.reviewAssetRequest(id, status, user?.id || 1);
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
      const data = await assetManagementService.addVendorQuotation(id, vendor_name, quotation_amount, delivery_days);
      return res.status(201).json(sendSuccess(data, 'Vendor quotation added'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/requests/:id/quotations
  async getQuotations(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await assetManagementService.getVendorQuotations(id);
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
      const data = await assetManagementService.createPurchaseOrder(request_id, vendor_name, total_amount, expected_delivery, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Purchase order generated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /assets/purchase-orders
  async getPOs(req: Request, res: Response) {
    try {
      const data = await assetManagementService.getPurchaseOrders();
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
      const data = await assetManagementService.receivePurchaseOrder(id, user?.id || 1);
      return res.json(sendSuccess(data, 'PO shipment received & asset auto-registered into master inventory'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const assetManagementController = new AssetManagementController();
