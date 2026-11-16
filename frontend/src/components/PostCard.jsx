import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [likes, setLikes] = useState(post.likes);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes((previous) => previous + (liked ? -1 : 1));
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="post-user">
          <img src={post.avatar} alt={post.username} />

          <div>
            <h4>{post.username}</h4>
            <p>{post.location}</p>
          </div>
        </div>

        <button className="icon-button">
          <MoreHorizontal size={22} />
        </button>
      </div>

      <div className="post-image">
        <img src={post.image} alt="Post" />
      </div>

      <div className="post-actions">
        <div className="post-action-left">
          <button onClick={toggleLike} className={liked ? "liked" : ""}>
            <Heart size={23} fill={liked ? "currentColor" : "none"} />
          </button>

          <button>
            <MessageCircle size={23} />
          </button>

          <button>
            <Send size={22} />
          </button>
        </div>

        <button
          onClick={() => setSaved(!saved)}
          className={saved ? "saved" : ""}
        >
          <Bookmark size={23} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="post-content">
        <h4>{likes.toLocaleString()} likes</h4>

        <p>
          <strong>{post.username}</strong> {post.caption}
        </p>

        <button className="comments-button">
          View all {post.comments} comments
        </button>

        <span className="post-time">{post.time}</span>
      </div>

      <div className="comment-input">
        <input placeholder="Add a comment..." />
        <button>Post</button>
      </div>
    </article>
  );
}
