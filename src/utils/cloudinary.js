import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

const deleteFromCloudinary = async (imageUrl) => {
    if (!imageUrl) return;

    try {
        const publicId = imageUrl
            .split("/")
            .pop()
            .split(".")[0];

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.log("Cloudinary delete error:", error.message);
    }
};

export {
    uploadOnCloudinary,
    deleteFromCloudinary
};