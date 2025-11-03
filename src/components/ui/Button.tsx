import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "subtle" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all focus-visible:ring-4 disabled:opacity-60 disabled:cursor-not-allowed";

const variantMap: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 focus-visible:ring-orange-200",
  secondary: "bg-navy-800 text-white hover:bg-navy-700 active:bg-navy-900 focus-visible:ring-navy-200",
  subtle: "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-200",
};

const sizeMap: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "text-sm px-3 py-2",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[base, variantMap[variant], sizeMap[size], className].join(" ")}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="relative flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
          <span>Working…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

