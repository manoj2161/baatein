import Post from "../models/Post.js";
import cloudinary from "../config/cloudinary.js";

// Upload video to Cloudinary
const uploadVideo = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "baatein/reels",
        resource_type: "video",
        transformation: [{ quality: "auto" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

// CREATE REEL
export const createReel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a video",
      });
    }

    if (!req.file.mimetype.startsWith("video/")) {
      return res.status(400).json({
        message: "Reels must be videos",
      });
    }

    const uploaded = await uploadVideo(req.file);

    const reel = await Post.create({
      user: req.user._id,
      caption: req.body.caption || "",
      mediaUrl: uploaded.secure_url,
      mediaType: "video",
      publicId: uploaded.public_id,
    });

    await reel.populate("user", "username profilePicture");

    return res.status(201).json({
      message: "Reel created successfully",
      reel,
    });
  } catch (error) {
    console.error("Create reel error:", error);

    return res.status(500).json({
      message: "Unable to create reel",
    });
  }
};

// GET REELS
export const getReels = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 10;

    const reels = await Post.find({
      mediaType: "video",
    })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      reels,
      page,
      hasMore: reels.length === limit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load reels",
    });
  }
};
