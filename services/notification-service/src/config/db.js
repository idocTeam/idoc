import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async()=>{

    try {
        const connection = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error(`Error connecting to DB: ${error.message}`);
        process.exit(1);
    }
    
}