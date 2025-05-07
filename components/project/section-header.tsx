import { ReactNode } from "react";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  count?: number;
  countLabel?: string;
}

export function SectionHeader({ icon, title, count, countLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center mb-4">
      <div className="mr-2 text-[var(--tensora-dark)]">
        {icon}
      </div>
      <div className="flex-1">
        <h2 className="text-xl font-bold text-[var(--tensora-dark)]">{title}</h2>
        {count !== undefined && (
          <p className="text-sm text-gray-500">
            {count} {count === 1 ? countLabel : `${countLabel}s`} configured
          </p>
        )}
      </div>
    </div>
  );
}