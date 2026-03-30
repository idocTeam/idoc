import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

// Connect database first
await connectDB();

// Start server
const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Patient Service running on http://localhost:${PORT}`);
});