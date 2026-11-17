import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, LoaderCircle, Users, UserRound } from "lucide-react";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { followUser } from "../services/profileService";

const ExplorePeople = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followingId, setFollowingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

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
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Unable to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchUsers();
    }
  }, [user]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((item) => {
      const username = item.username?.toLowerCase() || "";
      const fullName = item.fullName?.toLowerCase() || "";

      return username.includes(query) || fullName.includes(query);
    });
  }, [users, search]);

  const handleFollow = async (userId) => {
    const id = userId.toString();

    if (followingUsers.includes(id) || followingId) return;

    try {
      setFollowingId(id);

      await followUser(id);

      setFollowingUsers((prev) => [...prev, id]);
    } catch (err) {
      console.error("Failed to follow user:", err);
    } finally {
      setFollowingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717]">
      <Sidebar />

      <main className="min-h-screen px-4 pb-24 pt-20 md:ml-[220px] md:px-8 md:pb-6 md:pt-6 lg:ml-[240px]">
        <div className="mx-auto w-full max-w-[1000px]">
          {/* Heading */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#315efb]">
                <Users size={22} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Explore People
                </h1>
                <p className="text-sm text-gray-500">
                  Discover and connect with people on Baatein.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Search size={19} className="shrink-0 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </div>

          {/* User count */}
          {!loading && !error && (
            <p className="mb-4 text-sm text-gray-500">
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "person" : "people"} found
            </p>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoaderCircle className="h-8 w-8 animate-spin text-[#315efb]" />
              <p className="mt-3 text-sm text-gray-500">Finding people...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-white py-12 text-center">
              <p className="text-sm text-red-500">{error}</p>

              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-semibold text-[#315efb]"
              >
                Try again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <UserRound size={26} />
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                {search ? "No users found" : "No people to explore"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try searching with another name or username."
                  : "There are no other registered users yet."}
              </p>
            </div>
          ) : (
            /* Users Grid */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map((person) => {
                const userId = person._id.toString();
                const isFollowing = followingUsers.includes(userId);
                const isFollowLoading = followingId === userId;

                return (
                  <div
                    key={userId}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <Link to={`/profile/${userId}`} className="shrink-0">
                      <img
                        src={
                          person.profilePicture ||
                          "https://placehold.co/150x150?text=User"
                        }
                        alt={person.username || "Baatein user"}
                        className="h-14 w-14 rounded-full border border-gray-100 object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${userId}`}
                        className="block truncate text-sm font-semibold text-gray-900 hover:text-[#315efb]"
                      >
                        {person.username || "Unknown user"}
                      </Link>

                      <p className="mt-1 truncate text-xs text-gray-500">
                        {person.fullName || "Baatein user"}
                      </p>

                      <Link
                        to={`/profile/${userId}`}
                        className="mt-2 inline-block text-xs font-medium text-[#315efb] hover:underline"
                      >
                        View profile
                      </Link>
                    </div>

                    <button
                      onClick={() => handleFollow(userId)}
                      disabled={isFollowing || followingId !== null}
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        isFollowing
                          ? "cursor-default bg-gray-100 text-gray-500"
                          : "bg-[#315efb] text-white hover:bg-blue-700"
                      }`}
                    >
                      {isFollowLoading
                        ? "..."
                        : isFollowing
                          ? "Following"
                          : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExplorePeople;
