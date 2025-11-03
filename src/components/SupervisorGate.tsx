import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Header from "./ui/Header";
import Button from "./ui/Button";
import { useSupervisorAccess } from "../context/SupervisorAccessContext";

type SupervisorGateProps = {
  feature?: string;
};

export default function SupervisorGate({ feature }: SupervisorGateProps) {
  const { unlock, passcodeConfigured } = useSupervisorAccess();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtitle = passcodeConfigured
    ? feature
      ? `Supervisor clearance is required to access ${feature}.`
      : "Supervisor clearance required."
    : "Set VITE_SUPERVISOR_PASSCODE in your environment to enable supervisor access.";

  const submitDisabled = !passcodeConfigured || submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    setSubmitting(true);
    try {
      const result = await unlock(passcode);
      if (result.success) {
        setPasscode("");
        setError(null);
        return;
      }
      setError(result.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header title="Supervisor Access" subtitle={subtitle} />

      <div className="mx-auto max-w-md px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur"
          aria-describedby="supervisor-access-help"
        >
          <div>
            <label htmlFor="supervisor-passcode" className="block text-sm font-semibold text-slate-700">
              Passcode
            </label>
            <input
              id="supervisor-passcode"
              type="password"
              autoComplete="current-password"
              value={passcode}
              onChange={event => setPasscode(event.target.value)}
              className={`mt-2 w-full rounded-xl border-2 p-3 text-base shadow-sm transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 ${error ? "border-error" : "border-slate-200"}`}
              placeholder="Enter supervisor passcode"
              aria-invalid={error ? true : undefined}
            />
            <p id="supervisor-access-help" className="mt-2 text-xs text-slate-500">
              Access is limited to supervisors. Contact your administrator if you do not have the passcode.
            </p>
            {error && (
              <p className="mt-2 text-xs font-semibold text-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button type="submit" className="flex-1" disabled={submitDisabled}>
              {submitting ? "Unlocking..." : "Unlock"}
            </Button>
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Go Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
