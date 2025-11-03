import { Link } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";
import Header from "../components/ui/Header";
import {
  ClipboardIcon,
  HistoryIcon,
  BookIcon,
  UsersIcon,
  AlertIcon,
  DashboardIcon,
  HomeIcon,
  ClockIcon,
} from "../components/icons";
import { useJsaData } from "../hooks/useJsa";
import { useJobSiteFilter } from "../context/JobSiteFilterContext";

type FeatureCard = {
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  color: "blue" | "green" | "purple" | "orange" | "pink" | "red" | "teal" | "indigo";
  stat?: string;
};

function yyyymmdd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

export default function SupervisorHub() {
  const [inspectionCount, setInspectionCount] = useState(0);
  const [activeSessionCount, setActiveSessionCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dailyReportCount, setDailyReportCount] = useState(0);
  const { selectedSiteId, setSelectedSiteId, availableSites, isRestricted } = useJobSiteFilter();
  const { stats: jsaStats } = useJsaData(selectedSiteId);
  const dayKey = yyyymmdd(new Date());

  useEffect(() => {
    // Count today's inspections (filtered by selected site)
    const inspRef = ref(rtdb, `/v2/inspections`);
    const unsubInsp = onValue(inspRef, (snap) => {
      if (!snap.exists()) {
        setInspectionCount(0);
        setLoadingStats(false);
        return;
      }

      const allInspections = snap.val();
      const today = dayKey;

      // Filter inspections by today's date and selected site
      const filteredInspections = Object.values(allInspections).filter((insp: any) => {
        if (!insp.startedAt) return false;

        const inspDate = yyyymmdd(new Date(insp.startedAt));
        const isToday = inspDate === today;
        const matchesSite = !selectedSiteId || insp.siteId === selectedSiteId;

        return isToday && matchesSite;
      });

      setInspectionCount(filteredInspections.length);
      setLoadingStats(false);
    });

    // Count active time sessions (filtered by selected site)
    const sessionsRef = ref(rtdb, "/v2/activeSessions");
    const unsubSessions = onValue(sessionsRef, (snap) => {
      if (!snap.exists()) {
        setActiveSessionCount(0);
        return;
      }

      const sessions = snap.val();
      const sessionList = Object.values(sessions) as Array<{siteId?: string}>;

      if (!selectedSiteId) {
        // No filter, count all
        setActiveSessionCount(sessionList.length);
        return;
      }

      // Filter by selected site
      const filtered = sessionList.filter(s => s.siteId === selectedSiteId);
      setActiveSessionCount(filtered.length);
    });

    // Count today's daily reports (supervisors only)
    const reportsRef = ref(rtdb, "/v2/dailyReports");
    const unsubReports = onValue(reportsRef, (snap) => {
      if (!snap.exists()) {
        setDailyReportCount(0);
        return;
      }
      const all = snap.val();
      const today = dayKey;
      const filtered = Object.values(all).filter((r: any) => {
        const isToday = r.dayKey === today;
        const matchesSite = !selectedSiteId || r.siteId === selectedSiteId;
        return isToday && matchesSite;
      });
      setDailyReportCount(filtered.length);
    });

    return () => {
      unsubInsp();
      unsubSessions();
      unsubReports();
    };
  }, [dayKey, selectedSiteId]);

  const featureCards: FeatureCard[] = [
    {
      title: "JSA Management",
      description: "Create and manage Job Safety Analyses",
      icon: <ClipboardIcon className="text-blue-600" size={24} />,
      path: "/jsa/manage",
      color: "blue",
      stat: loadingStats ? "..." : `${jsaStats.active} active`,
    },
    {
      title: "Inspection History",
      description: "Review all completed inspections",
      icon: <HistoryIcon className="text-green-600" size={24} />,
      path: "/history",
      color: "green",
      stat: loadingStats ? "..." : `${inspectionCount} today`,
    },
    {
      title: "SOP Acknowledgments",
      description: "Track operator compliance",
      icon: <BookIcon className="text-orange-600" size={24} />,
      path: "/sops/acknowledgments",
      color: "orange",
      stat: "View history",
    },
    {
      title: "Personnel Tracking",
      description: "Live view of who's clocked in",
      icon: <UsersIcon className="text-red-600" size={24} />,
      path: "/personnel",
      color: "red",
      stat: loadingStats ? "..." : `${activeSessionCount} active`,
    },
    {
      title: "SOP Library",
      description: "View and manage SOP documents",
      icon: <BookIcon className="text-indigo-600" size={24} />,
      path: "/sops",
      color: "indigo",
      stat: "Browse",
    },
    {
      title: "Job Sites",
      description: "Manage locations and geofences",
      icon: <HomeIcon className="text-pink-600" size={24} />,
      path: "/job-sites",
      color: "pink",
      stat: "Manage sites",
    },
    {
      title: "Alerts & Notifications",
      description: "GPS alerts and system notifications",
      icon: <AlertIcon className="text-red-600" size={24} />,
      path: "/supervisor-alerts",
      color: "red",
      stat: "View alerts",
    },
    {
      title: "Daily Reports",
      description: "Site logs and daily summaries",
      icon: <DashboardIcon className="text-teal-600" size={24} />,
      path: "/reports",
      color: "teal",
      stat: loadingStats ? "..." : `${dailyReportCount} today`,
    },
    {
      title: "Documents",
      description: "Job site blueprints and KMZ files",
      icon: <BookIcon className="text-indigo-600" size={24} />,
      path: "/documents",
      color: "indigo",
      stat: "View library",
    },
  ];

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title="Supervisor Hub"
        subtitle="Manage operations, safety, and compliance"
      />

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-2xl shadow-lg p-6 border-2 border-orange-500/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-orange-500/20 backdrop-blur">
              <HomeIcon className="w-8 h-8 text-orange-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl">Supervisor Mode Active</h2>
              <p className="text-sm text-slate-300 mt-1">
                Access all management tools and oversight features
              </p>
            </div>
          </div>
        </div>

        {/* Job Site Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
              <DashboardIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
                {isRestricted ? "Your Assigned Job Site" : "Filter by Job Site"}
              </label>
              <select
                value={selectedSiteId || ""}
                onChange={(e) => setSelectedSiteId(e.target.value || null)}
                disabled={isRestricted}
                className={`w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold transition-all ${
                  isRestricted
                    ? "bg-slate-50 text-slate-500 cursor-not-allowed"
                    : "bg-white text-slate-900 hover:border-orange-400 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                }`}
              >
                {!isRestricted && <option value="">All Job Sites</option>}
                {availableSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {isRestricted && (
                <p className="text-xs text-slate-500 mt-1">
                  You can only view data for this job site
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Primary Management Tools */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 px-1 mb-3">
            Management Tools
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {featureCards
              .filter((card) => ["blue", "green", "orange"].includes(card.color))
              .map((card, index, arr) => {
                const colorMap = {
                  blue: { border: "border-l-blue-500", bg: "bg-blue-50", icon: "bg-blue-100", statBg: "bg-blue-100", statText: "text-blue-700" },
                  green: { border: "border-l-green-500", bg: "bg-green-50", icon: "bg-green-100", statBg: "bg-green-100", statText: "text-green-700" },
                  orange: { border: "border-l-orange-500", bg: "bg-orange-50", icon: "bg-orange-100", statBg: "bg-orange-100", statText: "text-orange-700" },
                };
                const colors = colorMap[card.color as "blue" | "green" | "orange"];

                return (
                  <Link
                    key={card.path}
                    to={card.path}
                    className={`
                      block p-4 border-l-4 ${colors.border} hover:${colors.bg} transition-colors
                      ${index !== arr.length - 1 ? "border-b border-slate-100" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors.icon} flex-shrink-0`}>
                          {card.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{card.title}</h3>
                          <p className="text-xs text-slate-600">{card.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className={`text-sm font-semibold ${colors.statText} ${colors.statBg} px-3 py-1 rounded-lg`}>
                          {card.stat}
                        </span>
                        <span className="text-slate-400">{">"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Administrative Tools */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 px-1 mb-3">
            Administrative Tools
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {featureCards
              .filter((card) => ["purple", "pink", "red"].includes(card.color))
              .map((card, index, arr) => {
                const colorMap = {
                  purple: { border: "border-l-purple-500", bg: "bg-purple-50", icon: "bg-purple-100", statBg: "bg-purple-100", statText: "text-purple-700" },
                  pink: { border: "border-l-pink-500", bg: "bg-pink-50", icon: "bg-pink-100", statBg: "bg-pink-100", statText: "text-pink-700" },
                  red: { border: "border-l-red-500", bg: "bg-red-50", icon: "bg-red-100", statBg: "bg-red-100", statText: "text-red-700" },
                };
                const colors = colorMap[card.color as "purple" | "pink" | "red"];

                return (
                  <Link
                    key={card.path}
                    to={card.path}
                    className={`
                      block p-4 border-l-4 ${colors.border} hover:${colors.bg} transition-colors
                      ${index !== arr.length - 1 ? "border-b border-slate-100" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors.icon} flex-shrink-0`}>
                          {card.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{card.title}</h3>
                          <p className="text-xs text-slate-600">{card.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className={`text-sm font-semibold ${colors.statText} ${colors.statBg} px-3 py-1 rounded-lg`}>
                          {card.stat}
                        </span>
                        <span className="text-slate-400">{">"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Reporting */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 px-1 mb-3">
            Reporting
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {featureCards
              .filter((card) => ["teal", "indigo"].includes(card.color))
              .map((card, index, arr) => {
                const colorMap = {
                  teal: { border: "border-l-teal-500", bg: "bg-teal-50", icon: "bg-teal-100", statBg: "bg-teal-100", statText: "text-teal-700" },
                  indigo: { border: "border-l-indigo-500", bg: "bg-indigo-50", icon: "bg-indigo-100", statBg: "bg-indigo-100", statText: "text-indigo-700" },
                } as const;
                const colors = colorMap[card.color as "teal" | "indigo"];

                return (
                  <Link
                    key={card.path}
                    to={card.path}
                    className={`
                      block p-4 border-l-4 ${colors.border} hover:${colors.bg} transition-colors
                      ${index !== arr.length - 1 ? "border-b border-slate-100" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors.icon} flex-shrink-0`}>
                          {card.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{card.title}</h3>
                          <p className="text-xs text-slate-600">{card.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className={`text-sm font-semibold ${colors.statText} ${colors.statBg} px-3 py-1 rounded-lg`}>
                          {card.stat}
                        </span>
                        <span className="text-slate-400">{">"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Quick Access Links */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
            Quick Access
          </h3>
          <div className="space-y-2">
            <Link
              to="/time-clock"
              className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <ClockIcon className="w-6 h-6 text-orange-500" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">Clock In/Out</span>
                </div>
                <span className="text-slate-400">{">"}</span>
              </div>
            </Link>
            <Link
              to="/inspect"
              className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <ClipboardIcon className="w-6 h-6 text-orange-500" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">Start Inspection</span>
                </div>
                <span className="text-slate-400">{">"}</span>
              </div>
            </Link>
            <Link
              to="/safety"
              className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <BookIcon className="w-6 h-6 text-indigo-500" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">Safety Hub (JSAs & SOPs)</span>
                </div>
                <span className="text-slate-400">{">"}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}












