import { Request, Response, NextFunction } from "express";
import { createError } from "../middleware/error.middleware";
import * as pathwayService from "../services/database/pathways.service";

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
        if (!req.user) {
            return next(createError("Authentication required", 401));
        }

        const pathway = await pathwayService.create({
            ...req.body.pathway,
            owner: req.user.id
        });
        
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
        if (!req.user) {
            return next(createError("Authentication required", 401));
        }

        // Check ownership
        const existingPathway = await pathwayService.findById(req.params.id);
        
        if (!existingPathway) {
            return next(createError("Pathway not found", 404));
        }
        
        if (existingPathway.owner._id.toString() !== req.user.id) {
            return next(createError("Not authorized to update this pathway", 403));
        }

        const pathway = await pathwayService.update(req.params.id, req.body.pathway);

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
        if (!req.user) {
            return next(createError("Authentication required", 401));
        }

        // Check ownership
        const existingPathway = await pathwayService.findById(req.params.id);
        
        if (!existingPathway) {
            return next(createError("Pathway not found", 404));
        }
        
        if (existingPathway.owner._id.toString() !== req.user.id) {
            return next(createError("Not authorized to delete this pathway", 403));
        }

        const pathway = await pathwayService.remove(req.params.id);

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