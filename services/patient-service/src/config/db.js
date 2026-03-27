import mongoose from "mongoose";

// Connect MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Patient Service DB connected");
  } catch (error) {
    console.error("Patient Service DB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;