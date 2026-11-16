import { useEffect, useState } from "react";
import CreatePost from "./CreatePost";
import FeedPost from "./FeedPost";
import { getFeed } from "../services/postService";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getFeed();
      setPosts(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handlePostCreated = (newPost) => {
    if (newPost) {
      setPosts((previous) => [newPost, ...previous]);
    } else {
      loadFeed();
    }
  };

  const handleDelete = (postId) => {
    setPosts((previous) => previous.filter((post) => post._id !== postId));
  };

  return (
    <section className="mx-auto my-5 w-full max-w-[620px]">
      <CreatePost onPostCreated={handlePostCreated} />

      {loading && (
        <p className="py-6 text-center text-sm text-gray-500">
          Loading posts...
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-white p-5 text-center text-sm text-red-500">
          {error}
          <button
            onClick={loadFeed}
            className="ml-2 font-semibold text-[#315efb]"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No posts yet. Follow people or share your first post.
        </p>
      )}

      {posts.map((post) => (
        <FeedPost key={post._id} post={post} onDelete={handleDelete} />
      ))}
    </section>
  );
};

export default Feed;
