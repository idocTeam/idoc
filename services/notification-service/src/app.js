import express from "express";

const app = express();

app.get("/", (req,res)=>{
    res.send("Notifcation-service running");
});


export default app;