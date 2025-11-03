import { type ReactNode } from "react";
import Button from "./Button";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-slate-300">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-600 max-w-sm mb-6">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick} size="md">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="secondary"
              size="md"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
