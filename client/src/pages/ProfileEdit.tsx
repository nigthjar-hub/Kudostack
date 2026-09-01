import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError, type Fic, type PinnedFandom, type PinnedFic, type SocialLink } from "../api";

export function ProfileEdit() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const [pinnedFics, setPinnedFics] = useState<PinnedFic[]>([]);
  const [ficQuery, setFicQuery] = useState("");
  const [ficResults, setFicResults] = useState<Fic[]>([]);
  const [pinFicError, setPinFicError] = useState<string | null>(null);

  const [pinnedFandoms, setPinnedFandoms] = useState<PinnedFandom[]>([]);
  const [fandomQuery, setFandomQuery] = useState("");
  const [fandomSuggestions, setFandomSuggestions] = useState<string[]>([]);
  const [pinFandomError, setPinFandomError] = useState<string | null>(null);

  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    api.getUser(user.username).then((profile) => {
      setSocialLinks(profile.socialLinks);
      setPinnedFics(profile.pinnedFics);
      setPinnedFandoms(profile.pinnedFandoms);
    });
  }, [user]);

  useEffect(() => {
    const q = ficQuery.trim();
    if (!q) {
      setFicResults([]);
      return;
    }
    const handle = setTimeout(() => api.searchFics(q).then(setFicResults), 250);
    return () => clearTimeout(handle);
  }, [ficQuery]);

  useEffect(() => {
    const q = fandomQuery.trim();
    if (!q) {
      setFandomSuggestions([]);
      return;
    }
    const handle = setTimeout(() => api.fandomAutocomplete(q).then(setFandomSuggestions), 250);
    return () => clearTimeout(handle);
  }, [fandomQuery]);

  if (!user) return null;

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile({
        displayName: displayName.trim() || null,
        username: username.trim(),
        bio: bio.trim() || null,
      });
      setUser(updated);
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2000);
      if (updated.username !== user!.username) {
        navigate(`/u/${updated.username}`, { replace: true });
      }
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleIconUpload(file: File) {
    setUploadError(null);
    setUploadingIcon(true);
    try {
      const { url } = await api.uploadImage(file);
      const updated = await api.updateProfile({ avatarUrl: url });
      setUser(updated);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploadingIcon(false);
    }
  }

  async function handleBannerUpload(file: File) {
    setUploadError(null);
    setUploadingBanner(true);
    try {
      const { url } = await api.uploadImage(file);
      const updated = await api.updateProfile({ bannerUrl: url });
      setUser(updated);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkError(null);
    try {
      const link = await api.addSocialLink(platform.trim(), url.trim());
      setSocialLinks((prev) => [...prev, link]);
      setPlatform("");
      setUrl("");
    } catch (err) {
      setLinkError(err instanceof ApiError ? err.message : "Couldn't add link");
    }
  }

  async function removeLink(id: string) {
    await api.removeSocialLink(id);
    setSocialLinks((prev) => prev.filter((l) => l.id !== id));
  }

  async function addFicPin(fic: Fic) {
    setPinFicError(null);
    try {
      const pin = await api.pinFic(fic.id);
      setPinnedFics((prev) => [...prev, pin]);
      setFicQuery("");
      setFicResults([]);
    } catch (err) {
      setPinFicError(err instanceof ApiError ? err.message : "Couldn't pin fic");
    }
  }

  async function removeFicPin(id: string) {
    await api.unpinFic(id);
    setPinnedFics((prev) => prev.filter((p) => p.id !== id));
  }

  async function addFandomPin(fandom: string) {
    setPinFandomError(null);
    try {
      const pin = await api.pinFandom(fandom);
      setPinnedFandoms((prev) => [...prev, pin]);
      setFandomQuery("");
      setFandomSuggestions([]);
    } catch (err) {
      setPinFandomError(err instanceof ApiError ? err.message : "Couldn't pin fandom");
    }
  }

  async function removeFandomPin(id: string) {
    await api.unpinFandom(id);
    setPinnedFandoms((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <section className="kudo-card overflow-hidden p-0">
        <div
          className="relative flex h-28 items-end justify-center bg-gradient-to-br from-sandy to-paprika"
          style={user.bannerUrl ? { backgroundImage: `url(${user.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="mb-2 rounded-full bg-ink/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
          >
            {uploadingBanner ? "Uploading..." : "Change banner"}
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])}
          />
        </div>
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => iconInputRef.current?.click()}
            disabled={uploadingIcon}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full font-heading text-xl font-semibold text-white"
            style={{ backgroundColor: user.avatarColor, backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined, backgroundSize: "cover" }}
          >
            {!user.avatarUrl && user.username.slice(0, 1).toUpperCase()}
          </button>
          <input
            ref={iconInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0])}
          />
          <p className="text-sm text-ink-muted">
            {uploadingIcon ? "Uploading icon..." : "Tap your icon or the banner to change them."}
          </p>
        </div>
        {uploadError && <p className="px-4 pb-3 text-sm text-paprika">{uploadError}</p>}
      </section>

      <form onSubmit={handleProfileSubmit} className="kudo-card flex flex-col gap-3 p-5">
        <h2 className="font-heading text-lg font-semibold text-ink">About you</h2>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
          Display name
          <input
            className="rounded-xl border border-paprika/15 bg-surface px-3 py-2 outline-none focus:border-sandy"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            placeholder={user.username}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
          Username
          <input
            className="rounded-xl border border-paprika/15 bg-surface px-3 py-2 outline-none focus:border-sandy"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
          Bio
          <textarea
            rows={3}
            className="rounded-xl border border-paprika/15 bg-surface px-3 py-2 outline-none focus:border-sandy"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />
        </label>
        {profileError && <p className="text-sm text-paprika">{profileError}</p>}
        <button
          type="submit"
          disabled={savingProfile}
          className="rounded-full bg-paprika px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {savedProfile ? "Saved!" : savingProfile ? "Saving..." : "Save"}
        </button>
      </form>

      <section className="kudo-card p-5">
        <h2 className="font-heading text-lg font-semibold text-ink">Social links</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {socialLinks.map((link) => (
            <li key={link.id} className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2">
              <span className="truncate text-sm text-ink">
                <span className="font-semibold">{link.platform}</span> · {link.url}
              </span>
              <button onClick={() => removeLink(link.id)} className="text-ink-dim" aria-label="Remove link">
                ✕
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addLink} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            placeholder="Platform (e.g. Tumblr)"
            className="flex-1 rounded-xl border border-paprika/15 bg-surface px-3 py-2 text-sm outline-none focus:border-sandy"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            maxLength={40}
            required
          />
          <input
            placeholder="https://..."
            type="url"
            className="flex-[2] rounded-xl border border-paprika/15 bg-surface px-3 py-2 text-sm outline-none focus:border-sandy"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={socialLinks.length >= 8}
            className="rounded-full border border-paprika bg-surface px-4 py-2 text-sm font-semibold text-paprika disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {linkError && <p className="mt-2 text-sm text-paprika">{linkError}</p>}
      </section>

      <section className="kudo-card p-5">
        <h2 className="font-heading text-lg font-semibold text-ink">Top 5 fics</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {pinnedFics.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2">
              <span className="truncate text-sm text-ink">
                {p.fic.title} <span className="text-ink-muted">· {p.fic.fandom}</span>
              </span>
              <button onClick={() => removeFicPin(p.id)} className="text-ink-dim" aria-label="Unpin fic">
                ✕
              </button>
            </li>
          ))}
        </ul>
        {pinnedFics.length < 5 && (
          <div className="relative mt-3">
            <input
              placeholder="Search your library..."
              className="w-full rounded-xl border border-paprika/15 bg-surface px-3 py-2 text-sm outline-none focus:border-sandy"
              value={ficQuery}
              onChange={(e) => setFicQuery(e.target.value)}
            />
            {ficResults.length > 0 && (
              <ul className="kudo-card absolute z-10 mt-1 max-h-52 w-full overflow-y-auto p-1">
                {ficResults
                  .filter((f) => !pinnedFics.some((p) => p.fic.id === f.id))
                  .map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => addFicPin(f)}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-paper"
                      >
                        {f.title} <span className="text-ink-muted">· {f.fandom}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
        {pinFicError && <p className="mt-2 text-sm text-paprika">{pinFicError}</p>}
      </section>

      <section className="kudo-card p-5">
        <h2 className="font-heading text-lg font-semibold text-ink">Top 5 fandoms</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {pinnedFandoms.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1.5 rounded-full bg-sandy/20 px-3 py-1 text-xs font-medium text-paprika"
            >
              {p.fandom}
              <button onClick={() => removeFandomPin(p.id)} aria-label="Unpin fandom">
                ✕
              </button>
            </span>
          ))}
        </div>
        {pinnedFandoms.length < 5 && (
          <div className="relative mt-3">
            <div className="flex gap-2">
              <input
                placeholder="Search fandoms..."
                className="flex-1 rounded-xl border border-paprika/15 bg-surface px-3 py-2 text-sm outline-none focus:border-sandy"
                value={fandomQuery}
                onChange={(e) => setFandomQuery(e.target.value)}
              />
              <button
                onClick={() => fandomQuery.trim() && addFandomPin(fandomQuery.trim())}
                className="rounded-full border border-paprika bg-surface px-4 py-2 text-sm font-semibold text-paprika"
              >
                Add
              </button>
            </div>
            {fandomSuggestions.length > 0 && (
              <ul className="kudo-card absolute z-10 mt-1 max-h-40 w-full overflow-y-auto p-1">
                {fandomSuggestions
                  .filter((f) => !pinnedFandoms.some((p) => p.fandom === f))
                  .map((f) => (
                    <li key={f}>
                      <button
                        onClick={() => addFandomPin(f)}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-paper"
                      >
                        {f}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
        {pinFandomError && <p className="mt-2 text-sm text-paprika">{pinFandomError}</p>}
      </section>
    </div>
  );
}
