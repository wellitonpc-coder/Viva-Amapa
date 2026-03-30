import React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * @typedef {"sm"|"md"|"lg"} StarSize
 */

/**
 * @param {{
 *  rating: number,
 *  onRate?: (value: number) => void,
 *  size?: StarSize,
 *  readonly?: boolean,
 *  className?: string
 * }} props
 */
export default function StarRating({
  rating = 0,
  onRate,
  size = "md",
  readonly = false,
  className = ""
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }

  const handleRate = (value) => {
    if (readonly) return
    if (typeof onRate === "function") onRate(value)
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= Number(rating || 0)
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleRate(value)}
            disabled={readonly}
            className={cn(
              "p-0.5 rounded transition",
              readonly ? "cursor-default" : "hover:scale-110 active:scale-95"
            )}
            aria-label={`Avaliar com ${value} estrela(s)`}
          >
            <Star
              className={cn(
                sizes[size] || sizes.md,
                filled ? "fill-amber-400 text-amber-400" : "text-slate-300"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}