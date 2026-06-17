import multer, { type FileFilterCallback } from "multer";
import { ApiError } from "../utils/apiError";

const storage= multer.memoryStorage();

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
    storage,
    fileFilter:imageFileFilter,
    limits:{fileSize:5*1024*1024}
})

export const uploadVideo= multer({
    storage,
    fileFilter: videoFileFilter,
    limits:{fileSize: 100*1024*1024}
})