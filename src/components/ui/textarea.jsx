import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * @typedef {React.TextareaHTMLAttributes<HTMLTextAreaElement>} TextareaProps
 */

const Textarea = React.forwardRef(
  /**
   * @param {TextareaProps} props
   * @param {React.ForwardedRef<HTMLTextAreaElement>} ref
   */
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm " +
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
            "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
``