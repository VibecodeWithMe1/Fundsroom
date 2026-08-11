import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { createProductSchema, updateProductSchema, adjustStockSchema } from '../validators/product.validator';

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const validatedData = createProductSchema.parse(req.body);
      const data = await ProductService.createProduct(validatedData, req.user.userId);
      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
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
      const category = req.query.category as string | undefined;
      const lowStockOnly = req.query.lowStockOnly === 'true';

      const data = await ProductService.getProducts({
        page,
        limit,
        search,
        category,
        lowStockOnly,
      });

      return res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ProductService.getProductById(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Product retrieved successfully',
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
      const validatedData = updateProductSchema.parse(req.body);
      const data = await ProductService.updateProduct(req.params.id, validatedData, req.user.userId);
      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const validatedData = adjustStockSchema.parse(req.body);
      const data = await ProductService.adjustStock(req.params.id, validatedData, req.user.userId);
      return res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const productId = req.query.productId as string | undefined;

      const data = await ProductService.getStockMovements({
        page,
        limit,
        productId,
      });

      return res.status(200).json({
        success: true,
        message: 'Stock movements retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
