import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "../middleware/error.middleware";
import * as authService from "../services/auth.service";

/**
 * Sign up a new user
 */
const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = req.body;

        // Check if email is already in use
        const existingUser = await authService.findUserByEmail(email);
        if (existingUser) {
            return next(createError('Email already in use', 409));
        }

        // Create user (password already excluded by service)
        const user = await authService.createUser({ email, password, name });

        // Generate token
        const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, {
            expiresIn: '30d'
        });

        return res.status(201).json({
            token,
            user
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * Login user
 */
const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Find user with password for authentication
        const user = await authService.findUserByEmailWithPassword(email);
        if (!user) {
            return next(createError('Invalid credentials', 401));
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return next(createError('Invalid credentials', 401));
        }

        // Generate token
        const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!, {
            expiresIn: '30d'
        });

        // Get user without password for response
        const userWithoutPassword = await authService.findUserByEmail(email);

        return res.json({
            token,
            user: userWithoutPassword
        });
    } catch (err) {
        return next(err);
    }
};

export const controller = {
    signup,
    login
};
