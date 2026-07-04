import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner = ({ size = 16, className = "" }: SpinnerProps) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
);
