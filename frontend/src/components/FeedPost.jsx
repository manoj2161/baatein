import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toggleLike, addComment, deletePost } from "../services/postService";

const FeedPost = ({ post, onDelete }) => {
  const { user } = useAuth();

  const [liked, setLiked] = useState(
    post.likes?.some((id) => String(id?._id || id) === String(user?._id)) ||
      false,
  );

  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const author = post.user || {};

  const isOwner = String(author._id) === String(user?._id);

  const handleLike = async () => {
    const previousLiked = liked;

    setLiked(!previousLiked);
    setLikesCount((count) => (previousLiked ? count - 1 : count + 1));

    try {
      await toggleLike(post._id);
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount((count) => (previousLiked ? count + 1 : count - 1));
      console.error("Like failed:", error);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) return;

    try {
      setLoading(true);

      await addComment(post._id, commentText);

      setComments((previous) => [
        ...previous,
        {
          user: {
            username: user.username,
            profilePicture: user.profilePicture,
          },
          text: commentText,
        },
      ]);

      setCommentText("");
    } catch (error) {
      console.error("Comment failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await deletePost(post._id);
      onDelete(post._id);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <article className="mb-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img
            src={author.profilePicture || "https://placehold.co/45x45?text=U"}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />

          <div className="flex flex-col gap-1">
            <strong className="text-sm font-semibold text-gray-900">
              {author.username || "User"}
            </strong>

            <span className="text-xs text-gray-500">
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString()
                : ""}
            </span>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        )}
      </div>

      {post.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed text-gray-800">
          {post.caption}
        </p>
      )}

      {post.mediaType === "video" ? (
        <video
          src={post.mediaUrl}
          controls
          className="max-h-[550px] w-full bg-gray-50 object-contain"
        />
      ) : (
        <img
          src={post.mediaUrl}
          alt="Post"
          className="max-h-[550px] w-full bg-gray-50 object-contain"
        />
      )}

      <div className="flex items-center gap-5 border-b border-gray-100 px-4 py-3 text-sm">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 text-lg"
        >
          <span className={liked ? "text-red-500" : "text-gray-700"}>
            {liked ? "♥" : "♡"}
          </span>

          <span className="text-sm text-gray-700">{likesCount}</span>
        </button>

        <span className="text-gray-600">Comments {comments.length}</span>
      </div>

      <div className="space-y-2 px-4 pt-3">
        {comments.map((comment, index) => (
          <p key={comment._id || index} className="text-sm">
            <strong className="mr-1 font-semibold text-gray-900">
              {comment.user?.username || "User"}
            </strong>
            <span className="text-gray-700">{comment.text}</span>
          </p>
        ))}
      </div>

      <form onSubmit={handleComment} className="flex gap-2 p-4">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          maxLength={500}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#315efb]"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-[#315efb] hover:bg-blue-50 disabled:opacity-50"
        >
          {loading ? "..." : "Post"}
        </button>
      </form>
    </article>
  );
};

export default FeedPost;
