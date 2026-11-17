import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  UserRound,
  MessageCircle,
  UserPlus,
  UserCheck,
  LoaderCircle,
  X,
  Ban,
  Clock,
  Trash2,
} from "lucide-react";

import api from "../api/axios";
import { followUser, unfollowUser } from "../services/profileService";

import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const HISTORY_KEY = "baatein_search_history";

export default function Search() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [followLoading, setFollowLoading] = useState(null);
  const [blockLoading, setBlockLoading] = useState(null);

  // LOAD SEARCH HISTORY
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(
        localStorage.getItem(HISTORY_KEY) || "[]",
      );

      setSearchHistory(Array.isArray(savedHistory) ? savedHistory : []);
    } catch (err) {
      console.error("Load search history error:", err);
      setSearchHistory([]);
    }
  }, []);

  // SAVE SEARCH HISTORY
  const saveSearchHistory = (selectedUser) => {
    setSearchHistory((previous) => {
      const updatedHistory = [
        selectedUser,
        ...previous.filter((item) => item._id !== selectedUser._id),
      ].slice(0, 10);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      return updatedHistory;
    });
  };

  // REMOVE ONE SEARCH HISTORY ITEM
  const removeHistoryItem = (userId) => {
    setSearchHistory((previous) => {
      const updatedHistory = previous.filter((item) => item._id !== userId);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      return updatedHistory;
    });
  };

  // CLEAR ALL SEARCH HISTORY
  const clearSearchHistory = () => {
    if (searchHistory.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear all search history?",
    );

    if (!confirmed) return;

    localStorage.removeItem(HISTORY_KEY);
    setSearchHistory([]);
  };

  // SEARCH USERS
  useEffect(() => {
    let cancelled = false;

    const searchUsers = async () => {
      const searchQuery = query.trim();

      if (!searchQuery) {
        setUsers([]);
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get("/explore/search", {
          params: {
            query: searchQuery,
          },
        });

        if (cancelled) return;

        const results = response.data.users || [];

        setUsers(results.filter((item) => item._id !== user?._id));
      } catch (err) {
        if (cancelled) return;

        console.error("User search error:", err);

        setUsers([]);
        setError(err.response?.data?.message || "Unable to search users.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(searchUsers, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, user?._id]);

  // FOLLOW / UNFOLLOW
  const handleFollow = async (selectedUser) => {
    try {
      setFollowLoading(selectedUser._id);

      const following =
        selectedUser.followers?.some((id) => id.toString() === user?._id) ||
        selectedUser.isFollowing === true;

      if (following) {
        await unfollowUser(selectedUser._id);

        setUsers((previous) =>
          previous.map((item) =>
            item._id === selectedUser._id
              ? {
                  ...item,
                  isFollowing: false,
                  followers: (item.followers || []).filter(
                    (id) => id.toString() !== user?._id,
                  ),
                }
              : item,
          ),
        );
      } else {
        await followUser(selectedUser._id);

        setUsers((previous) =>
          previous.map((item) =>
            item._id === selectedUser._id
              ? {
                  ...item,
                  isFollowing: true,
                  followers: [...(item.followers || []), user?._id],
                }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error("Follow action error:", err);
      alert(err.response?.data?.message || "Unable to update follow status.");
    } finally {
      setFollowLoading(null);
    }
  };

  // BLOCK USER
  const handleBlock = async (selectedUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to block @${selectedUser.username}?`,
    );

    if (!confirmed) return;

    try {
      setBlockLoading(selectedUser._id);

      await api.post(`/users/${selectedUser._id}/block`);

      // Remove the blocked user from the current search results.
      setUsers((previous) =>
        previous.filter((item) => item._id !== selectedUser._id),
      );

      alert(`@${selectedUser.username} has been blocked.`);
    } catch (err) {
      console.error("Block user error:", err);
      alert(err.response?.data?.message || "Unable to block user.");
    } finally {
      setBlockLoading(null);
    }
  };

  // OPEN PROFILE
  const openProfile = (selectedUser) => {
    saveSearchHistory(selectedUser);
    navigate(`/profile/${selectedUser._id}`);
  };

  // OPEN MESSAGES
  const openMessage = (selectedUser) => {
    saveSearchHistory(selectedUser);

    navigate("/messages", {
      state: {
        selectedUser,
      },
    });
  };

  // USER CARD
  const renderUser = (item) => {
    const following =
      item.isFollowing === true ||
      item.followers?.some((id) => id.toString() === user?._id);

    return (
      <div
        key={item._id}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={() => openProfile(item)}
            className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100"
          >
            {item.profilePicture ? (
              <img
                src={item.profilePicture}
                alt={item.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <UserRound size={23} />
              </div>
            )}
          </button>

          <button
            onClick={() => openProfile(item)}
            className="min-w-0 text-left"
          >
            <p className="truncate text-sm font-semibold text-gray-900 hover:underline">
              {item.fullName || item.username}
            </p>
            <p className="truncate text-sm text-gray-500">@{item.username}</p>
            {item.status && (
              <p className="mt-0.5 truncate text-xs text-gray-400">
                {item.status}
              </p>
            )}
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={() => handleFollow(item)}
            disabled={followLoading === item._id}
            className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              following
                ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                : "bg-[#315efb] text-white hover:bg-blue-700"
            }`}
          >
            {followLoading === item._id ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : following ? (
              <UserCheck size={15} />
            ) : (
              <UserPlus size={15} />
            )}
            <span>{following ? "Following" : "Follow"}</span>
          </button>

          <button
            onClick={() => openMessage(item)}
            title="Message"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100"
          >
            <MessageCircle size={17} />
          </button>

          <button
            onClick={() => handleBlock(item)}
            disabled={blockLoading === item._id}
            title="Block user"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {blockLoading === item._id ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Ban size={15} />
            )}
            <span>Block</span>
          </button>
        </div>
      </div>
    );
  };

  // RECENT SEARCH ITEM
  const renderHistoryItem = (item) => (
    <div
      key={item._id}
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-gray-100"
    >
      <button
        onClick={() => openProfile(item)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {item.profilePicture ? (
            <img
              src={item.profilePicture}
              alt={item.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <UserRound size={20} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {item.fullName || item.username}
          </p>
          <p className="truncate text-xs text-gray-500">@{item.username}</p>
        </div>
      </button>

      <button
        onClick={() => removeHistoryItem(item._id)}
        title="Remove from search history"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
      >
        <X size={17} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="min-h-screen md:ml-[240px]">
        <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Search</h1>

          {/* SEARCH INPUT */}
          <div className="relative mb-5">
            <SearchIcon
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people by name or username..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-12 text-sm outline-none transition focus:border-[#315efb] focus:ring-2 focus:ring-blue-100"
            />

            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X size={19} />
              </button>
            )}
          </div>

          {/* RECENT SEARCH HISTORY */}
          {!query.trim() && searchHistory.length > 0 && (
            <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={17} className="text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-800">
                    Recent searches
                  </h2>
                </div>

                <button
                  onClick={clearSearchHistory}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 transition hover:text-red-700"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {searchHistory.map(renderHistoryItem)}
              </div>
            </div>
          )}

          {/* SEARCH LOADING */}
          {loading && (
            <div className="flex justify-center py-12">
              <LoaderCircle size={28} className="animate-spin text-[#315efb]" />
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <p className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          {/* EMPTY SEARCH */}
          {!loading &&
            !error &&
            !query.trim() &&
            searchHistory.length === 0 && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <SearchIcon size={28} className="text-[#315efb]" />
                </div>

                <h2 className="font-semibold text-gray-800">Find people</h2>

                <p className="mt-2 text-sm text-gray-500">
                  Search for people using their name or username.
                </p>
              </div>
            )}

          {/* SEARCH RESULTS */}
          {!loading && !error && query.trim() && users.length > 0 && (
            <div className="space-y-3">
              <p className="mb-4 text-sm font-medium text-gray-500">
                People ({users.length})
              </p>

              {users.map((item) => renderUser(item))}
            </div>
          )}

          {/* NO RESULTS */}
          {!loading && !error && query.trim() && users.length === 0 && (
            <div className="py-12 text-center">
              <UserRound size={34} className="mx-auto mb-3 text-gray-300" />

              <h2 className="font-semibold text-gray-800">No users found</h2>

              <p className="mt-2 text-sm text-gray-500">
                Try searching with another name or username.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
