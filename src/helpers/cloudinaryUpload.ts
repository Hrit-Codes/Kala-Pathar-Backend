import cloudinary from "../config/cloudinary";
import fs from "fs";

export interface UploadResult {
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    localUrl: string;
    localPath: string;
    fileName: string;
    mimeType: string;
}

const LOCAL_STORE = "uploads/permanent";

//Utility function to ensure directory exists before attempting to write files to it. If the directory does not exist then it creates it (including any parent directories)
const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};


export const uploadImageToCloud = async (
    file: Express.Multer.File,
    folder: string
): Promise<UploadResult> => {
    // Save to local permanently first
    ensureDir(`${LOCAL_STORE}/${folder}`); //to check if directory exists otherwise create it
    const localFilePath = `${LOCAL_STORE}/${folder}/${file.filename}`;
    fs.copyFileSync(file.path, localFilePath);  // copy from temp to permanent
    fs.unlinkSync(file.path);                   // delete temp

    const localUrl = `${process.env.BASE_URL}/${localFilePath.replace(/\\/g, "/")}`;

    // Then upload to Cloudinary
    try {
        const res = await cloudinary.uploader.upload(localFilePath, {
            folder: `kala-patthar/${folder}`,
            resource_type: "image",
        });

        return {
            cloudinaryUrl: res.secure_url,
            cloudinaryPublicId: res.public_id,
            localUrl,
            localPath: localFilePath,
            fileName: file.originalname,
            mimeType: file.mimetype, //aslo known as Content-Type is a standard that indicates the nature of format of a file. Eg if file is image or video
        };
    } catch (error) {
        // Cloudinary failed but local is already saved — don't throw
        console.error("Cloudinary upload failed, local copy retained:", error);

        return {
            cloudinaryUrl: "",        // empty signals cloudinary unavailable
            cloudinaryPublicId: "",
            localUrl,
            localPath: localFilePath,
            fileName: file.originalname,
            mimeType: file.mimetype,
        };
    }
};

export const uploadVideoToCloud = async (
    file: Express.Multer.File,
    folder: string
): Promise<UploadResult> => {
    // Save to local permanently first
    ensureDir(`${LOCAL_STORE}/${folder}`); //ensure directory exists otherwise create it
    const localFilePath = `${LOCAL_STORE}/${folder}/${file.filename}`;
    fs.copyFileSync(file.path, localFilePath); // copy from temp to permanent
    fs.unlinkSync(file.path); // delete from temp

    const localUrl = `${process.env.BASE_URL}/${localFilePath.replace(/\\/g, "/")}`;

    //Upload to Cloudinary using stream
    return new Promise((resolve) => {
        // Create a Cloudinary upload stream
        const stream = cloudinary.uploader.upload_stream(
            { folder: `kala-patthar/${folder}`, resource_type: "video" },
            (error, result) => {
                // Handle the result
                if (error || !result) {
                    console.error("Cloudinary video upload failed, local copy retained:", error);
                    return resolve({
                        cloudinaryUrl: "",
                        cloudinaryPublicId: "",
                        localUrl,
                        localPath: localFilePath,
                        fileName: file.originalname,
                        mimeType: file.mimetype,
                    });
                }

                // Success return both Cloudinary and local info
                resolve({
                    cloudinaryUrl: result.secure_url,
                    cloudinaryPublicId: result.public_id,
                    localUrl,
                    localPath: localFilePath,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                });
            }
        );

        fs.createReadStream(localFilePath).pipe(stream);
    });
};

// Dispatches to the image or video uploader based on mediaType — for fields where either kind is accepted (e.g. hero section background)
export const uploadMediaToCloud = async (
    file: Express.Multer.File,
    folder: string,
    mediaType: "image" | "video"
): Promise<UploadResult> => {
    return mediaType === "video"
        ? uploadVideoToCloud(file, folder)
        : uploadImageToCloud(file, folder);
};

export const deleteFromCloud = async (
    publicId: string, // Cloudinary public id
    localPath: string, // Local file path
    resourceType: "image" | "video" = "image", // What type of file to delete
) => {
    // Always delete local first
    if (localPath && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
    }

    // Try delete from Cloudinary
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error) {
            console.warn("Could not delete from Cloudinary:", error);
            // Don't throw — local is already deleted
        }
    }
};