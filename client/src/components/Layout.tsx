import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/library", label: "My Library" },
  { to: "/add", label: "Add Fic" },
  { to: "/friends", label: "Friends" },
  { to: "/stats", label: "Stats" },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-honeydew">
      <header className="sticky top-0 z-10 border-b border-paprika/10 bg-honeydew/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <NavLink to="/library" className="font-heading text-2xl font-semibold text-paprika">
            Kudostack
          </NavLink>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-sandy text-white" : "text-ink-soft hover:bg-sandy/15"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <NavLink
                to={`/u/${user.username}`}
                className="flex h-9 w-9 items-center justify-center rounded-full font-heading text-sm font-semibold text-white"
                style={{ backgroundColor: user.avatarColor }}
                title={user.username}
              >
                {user.username.slice(0, 1).toUpperCase()}
              </NavLink>
            )}
            <button
              onClick={() => logout()}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-paprika/10"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-sandy text-white" : "text-ink-soft hover:bg-sandy/15"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
