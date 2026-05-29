import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    sub: string;
    phoneNumber: string;
    partnerId?: string;
    role: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    googleId?: string;
  };
}
