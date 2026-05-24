import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  children: React.ReactNode;
  status: "success" | "warning" | "danger";
}

const variants = {
  success: "bg-green-50 text-green-700 ring-green-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
};

export function StatusBadge({ children, status }: StatusBadgeProps) {
  return (
    <span className={cn("w-fit rounded-full px-2.5 py-1 text-xs font-medium ring-1", variants[status])}>
      {children}
    </span>
  );
}
