import { useState } from "react";
import { createPost } from "../services/postService";

const CreatePost = ({ onPostCreated }) => {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (preview) URL.revokeObjectURL(preview);

    setMedia(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!media) {
      setError("Please select an image or video.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("media", media);

      const newPost = await createPost(formData);

      if (onPostCreated) onPostCreated(newPost);

      setCaption("");
      setMedia(null);

      if (preview) URL.revokeObjectURL(preview);
      setPreview("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        Create a post
      </h3>

      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="What's on your mind?"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          maxLength={2200}
          className="min-h-20 w-full resize-y rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none transition focus:border-[#315efb]"
        />

        {preview &&
          (media?.type.startsWith("video/") ? (
            <video
              src={preview}
              controls
              className="mt-4 max-h-[350px] w-full rounded-lg object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="mt-4 max-h-[350px] w-full rounded-lg object-contain"
            />
          ))}

        <div className="mt-4 flex items-center justify-between">
          <label className="cursor-pointer rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-[#315efb] transition hover:bg-blue-100">
            Add photo/video
            <input
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={handleMediaChange}
              hidden
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#315efb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Posting..." : "Share"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </form>
    </div>
  );
};

export default CreatePost;
