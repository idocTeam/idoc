// src/app.js

import express from "express";
import cors from "cors";
import morgan from "morgan";

import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

app.use(cors());
app.use(express.json()); // very important
app.use(morgan("dev"));

app.get("/", (req,res)=>{
    res.send("Notifcation-service running");
});

app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

export default app;