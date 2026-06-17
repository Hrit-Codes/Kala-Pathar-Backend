import {v2 as cloudinary} from "cloudinary";
import { loadEnv } from "./env";

cloudinary.config({
    cloud_name:loadEnv.CLOUDINARY_CLOUD_NAME,
    api_key:loadEnv.CLOUDINARY_API_KEY,
    api_secret:loadEnv.CLOUDINARY_API_SECRET
})

export default cloudinary;