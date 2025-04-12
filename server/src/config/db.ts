import mongoose from "mongoose";

export const connectDb = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGO_URI!);
    
        console.log(`MongoDB connected: ${db.connection.host}`);
        return db;
    }
    catch (err: any) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
};