import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Settings,
  Grid3X3,
  Camera,
  LoaderCircle,
  ArrowLeft,
  ImagePlus,
  X,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import FeedPost from "../components/FeedPost";
import { useAuth } from "../context/AuthContext";

import {
  getMyProfile,
  getUserProfile,
  getUserPosts,
  getFollowList,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  checkUsernameAvailability,
  followUser,
  unfollowUser,
} from "../services/profileService";

const DEFAULT_PROFILE_PICTURE = "https://placehold.co/150x150?text=User";

const Profile = () => {
  const { userId } = useParams();
  const { user: loggedInUser, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pictureUploading, setPictureUploading] = useState(false);
  const [pictureRemoving, setPictureRemoving] = useState(false);

  // Followers / Following modal
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState("followers");
  const [followListUsers, setFollowListUsers] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [followListError, setFollowListError] = useState("");

  const profilePictureInputRef = useRef(null);

  const [editData, setEditData] = useState({
    username: "",
    fullName: "",
    bio: "",
    status: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [usernameAvailability, setUsernameAvailability] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const isOwnProfile = String(loggedInUser?._id) === String(userId);

  // Load profile and posts.
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const [userData, postData] = await Promise.all([
          isOwnProfile ? getMyProfile() : getUserProfile(userId),
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
          fullName: userData.fullName || "",
          bio: userData.bio || "",
          status: userData.status || "",
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

  // Keep selected post synchronized with the posts list.
  useEffect(() => {
    if (!selectedPost) return;

    const updatedPost = posts.find(
      (post) => String(post._id) === String(selectedPost._id),
    );

    if (updatedPost) {
      setSelectedPost(updatedPost);
    } else {
      setSelectedPost(null);
    }
  }, [posts]);

  // Close post viewer with Escape key.
  useEffect(() => {
    if (!selectedPost) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedPost(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedPost]);

  // Close followers/following modal with Escape key.
  useEffect(() => {
    if (!followListOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setFollowListOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [followListOpen]);

  // Create and clean up selected image preview.
  useEffect(() => {
    if (!selectedImage) {
      setPreviewImage("");
      return;
    }

    const imageUrl = URL.createObjectURL(selectedImage);
    setPreviewImage(imageUrl);

    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [selectedImage]);

  // Check username availability.
  useEffect(() => {
    if (!editOpen || !profile) return;

    const username = editData.username.trim().toLowerCase();

    if (username === profile.username) {
      setUsernameAvailability({
        available: true,
        message: "This is your current username.",
      });
      setCheckingUsername(false);
      return;
    }

    if (!/^[a-z0-9._]{3,30}$/.test(username)) {
      setUsernameAvailability({
        available: false,
        message:
          "Use 3-30 characters: lowercase letters, numbers, periods, or underscores.",
      });
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameAvailability(null);

    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(username);
        setUsernameAvailability(result);
      } catch (err) {
        setUsernameAvailability({
          available: false,
          message:
            err.response?.data?.message ||
            "Unable to check username availability.",
        });
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [editData.username, editOpen, profile]);

  // Open followers or following list.
  const openFollowList = async (type) => {
    setFollowListType(type);
    setFollowListUsers([]);
    setFollowListError("");
    setFollowListOpen(true);
    setFollowListLoading(true);

    try {
      const users = await getFollowList(userId, type);
      setFollowListUsers(users);
    } catch (err) {
      console.error("Unable to fetch follow list:", err);

      setFollowListError(
        err.response?.data?.message || "Unable to load this list.",
      );
    } finally {
      setFollowListLoading(false);
    }
  };

  // Follow and unfollow.
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

  // Validate image.
  const validateImage = (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPEG, PNG, WebP, or GIF image.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile picture must be smaller than 5 MB.");
      return false;
    }

    return true;
  };

  // Image selection inside edit modal.
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!validateImage(file)) {
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
  };

  // Upload picture by clicking profile picture.
  const handleQuickPictureUpload = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;
    if (!validateImage(file)) return;

    try {
      setPictureUploading(true);

      const updatedUser = await uploadProfilePicture(file);

      setProfile((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      updateUser?.(updatedUser);
    } catch (err) {
      console.error("Profile picture upload failed:", err);

      alert(err.response?.data?.message || "Unable to upload profile picture.");
    } finally {
      setPictureUploading(false);
    }
  };

  // Remove current profile picture.
  const handleRemoveProfilePicture = async () => {
    if (!profile.profilePicture) {
      alert("You do not have a profile picture to remove.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove your profile picture?",
    );

    if (!confirmed) return;

    try {
      setPictureRemoving(true);

      const updatedUser = await removeProfilePicture();

      setProfile((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      updateUser?.(updatedUser);
      setSelectedImage(null);
    } catch (err) {
      console.error("Remove picture failed:", err);

      alert(err.response?.data?.message || "Unable to remove profile picture.");
    } finally {
      setPictureRemoving(false);
    }
  };

  // Save profile information.
  const handleUpdateProfile = async (event) => {
    event.preventDefault();

    if (checkingUsername) {
      alert("Please wait while we check your username.");
      return;
    }

    if (!usernameAvailability?.available) {
      alert("Please choose a valid and available username.");
      return;
    }

    try {
      setSaving(true);

      let updatedUser = profile;

      if (selectedImage) {
        updatedUser = await uploadProfilePicture(selectedImage);

        setProfile((previous) => ({
          ...previous,
          ...updatedUser,
        }));
      }

      const profileData = {
        username: editData.username.trim().toLowerCase(),
        fullName: editData.fullName.trim(),
        bio: editData.bio.trim(),
        status: editData.status.trim(),
      };

      updatedUser = await updateProfile(profileData);

      setProfile((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      updateUser?.(updatedUser);

      setSelectedImage(null);
      setEditOpen(false);
    } catch (err) {
      console.error("Profile update failed:", err);

      alert(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Open edit modal.
  const openEditModal = () => {
    setEditData({
      username: profile.username || "",
      fullName: profile.fullName || "",
      bio: profile.bio || "",
      status: profile.status || "",
    });

    setSelectedImage(null);

    setUsernameAvailability({
      available: true,
      message: "This is your current username.",
    });

    setEditOpen(true);
  };

  const closeEditModal = () => {
    if (saving || pictureRemoving) return;

    setEditOpen(false);
    setSelectedImage(null);
  };

  // Remove deleted post from profile.
  const handlePostDelete = (postId) => {
    setPosts((previous) =>
      previous.filter((post) => String(post._id) !== String(postId)),
    );

    setSelectedPost(null);
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
              {/* Clickable profile picture */}
              <div className="flex justify-center sm:w-[180px]">
                <div className="relative">
                  <img
                    src={profile.profilePicture || DEFAULT_PROFILE_PICTURE}
                    alt={profile.username}
                    onClick={() => {
                      if (isOwnProfile && !pictureUploading) {
                        profilePictureInputRef.current?.click();
                      }
                    }}
                    className={`h-28 w-28 rounded-full border border-gray-200 object-cover sm:h-36 sm:w-36 ${
                      isOwnProfile ? "cursor-pointer" : ""
                    }`}
                  />

                  {isOwnProfile && (
                    <>
                      <button
                        type="button"
                        onClick={() => profilePictureInputRef.current?.click()}
                        disabled={pictureUploading}
                        title="Change profile picture"
                        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#315efb] text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {pictureUploading ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Camera size={17} />
                        )}
                      </button>

                      <input
                        ref={profilePictureInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleQuickPictureUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {profile.username}
                  </h1>

                  {isOwnProfile ? (
                    <button
                      onClick={openEditModal}
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

                  <button
                    type="button"
                    className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200"
                  >
                    <Settings size={18} />
                  </button>
                </div>

                {/* Counts */}
                <div className="my-6 flex justify-center gap-6 text-sm sm:justify-start sm:gap-10">
                  <p>
                    <strong>{posts.length}</strong>{" "}
                    <span className="text-gray-500">posts</span>
                  </p>

                  <button
                    type="button"
                    onClick={() => openFollowList("followers")}
                    className="transition hover:text-[#315efb]"
                  >
                    <strong>{followersCount}</strong>{" "}
                    <span className="text-gray-500">followers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openFollowList("following")}
                    className="transition hover:text-[#315efb]"
                  >
                    <strong>{followingCount}</strong>{" "}
                    <span className="text-gray-500">following</span>
                  </button>
                </div>

                {/* Profile details */}
                <div className="text-center sm:text-left">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {profile.fullName || profile.username}
                  </h3>

                  {profile.status && (
                    <p className="mt-1 text-sm font-medium text-[#315efb]">
                      {profile.status}
                    </p>
                  )}

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
                <button
                  type="button"
                  key={post._id}
                  onClick={() => setSelectedPost(post)}
                  aria-label={`View post by ${profile.username}`}
                  className="group relative aspect-square overflow-hidden bg-gray-100 text-left"
                >
                  {post.mediaType === "video" ? (
                    <video
                      src={post.mediaUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || "Post"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}

                  <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/50 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="text-sm font-semibold">
                      ♥ {post.likes?.length || 0}
                    </span>

                    <span className="text-sm font-semibold">
                      Comments {post.comments?.length || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <RightPanel />

      {/* Followers / Following Modal */}
      {followListOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={() => setFollowListOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {followListType === "followers" ? "Followers" : "Following"}
              </h2>

              <button
                type="button"
                onClick={() => setFollowListOpen(false)}
                aria-label="Close list"
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* User list */}
            <div className="min-h-[180px] flex-1 overflow-y-auto">
              {followListLoading ? (
                <div className="flex items-center justify-center py-16">
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-[#315efb]"
                  />
                </div>
              ) : followListError ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-red-500">{followListError}</p>

                  <button
                    type="button"
                    onClick={() => openFollowList(followListType)}
                    className="mt-4 rounded-lg bg-[#315efb] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Try again
                  </button>
                </div>
              ) : followListUsers.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <Camera size={25} />
                  </div>

                  <p className="text-sm font-medium text-gray-700">
                    {followListType === "followers"
                      ? "No followers yet"
                      : "Not following anyone yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {followListUsers.map((followUser) => (
                    <Link
                      key={followUser._id}
                      to={`/profile/${followUser._id}`}
                      onClick={() => setFollowListOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50"
                    >
                      <img
                        src={
                          followUser.profilePicture || DEFAULT_PROFILE_PICTURE
                        }
                        alt={followUser.username}
                        className="h-11 w-11 shrink-0 rounded-full border border-gray-200 object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {followUser.username}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {followUser.fullName || followUser.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Large Post Viewer */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/80 p-2 sm:p-6"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative my-auto w-full max-w-[650px]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              aria-label="Close post viewer"
              className="absolute -right-1 -top-11 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-100 sm:-right-3 sm:-top-12"
            >
              <X size={21} />
            </button>

            <FeedPost
              key={selectedPost._id}
              post={selectedPost}
              onDelete={handlePostDelete}
            />
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit profile
              </h2>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving || pictureRemoving}
                className="text-xl text-gray-500 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Profile picture upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Profile picture
                </label>

                <div className="flex items-center gap-4">
                  <img
                    src={
                      previewImage ||
                      profile.profilePicture ||
                      DEFAULT_PROFILE_PICTURE
                    }
                    alt="Profile preview"
                    className="h-20 w-20 rounded-full border border-gray-200 object-cover"
                  />

                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <ImagePlus size={18} />
                    Choose image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  JPEG, PNG, WebP or GIF. Maximum size: 5 MB.
                </p>

                {/* Remove current picture */}
                {profile.profilePicture && (
                  <button
                    type="button"
                    onClick={handleRemoveProfilePicture}
                    disabled={pictureRemoving || saving}
                    className="mt-3 block text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {pictureRemoving
                      ? "Removing picture..."
                      : "Remove current picture"}
                  </button>
                )}
              </div>

              {/* Full name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full name
                </label>

                <input
                  type="text"
                  value={editData.fullName}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      fullName: e.target.value,
                    })
                  }
                  maxLength={50}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                />
              </div>

              {/* Username */}
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
                      username: e.target.value.toLowerCase().replace(/\s/g, ""),
                    })
                  }
                  required
                  minLength={3}
                  maxLength={30}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                />

                <p
                  className={`mt-1 text-xs ${
                    checkingUsername
                      ? "text-gray-400"
                      : usernameAvailability?.available
                        ? "text-green-600"
                        : "text-red-500"
                  }`}
                >
                  {checkingUsername
                    ? "Checking username..."
                    : usernameAvailability?.message || ""}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <input
                  type="text"
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      status: e.target.value,
                    })
                  }
                  maxLength={60}
                  placeholder="What's on your mind?"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {editData.status.length}/60
                </p>
              </div>

              {/* Bio */}
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
                  rows={3}
                  placeholder="Tell people about yourself..."
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {editData.bio.length}/150
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  checkingUsername ||
                  !usernameAvailability?.available ||
                  pictureRemoving
                }
                className="w-full rounded-lg bg-[#315efb] py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
