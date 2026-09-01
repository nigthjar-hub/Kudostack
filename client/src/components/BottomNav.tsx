import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[440px] justify-center px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
    >
      <nav className="flex w-full items-center justify-around rounded-[28px] border border-ink/[0.06] bg-surface px-2 py-2 shadow-[0_10px_30px_rgba(43,33,24,0.14)]">
        <TabButton to={user ? `/u/${user.username}` : "/login"} label="Profile">
          <ProfileIcon />
        </TabButton>
        <TabButton to="/friends" label="Friends">
          <FriendsIcon />
        </TabButton>

        <button
          onClick={() => navigate("/add")}
          aria-label="Add Fic"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paprika text-white shadow-md shadow-paprika/30 active:scale-95"
        >
          <PlusIcon />
        </button>

        <TabButton to="/library" label="Library">
          <LibraryIcon />
        </TabButton>
        <TabButton to="/stats" label="Stats">
          <StatsIcon />
        </TabButton>
      </nav>
    </div>
  );
}

function TabButton({ to, label, children }: { to: string; label: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-semibold ${
          isActive ? "text-paprika" : "text-ink-dim"
        }`
      }
    >
      <span className="h-[22px] w-[22px]">{children}</span>
      {label}
    </NavLink>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: "100%",
  height: "100%",
};

function ProfileIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.5 8.6c0 4.2-4.8 7.5-8.5 10.4-3.7-2.9-8.5-6.2-8.5-10.4a4.6 4.6 0 0 1 8.5-2.5 4.6 4.6 0 0 1 8.5 2.5Z" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11a2 2 0 0 1 2 2v14a1.5 1.5 0 0 0-1.5-1.5H4Z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13a2 2 0 0 0-2 2v14a1.5 1.5 0 0 1 1.5-1.5H20Z" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3c.6 3.4 1.2 5 2.5 6.5S18 12 21 12c-3 0-5.2 1-6.5 2.5S12.6 18.6 12 22c-.6-3.4-1.2-5-2.5-6.5S6 13 3 12c3 0 5.2-1 6.5-2.5S11.4 6.4 12 3Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
