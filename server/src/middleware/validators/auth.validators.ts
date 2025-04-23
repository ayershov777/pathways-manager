import { Request, Response, NextFunction } from "express";
import Ajv, { JSONSchemaType, ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { createError } from "../error.middleware";

// Initialize Ajv instance
const ajv = new Ajv({
    allErrors: true,
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true,
});

// Add email format
addFormats(ajv);

// Schema for signup
const signupSchema = {
    type: "object",
    properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
        name: { type: "string", minLength: 1 }
    },
    required: ["email", "password", "name"],
    additionalProperties: false
} as JSONSchemaType<{ email: string, password: string, name: string }>;

// Schema for login
const loginSchema = {
    type: "object",
    properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 1 }
    },
    required: ["email", "password"],
    additionalProperties: false
} as JSONSchemaType<{ email: string, password: string }>;

// Compile the schemas
const validateSignupSchema = ajv.compile(signupSchema);
const validateLoginSchema = ajv.compile(loginSchema);

/**
 * Format validation errors from Ajv
 */
const formatValidationErrors = (errors: ErrorObject[] | null | undefined): string => {
    if (!errors || errors.length === 0) return 'Validation error';

    return errors.map((err) => {
        const path = err.instancePath ? err.instancePath.replace(/^\//, '') : '';
        const property = err.params.missingProperty || err.params.additionalProperty || '';
        const fullPath = path ? (property ? `${path}.${property}` : path) : property;

        let message = err.message || 'Invalid value';
        if (fullPath) {
            message = `${fullPath}: ${message}`;
        }

        return message;
    }).join(', ');
};

/**
 * Middleware to validate user signup
 */
export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
    // Validate against schema
    if (!validateSignupSchema(req.body)) {
        const errorMessage = formatValidationErrors(validateSignupSchema.errors);
        return next(createError(`Validation error: ${errorMessage}`, 400));
    }

    next();
};

/**
 * Middleware to validate user login
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    // Validate against schema
    if (!validateLoginSchema(req.body)) {
        const errorMessage = formatValidationErrors(validateLoginSchema.errors);
        return next(createError(`Validation error: ${errorMessage}`, 400));
    }

    next();
};