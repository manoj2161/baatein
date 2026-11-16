import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Settings,
  Grid3X3,
  Camera,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import { useAuth } from "../context/AuthContext";

import {
  getUserProfile,
  getUserPosts,
  updateProfile,
  followUser,
  unfollowUser,
} from "../services/profileService";

const Profile = () => {
  const { userId } = useParams();
  const { user: loggedInUser, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    bio: "",
    profilePicture: "",
  });

  const isOwnProfile = String(loggedInUser?._id) === String(userId);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const [userData, postData] = await Promise.all([
          getUserProfile(userId),
          getUserPosts(userId),
        ]);

        setProfile(userData);
        setPosts(postData);

        setFollowing(
          userData.followers?.some(
            (follower) =>
              String(follower?._id || follower) === String(loggedInUser?._id),
          ) || false,
        );

        setEditData({
          username: userData.username || "",
          bio: userData.bio || "",
          profilePicture: userData.profilePicture || "",
        });
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    if (userId && loggedInUser) {
      loadProfile();
    }
  }, [userId, loggedInUser?._id]);

  const handleFollow = async () => {
    try {
      setFollowLoading(true);

      if (following) {
        await unfollowUser(userId);

        setFollowing(false);

        setProfile((previous) => ({
          ...previous,
          followers: previous.followers.filter(
            (follower) =>
              String(follower?._id || follower) !== String(loggedInUser._id),
          ),
        }));
      } else {
        await followUser(userId);

        setFollowing(true);

        setProfile((previous) => ({
          ...previous,
          followers: [...previous.followers, loggedInUser._id],
        }));
      }
    } catch (err) {
      console.error("Follow action failed:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const updatedUser = await updateProfile(editData);

      setProfile((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      updateUser?.(updatedUser);

      setEditOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <LoaderCircle className="animate-spin text-[#315efb]" size={32} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <p className="text-sm text-red-500">{error || "Profile not found."}</p>
      </div>
    );
  }

  const followersCount = profile.followers?.length || 0;
  const followingCount = profile.following?.length || 0;

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717]">
      <Sidebar />

      <main className="min-h-screen px-4 pb-20 pt-8 md:ml-[240px] md:px-8 lg:mr-[320px]">
        <div className="mx-auto max-w-[850px]">
          {/* Back button */}
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#315efb]"
          >
            <ArrowLeft size={18} />
            Back to home
          </Link>

          {/* Profile information */}
          <section className="border-b border-gray-200 pb-8">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-16">
              {/* Profile picture */}
              <div className="flex justify-center sm:w-[180px]">
                <img
                  src={
                    profile.profilePicture ||
                    "https://placehold.co/150x150?text=User"
                  }
                  alt={profile.username}
                  className="h-28 w-28 rounded-full border border-gray-200 object-cover sm:h-36 sm:w-36"
                />
              </div>

              {/* Profile details */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {profile.username}
                  </h1>

                  {isOwnProfile ? (
                    <button
                      onClick={() => setEditOpen(true)}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
                    >
                      Edit profile
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`rounded-lg px-5 py-2 text-sm font-semibold ${
                        following
                          ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          : "bg-[#315efb] text-white hover:bg-blue-700"
                      }`}
                    >
                      {followLoading
                        ? "Please wait..."
                        : following
                          ? "Following"
                          : "Follow"}
                    </button>
                  )}

                  <button className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200">
                    <Settings size={18} />
                  </button>
                </div>

                {/* Counts */}
                <div className="my-6 flex justify-center gap-8 text-sm sm:justify-start sm:gap-10">
                  <p>
                    <strong>{posts.length}</strong>{" "}
                    <span className="text-gray-500">posts</span>
                  </p>

                  <p>
                    <strong>{followersCount}</strong>{" "}
                    <span className="text-gray-500">followers</span>
                  </p>

                  <p>
                    <strong>{followingCount}</strong>{" "}
                    <span className="text-gray-500">following</span>
                  </p>
                </div>

                {/* Bio */}
                <div className="text-center sm:text-left">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {profile.username}
                  </h3>

                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {profile.bio || "No bio added yet."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Posts heading */}
          <div className="flex items-center justify-center gap-2 border-t border-gray-200 py-5 text-sm font-semibold text-gray-800">
            <Grid3X3 size={17} />
            POSTS
          </div>

          {/* Post grid */}
          {posts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-300">
                <Camera size={30} />
              </div>

              <h3 className="text-xl font-semibold text-gray-900">
                No posts yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Posts shared by this user will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="group relative aspect-square overflow-hidden bg-gray-100"
                >
                  {post.mediaType === "video" ? (
                    <video
                      src={post.mediaUrl}
                      className="h-full w-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || "Post"}
                      className="h-full w-full object-cover"
                    />
                  )}

                  <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                    <span className="text-sm font-semibold">
                      ♥ {post.likes?.length || 0}
                    </span>

                    <span className="text-sm font-semibold">
                      Comments {post.comments?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <RightPanel />

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit profile
              </h2>

              <button
                onClick={() => setEditOpen(false)}
                className="text-xl text-gray-500 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Username
                </label>

                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      username: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Profile picture URL
                </label>

                <input
                  type="url"
                  value={editData.profilePicture}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      profilePicture: e.target.value,
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Bio
                </label>

                <textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      bio: e.target.value,
                    })
                  }
                  maxLength={150}
                  rows={4}
                  placeholder="Tell people about yourself..."
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {editData.bio.length}/150
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#315efb] py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
