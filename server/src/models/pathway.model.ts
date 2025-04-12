import mongoose, { InferSchemaType } from "mongoose";

const pathwaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    modules: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Module"
        }],
        default: [],
    }
});

type PathwayData = InferSchemaType<typeof pathwaySchema>;

export const Pathway = mongoose.model<PathwayData>("Pathway", pathwaySchema);

export type PathwayUpdateInput = Omit<Partial<PathwayData>,
    "_id" |
    "createdAt" |
    "updatedAt" |
    "modules"
>;
