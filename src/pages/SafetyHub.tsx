import { Link } from "react-router-dom";
import Header from "../components/ui/Header";
import { ClipboardIcon, BookIcon } from "../components/icons";

export default function SafetyHub() {
  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="Safety" subtitle="Job Safety Analyses & SOPs" />
      <div className="max-w-2xl mx-auto p-4 grid gap-4">
        <Link
          to="/jsa"
          className="block bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition"
        >
          <div className="flex items-center gap-4">
            <ClipboardIcon className="text-orange-600" size={28} />
            <div>
              <div className="font-bold text-slate-900">JSAs</div>
              <div className="text-sm text-slate-600">
                Browse and review Job Safety Analyses
              </div>
            </div>
          </div>
        </Link>
        <Link
          to="/sops"
          className="block bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition"
        >
          <div className="flex items-center gap-4">
            <BookIcon className="text-orange-600" size={28} />
            <div>
              <div className="font-bold text-slate-900">SOPs</div>
              <div className="text-sm text-slate-600">
                View Standard Operating Procedures
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
