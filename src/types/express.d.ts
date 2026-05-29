export {};

declare global {
  namespace Express {
    export interface Request {
      user?: {
        userId?: string;
        sub?: string;
        phoneNumber?: string;
        partnerId?: string;
        role?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        googleId?: string;
      };
    }
  }
}
