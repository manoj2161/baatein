import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { deleteStory } from "../services/storyService";
import { useAuth } from "../context/AuthContext";

export default function StoryViewer({
  stories,
  initialIndex,
  onClose,
  onDelete,
}) {
  const [index, setIndex] = useState(initialIndex);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const story = stories[index];

  useEffect(() => {
    if (!story) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      if (index < stories.length - 1) {
        setIndex((current) => current + 1);
      } else {
        onClose();
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [index, story, stories.length, onClose]);

  if (!story) return null;

  const owner = story.user || {};

  const isOwner = String(owner._id) === String(user?._id);

  const handleDelete = async () => {
    if (!window.confirm("Delete this story?")) return;

    try {
      setDeleting(true);
      await deleteStory(story._id);
      onDelete(story._id);
    } catch (error) {
      console.error("Unable to delete story:", error);
      setDeleting(false);
    }
  };

  const previous = () => {
    setIndex((current) => Math.max(0, current - 1));
  };

  const next = () => {
    if (index < stories.length - 1) {
      setIndex((current) => current + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3">
      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X size={24} />
      </button>

      <div className="relative flex h-[85vh] w-full max-w-[430px] flex-col overflow-hidden rounded-xl bg-black">
        {/* Progress */}
        <div className="absolute left-3 right-3 top-3 z-20 flex gap-1">
          {stories.map((item, i) => (
            <div
              key={item._id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className={`h-full rounded-full bg-white ${
                  i < index ? "w-full" : i === index ? "w-full" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* User information */}
        <div className="absolute left-4 right-4 top-7 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={owner.profilePicture || "https://placehold.co/40x40?text=U"}
              alt=""
              className="h-9 w-9 rounded-full border border-white object-cover"
            />

            <span className="text-sm font-semibold text-white">
              {owner.username || "User"}
            </span>
          </div>

          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-black/40 p-2 text-white hover:bg-red-500"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Media */}
        {story.mediaType === "video" ? (
          <video
            key={story._id}
            src={story.mediaUrl}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            key={story._id}
            src={story.mediaUrl}
            alt="Story"
            className="h-full w-full object-contain"
          />
        )}

        {/* Navigation */}
        <button
          onClick={previous}
          disabled={index === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white disabled:opacity-20"
        >
          <ChevronLeft size={25} />
        </button>

        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white"
        >
          <ChevronRight size={25} />
        </button>
      </div>
    </div>
  );
}
