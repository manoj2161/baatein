import {
  House,
  Search,
  MessageCircle,
  Heart,
  PlusSquare,
  UserRound,
  LogOut,
  PenLine,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const desktopMenuItems = [
  { label: "Home", icon: House, path: "/" },
  { label: "Search", icon: Search, path: "/search" },
  { label: "Messages", icon: MessageCircle, path: "/messages" },
  { label: "Notifications", icon: Heart, path: "/notifications" },
  { label: "The Unsent", icon: PenLine, path: "/unsent" },
  { label: "Create", icon: PlusSquare, path: "/create" },
  { label: "Profile", icon: UserRound, path: null },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, totalUnreadCount, notificationUnreadCount } = useAuth();

  const isProfilePage = location.pathname.startsWith("/profile");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const handleNavigation = (label, path) => {
    if (label === "Profile") {
      if (user?._id) {
        navigate(`/profile/${user._id}`);
      }
      return;
    }

    navigate(path);
  };

  const isActive = (label, path) => {
    if (label === "Profile") {
      return isProfilePage;
    }

    if (label === "The Unsent") {
      return location.pathname.startsWith("/unsent");
    }

    return location.pathname === path;
  };

  const getBadgeCount = (label) => {
    if (label === "Messages") return totalUnreadCount || 0;
    if (label === "Notifications") return notificationUnreadCount || 0;
    return 0;
  };

  const mobileTopItems = [
    { label: "Search", icon: Search, path: "/search" },
    { label: "Notifications", icon: Heart, path: "/notifications" },
    { label: "Messages", icon: MessageCircle, path: "/messages" },
  ];

  return (
    <>
      {/* DESKTOP AND TABLET SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-gray-200 bg-white px-3 py-6 md:flex lg:w-[240px] lg:px-4 lg:py-8">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="mb-8 flex cursor-pointer items-center gap-3 px-3 text-left lg:mb-10"
          aria-label="Baatein home"
        >
          <img
            src={logo}
            alt="Baatein"
            className="h-10 w-10 shrink-0 object-contain"
          />

          <span className="text-2xl font-bold tracking-tight text-gray-900">
            baatein
          </span>
        </button>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {desktopMenuItems.map(({ label, icon: Icon, path }) => {
            const active = isActive(label, path);
            const count = getBadgeCount(label);

            return (
              <button
                key={label}
                onClick={() => handleNavigation(label, path)}
                className={`flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition lg:gap-4 lg:px-4 lg:text-[15px] ${
                  active
                    ? "bg-blue-50 font-semibold text-[#315efb]"
                    : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />

                <span className="flex-1">{label}</span>

                {count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#315efb] px-1.5 text-[11px] font-semibold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-4 flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 lg:gap-4 lg:px-4 lg:text-[15px]"
        >
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
          aria-label="Baatein home"
        >
          <img src={logo} alt="Baatein" className="h-9 w-9 object-contain" />

          <span className="text-xl font-bold tracking-tight text-gray-900">
            baatein
          </span>
        </button>

        {/* Mobile Top Actions */}
        <div className="flex items-center gap-4">
          {mobileTopItems.map(({ label, icon: Icon, path }) => {
            const active = isActive(label, path);
            const count = getBadgeCount(label);

            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                aria-label={label}
                className={`relative flex h-10 w-9 items-center justify-center ${
                  active ? "text-[#315efb]" : "text-gray-600"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />

                {count > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#315efb] px-1 text-[9px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid h-[64px] grid-cols-5 items-center px-3">
          {/* Home */}
          <button
            onClick={() => navigate("/")}
            aria-label="Home"
            className={`flex h-full flex-col items-center justify-center gap-1 ${
              isActive("Home", "/") ? "text-[#315efb]" : "text-gray-500"
            }`}
          >
            <House size={22} />
            <span className="text-[10px]">Home</span>
          </button>

          {/* The Unsent */}
          <button
            onClick={() => navigate("/unsent")}
            aria-label="The Unsent"
            className={`flex h-full flex-col items-center justify-center gap-1 ${
              isActive("The Unsent", "/unsent")
                ? "text-[#315efb]"
                : "text-gray-500"
            }`}
          >
            <PenLine size={22} />
            <span className="text-[10px]">Unsent</span>
          </button>

          {/* Create */}
          <button
            onClick={() => navigate("/create")}
            aria-label="Create"
            className="flex h-full items-center justify-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#315efb] text-white shadow-md">
              <PlusSquare size={24} />
            </span>
          </button>

          {/* Profile */}
          <button
            onClick={() => handleNavigation("Profile", null)}
            aria-label="Profile"
            className={`flex h-full flex-col items-center justify-center gap-1 ${
              isProfilePage ? "text-[#315efb]" : "text-gray-500"
            }`}
          >
            <UserRound size={22} />
            <span className="text-[10px]">Profile</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="flex h-full flex-col items-center justify-center gap-1 text-red-500"
          >
            <LogOut size={22} />
            <span className="text-[10px]">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
