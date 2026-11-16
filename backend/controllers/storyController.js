import Story from "../models/Story.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "baatein/stories",
        resource_type: resourceType,
        ...(resourceType === "video"
          ? { transformation: [{ quality: "auto" }] }
          : {}),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

// CREATE STORY
export const createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image or video",
      });
    }

    const uploaded = await uploadToCloudinary(req.file);

    const story = await Story.create({
      user: req.user._id,
      mediaUrl: uploaded.secure_url,
      mediaType: req.file.mimetype.startsWith("video/") ? "video" : "image",
      publicId: uploaded.public_id,
    });

    await story.populate("user", "username profilePicture");

    return res.status(201).json({
      message: "Story created successfully",
      story,
    });
  } catch (error) {
    console.error("Story upload error:", error);

    return res.status(500).json({
      message: "Unable to create story",
    });
  }
};

// GET STORIES FROM FOLLOWED USERS AND YOURSELF
export const getStories = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("following");

    const userIds = [req.user._id, ...user.following];

    const stories = await Story.find({
      user: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      stories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load stories",
    });
  }
};

// DELETE STORY
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({
        message: "Story not found",
      });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot delete this story",
      });
    }

    await cloudinary.uploader.destroy(story.publicId, {
      resource_type: story.mediaType === "video" ? "video" : "image",
    });

    await story.deleteOne();

    return res.status(200).json({
      message: "Story deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete story",
    });
  }
};
