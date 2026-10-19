import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary-soft focus-visible:ring-primary/40",
        primary:
          "border border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary-soft focus-visible:ring-primary/40",
        accent:
          "border border-transparent bg-accent text-accent-foreground shadow-sm hover:bg-[#0284c7] hover:text-white focus-visible:ring-accent/50",
        secondary:
          "glass text-foreground hover:bg-white focus-visible:ring-primary/30",
        outline:
          "border border-primary/20 bg-white/60 text-primary hover:bg-primary/10 focus-visible:ring-primary/30",
        ghost:
          "border border-transparent text-foreground hover:bg-primary/10 focus-visible:ring-primary/30",
        destructive:
          "border border-transparent bg-danger text-white shadow-sm hover:bg-danger/90 focus-visible:ring-danger/40",
        link: "border border-transparent text-primary underline-offset-4 hover:underline focus-visible:ring-primary/30",
      },
      size: {
        default: "h-11 gap-2 px-4",
        xs: "h-7 gap-1 rounded-lg px-2 text-xs",
        sm: "h-9 gap-1.5 rounded-lg px-3",
        lg: "h-12 gap-2 px-5 text-base",
        icon: "size-11",
        "icon-xs": "size-7 rounded-lg",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
