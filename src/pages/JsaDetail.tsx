import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/ui/Header";
import Button from "../components/ui/Button";
import SignaturePad from "../components/SignaturePad";
import { useToast } from "../hooks/useToast";
import { rtdb, auth } from "../firebase";
import { path } from "../backend.paths";
import { signJsa } from "../services/jsa";
import type { Jsa, JsaSignature } from "../services/jsa";

type Params = {
  id: string;
};

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export default function JsaDetail() {
  const { id } = useParams<Params>();
  const toast = useToast();
  const navigate = useNavigate();
  const [jsa, setJsa] = useState<Jsa | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState<Record<string, JsaSignature>>({});
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [name, setName] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    const jsaRef = ref(rtdb, path("jsas", id));
    const unsubscribe = onValue(jsaRef, (snapshot) => {
      if (!snapshot.exists()) {
        setJsa(null);
        setLoading(false);
        return;
      }
      const data = snapshot.val() as Omit<Jsa, "id">;
      setJsa({ id, ...data });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const sigRef = ref(rtdb, path("jsaSignatures", id));
    const unsubscribe = onValue(sigRef, (snapshot) => {
      const val = snapshot.val() as Record<string, JsaSignature> | null;
      setSignatures(val ?? {});
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!uid) return;
    const existing = signatures[uid];
    if (existing && !name) {
      setName(existing.name);
    }
  }, [uid, signatures, name]);

  const hasSigned = useMemo(() => {
    if (!uid) return false;
    return Boolean(signatures[uid]);
  }, [uid, signatures]);

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-error">Missing JSA identifier.</p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) {
      toast.error("Missing JSA identifier.");
      return;
    }
    if (!uid) {
      toast.error("Authentication missing. Refresh and try again.");
      return;
    }
    if (!name.trim()) {
      toast.warning("Add your name before signing.");
      return;
    }
    if (!signature) {
      toast.warning("Capture your signature before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await signJsa({
        jsaId: id,
        uid,
        name: name.trim(),
        signatureDataUrl: signature,
      });
      toast.success("Signature saved.");
    } catch (error) {
      console.error("Failed to sign JSA", error);
      toast.error("Unable to save signature. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-40 rounded bg-slate-200 animate-pulse" />
        <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!jsa) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header title="JSA not found" subtitle="This record may have been archived or removed." />
        <div className="max-w-lg mx-auto p-6">
          <Button variant="subtle" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const signatureEntries = Object.entries(signatures).sort((a, b) => b[1].signedAt - a[1].signedAt);
  const isArchived = jsa.status === "archived";
  const closedAt = jsa.archivedAt ?? jsa.updatedAt ?? jsa.createdAt;
  const effectiveLabel = jsa.effectiveDate ? new Date(jsa.effectiveDate).toLocaleDateString() : new Date(jsa.createdAt).toLocaleDateString();

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <Header
        title={jsa.title}
        subtitle={jsa.jobLocation ? `Location - ${jsa.jobLocation}` : "Job Safety Analysis"}
        right={<Link to="/jsa" className="text-xs font-semibold text-orange-200 hover:text-white">Back to JSAs</Link>}
      />

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Hazards</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{jsa.hazards}</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Controls & Steps</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{jsa.controls}</p>
          </article>
          {jsa.ppe && (
            <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 md:col-span-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Required PPE</h2>
              <p className="mt-2 text-sm text-slate-800">{jsa.ppe}</p>
            </article>
          )}
          <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 md:col-span-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Effective Date</h2>
            <p className="mt-2 text-sm text-slate-800">{effectiveLabel}</p>
            {isArchived && (
              <p className="mt-1 text-xs text-slate-500">Closed {new Date(closedAt).toLocaleString()}</p>
            )}
          </article>
          {jsa.sopDocs && jsa.sopDocs.length > 0 && (
            <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 md:col-span-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Reference Documents</h2>
              <ul className="mt-2 space-y-2">
                {jsa.sopDocs.map(doc => (
                  <li
                    key={doc.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                      <p className="text-xs text-slate-500">
                        Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                        {doc.fileSize ? ` Â· ${formatFileSize(doc.fileSize)}` : ""}
                      </p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
                    >
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Acknowledge JSA</h2>
              <p className="text-xs text-slate-500">Read above, then sign to confirm understanding.</p>
            </div>
            {isArchived ? (
              <span className="text-xs font-semibold text-slate-500">Closed</span>
            ) : hasSigned ? (
              <span className="text-xs font-semibold text-emerald-500">Signed</span>
            ) : null}
          </header>

          {isArchived ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              This JSA has been closed by a supervisor. Review the details above or contact your supervisor for any questions.
            </div>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Full Name</label>
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                  placeholder="e.g. Jamie Rivera"
                />
              </div>

              <SignaturePad
                label="Signature"
                onSignature={(dataUrl) => setSignature(dataUrl)}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : hasSigned ? "Update Signature" : "Sign JSA"}
                </Button>
                <Button type="button" variant="subtle" onClick={() => navigate("/jsa")}>
                  Back to list
                </Button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Signatures</h2>
          {signatureEntries.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No signatures yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {signatureEntries.map(([signerUid, entry]) => (
                <li key={signerUid} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{entry.name}</p>
                    <p className="text-xs text-slate-500">{new Date(entry.signedAt).toLocaleString()}</p>
                  </div>
                  <a
                    href={entry.signatureDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-orange-500 hover:underline"
                  >
                    View signature
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}


