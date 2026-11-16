import { users } from "../data/dummyData";

export default function RightPanel() {
  return (
    <aside className="right-panel">
      <div className="current-user">
        <img src="https://i.pravatar.cc/150?img=68" alt="Your profile" />

        <div>
          <h4>your_username</h4>
          <p>Your Name</p>
        </div>

        <button>Switch</button>
      </div>

      <div className="suggestion-heading">
        <h4>People you may know</h4>
        <button>See all</button>
      </div>

      <div className="suggestions">
        {users.slice(0, 4).map((user) => (
          <div className="suggestion-user" key={user.id}>
            <img src={user.avatar} alt={user.name} />

            <div>
              <h4>{user.username}</h4>
              <p>Suggested for you</p>
            </div>

            <button>Follow</button>
          </div>
        ))}
      </div>

      <div className="right-footer">
        <p>About · Help · Privacy · Terms</p>
        <p>© 2026 BAATEIN</p>
      </div>
    </aside>
  );
}
