import api from "./api";
import type { ImagePickerAsset } from "expo-image-picker";

// GET FEED
export const getFeed = async () => {
  const response = await api.get("/posts/feed");
  return response.data.posts || [];
};

// GET POSTS BY USER
export const getUserPosts = async (userId: string) => {
  const response = await api.get(`/posts/user/${userId}`);
  return response.data.posts || [];
};

// CREATE POST
export const createPost = async (
  assets: ImagePickerAsset[],
  caption: string,
) => {
  const formData = new FormData();

  formData.append("caption", caption);

  assets.forEach((asset, index) => {
    const fileName = asset.fileName || `post-${Date.now()}-${index}.jpg`;

    const mimeType =
      asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg");

    formData.append("media", {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as any);
  });

  const response = await api.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.post;
};

// LIKE / UNLIKE POST
export const toggleLike = async (postId: string) => {
  const response = await api.put(`/posts/${postId}/like`);
  return response.data;
};

// ADD COMMENT
export const addComment = async (postId: string, text: string) => {
  const response = await api.post(`/posts/${postId}/comments`, { text });

  return response.data;
};

// DELETE POST
export const deletePost = async (postId: string) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};
