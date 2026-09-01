import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../api";

export function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [showCW, setShowCW] = useState(user?.defaultShowContentWarnings ?? false);
  const [showSpice, setShowSpice] = useState(user?.defaultShowSpiceTags ?? false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  async function savePrefs() {
    const updated = await api.updateProfile({
      defaultShowContentWarnings: showCW,
      defaultShowSpiceTags: showSpice,
    });
    setUser(updated);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm");
      return;
    }
    if (!window.confirm("This permanently deletes your account and everything you've logged. Continue?")) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAccount(deletePassword);
      navigate("/login");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="kudo-card p-5">
        <h2 className="font-heading text-lg font-semibold text-ink">Privacy defaults</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Content warning and spice-level tags are private by default when you log a new fic. Set your
          usual preference here — you can still override it per fic.
        </p>
        <label className="mt-4 flex items-center justify-between gap-3 text-sm text-ink">
          Show content warning tags on my activity
          <input type="checkbox" checked={showCW} onChange={(e) => setShowCW(e.target.checked)} />
        </label>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm text-ink">
          Show spice-level tags on my activity
          <input type="checkbox" checked={showSpice} onChange={(e) => setShowSpice(e.target.checked)} />
        </label>
        <button
          onClick={savePrefs}
          className="mt-4 rounded-full bg-paprika px-4 py-2 text-sm font-semibold text-white"
        >
          {prefsSaved ? "Saved!" : "Save preferences"}
        </button>
      </section>

      <section className="kudo-card p-5">
        <h2 className="font-heading text-lg font-semibold text-ink">Change password</h2>
        <form onSubmit={handlePasswordChange} className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            Current password
            <input
              type="password"
              className="rounded-xl border border-paprika/15 bg-surface px-3 py-2 outline-none focus:border-sandy"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            New password
            <input
              type="password"
              minLength={8}
              className="rounded-xl border border-paprika/15 bg-surface px-3 py-2 outline-none focus:border-sandy"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          {passwordError && <p className="text-sm text-paprika">{passwordError}</p>}
          <button
            type="submit"
            className="rounded-full bg-paprika px-4 py-2 text-sm font-semibold text-white"
          >
            {passwordSaved ? "Password updated!" : "Update password"}
          </button>
        </form>
      </section>

      <button
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
        className="rounded-full border border-paprika/20 py-2.5 text-sm font-semibold text-paprika"
      >
        Log out
      </button>

      <section className="kudo-card border-paprika/30 p-5">
        <h2 className="font-heading text-lg font-semibold text-paprika">Delete account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          This permanently deletes your account, library, reviews, and follows. This cannot be undone.
        </p>
        <input
          type="password"
          placeholder="Confirm your password"
          className="mt-3 w-full rounded-xl border border-paprika/15 bg-surface px-3 py-2 outline-none focus:border-sandy"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
        />
        {deleteError && <p className="mt-2 text-sm text-paprika">{deleteError}</p>}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-3 rounded-full bg-paprika px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </section>
    </div>
  );
}
