import { Request, Response, NextFunction } from "express";
import { Pathway } from "../models/pathway.model";
import { createError } from "../middleware/error.middleware";

// Define result types for better type safety
type PathwayResult<T> = Promise<T | null>;
type PaginatedResult<T> = {
    items: T[];
    pagination: {
        total: number;
        page: number;
        pages: number;
    };
};

/**
 * Core data access functions (pure functions)
 */
const pathwayService = {
    /**
     * Find all pathways with pagination
     */
    findAll: async (page: number, limit: number): Promise<PaginatedResult<any>> => {
        const skip = (page - 1) * limit;

        const [pathways, total] = await Promise.all([
            Pathway.find()
                .select("-modules")
                .skip(skip)
                .limit(limit)
                .lean(),
            Pathway.countDocuments()
        ]);

        return {
            items: pathways,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Find pathway by ID
     */
    findById: async (id: string): PathwayResult<any> => {
        return Pathway.findById(id).lean();
    },

    /**
     * Create a new pathway
     */
    create: async (data: any): PathwayResult<any> => {
        return Pathway.create(data);
    },

    /**
     * Update a pathway
     */
    update: async (id: string, data: any): PathwayResult<any> => {
        return Pathway.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        }).lean();
    },

    /**
     * Delete a pathway
     */
    remove: async (id: string): PathwayResult<any> => {
        return Pathway.findByIdAndDelete(id);
    }
};

/**
 * Controller handlers (compose service functions with HTTP concerns)
 */

/**
 * Get all pathways with pagination
 */
const getAllPathways = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await pathwayService.findAll(page, limit);

        return res.json({
            pathways: result.items,
            pagination: result.pagination
        });
    }
    catch (err) {
        return next(err);
    }
};

/**
 * Get a specific pathway by ID
 */
const getPathwayById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathway = await pathwayService.findById(req.params.id);

        if (!pathway) {
            return next(createError("Pathway not found", 404));
        }

        return res.json({ pathway });
    }
    catch (err) {
        return next(err);
    }
};

/**
 * Create a new pathway
 */
const createPathway = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathway = await pathwayService.create(req.body.pathway);
        return res.status(201).json({ pathway });
    }
    catch (err) {
        return next(err);
    }
};

/**
 * Update a pathway by ID
 */
const updatePathway = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathway = await pathwayService.update(req.params.id, req.body.pathway);

        if (!pathway) {
            return next(createError("Pathway not found", 404));
        }

        return res.json({ pathway });
    }
    catch (err) {
        return next(err);
    }
};

/**
 * Remove a pathway by ID
 */
const removePathway = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathway = await pathwayService.remove(req.params.id);

        if (!pathway) {
            return next(createError("Pathway not found", 404));
        }

        return res.json({
            message: "Pathway successfully deleted",
            pathway
        });
    }
    catch (err) {
        return next(err);
    }
};

export const controller = {
    getAllPathways,
    getPathwayById,
    createPathway,
    updatePathway,
    removePathway,
};