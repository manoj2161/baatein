import { api } from "./api";

export type UnsentCategory =
  | "To Someone"
  | "To My Past"
  | "To My Future"
  | "An Apology"
  | "A Thank You"
  | "A Goodbye"
  | "A Dream"
  | "A Secret";

export type UnsentVisibility = "anonymous" | "followers" | "public";

export interface UnsentAuthor {
  _id?: string;
  username: string;
  fullName: string;
  profilePicture: string;
}

export interface UnsentMessage {
  _id: string;
  content: string;
  category: UnsentCategory;
  visibility: UnsentVisibility;
  author: UnsentAuthor;
  reactionCount: number;
  replyCount: number;
  isReacted: boolean;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnsentReply {
  _id: string;
  content: string;
  author: UnsentAuthor;
  isAnonymous: boolean;
  isOwnReply: boolean;
  createdAt: string;
  updatedAt: string;
}

// CREATE UNSENT MESSAGE
export const createUnsent = async (data: {
  content: string;
  category: UnsentCategory;
  visibility: UnsentVisibility;
}) => {
  const response = await api.post("/unsent", data);
  return response.data;
};

// GET UNSENT FEED
export const getUnsentFeed = async (): Promise<{
  unsent: UnsentMessage[];
  count: number;
}> => {
  const response = await api.get("/unsent/feed");
  return response.data;
};

// GET MY UNSENT MESSAGES
export const getMyUnsent = async (): Promise<{
  unsent: UnsentMessage[];
}> => {
  const response = await api.get("/unsent/my");
  return response.data;
};

// TOGGLE "I FELT THIS TOO"
export const toggleUnsentReaction = async (unsentId: string) => {
  const response = await api.put(`/unsent/${unsentId}/reaction`);

  return response.data;
};

// DELETE UNSENT MESSAGE
export const deleteUnsent = async (unsentId: string) => {
  const response = await api.delete(`/unsent/${unsentId}`);
  return response.data;
};

// CREATE ANONYMOUS REPLY
export const createUnsentReply = async (unsentId: string, content: string) => {
  const response = await api.post(`/unsent/${unsentId}/replies`, { content });

  return response.data;
};

// GET UNSENT REPLIES
export const getUnsentReplies = async (
  unsentId: string,
): Promise<{
  replies: UnsentReply[];
  count: number;
}> => {
  const response = await api.get(`/unsent/${unsentId}/replies`);

  return response.data;
};

// DELETE YOUR OWN REPLY
export const deleteUnsentReply = async (unsentId: string, replyId: string) => {
  const response = await api.delete(`/unsent/${unsentId}/replies/${replyId}`);

  return response.data;
};
