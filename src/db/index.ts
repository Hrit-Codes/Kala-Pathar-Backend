import mongoose from "mongoose";
import { loadEnv } from "../config/env";

export const dbConnection=async()=>{
    try{
        const mongodbInstance= await mongoose.connect(loadEnv.MONGO_URL);
        console.log(
            "Database connection Established",
            mongodbInstance.connection.host
        )
    }catch(error){
        console.log("DbConnection Error::",error);
    }
}