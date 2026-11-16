import { useEffect, useState } from "react";
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

  const handleUpload = async (event) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) return;

    console.log("Selected file:", file);
    console.log("File type:", file.type);

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
    const updatedStories = stories.filter((story) => story._id !== storyId);

    setStories(updatedStories);
    setSelectedIndex(null);
  };

  // Show only the latest story for each user in the story bar.
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

  const myStories = latestStories.filter(
    (story) => String(story.user?._id) === String(user?._id),
  );

  const otherStories = latestStories.filter(
    (story) => String(story.user?._id) !== String(user?._id),
  );

  const orderedStories = [...myStories, ...otherStories];

  const openStory = (story) => {
    const index = stories.findIndex((item) => item._id === story._id);

    if (index !== -1) setSelectedIndex(index);
  };

  return (
    <>
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {/* Heading */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Stories</h3>
            <p className="mt-1 text-xs text-gray-500">See what's happening</p>
          </div>

          <span className="text-xs font-medium text-gray-400">24 hours</span>
        </div>

        {/* Story list */}
        <div className="flex gap-5 overflow-x-auto pb-2">
          {/* Add story */}
          <label className="flex min-w-[65px] cursor-pointer flex-col items-center gap-2">
            <div className="relative h-[62px] w-[62px] rounded-full border-2 border-gray-200 p-[3px]">
              <img
                src={
                  user?.profilePicture ||
                  "https://placehold.co/150x150?text=You"
                }
                alt="Your profile"
                className="h-full w-full rounded-full object-cover"
              />

              <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#315efb] text-white">
                {uploading ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
              </span>
            </div>

            <span className="max-w-[70px] truncate text-xs text-gray-600">
              {uploading ? "Uploading..." : "Your story"}
            </span>

            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {/* Other stories */}
          {orderedStories.map((story) => (
            <button
              key={story._id}
              onClick={() => openStory(story)}
              className="flex min-w-[65px] flex-col items-center gap-2"
            >
              <div className="h-[62px] w-[62px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
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
                {String(story.user?._id) === String(user?._id)
                  ? "Your story"
                  : story.user?.username || "User"}
              </span>
            </button>
          ))}
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
        />
      )}
    </>
  );
}
