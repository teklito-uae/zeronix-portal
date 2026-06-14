import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full h-[24px] border px-2.5 text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary text-brand-white hover:bg-brand-primary/80",
        secondary:
          "border-transparent bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]",
        destructive:
          "border-transparent bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]",
        outline: "text-brand-primary border-brand-border",
        success: "border-transparent bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]",
        warning: "border-transparent bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]",
        info: "border-transparent bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#BFDBFE]",
        special: "border-transparent bg-[#EDE9FE] text-[#5B21B6] hover:bg-[#DDD6FE]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
