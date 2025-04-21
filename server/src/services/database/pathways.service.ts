// server/src/services/pathway.service.ts

import { Pathway } from "../../models/pathway.model";

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
 * Find all pathways with pagination
 */
export const findAll = async (page: number, limit: number): Promise<PaginatedResult<any>> => {
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
};

/**
 * Find pathway by ID
 */
export const findById = async (id: string): PathwayResult<any> => {
    return Pathway.findById(id).lean();
};

/**
 * Create a new pathway
 */
export const create = async (data: any): PathwayResult<any> => {
    return Pathway.create(data);
};

/**
 * Update a pathway
 */
export const update = async (id: string, data: any): PathwayResult<any> => {
    return Pathway.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    }).lean();
};

/**
 * Delete a pathway
 */
export const remove = async (id: string): PathwayResult<any> => {
    return Pathway.findByIdAndDelete(id);
};
