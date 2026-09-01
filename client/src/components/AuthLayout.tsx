import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sandy to-paprika shadow-sm">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#fffaf1">
              <path d="M12 19.2c-.4 0-.75-.14-1.02-.4C7.3 15.5 4 12.4 4 9.1 4 6.5 6 4.6 8.4 4.6c1.4 0 2.75.6 3.6 1.6a4.8 4.8 0 0 1 3.6-1.6C18 4.6 20 6.5 20 9.1c0 3.3-3.3 6.4-6.98 9.7-.27.26-.62.4-1.02.4Z" />
            </svg>
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-paprika">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
        </div>
        <div className="kudo-card p-7">{children}</div>
      </div>
    </div>
  );
}
