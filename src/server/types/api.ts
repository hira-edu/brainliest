import { Request, Response } from 'express';

export interface ApiRequest<T = any> extends Request {
  body: T;
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface ApiResponse<T = any> extends Response {
  json: (body: T) => this;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface ApiSuccess<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export type ApiHandler<T = any, R = any> = (
  req: ApiRequest<T>,
  res: ApiResponse<R>
) => Promise<void> | void;