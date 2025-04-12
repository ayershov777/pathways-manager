import { Request, Response, NextFunction } from "express";
import { Pathway, PathwayUpdateInput } from "../models/pathway.model";

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
            update.name = name;
        }

        if (description) {
            update.description = description;
        }

        const pathway = await Pathway.findByIdAndUpdate(pathwayId, update, { new: true, runValidators: true }).lean();

        if (!pathway) {
            return res.status(404).json({ message: "No pathway with that id was found." });
        }

        return res.json({ pathway });
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