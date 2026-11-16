import { users } from "../data/dummyData";

export default function StoriesBar() {
  return (
    <section className="stories-section">
      <div className="section-heading">
        <div>
          <h3>Stories</h3>
          <p>See what's happening</p>
        </div>

        <button className="text-button">View all</button>
      </div>

      <div className="stories-list">
        <div className="story-item">
          <div className="story-avatar add-story">
            <img src="https://i.pravatar.cc/150?img=68" alt="Your profile" />
            <span>+</span>
          </div>
          <p>Your story</p>
        </div>

        {users.map((user) => (
          <div className="story-item" key={user.id}>
            <div className="story-avatar">
              <img src={user.avatar} alt={user.name} />
            </div>
            <p>{user.username}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
