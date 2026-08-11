import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const data = await AuthService.login(validatedData);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
      const data = await AuthService.getUserProfile(req.user.userId);
      return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: data },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }
}
