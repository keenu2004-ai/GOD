import { Request } from 'express';
import { ValidationRule } from '../middlewares/validateRequest.js';

export const isRequired = (fieldName: string, paramType: 'body' | 'params' | 'query' = 'body'): ValidationRule => {
  return (req: Request) => {
    const val = req[paramType]?.[fieldName];
    if (val === undefined || val === null || val === '') {
      return `${fieldName} is required in ${paramType}`;
    }
    return null;
  };
};

export const isEmail = (fieldName: string = 'email'): ValidationRule => {
  return (req: Request) => {
    const email = req.body?.[fieldName];
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return `Invalid email address format for ${fieldName}`;
    }
    return null;
  };
};

export const isNumericId = (paramName: string = 'id'): ValidationRule => {
  return (req: Request) => {
    const id = req.params?.[paramName];
    if (!id || isNaN(Number(id))) {
      return `Invalid parameters: ${paramName} must be a number`;
    }
    return null;
  };
};

export const isMinLength = (fieldName: string, minLength: number): ValidationRule => {
  return (req: Request) => {
    const val = req.body?.[fieldName];
    if (val && String(val).length < minLength) {
      return `${fieldName} must be at least ${minLength} characters long`;
    }
    return null;
  };
};
