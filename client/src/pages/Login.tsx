import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api";
import { AuthLayout } from "../components/AuthLayout";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/friends");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to see what your friends are reading.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
          Username
          <input
            className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
          Password
          <input
            type="password"
            className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-paprika">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-sandy px-4 py-2.5 font-heading font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        New to Kudostack?{" "}
        <Link to="/register" className="font-medium text-paprika">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
