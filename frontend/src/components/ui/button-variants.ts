import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/20 focus-visible:border-brand-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-brand-white hover:opacity-90",
        destructive:
          "bg-brand-danger text-white hover:opacity-90",
        outline:
          "border border-brand-border bg-brand-white text-brand-secondary hover:bg-brand-surface hover:text-brand-primary",
        secondary:
          "bg-brand-surface text-brand-primary hover:bg-brand-border/50",
        ghost:
          "hover:bg-brand-surface hover:text-brand-primary text-brand-secondary",
        link:
          "text-brand-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 md:h-9 px-4 py-2 text-[13px] rounded-lg [&_svg]:size-[16px]",
        sm: "h-10 md:h-[30px] px-3 py-1.5 text-[12px] rounded-lg [&_svg]:size-[14px]",
        xs: "h-8 md:h-6 px-2 py-1 text-[11px] rounded-md [&_svg]:size-[12px]",
        lg: "h-11 md:h-10 px-5 py-2.5 text-[14px] rounded-lg [&_svg]:size-[18px]",
        icon: "h-11 w-11 md:h-8 md:w-8 rounded-lg [&_svg]:size-[16px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
