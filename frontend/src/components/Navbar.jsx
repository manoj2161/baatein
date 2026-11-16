
import {
  House,
  Search,
  PlusSquare,
  MessageCircle,
  UserRound,
} from "lucide-react";

const items = [
  { label: "Home", icon: House },
  { label: "Search", icon: Search },
  { label: "Create", icon: PlusSquare },
  { label: "Messages", icon: MessageCircle },
  { label: "Profile", icon: UserRound },
];

export default function Navbar({ activePage, setActivePage }) {
  return (
    <nav className="mobile-navbar">
      {items.map(({ label, icon: Icon }) => (
        <button
          key={label}
          className={activePage === label ? "mobile-active" : ""}
          onClick={() => setActivePage(label)}
        >
          <Icon size={23} />
        </button>
      ))}
    </nav>
  );
}