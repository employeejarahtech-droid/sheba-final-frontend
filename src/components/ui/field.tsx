import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div ref={ref} className={cn("grid w-full items-center gap-1.5", className)} {...props} />
        )
    }
)
Field.displayName = "Field"

const FieldLabel = React.forwardRef<
    React.ElementRef<typeof Label>,
    React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
    return <Label ref={ref} className={cn(className)} {...props} />
})
FieldLabel.displayName = "FieldLabel"

const FieldError = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, children, ...props }, ref) => {
        if (!children) return null
        return (
            <p ref={ref} className={cn("text-xs font-medium text-destructive", className)} {...props}>
                {children}
            </p>
        )
    }
)
FieldError.displayName = "FieldError"

export { Field, FieldLabel, FieldError }
