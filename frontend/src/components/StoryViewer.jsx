import { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  LoaderCircle,
  Clock,
} from "lucide-react";

import {
  deleteStory,
  viewStory,
  getStoryViewers,
} from "../services/storyService";

import { useAuth } from "../context/AuthContext";

export default function StoryViewer({
  stories,
  initialIndex,
  onClose,
  onDelete,
  onViewed,
}) {
  const [index, setIndex] = useState(initialIndex);
  const [deleting, setDeleting] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [viewerError, setViewerError] = useState("");

  const { user } = useAuth();

  const story = stories[index];

  const owner = story?.user || {};
  const isOwner = String(owner._id) === String(user?._id);

  // Record a view whenever another user's story is opened.
  useEffect(() => {
    if (!story || isOwner) return;

    let cancelled = false;

    const recordView = async () => {
      try {
        await viewStory(story._id);

        if (!cancelled) {
          onViewed?.(story._id);
        }
      } catch (error) {
        console.error("Unable to record story view:", error);
      }
    };

    recordView();

    return () => {
      cancelled = true;
    };
  }, [story?._id, isOwner, onViewed]);

  // Reset viewer history when changing stories.
  useEffect(() => {
    setShowViewers(false);
    setViewers([]);
    setViewerError("");
  }, [story?._id]);

  // Automatically move to the next story after 7 seconds.
  useEffect(() => {
    if (!story || showViewers) return;

    const timer = setTimeout(() => {
      if (index < stories.length - 1) {
        setIndex((current) => current + 1);
      } else {
        onClose();
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [index, story?._id, stories.length, onClose, showViewers]);

  if (!story) return null;

  const formatViewedTime = (date) => {
    if (!date) return "Recently";

    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (Number.isNaN(seconds) || seconds < 0) {
      return "Recently";
    }

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days} ${days === 1 ? "day" : "days"} ago`;
  };

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

  const handleGetViewers = async () => {
    if (showViewers) {
      setShowViewers(false);
      return;
    }

    setShowViewers(true);
    setLoadingViewers(true);
    setViewerError("");

    try {
      const data = await getStoryViewers(story._id);
      setViewers(data.viewers || []);
    } catch (error) {
      console.error("Unable to load story viewers:", error);

      setViewerError(
        error.response?.data?.message ||
          "Unable to load viewers. Please try again.",
      );
    } finally {
      setLoadingViewers(false);
    }
  };

  const previous = () => {
    if (index > 0) {
      setIndex((current) => current - 1);
    }
  };

  const next = () => {
    if (index < stories.length - 1) {
      setIndex((current) => current + 1);
    } else {
      onClose();
    }
  };

  const viewerCount = story.viewersCount || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black sm:bg-black/95 sm:p-4">
      {/* Story Container */}
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-black sm:h-[85vh] sm:rounded-xl">
        {/* Close Button - Top Right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close story"
          className="absolute right-3 top-4 z-[120] rounded-full bg-black/60 p-2.5 text-white transition hover:bg-white/20 sm:right-4 sm:top-4"
        >
          <X size={23} />
        </button>

        {/* Progress Bars */}
        <div className="absolute left-3 right-14 top-3 z-20 flex gap-1">
          {stories.map((item, i) => (
            <div
              key={item._id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className={`h-full rounded-full bg-white ${
                  i <= index ? "w-full" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* User Information */}
        <div className="absolute left-3 right-14 top-7 z-20 flex items-center gap-2 sm:left-4">
          <img
            src={owner.profilePicture || "https://placehold.co/40x40?text=U"}
            alt={owner.username || "User"}
            className="h-9 w-9 shrink-0 rounded-full border border-white object-cover"
          />

          <span className="truncate text-sm font-semibold text-white">
            {owner.username || "User"}
          </span>
        </div>

        {/* Story Media */}
        <div className="flex h-full w-full items-center justify-center">
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
        </div>

        {/* Previous Story */}
        <button
          type="button"
          onClick={previous}
          disabled={index === 0 || showViewers}
          aria-label="Previous story"
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/70 disabled:opacity-20"
        >
          <ChevronLeft size={25} />
        </button>

        {/* Next Story */}
        <button
          type="button"
          onClick={next}
          disabled={showViewers}
          aria-label="Next story"
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/70 disabled:opacity-20"
        >
          <ChevronRight size={25} />
        </button>

        {/* Bottom Story Actions */}
        {isOwner && !showViewers && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-white/10 bg-black/70 px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleGetViewers}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <Eye size={19} />
              <span>{viewerCount} views</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-full bg-red-500/15 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
            >
              {deleting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>
        )}

        {/* Story Viewer History */}
        {showViewers && isOwner && (
          <div className="absolute inset-x-0 bottom-0 z-40 max-h-[65%] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <div>
                <h3 className="font-semibold text-gray-900">Story viewers</h3>

                <p className="mt-1 text-xs text-gray-500">
                  {viewers.length} {viewers.length === 1 ? "person" : "people"}{" "}
                  viewed your story
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowViewers(false)}
                aria-label="Close viewer history"
                className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[calc(65vh-85px)] overflow-y-auto px-4 pb-6">
              {loadingViewers && (
                <div className="flex justify-center py-8">
                  <LoaderCircle
                    size={25}
                    className="animate-spin text-[#315efb]"
                  />
                </div>
              )}

              {viewerError && (
                <p className="py-6 text-center text-sm text-red-500">
                  {viewerError}
                </p>
              )}

              {!loadingViewers && !viewerError && viewers.length === 0 && (
                <div className="py-8 text-center">
                  <Eye size={28} className="mx-auto mb-2 text-gray-300" />

                  <p className="text-sm text-gray-500">
                    No one has viewed this story yet.
                  </p>
                </div>
              )}

              {!loadingViewers &&
                viewers.map((viewer) => (
                  <div
                    key={viewer._id}
                    className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={
                          viewer.profilePicture ||
                          "https://placehold.co/40x40?text=U"
                        }
                        alt={viewer.username || "User"}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />

                      <span className="truncate text-sm font-medium text-gray-800">
                        {viewer.username || "User"}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                      <Clock size={13} />
                      <span>{formatViewedTime(viewer.viewedAt)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
