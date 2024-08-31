import express from "express";
import {config} from "dotenv";
import paymentRoute from "./routes/paymentRoutes.js";

config({path:"./config/config.env"});

export const app = express();

app.use("/api", paymentRoute)