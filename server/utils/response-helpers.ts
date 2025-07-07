/**
 * Server response helpers - DRY solution for repeated response patterns
 */
import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Standardized response helpers to reduce repetition in routes
 */
export class ResponseHelpers {
  /**
   * Send successful response with data
   */
  static success<T>(res: Response, data: T, message?: string, status = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    return res.status(status).json(response);
  }

  /**
   * Send successful response with pagination
   */
  static successWithPagination<T>(
    res: Response, 
    data: T[], 
    pagination: ApiResponse['pagination'],
    message?: string,
    status = 200
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      message,
      pagination
    };
    return res.status(status).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response, 
    message: string, 
    status = 400, 
    errors?: any[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors
    };
    return res.status(status).json(response);
  }

  /**
   * Send validation error response
   */
  static validationError(res: Response, errors: any[]): Response {
    return ResponseHelpers.error(res, 'Validation failed', 400, errors);
  }

  /**
   * Send not found response
   */
  static notFound(res: Response, resource = 'Resource'): Response {
    return ResponseHelpers.error(res, `${resource} not found`, 404);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return ResponseHelpers.error(res, message, 401);
  }

  /**
   * Send forbidden response
   */
  static forbidden(res: Response, message = 'Forbidden'): Response {
    return ResponseHelpers.error(res, message, 403);
  }

  /**
   * Send internal server error response
   */
  static serverError(res: Response, message = 'Internal server error'): Response {
    return ResponseHelpers.error(res, message, 500);
  }

  /**
   * Send created response
   */
  static created<T>(res: Response, data: T, message?: string): Response {
    return ResponseHelpers.success(res, data, message, 201);
  }

  /**
   * Send no content response
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

/**
 * Async route handler wrapper to reduce try-catch repetition
 */
export function asyncHandler(
  fn: (req: any, res: Response, next: any) => Promise<any>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Route error:', error);
      ResponseHelpers.serverError(res, error.message);
    });
  };
}

/**
 * Validation middleware wrapper
 */
export function validateRequest(schema: any) {
  return (req: any, res: Response, next: any) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return ResponseHelpers.validationError(res, validation.error.errors);
    }
    req.validatedData = validation.data;
    next();
  };
}

/**
 * Pagination helper
 */
export function parsePagination(req: any) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

export function createPagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages
  };
}

/**
 * Common route patterns
 */
export class CrudHelpers {
  /**
   * Generic GET all with pagination
   */
  static getAll<T>(
    storage: any,
    methodName: string,
    resourceName: string
  ) {
    return asyncHandler(async (req, res) => {
      const { page, limit, offset } = parsePagination(req);
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
      
      const items = await storage[methodName](filters, limit, offset);
      const total = await storage[`get${resourceName}Count`](filters);
      const pagination = createPagination(page, limit, total);
      
      ResponseHelpers.successWithPagination(res, items, pagination);
    });
  }

  /**
   * Generic GET by ID
   */
  static getById<T>(
    storage: any,
    methodName: string,
    resourceName: string
  ) {
    return asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ResponseHelpers.error(res, 'Invalid ID');
      }

      const item = await storage[methodName](id);
      if (!item) {
        return ResponseHelpers.notFound(res, resourceName);
      }

      ResponseHelpers.success(res, item);
    });
  }

  /**
   * Generic CREATE
   */
  static create<T>(
    storage: any,
    methodName: string,
    resourceName: string,
    schema: any
  ) {
    return asyncHandler(async (req, res) => {
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return ResponseHelpers.validationError(res, validation.error.errors);
      }

      const item = await storage[methodName](validation.data);
      ResponseHelpers.created(res, item, `${resourceName} created successfully`);
    });
  }

  /**
   * Generic UPDATE
   */
  static update<T>(
    storage: any,
    methodName: string,
    resourceName: string,
    schema: any
  ) {
    return asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ResponseHelpers.error(res, 'Invalid ID');
      }

      const validation = schema.partial().safeParse(req.body);
      if (!validation.success) {
        return ResponseHelpers.validationError(res, validation.error.errors);
      }

      const item = await storage[methodName](id, validation.data);
      if (!item) {
        return ResponseHelpers.notFound(res, resourceName);
      }

      ResponseHelpers.success(res, item, `${resourceName} updated successfully`);
    });
  }

  /**
   * Generic DELETE
   */
  static delete<T>(
    storage: any,
    methodName: string,
    resourceName: string
  ) {
    return asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return ResponseHelpers.error(res, 'Invalid ID');
      }

      const success = await storage[methodName](id);
      if (!success) {
        return ResponseHelpers.notFound(res, resourceName);
      }

      ResponseHelpers.noContent(res);
    });
  }
}