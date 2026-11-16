import api from "../api/axios";

// GET STORIES
export const getStories = async () => {
  const response = await api.get("/stories");
  return response.data.stories || [];
};

// CREATE STORY
export const createStory = async (formData) => {
  const response = await api.post("/stories", formData);
  return response.data.story;
};

// DELETE STORY
export const deleteStory = async (storyId) => {
  const response = await api.delete(`/stories/${storyId}`);
  return response.data;
};

// MARK STORY AS VIEWED
export const viewStory = async (storyId) => {
  const response = await api.post(`/stories/${storyId}/view`);
  return response.data;
};

// GET STORY VIEWERS
export const getStoryViewers = async (storyId) => {
  const response = await api.get(`/stories/${storyId}/viewers`);
  return response.data;
};
