import { Request, Response, NextFunction } from "express";
import { Pathway, PathwayUpdateInput } from "../models/pathway.model";

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

const getAllPathways = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathways = await Pathway.find().projection("-modules").lean();
        return res.json({ pathways });
    }
    catch (err) {
        return next(err);
    }
};

const getPathwayById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathway = await Pathway.findById(req.params.id).lean();
        if (pathway) {
            return res.json({ pathway });
        }
        else {
            return res.status(404).json({ message: "No pathway with that id was found." })
        }
    }
    catch (err) {
        return next(err);
    }
};

const createPathway = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description } = req.body.pathway;

        if (!name || typeof name !== 'string' || name.trim() === "") {
            return res.status(400).json({ message: "Pathway name is required and cannot be empty." });
        }

        if (!description || typeof description !== 'string' || description.trim() === "") {
            return res.status(400).json({ message: "Pathway description cannot be empty if provided." });
        }

        if (!(await isPathwayNameAvailable(name))) {
            return res.status(409).json({ message: "The specified pathway name is unavailable." });
        };

        const pathway = await Pathway.create({ name, description });

        return res.status(201).json({ pathway });
    }
    catch (err) {
        return next(err);
    }
};

const removePathway = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathway = await Pathway.findByIdAndDelete(req.params.id);

        if (!pathway) {
            return res.status(404).json({ message: "No pathway with that id was found." });
        }

        return res.json({ pathway });
    }
    catch (err) {
        return next(err);
    }
};

const updatePathway = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathwayId = req.params.id;
        const { name, description } = req.body.pathway || {};

        const update: PathwayUpdateInput = {};

        if (name) {
            if (typeof name !== 'string' || name.trim() === "") {
                return res.status(400).json({ message: "Pathway name cannot be null or empty if provided." });
            }

            if (!isPathwayNameAvailable(name, pathwayId)) {
                return res.status(409).json({ message: "The specified pathway name is unavailable." })
            };

            update.name = name;
        }

        if (description) {
            if (typeof description !== 'string' || description.trim() === "") {
                return res.status(400).json({ message: "Pathway description cannot be null or empty if provided." });
            }

            update.description = description;
        }

        if (Object.keys(update).length > 0) {
            const pathway = await Pathway.findByIdAndUpdate(pathwayId, update, { new: true, runValidators: true }).lean();

            if (!pathway) {
                return res.status(404).json({ message: "No pathway with that id was found." });
            }

            return res.json({ pathway });
        }
        else {
            return res.status(400).json({ message: "No valid update properties were provided." });
        }
    }
    catch (err) {
        return next(err);
    }
};

export const controller = {
    getAllPathways,
    getPathwayById,
    createPathway,
    removePathway,
    updatePathway,
};
