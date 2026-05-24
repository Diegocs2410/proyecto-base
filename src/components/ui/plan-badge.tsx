interface PlanBadgeProps {
  label: string;
}

export function PlanBadge({ label }: PlanBadgeProps) {
  return (
    <span className="w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-600/20">
      {label}
    </span>
  );
}
