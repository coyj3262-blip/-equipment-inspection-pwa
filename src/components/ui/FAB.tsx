import React, { useState } from "react";

type FABProps = {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  ariaLabel?: string;
  className?: string;
  extended?: boolean; // Extended FAB with text
};

/**
 * Floating Action Button (FAB)
 *
 * Primary action button that floats above content.
 * Positioned in bottom-right corner (56px from bottom to clear bottom nav).
 *
 * Usage:
 * <FAB onClick={() => startInspection()} icon={<PlusIcon />} ariaLabel="Start inspection" />
 * <FAB onClick={() => startInspection()} label="Start Inspection" extended />
 */
export default function FAB({
  onClick,
  icon,
  label,
  ariaLabel,
  className = "",
  extended = false,
}: FABProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
  };

  const baseClasses = `
    fixed z-40
    flex items-center justify-center gap-2
    bg-orange-500 hover:bg-orange-600 active:bg-orange-700
    text-white font-semibold
    transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-orange-300
    ${isPressed ? "scale-95" : "scale-100 hover:scale-105"}
  `.trim();

  const sizeClasses = extended
    ? "px-6 py-4 rounded-full shadow-2xl"
    : "w-14 h-14 rounded-full shadow-2xl";

  const positionClasses = "bottom-20 right-4"; // 80px from bottom to clear 72px bottom nav

  return (
    <button
      onClick={() => {
        handlePress();
        onClick();
      }}
      onMouseDown={handlePress}
      onTouchStart={handlePress}
      aria-label={ariaLabel || label || "Primary action"}
      className={`${baseClasses} ${sizeClasses} ${positionClasses} ${className}`}
    >
      {icon && <span className={extended ? "text-xl" : "text-2xl"}>{icon}</span>}
      {extended && label && <span className="text-sm">{label}</span>}
    </button>
  );
}
