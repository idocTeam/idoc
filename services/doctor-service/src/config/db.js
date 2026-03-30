import mongoose from "mongoose";

// Connect MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Doctor Service DB connected");
  } catch (error) {
    console.error("Doctor Service DB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;