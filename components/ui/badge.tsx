import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary/90 text-secondary-foreground shadow-sm",
        destructive:
          "border-transparent bg-destructive/90 text-destructive-foreground shadow-sm",
        success:
          "border-transparent bg-success/90 text-success-foreground shadow-sm",
        outline: 
          "text-foreground border-border/50 bg-muted/20 hover:bg-muted/40",
        gold: 
          "border-transparent bg-gold/90 text-gold-foreground shadow-sm",
        muted: 
          "border-transparent bg-muted/50 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
