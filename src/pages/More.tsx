import { Link, useNavigate } from "react-router-dom";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import { useUserRole } from "../hooks/useUserRole";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { useState, type ReactNode } from "react";
import {
  ClipboardIcon,
  UsersIcon,
  BookIcon,
  DashboardIcon,
  AlertIcon,
  HomeIcon,
  ClockIcon,
} from "../components/icons";

type MenuItem = {
  label: string;
  description?: string;
  icon?: ReactNode;
  path?: string;
  onClick?: () => void;
  requiresSupervisor?: boolean;
  color?: "default" | "danger";
};

export default function More() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isSupervisor, loading } = useUserRole();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Failed to sign out");
      setSigningOut(false);
    }
  };

  const dailyOperationsItems: MenuItem[] = [
    {
      label: "Inspection History",
      description: "Review completed inspections",
      icon: <ClipboardIcon className="w-6 h-6 text-orange-600" />,
      path: "/history",
      requiresSupervisor: true,
    },
    {
      label: "Daily Reports",
      description: "Filter by site and date",
      icon: <DashboardIcon className="w-6 h-6 text-orange-600" />,
      path: "/reports",
      requiresSupervisor: true,
    },
    {
      label: "Time History",
      description: "Review your personal time logs",
      icon: <ClockIcon className="w-6 h-6 text-slate-500" />,
      path: "/time-history",
    },
  ];

  const safetyComplianceItems: MenuItem[] = [
    {
      label: "JSA Management",
      description: "Create and manage JSAs",
      icon: <ClipboardIcon className="w-6 h-6 text-orange-600" />,
      path: "/jsa/manage",
      requiresSupervisor: true,
    },
    {
      label: "JSA Library",
      description: "Browse Job Safety Analyses",
      icon: <ClipboardIcon className="w-6 h-6 text-slate-500" />,
      path: "/jsa",
    },
    {
      label: "SOP Library",
      description: "View Standard Operating Procedures",
      icon: <BookIcon className="w-6 h-6 text-slate-500" />,
      path: "/sops",
    },
    {
      label: "SOP Acknowledgments",
      description: "Track operator compliance",
      icon: <BookIcon className="w-6 h-6 text-orange-600" />,
      path: "/sops/acknowledgments",
      requiresSupervisor: true,
    },
  ];

  const siteManagementItems: MenuItem[] = [
    {
      label: "Job Sites",
      description: "Manage locations and geofences",
      icon: <UsersIcon className="w-6 h-6 text-slate-500" />,
      path: "/job-sites",
      requiresSupervisor: true,
    },
    {
      label: "Documents",
      description: "Blueprints, KMZs, and attachments",
      icon: <BookIcon className="w-6 h-6 text-slate-500" />,
      path: "/documents",
      requiresSupervisor: true,
    },
    {
      label: "Supervisor Alerts",
      description: "Out-of-radius and GPS warnings",
      icon: <AlertIcon className="w-6 h-6 text-orange-600" />,
      path: "/supervisor-alerts",
      requiresSupervisor: true,
    },
  ];

  const accountItems: MenuItem[] = [
    {
      label: "Supervisor Hub",
      description: "Return to supervisor landing",
      icon: <HomeIcon className="w-6 h-6 text-slate-500" />,
      path: "/supervisor-hub",
      requiresSupervisor: true,
    },
    {
      label: "My Profile",
      description: "View and edit your profile",
      icon: <UsersIcon className="w-6 h-6 text-slate-500" />,
      path: "/profile",
    },
    {
      label: "Manage Users",
      description: "Create and manage accounts",
      icon: <UsersIcon className="w-6 h-6 text-orange-600" />,
      path: "/users",
      requiresSupervisor: true,
    },
  ];

  const supportItems: MenuItem[] = [
    {
      label: "Settings",
      description: "App preferences",
      onClick: () => toast.info("Settings coming soon!"),
    },
    {
      label: "Help & Support",
      description: "Get help",
      onClick: () => toast.info("Help & Support coming soon!"),
    },
    {
      label: "About",
      description: "App version",
      onClick: () => toast.info("Equipment Inspection System v2 - Built with React, TypeScript, and Firebase"),
    },
  ];

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "DAILY OPERATIONS",
      items: dailyOperationsItems,
    },
    {
      title: "SAFETY & COMPLIANCE",
      items: safetyComplianceItems,
    },
    ...(isSupervisor
      ? [
          {
            title: "SITE MANAGEMENT",
            items: siteManagementItems,
          },
        ]
      : []),
    {
      title: "ACCOUNT",
      items: accountItems,
    },
    {
      title: "SUPPORT & PREFERENCES",
      items: supportItems,
    },
  ];

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="More" subtitle="Settings & Tools" />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <Button
            onClick={handleSignOut}
            loading={signingOut}
            disabled={signingOut}
            variant="danger"
            className="w-full"
            size="lg"
          >
            {signingOut ? "Signing Out..." : "Sign Out"}
          </Button>
        </div>

        {menuSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 px-1 mb-3">
              {section.title}
            </h2>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
              {section.items.map((item, itemIdx) => {
                if (item.requiresSupervisor && (loading || !isSupervisor)) {
                  return null;
                }

                const content = (
                  <div
                    className={`flex items-center gap-4 p-4 transition-colors hover:bg-slate-50 ${
                      item.requiresSupervisor ? "bg-gradient-to-r from-amber-50 to-transparent" : ""
                    }`}
                  >
                    {item.icon && (
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                        {item.icon}
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${item.color === "danger" ? "text-red-600" : "text-slate-900"}`}
                        >
                          {item.label}
                        </span>
                        {item.requiresSupervisor && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded">
                            SUPERVISOR
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                      )}
                    </div>
                    {item.path && <span className="text-slate-400">{">"}</span>}
                  </div>
                );

                const isLast = itemIdx === section.items.length - 1;
                const borderClass = isLast ? "" : "border-b border-slate-100";

                if (item.onClick) {
                  return (
                    <button key={itemIdx} onClick={item.onClick} className={`w-full text-left ${borderClass}`}>
                      {content}
                    </button>
                  );
                }

                if (item.path) {
                  return (
                    <Link key={itemIdx} to={item.path} className={`block ${borderClass}`}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={itemIdx} className={borderClass}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="text-center text-xs text-slate-400 space-y-1 pt-4">
          <div>Equipment Inspection System v2</div>
          <div>React 19 + TypeScript + Firebase</div>
          <div className="text-slate-300">Built with Claude Code</div>
        </div>
      </div>
    </div>
  );
}
