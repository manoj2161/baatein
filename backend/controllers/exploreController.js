import Post from "../models/Post.js";
import User from "../models/User.js";

// Escape special regex characters in search input.
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// EXPLORE POSTS
export const getExplorePosts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      posts,
      page,
      hasMore: posts.length === limit,
    });
  } catch (error) {
    console.error("Explore posts error:", error);

    return res.status(500).json({
      message: "Unable to load explore posts",
    });
  }
};

// SEARCH USERS AND POSTS
export const searchExplore = async (req, res) => {
  try {
    const search = (req.query.query || req.query.q || "").trim();

    if (!search) {
      return res.status(200).json({
        users: [],
        posts: [],
      });
    }

    const searchRegex = new RegExp(escapeRegex(search), "i");

    // Search users and include followers to determine follow status.
    const users = await User.find({
      username: searchRegex,
    })
      .select("username fullName profilePicture bio status followers")
      .limit(10);

    const posts = await Post.find({
      caption: searchRegex,
    })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      users,
      posts,
    });
  } catch (error) {
    console.error("Explore search error:", error);

    return res.status(500).json({
      message: "Search failed",
    });
  }
};
