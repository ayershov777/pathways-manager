import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "./error.middleware";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}

/**
 * Middleware to authenticate JWT token
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(createError('Authentication required', 401));
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return next(createError('Authentication required', 401));
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        
        // Add user id to request
        req.user = { id: decoded.id };
        
        next();
    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
            return next(createError('Invalid token', 401));
        }
        next(err);
    }
};

/**
 * Optional authentication - doesn't reject if no token present
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return next();
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        
        // Add user id to request
        req.user = { id: decoded.id };
        
        next();
    } catch (err) {
        // Don't reject for optional auth, just continue
        next();
    }
};