import api from "./api";

export interface BlockedUser {
  _id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  bio?: string;
  status?: string;
}

export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  const response = await api.get("/users/blocked");
  return response.data.users || [];
};

export const unblockUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}/block`);
};
