import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/apiError";

const ensureDir=(dir:string)=>{
    if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true})
}

//File saved to disk storage first
const diskStorage=multer.diskStorage({
    destination:(_req,_file,cb)=>{
        const dir="uploads/temp"; //every incoming file lands here first
        ensureDir(dir);
        cb(null,dir);
    },
    filename:(_req,file,cb)=>{
        //to prevent name collisions if two files arrive simultaneosuly
        const unique=`${Date.now()}-${Math.round(Math.random()*1e0)}`;
        const ext = path.extname(file.originalname);
        cb(null,`${file.fieldname}-${unique}${ext}`);
    }
})

const imageFileFilter=(
    req:Express.Request,
    file:Express.Multer.File,
    cb:multer.FileFilterCallback,
)=>{
    const allowedTypes=["image/jpeg","image/png","image/webp"]
    if(!allowedTypes.includes(file.mimetype)){
        return cb(new ApiError(400,"Only JPEG, PNG, and WEBP images are allowed") as any);
    }
    cb(null, true);
}

const videoFileFilter=(
    req:Express.Request,
    file:Express.Multer.File,
    cb:multer.FileFilterCallback
)=>{
    const allowedTypes=["video/mp4","video/webm", "video/quicktime"];
    if(!allowedTypes.includes(file.mimetype)){
        return cb(new ApiError(400,"Only MP4, WEBM, and MOV videos are allowed") as any)
    }
    cb(null,true);
}

export const uploadImage=multer({
    storage:diskStorage,
    fileFilter:imageFileFilter,
    limits:{fileSize:5*1024*1024}
})

export const uploadVideo= multer({
    storage:diskStorage,
    fileFilter: videoFileFilter,
    limits:{fileSize: 100*1024*1024}
})