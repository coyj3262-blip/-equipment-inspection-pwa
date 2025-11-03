import React from "react";

type HeaderProps = {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export default function Header({ title, subtitle, right, className = "" }: HeaderProps) {
  return (
    <div className={["bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6 shadow-lg", className].join(" ")}> 
      <div className="max-w-2xl mx-auto flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-navy-200 text-sm mt-1">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}

