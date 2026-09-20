import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const inputClass =
  "rounded-xl border border-(--color-ocean)/50 bg-(--color-night) px-4 py-3 text-(--color-light) outline-none focus:border-(--color-sand)";
const inputErrorClass = "border-red-400 focus:border-red-400";
const labelClass = "flex flex-col gap-1.5 text-sm";
const legendClass = "text-(--color-sand)";

function fieldClass(error?: string) {
  return error ? `${inputClass} ${inputErrorClass}` : inputClass;
}

export function RequiredMark() {
  return (
    <>
      {" "}
      <span aria-hidden="true">*</span>
    </>
  );
}

export function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string | undefined;
}) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs text-red-300">
      {message}
    </p>
  );
}

export function fieldsetErrorClass(hasError: boolean) {
  return hasError ? "rounded-lg border border-red-400 p-3" : "";
}

type TextFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string | undefined;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextField({
  id,
  label,
  required,
  error,
  className,
  ...inputProps
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <label className={labelClass} htmlFor={id}>
      <span className={legendClass}>
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={className ?? fieldClass(error)}
        {...inputProps}
      />
      <FieldError id={errorId} message={error} />
    </label>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string | undefined;
  placeholder?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({
  id,
  label,
  required,
  error,
  placeholder = "Select one",
  children,
  className,
  ...selectProps
}: SelectFieldProps) {
  const errorId = `${id}-error`;

  return (
    <label className={labelClass} htmlFor={id}>
      <span className={legendClass}>
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      <select
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={className ?? fieldClass(error)}
        {...selectProps}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
      <FieldError id={errorId} message={error} />
    </label>
  );
}

export { inputClass, labelClass, legendClass, fieldClass };
