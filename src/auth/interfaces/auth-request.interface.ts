import { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    userId: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    partnerId?: string;
  };
}
