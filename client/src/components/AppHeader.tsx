import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROUTE_COPY: { match: (path: string) => boolean; title: string; subtitle: string }[] = [
  { match: (p) => p.startsWith("/friends"), title: "Friends", subtitle: "what your people are reading" },
  { match: (p) => p.startsWith("/add"), title: "Add Fic", subtitle: "log something new" },
  { match: (p) => p.startsWith("/library"), title: "My Library", subtitle: "everything you've logged" },
  { match: (p) => p.startsWith("/stats"), title: "Stats", subtitle: "your year in fic" },
];

export function AppHeader() {
  const location = useLocation();
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  let title = "Kudostack";
  let subtitle = "";

  if (location.pathname.startsWith("/u/")) {
    const isSelf = user?.username === username;
    title = isSelf ? "My Profile" : `${username}`;
    subtitle = isSelf ? "your reading life" : "reading profile";
  } else {
    const entry = ROUTE_COPY.find((r) => r.match(location.pathname));
    if (entry) {
      title = entry.title;
      subtitle = entry.subtitle;
    }
  }

  return (
    <header
      className="mx-auto max-w-[440px] px-5 pb-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
    >
      <h1 className="font-heading text-2xl font-bold text-paprika">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
    </header>
  );
}
