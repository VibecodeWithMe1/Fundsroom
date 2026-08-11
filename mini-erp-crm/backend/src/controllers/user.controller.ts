import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

export class UserController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const data = await UserService.createUser(validatedData);
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.getUsers();
      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.getUserById(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const data = await UserService.updateUser(req.params.id, validatedData);
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UserService.deleteUser(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
