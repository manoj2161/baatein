import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const menuRef = useRef(null);

  const author = post.user || {};
  const authorId = author._id;
  const isOwner = String(authorId) === String(user?._id);

  // Close menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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
            _id: user._id,
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
    if (!window.confirm("Are you sure you want to delete this post?")) {
      setMenuOpen(false);
      return;
    }

    try {
      setDeleting(true);
      setMenuOpen(false);

      await deletePost(post._id);

      if (onDelete) {
        onDelete(post._id);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.response?.data?.message || "Unable to delete this post.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="mb-5 overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex min-w-0 items-center gap-3">
          {authorId ? (
            <Link
              to={`/profile/${authorId}`}
              className="shrink-0"
              aria-label={`Open ${author.username || "User"}'s profile`}
            >
              <img
                src={
                  author.profilePicture || "https://placehold.co/45x45?text=U"
                }
                alt=""
                className="h-11 w-11 rounded-full object-cover"
              />
            </Link>
          ) : (
            <img
              src={author.profilePicture || "https://placehold.co/45x45?text=U"}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
          )}

          <div className="flex min-w-0 flex-col gap-1">
            {authorId ? (
              <Link
                to={`/profile/${authorId}`}
                className="truncate text-sm font-semibold text-gray-900 hover:text-[#315efb]"
              >
                {author.username || "User"}
              </Link>
            ) : (
              <strong className="text-sm font-semibold text-gray-900">
                {author.username || "User"}
              </strong>
            )}

            <span className="text-xs text-gray-500">
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString()
                : ""}
            </span>
          </div>
        </div>

        {/* Three-dot menu */}
        {isOwner && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((previous) => !previous)}
              disabled={deleting}
              aria-label="Post options"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
            >
              <MoreHorizontal size={23} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={17} />
                  {deleting ? "Deleting..." : "Delete post"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed text-gray-800">
          {post.caption}
        </p>
      )}

      {/* Media */}
      {post.mediaType === "video" ? (
        <video
          src={post.mediaUrl}
          controls
          playsInline
          preload="metadata"
          className="max-h-[550px] w-full bg-gray-50 object-contain"
        />
      ) : (
        <img
          src={post.mediaUrl}
          alt="Post"
          loading="lazy"
          className="max-h-[550px] w-full bg-gray-50 object-contain"
        />
      )}

      {/* Likes and comments count */}
      <div className="flex items-center gap-5 border-b border-gray-100 px-4 py-3 text-sm">
        <button
          type="button"
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

      {/* Comments */}
      <div className="space-y-2 px-4 pt-3">
        {comments.map((comment, index) => (
          <p key={comment._id || index} className="text-sm">
            {comment.user?._id ? (
              <Link
                to={`/profile/${comment.user._id}`}
                className="mr-1 font-semibold text-gray-900 hover:text-[#315efb]"
              >
                {comment.user.username || "User"}
              </Link>
            ) : (
              <strong className="mr-1 font-semibold text-gray-900">
                {comment.user?.username || "User"}
              </strong>
            )}

            <span className="text-gray-700">{comment.text}</span>
          </p>
        ))}
      </div>

      {/* Add comment */}
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
