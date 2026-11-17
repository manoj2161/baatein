import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Video,
  UploadCloud,
  X,
  LoaderCircle,
  Send,
  Sparkles,
  Image as ImageIcon,
  Film,
  CheckCircle2,
} from "lucide-react";

import { createPost } from "../services/postService";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const CreatePost = ({ onPostCreated }) => {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);

  const isVideo = media?.type.startsWith("video/");

  useEffect(() => {
    if (!media) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(media);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [media]);

  const validateFile = (file) => {
    if (!file) return false;

    const isImage = file.type.startsWith("image/");
    const isVideoFile = file.type.startsWith("video/");

    if (!isImage && !isVideoFile) {
      setError("Please select a valid image or video.");
      return false;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be less than 10 MB.");
      return false;
    }

    if (isVideoFile && file.size > MAX_VIDEO_SIZE) {
      setError("Video size must be less than 100 MB.");
      return false;
    }

    setError("");
    setMedia(file);
    return true;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) validateFile(file);

    event.target.value = "";
  };

  const openFilePicker = (type) => {
    if (!fileInputRef.current) return;

    fileInputRef.current.accept =
      type === "image" ? "image/*" : "video/mp4,video/webm,video/quicktime";

    fileInputRef.current.click();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) validateFile(file);
  };

  const removeMedia = () => {
    setMedia(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!media) {
      setError("Choose a photo or video before sharing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("caption", caption.trim());
      formData.append("media", media);

      const newPost = await createPost(formData);

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      setCaption("");
      setMedia(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create post. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Caption section */}
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_35px_rgba(0,0,0,0.035)]">
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#315efb]">
              <Sparkles size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Start with a thought
              </h2>
              <p className="text-xs text-gray-500">
                Every post has a story behind it.
              </p>
            </div>
          </div>

          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="What's happening in your world?"
            maxLength={2200}
            rows={4}
            className="min-h-32 w-full resize-y border-0 bg-transparent text-base leading-7 text-gray-800 outline-none placeholder:text-gray-400 sm:text-lg"
          />

          <div className="flex justify-end border-t border-gray-100 pt-3">
            <span className="text-xs text-gray-400">
              {caption.length} / 2200
            </span>
          </div>
        </div>
      </section>

      {/* Media section */}
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_35px_rgba(0,0,0,0.035)]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-7">
          <div>
            <h2 className="font-semibold text-gray-900">Your moment</h2>
            <p className="mt-1 text-xs text-gray-500">
              Add a photo or video to your post.
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#315efb]">
            <ImageIcon size={20} />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {!media ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`relative flex min-h-[290px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-4 py-10 text-center transition sm:min-h-[340px] ${
                dragging
                  ? "border-[#315efb] bg-blue-50"
                  : "border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/60"
              }`}
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-indigo-100/40 blur-3xl" />

              <div className="relative">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-100 bg-white text-[#315efb] shadow-lg shadow-blue-100/50">
                  <UploadCloud size={34} strokeWidth={1.6} />
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  {dragging ? "Drop it here" : "Bring your moment to life"}
                </h3>

                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                  Choose something from your device or drag and drop it here.
                  Your story deserves to be shared.
                </p>

                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => openFilePicker("image")}
                    className="flex items-center gap-2 rounded-xl bg-[#315efb] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                  >
                    <ImagePlus size={18} />
                    Choose Photo
                  </button>

                  <button
                    type="button"
                    onClick={() => openFilePicker("video")}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Video size={18} />
                    Choose Video
                  </button>
                </div>

                <p className="mt-5 text-[11px] text-gray-400">
                  Images up to 10 MB · Videos up to 100 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#315efb]">
                    {isVideo ? <Film size={18} /> : <ImageIcon size={18} />}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {media.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(media.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeMedia}
                  disabled={loading}
                  aria-label="Remove selected media"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="flex min-h-[220px] items-center justify-center bg-[#f4f6fa] p-2 sm:min-h-[300px]">
                {isVideo ? (
                  <video
                    src={preview}
                    controls
                    preload="metadata"
                    playsInline
                    className="max-h-[450px] w-full rounded-lg object-contain"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Selected post preview"
                    loading="lazy"
                    className="max-h-[450px] w-full rounded-lg object-contain"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3 text-xs font-medium text-green-600">
                <CheckCircle2 size={16} />
                Media ready to share
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Share section */}
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Ready to share your moment?
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Your followers will be able to see your new post.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !media}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315efb] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/60 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send size={17} />
                Share Post
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
};

export default CreatePost;
