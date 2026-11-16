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

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const userIds = [req.user._id, ...user.following];

    const stories = await Story.find({
      user: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .sort({ createdAt: 1 });

    const currentUserId = req.user._id.toString();

    const formattedStories = stories.map((story) => {
      const isOwner = story.user?._id?.toString() === currentUserId;

      const uniqueViewers = new Map();

      story.viewers.forEach((viewer) => {
        const viewerId = viewer.user?.toString();

        if (!viewerId) return;

        const existing = uniqueViewers.get(viewerId);

        if (
          !existing ||
          new Date(viewer.viewedAt) > new Date(existing.viewedAt)
        ) {
          uniqueViewers.set(viewerId, viewer);
        }
      });

      const isViewed = uniqueViewers.has(currentUserId);

      return {
        ...story.toObject(),
        isViewed: isOwner ? true : isViewed,
        viewersCount: isOwner ? uniqueViewers.size : undefined,
        viewers: undefined,
      };
    });

    return res.status(200).json({
      stories: formattedStories,
    });
  } catch (error) {
    console.error("Get stories error:", error);

    return res.status(500).json({
      message: "Unable to load stories",
    });
  }
};

// MARK STORY AS VIEWED
export const viewStory = async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.storyId,
      expiresAt: { $gt: new Date() },
    });

    if (!story) {
      return res.status(404).json({
        message: "Story not found or expired",
      });
    }

    const viewerId = req.user._id.toString();

    if (story.user.toString() === viewerId) {
      return res.status(200).json({
        message: "You cannot view your own story as a viewer",
        viewed: false,
      });
    }

    const viewedAt = new Date();

    // Find every existing record for this viewer.
    const matchingViewers = story.viewers.filter(
      (viewer) => viewer.user?.toString() === viewerId,
    );

    if (matchingViewers.length > 0) {
      // Keep one record and update its timestamp.
      const latestViewer = matchingViewers.reduce((latest, current) =>
        new Date(current.viewedAt) > new Date(latest.viewedAt)
          ? current
          : latest,
      );

      latestViewer.viewedAt = viewedAt;

      // Remove any duplicate records for this same user.
      story.viewers = story.viewers.filter(
        (viewer) =>
          viewer.user?.toString() !== viewerId ||
          viewer._id.toString() === latestViewer._id.toString(),
      );
    } else {
      story.viewers.push({
        user: req.user._id,
        viewedAt,
      });
    }

    await story.save();

    return res.status(200).json({
      message: "Story view recorded",
      viewed: true,
      viewedAt,
    });
  } catch (error) {
    console.error("Story view error:", error);

    return res.status(500).json({
      message: "Unable to record story view",
    });
  }
};

// GET STORY VIEWERS (ONLY STORY OWNER)
export const getStoryViewers = async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.storyId,
      expiresAt: { $gt: new Date() },
    }).populate({
      path: "viewers.user",
      select: "username profilePicture",
    });

    if (!story) {
      return res.status(404).json({
        message: "Story not found or expired",
      });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot view this story's viewer history",
      });
    }

    // Return only the latest record for each user.
    const uniqueViewers = new Map();

    story.viewers.forEach((viewer) => {
      if (!viewer.user) return;

      const viewerId = viewer.user._id.toString();
      const existing = uniqueViewers.get(viewerId);

      if (
        !existing ||
        new Date(viewer.viewedAt) > new Date(existing.viewedAt)
      ) {
        uniqueViewers.set(viewerId, viewer);
      }
    });

    const viewers = Array.from(uniqueViewers.values())
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .map((viewer) => ({
        _id: viewer.user._id,
        username: viewer.user.username,
        profilePicture: viewer.user.profilePicture,
        viewedAt: viewer.viewedAt,
      }));

    return res.status(200).json({
      totalViews: viewers.length,
      viewers,
    });
  } catch (error) {
    console.error("Get story viewers error:", error);

    return res.status(500).json({
      message: "Unable to load story viewers",
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
    console.error("Delete story error:", error);

    return res.status(500).json({
      message: "Unable to delete story",
    });
  }
};
