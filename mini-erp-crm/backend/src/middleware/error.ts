import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the complete error stack in development/test
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.url} :`, err);
  }

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.errorCode,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'fields';
      return res.status(409).json({
        success: false,
        message: `Conflict: A record with this ${target} already exists.`,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        },
      });
    }

    // P2003: Foreign key constraint failed
    if (err.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Conflict: Foreign key constraint fails. Referenced record not found or cannot delete.',
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
        },
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
};
