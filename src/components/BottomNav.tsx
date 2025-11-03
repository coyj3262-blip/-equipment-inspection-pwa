import { Link, useLocation } from "react-router-dom";
import {
  DashboardIcon,
  ClipboardIcon,
  UsersIcon,
  MenuIcon,
  BookIcon,
} from "./icons";
import { useSupervisorAlerts } from "../hooks/useSupervisorAlerts";
import { useUserRole } from "../hooks/useUserRole";
import type { ComponentType } from "react";

type NavItem = {
  path: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  label: string;
  badge?: () => number;
};

const getNavItems = (isSupervisor: boolean): NavItem[] => {
  if (isSupervisor) {
    return [
      { path: "/inspect", icon: ClipboardIcon, label: "Inspect" },
      { path: "/personnel", icon: UsersIcon, label: "Personnel" },
      { path: "/safety", icon: BookIcon, label: "Safety" },
      { path: "/more", icon: MenuIcon, label: "More" },
    ];
  } else {
    return [
      { path: "/dashboard", icon: DashboardIcon, label: "Dashboard" },
      { path: "/inspect", icon: ClipboardIcon, label: "Inspect" },
      { path: "/time-clock", icon: ClipboardIcon, label: "Time Clock" },
      { path: "/more", icon: MenuIcon, label: "More" },
    ];
  }
};

export default function BottomNav() {
  const location = useLocation();
  const { isSupervisor, loading } = useUserRole();
  const { unreadCount } = useSupervisorAlerts();

  if (location.pathname === "/login") return null;
  if (location.pathname.includes("/run") || location.pathname.includes("/pre"))
    return null;

  const navItems = getNavItems(loading ? false : isSupervisor);

  const isActiveRoute = (itemPath: string) => {
    const current = location.pathname;
    if (itemPath === "/safety") {
      return (
        current.startsWith("/safety") ||
        current.startsWith("/jsa") ||
        current.startsWith("/sops")
      );
    }
    return current.startsWith(itemPath);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/60 safe-area-inset-bottom z-40 shadow-xl">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = isActiveRoute(item.path);
          const Icon = item.icon;
          const showBadge =
            item.path === "/personnel" &&
            !loading &&
            isSupervisor &&
            unreadCount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 py-1 transition-all duration-200 ${
                isActive
                  ? "text-orange-500"
                  : "text-slate-600 hover:text-orange-400"
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? "bg-orange-100" : "hover:bg-slate-100"
                }`}
              >
                <Icon className="w-6 h-6" size={24} />
                {showBadge && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-all ${
                  isActive ? "font-bold" : ""
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-orange-500 rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
