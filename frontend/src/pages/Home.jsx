import Sidebar from "../components/Sidebar";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RightPanel from "../components/RightPanel";
import Navbar from "../components/Navbar";

import { posts } from "../data/dummyData";

export default function Home({ activePage, setActivePage }) {
  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="main-content">
        <div className="feed-container">
          <StoriesBar />

          <div className="feed-heading">
            <div>
              <h2>Your feed</h2>
              <p>Updates from your community</p>
            </div>

            <button className="filter-button">For you</button>
          </div>

          <div className="posts-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>

      <RightPanel />

      <Navbar activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}
