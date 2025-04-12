import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    prerequisites: {
        type: [[String]], // module keys
        default: [],
    },
});

moduleSchema.index({ prerequisites: 1 });

export const Module = mongoose.model("Module", moduleSchema);
