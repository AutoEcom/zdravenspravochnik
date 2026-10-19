import * as React from "react"

import { cn } from "cn"

function GlassCard({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "strong"
}) {
  return (
    <div
      data-slot="glass-card"
      data-variant={variant}
      className={cn(
        "rounded-2xl p-4 text-card-foreground sm:p-6",
        variant === "strong" ? "glass-strong" : "glass",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { GlassCard }
