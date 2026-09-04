import { AlertCircle } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type AriaAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

const controlClass =
  "min-h-touch w-full rounded-control border-2 border-line bg-surface px-4 text-base text-ink shadow-[0_1px_2px_rgb(44_42_53/0.04)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-ink-muted/75 hover:border-tint-violeta-cover focus:border-primary focus:ring-4 focus:ring-primary-soft disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted aria-invalid:border-danger aria-invalid:ring-danger-soft";

type DescribedControl = {
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
};

export function FormField({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactElement<DescribedControl>;
  className?: string;
}) {
  const descriptionId = error ? `${id}-erro` : hint ? `${id}-ajuda` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        "aria-describedby": descriptionId,
        "aria-invalid": Boolean(error),
      })
    : children;

  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && (
          <span className="ml-2 font-normal text-ink-muted">(opcional)</span>
        )}
      </label>
      {control}
      {error ? (
        <p
          id={`${id}-erro`}
          role="alert"
          className="flex items-start gap-2 text-sm font-medium text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-ajuda`} className="text-sm leading-relaxed text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-32 resize-y py-3", className)} {...props} />;
}

export function SelectField({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cn(controlClass, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}
