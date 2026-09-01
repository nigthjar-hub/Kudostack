import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROUTE_COPY: { match: (path: string) => boolean; title: string; subtitle: string; back?: boolean }[] = [
  { match: (p) => p.startsWith("/friends"), title: "Friends", subtitle: "what your people are reading" },
  { match: (p) => p.startsWith("/add"), title: "Add Fic", subtitle: "log something new" },
  { match: (p) => p.startsWith("/library"), title: "My Library", subtitle: "everything you've logged" },
  { match: (p) => p.startsWith("/stats"), title: "Stats", subtitle: "your year in fic" },
  { match: (p) => p.startsWith("/settings"), title: "Settings", subtitle: "account & privacy", back: true },
  {
    match: (p) => p.startsWith("/profile/edit"),
    title: "Edit Profile",
    subtitle: "how others see you",
    back: true,
  },
];

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  let title = "Kudostack";
  let subtitle = "";
  let showBack = false;

  if (location.pathname.startsWith("/u/")) {
    const isSelf = user?.username === username;
    title = isSelf ? "My Profile" : `${username}`;
    subtitle = isSelf ? "your reading life" : "reading profile";
  } else {
    const entry = ROUTE_COPY.find((r) => r.match(location.pathname));
    if (entry) {
      title = entry.title;
      subtitle = entry.subtitle;
      showBack = !!entry.back;
    }
  }

  return (
    <header
      className="mx-auto max-w-[440px] px-5 pb-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
    >
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="mb-2 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <h1 className="font-heading text-[2rem] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
    </header>
  );
}
