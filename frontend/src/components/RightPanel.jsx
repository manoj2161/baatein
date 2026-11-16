import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { followUser } from "../services/profileService";

export default function RightPanel() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followingId, setFollowingId] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);

        const response = await api.get("/users");

        const fetchedUsers = response.data.users || [];

        const currentUserId = user?._id?.toString();

        const filteredUsers = fetchedUsers.filter(
          (item) => item._id?.toString() !== currentUserId,
        );

        setUsers(filteredUsers);

        setFollowingUsers(
          (user?.following || []).map((id) =>
            typeof id === "object" ? id._id?.toString() : id.toString(),
          ),
        );
      } catch (error) {
        console.error("Failed to fetch suggested users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchSuggestions();
    }
  }, [user]);

  const handleFollow = async (userId) => {
    try {
      setFollowingId(userId);

      await followUser(userId);

      setFollowingUsers((prev) => [...prev, userId.toString()]);
    } catch (error) {
      console.error("Failed to follow user:", error);
    } finally {
      setFollowingId(null);
    }
  };

  return (
    <aside className="fixed right-0 top-0 hidden h-screen w-[320px] flex-col border-l border-gray-200 bg-white px-6 py-8 lg:flex">
      {/* Current User */}
      <div className="mb-9 flex items-center gap-3">
        <Link to={`/profile/${user?._id}`}>
          <img
            src={
              user?.profilePicture || "https://placehold.co/150x150?text=User"
            }
            alt="Your profile"
            className="h-12 w-12 rounded-full object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${user?._id}`}
            className="block truncate text-sm font-semibold text-gray-900"
          >
            {user?.username || "Username"}
          </Link>

          <p className="truncate text-xs text-gray-500">
            {user?.fullName || "Your Name"}
          </p>
        </div>

        <Link
          to={`/profile/${user?._id}`}
          className="text-xs font-semibold text-[#315efb] hover:text-blue-700"
        >
          Profile
        </Link>
      </div>

      {/* Suggestions Heading */}
      <div className="mb-5 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-500">
          People you may know
        </h4>

        <Link
          to="/explore"
          className="text-xs font-semibold text-gray-900 hover:text-[#315efb]"
        >
          See all
        </Link>
      </div>

      {/* Suggestions */}
      <div className="flex flex-col gap-5 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#315efb]" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">No suggested users available.</p>
        ) : (
          users.slice(0, 5).map((suggestedUser) => {
            const userId = suggestedUser._id.toString();

            const isFollowing = followingUsers.includes(userId);

            return (
              <div className="flex items-center gap-3" key={suggestedUser._id}>
                <Link to={`/profile/${userId}`}>
                  <img
                    src={
                      suggestedUser.profilePicture ||
                      "https://placehold.co/150x150?text=User"
                    }
                    alt={suggestedUser.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/profile/${userId}`}
                    className="block truncate text-sm font-semibold text-gray-900 hover:underline"
                  >
                    {suggestedUser.username}
                  </Link>

                  <p className="truncate text-xs text-gray-500">
                    {suggestedUser.fullName || "Baatein user"}
                  </p>
                </div>

                <button
                  onClick={() => handleFollow(userId)}
                  disabled={isFollowing || followingId === userId}
                  className={`text-xs font-semibold ${
                    isFollowing
                      ? "cursor-default text-gray-400"
                      : "text-[#315efb] hover:text-blue-700"
                  }`}
                >
                  {followingId === userId
                    ? "..."
                    : isFollowing
                      ? "Following"
                      : "Follow"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-xs leading-6 text-gray-400">
        <p>About · Help · Privacy · Terms</p>
        <p className="mt-2">© 2026 BAATEIN</p>
      </div>
    </aside>
  );
}
