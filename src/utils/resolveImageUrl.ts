// utils/resolveImageUrl.ts
import https from "https";

export const isUrlReachable = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!url) return resolve(false);
        // Real HTTP Head-like request to check if the URL responds
        https.get(url, (res) => {
            resolve(res.statusCode === 200);
        }).on("error", () => resolve(false)); // network error= not reachable
    });
};

export const resolveImageUrl = async (
    cloudinaryUrl: string,
    localUrl: string
): Promise<string> => {
    if (!cloudinaryUrl) return localUrl; //If cloudinaryUrl is empty then return localUrl
    const reachable = await isUrlReachable(cloudinaryUrl);
    return reachable ? cloudinaryUrl : localUrl; // Cloudinary down then return localUrl
};