import {
  House,
  Search,
  Compass,
  Video,
  MessageCircle,
  Heart,
  PlusSquare,
  UserRound,
  LogOut,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { label: "Home", icon: House, path: "/" },
  { label: "Search", icon: Search, path: "/search" },
  { label: "Explore", icon: Compass, path: "/explore" },
  { label: "Reels", icon: Video, path: "/reels" },
  { label: "Messages", icon: MessageCircle, path: "/messages" },
  { label: "Notifications", icon: Heart, path: "/notifications" },
  { label: "Create", icon: PlusSquare, path: "/create" },
  { label: "Profile", icon: UserRound, path: null },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, totalUnreadCount, notificationUnreadCount } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-gray-200 bg-white px-4 py-8 md:flex">
      {/* Brand */}
      <div
        onClick={() => navigate("/")}
        className="mb-10 flex cursor-pointer items-center gap-3 px-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#315efb] text-xl font-bold text-white">
          b
        </div>

        <span className="text-2xl font-bold tracking-tight text-gray-900">
          baatein
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {menuItems.map(({ label, icon: Icon, path }) => {
          const active =
            label === "Profile"
              ? location.pathname.startsWith("/profile")
              : location.pathname === path;

          return (
            <button
              key={label}
              onClick={() => {
                if (label === "Profile") {
                  if (user?._id) {
                    navigate(`/profile/${user._id}`);
                  }
                  return;
                }

                navigate(path);
              }}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] transition ${
                active
                  ? "bg-blue-50 font-semibold text-[#315efb]"
                  : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />

              <span className="flex-1">{label}</span>

              {/* Messages unread badge */}
              {label === "Messages" && totalUnreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#315efb] px-1.5 text-[11px] font-semibold text-white">
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )}

              {/* Notifications unread badge */}
              {label === "Notifications" && notificationUnreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#315efb] px-1.5 text-[11px] font-semibold text-white">
                  {notificationUnreadCount > 99
                    ? "99+"
                    : notificationUnreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] font-medium text-red-500 transition hover:bg-red-50"
      >
        <LogOut size={22} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
