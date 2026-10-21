import { cn } from "cn"

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white",
        className
      )}
    >
      <svg viewBox="0 0 32 32" className="size-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M16 3.2 26.5 7.4v8.8c0 6.1-4.1 10.6-10.5 12.6C9.6 26.8 5.5 22.3 5.5 16.2V7.4L16 3.2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          shapeRendering="geometricPrecision"
        />
        <path
          d="M16 11.2v8.2M11.9 15.3h8.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          shapeRendering="geometricPrecision"
        />
      </svg>
    </span>
  )
}
