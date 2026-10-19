import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary/10 text-primary",
        primary: "border-primary/15 bg-primary/10 text-primary",
        secondary: "border-white/60 bg-white/70 text-muted-foreground",
        accent: "border-accent/25 bg-accent/15 text-sky-800",
        success: "border-success/25 bg-success/15 text-success-foreground",
        warning: "border-warning/25 bg-warning/15 text-warning-foreground",
        destructive: "border-danger/20 bg-danger/10 text-danger-foreground",
        outline: "border-slate-200/80 bg-white/60 text-foreground",
        ghost: "border-transparent text-muted-foreground hover:bg-primary/10",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
