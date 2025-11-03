import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/ui/Header";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import { CheckIcon } from "../components/icons";
import { useJsaData } from "../hooks/useJsa";
import { auth } from "../firebase";

export default function JsaList() {
  const navigate = useNavigate();
  const { activeJsas, signaturesByJsa, loading, stats } = useJsaData();
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const viewModels = useMemo(() => activeJsas.map(jsa => {
    const signatureCount = signaturesByJsa[jsa.id] ? Object.keys(signaturesByJsa[jsa.id]).length : 0;
    const userSigned = uid ? Boolean(signaturesByJsa[jsa.id]?.[uid]) : false;
    const effectiveLabel = jsa.effectiveDate ? new Date(jsa.effectiveDate).toLocaleDateString() : new Date(jsa.createdAt).toLocaleDateString();
    const sopDocCount = jsa.sopDocs ? jsa.sopDocs.length : 0;
    return { ...jsa, signatureCount, userSigned, effectiveLabel, sopDocCount };
  }), [activeJsas, signaturesByJsa, uid]);

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header title="Job Safety Analyses" subtitle="Review and acknowledge the latest safety plans" />

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <section className="rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active JSAs</h2>
              <p className="text-xs text-slate-500">Tap any card to read details and sign.</p>
            </div>
            <div className="text-xs text-slate-500 text-right">
              <div><span className="font-semibold text-slate-700">{stats.active}</span> active</div>
              <div><span className="font-semibold text-slate-700">{stats.total}</span> total</div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" message="Loading safety analyses..." />
          </div>
        ) : viewModels.length === 0 ? (
          <EmptyState
            icon={<CheckIcon size={64} className="text-slate-300" />}
            title="No active JSAs"
            description="There are no active Job Safety Analyses right now. Check with your supervisor to confirm today's work plan and safety requirements."
            action={{
              label: "Return Home",
              onClick: () => navigate("/")
            }}
          />
        ) : (
          <div className="space-y-3">
            {viewModels.map(jsa => (
              <Link
                key={jsa.id}
                to={`/jsa/${jsa.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-orange-300 hover:shadow-lg"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{jsa.title}</h3>
                    <p className="text-xs text-slate-500">Effective {jsa.effectiveLabel}</p>
                    {jsa.jobLocation && <p className="text-xs text-slate-500">{jsa.jobLocation}</p>}
                    {jsa.sopDocCount > 0 && (
                      <p className="text-xs text-slate-500">{jsa.sopDocCount} reference {jsa.sopDocCount === 1 ? "doc" : "docs"}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    <p><span className="font-semibold text-slate-700">{jsa.signatureCount}</span> signed</p>
                    {jsa.userSigned ? (
                      <span className="text-emerald-500 font-semibold">Signed</span>
                    ) : (
                      <span className="text-orange-500 font-semibold">Pending</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Hazards</h4>
                    <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{jsa.hazards}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Controls</h4>
                    <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{jsa.controls}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


