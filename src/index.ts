import express from "express";
import dns from "dns";
dns.setServers(['8.8.8.8', '8.8.4.4']);
import dotenv from "dotenv";
import cors from "cors";
import { loadEnv } from "./config/env";
import { dbConnection } from "./db";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import destinationRoutes from "./routes/destinationRoutes";
import packagetypeRoutes from "./routes/packageTypeRoutes";
import companyinfoRoutes from "./routes/companyInfoRoutes";
import whyChooseUsRoutes from "./routes/whyChooseUsRoutes";
import aboutUsRoutes from "./routes/aboutUsRoutes";
import galleryRoutes from "./routes/galleryRoutes";
import partnerRoutes from "./routes/partnerRoutes";

dotenv.config();

const app=express();
const port=Number(loadEnv.PORT) || 3000;
const hostname=process.env.HOST || "localhost";

app.use(cors());
app.get("/",(req,res)=>res.send("Server is running"));

dbConnection()
    .then(()=>
        app.listen(port,hostname,()=>{
            console.log(`Server running successfully at ${hostname}:${port}`);
        })
    )
    .catch((err)=>console.log("Error in connection::",err));

//universal middlewares
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use("/api/public",express.static("public"));

app.use("/api/auth",authRoutes);
app.use("/api/destination",destinationRoutes);
app.use("/api/packagetype",packagetypeRoutes);
app.use("/api/companyinfo",companyinfoRoutes);
app.use("/api/whychooseus",whyChooseUsRoutes);
app.use("/api/aboutus",aboutUsRoutes);
app.use("/api/gallery",galleryRoutes);
app.use("/api/partner",partnerRoutes);