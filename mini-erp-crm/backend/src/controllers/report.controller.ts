import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  static async getSalesSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getSalesSummary();
      return res.status(200).json({
        success: true,
        message: 'Sales reports data retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getInventoryForecast();
      return res.status(200).json({
        success: true,
        message: 'Inventory forecasting data retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
