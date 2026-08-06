import { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(data: T, message: string = 'Success'): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function sendError(message: string): ApiResponse<null> {
  return {
    success: false,
    message,
    data: null,
  };
}
