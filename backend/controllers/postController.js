import Post from "../models/Post.js";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import createNotification from "../utils/createNotification.js";

// Upload media to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "baatein/posts",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    stream.end(file.buffer);
  });
};

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image or video",
      });
    }

    const uploadedMedia = await uploadToCloudinary(req.file);

    const post = await Post.create({
      user: req.user._id,
      caption: caption || "",
      mediaUrl: uploadedMedia.secure_url,
      mediaType: req.file.mimetype.startsWith("video/") ? "video" : "image",
      publicId: uploadedMedia.public_id,
    });

    await post.populate("user", "username profilePicture");

    return res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);

    return res.status(500).json({
      message: "Unable to create post",
    });
  }
};

// GET FEED
export const getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("following");

    const followingIds = user.following.map((id) => id.toString());

    const feed = await Post.find({
      user: { $in: [...followingIds, req.user._id] },
    })
      .populate("user", "username profilePicture")
      .populate("comments.user", "username profilePicture")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      posts: feed,
    });
  } catch (error) {
    console.error("Feed error:", error);

    return res.status(500).json({
      message: "Unable to load feed",
    });
  }
};

// GET POSTS BY USER
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.params.userId,
    })
      .populate("user", "username profilePicture")
      .populate("comments.user", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("Get user posts error:", error);

    return res.status(500).json({
      message: "Unable to load user posts",
    });
  }
};

// LIKE OR UNLIKE POST
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString(),
    );

    if (alreadyLiked) {
      // REMOVE LIKE
      post.likes.pull(req.user._id);

      await post.save();

      // DELETE THE CORRESPONDING LIKE NOTIFICATION
      try {
        await Notification.deleteMany({
          recipient: post.user,
          sender: req.user._id,
          post: post._id,
          type: "like",
        });

        // Calculate the recipient's latest unread notification count.
        const unreadCount = await Notification.countDocuments({
          recipient: post.user,
          isRead: false,
        });

        // Update the recipient's sidebar badge in real time.
        const io = req.app.get("io");

        if (io) {
          io.to(post.user.toString()).emit("notificationCountUpdated", {
            unreadCount,
          });
        }
      } catch (notificationError) {
        console.error("Unlike notification cleanup error:", notificationError);
      }
    } else {
      // ADD LIKE
      post.likes.addToSet(req.user._id);

      await post.save();

      // CREATE NOTIFICATION
      try {
        await createNotification({
          recipient: post.user,
          sender: req.user._id,
          type: "like",
          post: post._id,
          message: "liked your post",
          io: req.app.get("io"),
        });
      } catch (notificationError) {
        console.error("Like notification error:", notificationError);
      }
    }

    return res.status(200).json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      likes: post.likes,
      liked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Toggle like error:", error);

    return res.status(500).json({
      message: "Unable to update like",
    });
  }
};

// ADD COMMENT
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();

    // CREATE COMMENT NOTIFICATION
    try {
      await createNotification({
        recipient: post.user,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        message: "commented on your post",
        io: req.app.get("io"),
      });
    } catch (notificationError) {
      console.error("Comment notification error:", notificationError);
    }

    await post.populate("comments.user", "username profilePicture");

    return res.status(201).json({
      message: "Comment added",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({
      message: "Unable to add comment",
    });
  }
};

// DELETE POST
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot delete this post",
      });
    }

    await cloudinary.uploader.destroy(post.publicId, {
      resource_type: post.mediaType === "video" ? "video" : "image",
    });

    await post.deleteOne();

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    return res.status(500).json({
      message: "Unable to delete post",
    });
  }
};
