import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Botão.
 *
 * Altura mínima de 56px nas variantes de ação: o público inclui pessoas idosas
 * e com pouca prática de toque, então o alvo é maior que o usual de 44px.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold " +
    "transition-colors disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        primary: "bg-primary text-ink-inverse hover:bg-primary-hover",
        soft: "bg-primary-soft text-primary hover:bg-primary hover:text-ink-inverse",
        ghost:
          "border-2 border-line bg-surface text-primary hover:border-primary",
        quiet: "text-ink-muted hover:bg-surface-muted hover:text-ink",
      },
      size: {
        /** Ação principal — respeita o alvo de toque de 56px. */
        default: "min-h-touch px-6 text-base",
        compact: "min-h-11 px-4 text-sm",
        icon: "size-11 rounded-full p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
    children?: ReactNode;
  };

export function Button({
  className,
  variant,
  size,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export { buttonVariants };
