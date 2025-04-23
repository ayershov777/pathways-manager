import { Pathway } from "../../models/pathway.model";

/**
 * Find all pathways with pagination
 */
export const findAll = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;

    const [pathways, total] = await Promise.all([
        Pathway.find()
            .select("-modules")
            .populate('owner', 'name')
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
export const findById = async (id: string) => {
    return Pathway.findById(id)
        .populate('owner', 'name')
        .lean();
};

/**
 * Create a new pathway
 */
export const create = async (data: any) => {
    return (await Pathway.create(data)).toObject();
};

/**
 * Update a pathway
 */
export const update = async (id: string, data: any) => {
    return Pathway.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    }).lean();
};

/**
 * Delete a pathway
 */
export const remove = async (id: string) => {
    return Pathway.findByIdAndDelete(id).lean();
};