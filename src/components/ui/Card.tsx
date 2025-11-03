import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  elevation?: "none" | "card" | "card-hover";
  padding?: "none" | "sm" | "md" | "lg";
};

const elevMap = {
  none: "",
  card: "shadow-card",
  "card-hover": "shadow-card hover:shadow-2xl",
} as const;

const padMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export default function Card({
  elevation = "card",
  padding = "md",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div className={["bg-white rounded-card", elevMap[elevation], padMap[padding], className].join(" ")} {...rest}>
      {children}
    </div>
  );
}

