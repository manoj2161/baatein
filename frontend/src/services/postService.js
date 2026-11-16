import api from "../api/axios";

export const getFeed = async () => {
  const response = await api.get("/posts/feed");
  return response.data.posts || [];
};

export const createPost = async (formData) => {
  const response = await api.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.post;
};

export const toggleLike = async (postId) => {
  const response = await api.put(`/posts/${postId}/like`);
  return response.data;
};

export const addComment = async (postId, text) => {
  const response = await api.post(`/posts/${postId}/comments`, {
    text,
  });

  return response.data;
};

export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};
