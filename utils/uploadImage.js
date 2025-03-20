const cloudinary = require("../config/cloudinary");

const uploadImage = async (image) => {
  try {
    let uploadedImage;

    if (image.startsWith("data:image")) {
      // ✅ Base64 Image Upload
      uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "retailers",
        transformation: [
          { width: 500, height: 500, crop: "fill" },
          { quality: "auto:low" },
          { fetch_format: "auto" },
          { flags: "progressive" },
          { dpr: "auto" },
        ],
      });
    } else {
      // ✅ File Path Upload (from Multer)
      uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "retailers",
      });
    }

    return uploadedImage.secure_url; // ✅ Return Cloudinary URL
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    throw new Error("Image upload failed.");
  }
};

module.exports = { uploadImage };
