import { Request, Response, NextFunction } from "express";
import Ajv, { JSONSchemaType, ErrorObject } from "ajv";
import { createError } from "../error.middleware";
import { Pathway } from "../../models/pathway.model";

// Initialize Ajv instance
const ajv = new Ajv({
    allErrors: true,
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true,
});

// Schema for creating a pathway
const createPathwaySchema = {
    type: "object",
    properties: {
        name: { type: "string", minLength: 1 },
        description: { type: "string", minLength: 1 }
    },
    required: ["name", "description"],
    additionalProperties: false
} as JSONSchemaType<{ name: string, description: string }>;

// Schema for updating a pathway
const updatePathwaySchema = {
    type: "object",
    properties: {
        name: { type: "string", minLength: 1, nullable: true },
        description: { type: "string", minLength: 1, nullable: true }
    },
    additionalProperties: false,
    minProperties: 1 // At least one property must be provided
} as JSONSchemaType<{ name?: string, description?: string }>;

// Compile the schemas
const validateCreateSchema = ajv.compile(createPathwaySchema);
const validateUpdateSchema = ajv.compile(updatePathwaySchema);

/**
 * Checks if a pathway name is already used in the database
 * @param name The pathway name to check
 * @returns Promise<boolean> True if the name is unique, false if it already exists
 */
const isNameUnique = async (name: string): Promise<boolean> => {
    try {
        const trimmedName = name.trim();
        const existingPathway = await Pathway.findOne({ name: trimmedName }).select('_id').lean();
        return !existingPathway;
    } catch (error) {
        console.error('Error checking pathway name uniqueness:', error);
        throw error;
    }
};

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
 * Middleware to validate pathway creation request
 */
export const validateCreatePathway = async (req: Request, res: Response, next: NextFunction) => {
    // Check if pathway data exists
    if (!req.body.pathway) {
        return next(createError("Request body must contain a pathway object", 400));
    }

    // Validate against schema
    if (!validateCreateSchema(req.body.pathway)) {
        const errorMessage = formatValidationErrors(validateCreateSchema.errors);
        return next(createError(`Validation error: ${errorMessage}`, 400));
    }

    // Check if name is unique
    const name = req.body.pathway.name;
    if (!(await isNameUnique(name))) {
        return next(createError("The specified pathway name is unavailable.", 409));
    }

    next();
};

/**
 * Middleware to validate pathway update request
 */
export const validateUpdatePathway = async (req: Request, res: Response, next: NextFunction) => {
    const pathwayId = req.params.id;

    // Check if pathway data exists
    if (!req.body.pathway) {
        return next(createError("Request body must contain a pathway object", 400));
    }

    // Validate against schema
    if (!validateUpdateSchema(req.body.pathway)) {
        const errorMessage = formatValidationErrors(validateUpdateSchema.errors);
        return next(createError(`Validation error: ${errorMessage}`, 400));
    }

    // Only check name uniqueness if name is being updated
    const { name } = req.body.pathway;
    if (name !== undefined) {
        // Get the current pathway to see if name is actually changing
        const currentPathway = await Pathway.findById(pathwayId).select('name').lean();

        // If pathway doesn't exist, let the controller handle it
        if (!currentPathway) {
            return next();
        }

        // Only check uniqueness if the name is actually changing
        if (name.trim() !== currentPathway.name) {
            if (!(await isNameUnique(name))) {
                return next(createError("The specified pathway name is unavailable.", 409));
            }
        }
    }

    next();
};

/**
 * Middleware to validate MongoDB ObjectId
 */
export const validatePathwayId = (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    // Check if the ID matches the MongoDB ObjectId pattern (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidObjectId) {
        return next(createError("Invalid pathway ID format", 400));
    }

    next();
};