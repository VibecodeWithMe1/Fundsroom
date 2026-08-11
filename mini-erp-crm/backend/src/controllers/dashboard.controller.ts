import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getDashboardKPIs();
      return res.status(200).json({
        success: true,
        message: 'Dashboard summary retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getAlerts();
      return res.status(200).json({
        success: true,
        message: 'Aggregated notifications alerts retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
