import * as React from "react"
import { cn } from "../../lib/utils"

const variants = {
  primary: {
    base: "bg-primary text-primary-foreground hover:bg-primary/90",
    sizes: {
      icon: "h-8 w-8 p-0",
      sm: "h-9 rounded-md px-3",
      md: "h-10 rounded-md px-4 py-2",
      lg: "h-11 rounded-md px-8"
    }
  },
  default: {
    base: "bg-primary text-primary-foreground hover:bg-primary/90",
    sizes: {
      icon: "h-8 w-8 p-0",
      sm: "h-9 rounded-md px-3",
      md: "h-10 rounded-md px-4 py-2",
      lg: "h-11 rounded-md px-8"
    }
  },
  destructive: {
    base: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    sizes: {
      icon: "h-8 w-8 p-0",
      sm: "h-9 rounded-md px-3",
      md: "h-10 rounded-md px-4 py-2",
      lg: "h-11 rounded-md px-8"
    }
  },
  outline: {
    base: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    sizes: {
      icon: "h-8 w-8 p-0",
      sm: "h-9 rounded-md px-3",
      md: "h-10 rounded-md px-4 py-2",
      lg: "h-11 rounded-md px-8"
    }
  },
  secondary: {
    base: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    sizes: {
      icon: "h-8 w-8 p-0",
      sm: "h-9 rounded-md px-3",
      md: "h-10 rounded-md px-4 py-2",
      lg: "h-11 rounded-md px-8"
    }
  },
  ghost: {
    base: "hover:bg-accent hover:text-accent-foreground",
    sizes: {
      icon: "h-8 w-8 p-0",
      sm: "h-9 rounded-md px-3",
      md: "h-10 rounded-md px-4 py-2",
      lg: "h-11 rounded-md px-8"
    }
  },
  link: {
    base: "text-primary underline-offset-4 hover:underline",
    sizes: {
      icon: "h-8 w-8 p-0",
      sm: "h-9 rounded-md px-3",
      md: "h-10 rounded-md px-4 py-2",
      lg: "h-11 rounded-md px-8"
    }
  }
} as const

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof variants["default"]["sizes"]
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variantStyles = variants[variant]
    const baseStyles = variantStyles.base
    const sizeStyles = variantStyles.sizes[size]
    
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          baseStyles, sizeStyles, className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export default Button
