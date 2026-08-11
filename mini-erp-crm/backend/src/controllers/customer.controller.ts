import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { createCustomerSchema, updateCustomerSchema, createFollowUpSchema } from '../validators/customer.validator';

export class CustomerController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const validatedData = createCustomerSchema.parse(req.body);
      const data = await CustomerService.createCustomer(validatedData, req.user.userId);
      return res.status(201).json({
        success: true,
        message: 'Customer created successfully',
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
      const status = req.query.status as any | undefined;
      const customerType = req.query.customerType as any | undefined;
      const leadStage = req.query.leadStage as string | undefined;

      const data = await CustomerService.getCustomers({
        page,
        limit,
        search,
        status,
        customerType,
        leadStage,
      });

      return res.status(200).json({
        success: true,
        message: 'Customers retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CustomerService.getCustomerById(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Customer retrieved successfully',
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
      const validatedData = updateCustomerSchema.parse(req.body);
      const data = await CustomerService.updateCustomer(req.params.id, validatedData, req.user.userId);
      return res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const data = await CustomerService.deleteCustomer(req.params.id, req.user.userId);
      return res.status(200).json({
        success: true,
        message: 'Customer deactivated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const validatedData = createFollowUpSchema.parse(req.body);
      const data = await CustomerService.createFollowUp(req.params.customerId, validatedData, req.user.userId);
      return res.status(201).json({
        success: true,
        message: 'Follow-up created successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CustomerService.getFollowUps(req.params.customerId);
      return res.status(200).json({
        success: true,
        message: 'Follow-ups retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStageHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CustomerService.getStageHistory(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Customer stage conversion history retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
