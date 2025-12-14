import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description: string;
  trend?: string;
  colorClass: string;
}
