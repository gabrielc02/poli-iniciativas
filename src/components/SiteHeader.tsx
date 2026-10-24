import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Plus } from "lucide-react";
import { Logo } from "@/components/Logo";
import type { User } from "@/lib/initiatives";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  user: User;
  onLogout: () => void;
};

const navLink =
  "rounded-md px-3 py-1.5 text-sm font-semibold text-[#0B2545] transition hover:bg-[#0B2545]/10";
const navActive = "bg-[#0B2545] text-white hover:bg-[#0B2545] hover:text-white";

export function SiteHeader({ user, onLogout }: SiteHeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white">
      <div className="flex items-center justify-between gap-4 px-4 py-1.5 sm:px-6 md:px-10">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          <Link to="/inicio" className={cn(navLink, pathname === "/inicio" && navActive)}>
            Iniciativas
          </Link>
          <Link to="/parceiros" className={cn(navLink, pathname === "/parceiros" && navActive)}>
            Parceiros
          </Link>
          <Link to="/membros" className={cn(navLink, pathname === "/membros" && navActive)}>
            Membros
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/parceiros"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold text-[#0B2545] transition hover:bg-[#0B2545]/10 md:hidden",
              pathname === "/parceiros" && navActive,
            )}
          >
            parceiros
          </Link>
          <Link
            to="/membros"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold text-[#0B2545] transition hover:bg-[#0B2545]/10 md:hidden",
              pathname === "/membros" && navActive,
            )}
          >
            membros
          </Link>
          <Link
            to="/inicio"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#0B2545] bg-white px-3 py-1.5 text-sm font-semibold text-[#0B2545] transition hover:bg-[#0B2545] hover:text-white"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Iniciativa</span>
            <span className="sm:hidden">Nova</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sair"
            className="rounded-md p-2 text-[#0B2545]/70 transition hover:bg-[#0B2545]/10 hover:text-[#0B2545]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
