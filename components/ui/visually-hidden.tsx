import * as React from "react"
import { cn } from "@/lib/utils"

// This component helps with accessibility by hiding content visually 
// while still making it available to screen readers
export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
          "clip-[rect(0,0,0,0)]",
          className
        )}
        {...props}
      />
    )
  }
)

VisuallyHidden.displayName = "VisuallyHidden" 