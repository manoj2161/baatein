import { users } from "../data/dummyData";

export default function RightPanel() {
  return (
    <aside className="fixed right-0 top-0 hidden h-screen w-[320px] flex-col border-l border-gray-200 bg-white px-6 py-8 lg:flex">
      {/* Current User */}
      <div className="mb-9 flex items-center gap-3">
        <img
          src="https://i.pravatar.cc/150?img=68"
          alt="Your profile"
          className="h-12 w-12 rounded-full object-cover"
        />

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-gray-900">
            your_username
          </h4>
          <p className="truncate text-xs text-gray-500">Your Name</p>
        </div>

        <button className="text-xs font-semibold text-[#315efb] hover:text-blue-700">
          Switch
        </button>
      </div>

      {/* Suggestions Heading */}
      <div className="mb-5 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-500">
          People you may know
        </h4>

        <button className="text-xs font-semibold text-gray-900 hover:text-[#315efb]">
          See all
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex flex-col gap-5">
        {users.slice(0, 4).map((user) => (
          <div className="flex items-center gap-3" key={user.id}>
            <img
              src={user.avatar}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover"
            />

            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-gray-900">
                {user.username}
              </h4>

              <p className="text-xs text-gray-500">Suggested for you</p>
            </div>

            <button className="text-xs font-semibold text-[#315efb] hover:text-blue-700">
              Follow
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-xs leading-6 text-gray-400">
        <p>About · Help · Privacy · Terms</p>
        <p className="mt-2">© 2026 BAATEIN</p>
      </div>
    </aside>
  );
}
