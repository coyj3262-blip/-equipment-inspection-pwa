import React from "react";

type TagKind = "pass" | "fail" | "na" | "submitted" | "in_progress" | "reopened" | "overdue" | "info";

type TagProps = {
  kind?: TagKind;
  className?: string;
  children?: React.ReactNode;
};

const kindMap: Record<TagKind, string> = {
  pass: "bg-pass/10 text-pass",
  fail: "bg-fail/10 text-fail",
  na: "bg-na/10 text-na",
  submitted: "bg-success/10 text-success",
  in_progress: "bg-warning/10 text-warning",
  reopened: "bg-warning/10 text-warning",
  overdue: "bg-error/10 text-error",
  info: "bg-slate-100 text-slate-700",
};

export default function Tag({ kind = "info", className = "", children }: TagProps) {
  return (
    <span className={["px-3 py-1 rounded-lg text-xs font-semibold", kindMap[kind], className].join(" ")}>
      {children}
    </span>
  );
}

