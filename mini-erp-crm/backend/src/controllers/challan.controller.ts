import { Request, Response, NextFunction } from 'express';
import { ChallanService } from '../services/challan.service';
import { createChallanSchema, updateChallanSchema } from '../validators/challan.validator';

export class ChallanController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const validatedData = createChallanSchema.parse(req.body);
      const data = await ChallanService.createChallan(validatedData, req.user.userId);
      return res.status(201).json({
        success: true,
        message: `Challan created successfully as ${validatedData.status}`,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const search = req.query.search as string | undefined;
      const customerId = req.query.customerId as string | undefined;
      const status = req.query.status as any | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = await ChallanService.getChallans({
        page,
        limit,
        search,
        customerId,
        status,
        startDate,
        endDate,
      });

      return res.status(200).json({
        success: true,
        message: 'Challans retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ChallanService.getChallanById(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Challan retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const validatedData = updateChallanSchema.parse(req.body);
      const data = await ChallanService.updateChallan(req.params.id, validatedData, req.user.userId);
      return res.status(200).json({
        success: true,
        message: 'Challan updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const data = await ChallanService.confirmChallan(req.params.id, req.user.userId);
      return res.status(200).json({
        success: true,
        message: 'Challan confirmed and inventory updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const data = await ChallanService.cancelChallan(req.params.id, req.user.userId);
      return res.status(200).json({
        success: true,
        message: 'Challan cancelled and stock levels restored successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
