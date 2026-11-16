import {
  House,
  Search,
  Compass,
  Video,
  MessageCircle,
  Heart,
  PlusSquare,
  UserRound,
  Menu,
} from "lucide-react";

const menuItems = [
  { label: "Home", icon: House },
  { label: "Search", icon: Search },
  { label: "Explore", icon: Compass },
  { label: "Reels", icon: Video },
  { label: "Messages", icon: MessageCircle },
  { label: "Notifications", icon: Heart },
  { label: "Create", icon: PlusSquare },
  { label: "Profile", icon: UserRound },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">b</div>
        <span>baatein</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${activePage === label ? "active" : ""}`}
            onClick={() => setActivePage(label)}
          >
            <Icon size={21} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <button className="nav-item more-button">
        <Menu size={21} />
        <span>More</span>
      </button>
    </aside>
  );
}
