import api from "./api";
import type { ImagePickerAsset } from "expo-image-picker";

// GET STORIES
export const getStories = async () => {
  const response = await api.get("/stories");
  return response.data.stories || [];
};

// CREATE STORY
export const createStory = async (asset: ImagePickerAsset) => {
  const formData = new FormData();

  const fileName =
    asset.fileName ||
    `story-${Date.now()}.${asset.type === "video" ? "mp4" : "jpg"}`;

  const mimeType =
    asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg");

  formData.append("media", {
    uri: asset.uri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await api.post("/stories", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.story;
};

// DELETE STORY
export const deleteStory = async (storyId: string) => {
  const response = await api.delete(`/stories/${storyId}`);
  return response.data;
};

// MARK STORY AS VIEWED
export const viewStory = async (storyId: string) => {
  const response = await api.post(`/stories/${storyId}/view`);
  return response.data;
};

// GET STORY VIEWERS
export const getStoryViewers = async (storyId: string) => {
  const response = await api.get(`/stories/${storyId}/viewers`);
  return response.data;
};
