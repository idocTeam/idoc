import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
  console.log(`Admin Service running on http://localhost:${PORT}`);
});