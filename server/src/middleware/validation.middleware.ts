import { Request, Response, NextFunction } from "express";
import { Pathway } from "../models/pathway.model";

/**
 * Checks if a pathway name is available.
 * Optionally excludes a specific pathway ID from the check (for updates).
 * @param name The pathway name to check.
 * @param currentIdToExclude The _id of the pathway being updated, to exclude from the check.
 * @returns Promise<boolean> True if the name is available, false otherwise.
 */
const isPathwayNameAvailable = async (name: string, currentIdToExclude?: string): Promise<boolean> => {
    const query: any = { name: name.trim() };

    if (currentIdToExclude) {
        query._id = { $ne: currentIdToExclude };
    }

    const existingPathway = await Pathway.findOne(query).select('_id').lean();

    return !existingPathway;
};

/**
 * Validates the request body when creating a new pathway
 */
export const validateCreatePathway = async (req: Request, res: Response, next: NextFunction) => {
    const { name, description } = req.body.pathway || {};

    if (!name || typeof name !== 'string' || name.trim() === "") {
        return res.status(400).json({ message: "Pathway name is required and cannot be empty." });
    }

    if (!description || typeof description !== 'string' || description.trim() === "") {
        return res.status(400).json({ message: "Pathway description cannot be empty if provided." });
    }

    if (!(await isPathwayNameAvailable(name))) {
        return res.status(409).json({ message: "The specified pathway name is unavailable." });
    }

    next();
};

/**
 * Validates the request body when updating an existing pathway
 */
export const validateUpdatePathway = async (req: Request, res: Response, next: NextFunction) => {
    const pathwayId = req.params.id;
    const { name, description } = req.body.pathway || {};

    // Check if at least one field to update is provided
    if (!name && !description) {
        return res.status(400).json({ message: "No valid update properties were provided." });
    }

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === "") {
            return res.status(400).json({ message: "Pathway name cannot be null or empty if provided." });
        }

        if (!(await isPathwayNameAvailable(name, pathwayId))) {
            return res.status(409).json({ message: "The specified pathway name is unavailable." });
        }
    }

    if (description !== undefined) {
        if (typeof description !== 'string' || description.trim() === "") {
            return res.status(400).json({ message: "Pathway description cannot be null or empty if provided." });
        }
    }

    next();
};
