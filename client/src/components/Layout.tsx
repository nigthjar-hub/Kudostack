import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function Layout() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col bg-paper">
        <AppHeader />
        <main className="flex-1 px-5 pb-28">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
