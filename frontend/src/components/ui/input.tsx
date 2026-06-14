import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2 text-[13px] text-brand-primary shadow-none transition-all file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-brand-primary placeholder:text-brand-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
