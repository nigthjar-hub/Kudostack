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
    <div className="flex min-h-screen items-center justify-center bg-honeydew px-4">
      <div className="kudo-card w-full max-w-sm p-8">
        <h1 className="font-heading text-3xl font-semibold text-paprika">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-soft">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
