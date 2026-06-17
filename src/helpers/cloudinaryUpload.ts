import cloudinary from "../config/cloudinary";
import { ApiError } from "../utils/apiError";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
}

// For images and documents — data URI approach
export const uploadImageToCloud = async (
  file: Express.Multer.File,
  folder: string
): Promise<CloudinaryUploadResult> => {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataUri = `data:${file.mimetype};base64,${b64}`;

  try {
    const res = await cloudinary.uploader.upload(dataUri, {
      folder: `kala-patthar/${folder}`,
      resource_type: "image",
    });

    return {
      url: res.secure_url,
      publicId: res.public_id,
      fileName: file.originalname,
      mimeType: file.mimetype,
    };
  } catch (error) {
    throw new ApiError(500, "Failed to upload image to Cloudinary");
  }
};

// For video — true streaming, avoids holding a 33%-larger base64 copy in memory
export const uploadVideoToCloud = (
  file: Express.Multer.File,
  folder: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `kala-patthar/${folder}`,
        resource_type: "video",
      },
      (error, result) => {
        if (error || !result) {
          return reject(new ApiError(500, "Failed to upload video to Cloudinary"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          fileName: file.originalname,
          mimeType: file.mimetype,
        });
      }
    );
    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloud = async (
  publicId: string,
  resourceType: "image" | "video" = "image"
) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    throw new ApiError(500, "Failed to delete file from Cloudinary");
  }
};