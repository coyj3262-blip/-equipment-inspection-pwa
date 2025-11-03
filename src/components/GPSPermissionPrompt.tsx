/**
 * GPSPermissionPrompt Component
 *
 * Educational dialog explaining why GPS permission is needed
 * Shows before first clock-in attempt
 */

import Button from "./ui/Button";

interface Props {
  onAllow: () => void;
  onDeny: () => void;
  isOpen: boolean;
}

export default function GPSPermissionPrompt({ onAllow, onDeny, isOpen }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-orange-100">
            <span className="text-4xl">📍</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Enable Location Services
          </h2>
        </div>

        {/* Explanation */}
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            This app needs your location to verify you're at the correct job site when clocking in.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="font-semibold text-blue-900 flex items-center gap-2">
              <span>🔒</span> Your Privacy
            </div>
            <ul className="space-y-1 text-blue-800 text-xs ml-6 list-disc">
              <li>Location is only captured during clock-in/out</li>
              <li>No continuous tracking or background monitoring</li>
              <li>Used only to verify you're at the job site</li>
            </ul>
          </div>

          <p className="text-xs text-slate-500 italic">
            If you deny location access, your supervisor will need to manually approve your clock-in.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={onAllow} className="w-full" size="lg">
            Allow Location Access
          </Button>
          <button
            onClick={onDeny}
            className="w-full text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Continue Without Location
          </button>
        </div>
      </div>
    </div>
  );
}
