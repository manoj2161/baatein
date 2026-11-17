import { useCallback, useEffect, useState } from "react";
import { Plus, LoaderCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getStories, createStory } from "../services/storyService";
import StoryViewer from "./StoryViewer";

export default function StoriesBar() {
  const { user } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [error, setError] = useState("");

  const loadStories = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStories();
      setStories(data);
    } catch (err) {
      setError("Unable to load stories.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleViewed = useCallback((storyId) => {
    setStories((currentStories) =>
      currentStories.map((story) =>
        story._id === storyId ? { ...story, isViewed: true } : story,
      ),
    );
  }, []);

  const handleUpload = async (event) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Please select a valid image or video.");
      input.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("media", file);

      await createStory(formData);

      await loadStories();
    } catch (err) {
      console.error("Story upload error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to upload story. Please try again.",
      );
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const handleDelete = (storyId) => {
    setStories((currentStories) =>
      currentStories.filter((story) => story._id !== storyId),
    );

    setSelectedIndex(null);
  };

  // Get the latest story for each user.
  const latestStories = Object.values(
    stories.reduce((groups, story) => {
      const userId = story.user?._id;

      if (!userId) return groups;

      if (
        !groups[userId] ||
        new Date(story.createdAt) > new Date(groups[userId].createdAt)
      ) {
        groups[userId] = story;
      }

      return groups;
    }, {}),
  );

  // Separate your story from other users' stories.
  const myStory = latestStories.find(
    (story) => String(story.user?._id) === String(user?._id),
  );

  const otherStories = latestStories.filter(
    (story) => String(story.user?._id) !== String(user?._id),
  );

  const openStory = (story) => {
    const index = stories.findIndex((item) => item._id === story._id);

    if (index !== -1) {
      setSelectedIndex(index);
    }
  };

  const handleMyProfileClick = () => {
    if (myStory) {
      openStory(myStory);
    }
  };

  return (
    <>
      <section className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:mb-6 sm:p-5">
        {/* Heading */}
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Stories</h3>

            <p className="mt-1 text-xs text-gray-500">See what's happening</p>
          </div>

          <span className="text-xs font-medium text-gray-400">24 hours</span>
        </div>

        {/* Story list */}
        <div className="flex gap-4 overflow-x-auto overscroll-x-contain pb-2 scrollbar-hide sm:gap-5">
          {/* Your single profile story icon */}
          <div className="flex w-[68px] min-w-[68px] shrink-0 flex-col items-center gap-2">
            <div
              className={`relative h-[62px] w-[62px] rounded-full p-[2px] ${
                myStory
                  ? myStory.isViewed
                    ? "bg-gray-300"
                    : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                  : "bg-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={handleMyProfileClick}
                disabled={!myStory}
                aria-label={
                  myStory ? "View your story" : "Your profile picture"
                }
                className="h-full w-full rounded-full bg-white p-[3px]"
              >
                <img
                  src={
                    user?.profilePicture ||
                    "https://placehold.co/150x150?text=You"
                  }
                  alt="Your profile"
                  className="h-full w-full rounded-full object-cover"
                />
              </button>

              {/* Add another story */}
              <label
                className={`absolute bottom-0 right-0 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#315efb] text-white ${
                  uploading ? "cursor-wait" : ""
                }`}
                title="Add another story"
              >
                {uploading ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}

                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <span className="max-w-[70px] truncate text-xs text-gray-600">
              {uploading ? "Uploading..." : "Your story"}
            </span>
          </div>

          {/* Other users' stories */}
          {otherStories.map((story) => {
            const isViewed = Boolean(story.isViewed);

            return (
              <button
                key={story._id}
                type="button"
                onClick={() => openStory(story)}
                aria-label={`View ${story.user?.username || "user"}'s story`}
                className="flex w-[68px] min-w-[68px] shrink-0 flex-col items-center gap-2"
              >
                <div
                  className={`h-[62px] w-[62px] rounded-full p-[2px] ${
                    isViewed
                      ? "bg-gray-300"
                      : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                  }`}
                >
                  <div className="h-full w-full rounded-full bg-white p-[3px]">
                    <img
                      src={
                        story.user?.profilePicture ||
                        "https://placehold.co/150x150?text=U"
                      }
                      alt={story.user?.username || "User"}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                </div>

                <span className="max-w-[70px] truncate text-xs text-gray-600">
                  {story.user?.username || "User"}
                </span>
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Loading stories...
          </p>
        )}

        {error && (
          <p className="mt-3 text-center text-xs text-red-500">{error}</p>
        )}

        {!loading && stories.length === 0 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            No stories yet. Share your first story.
          </p>
        )}
      </section>

      {/* Story viewer */}
      {selectedIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onDelete={handleDelete}
          onViewed={handleViewed}
        />
      )}
    </>
  );
}
