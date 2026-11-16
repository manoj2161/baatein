import api from "../api/axios";

export const getStories = async () => {
  const response = await api.get("/stories");
  return response.data.stories || [];
};

export const createStory = async (formData) => {
  const response = await api.post("/stories", formData);
  return response.data.story;
};

export const deleteStory = async (storyId) => {
  const response = await api.delete(`/stories/${storyId}`);
  return response.data;
};
