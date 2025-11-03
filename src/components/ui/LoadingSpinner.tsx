type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
};

export default function LoadingSpinner({
  size = "md",
  message = "Loading...",
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-12 h-12 border-3",
    lg: "w-16 h-16 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-orange-200 border-t-orange-500 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm font-medium text-slate-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
