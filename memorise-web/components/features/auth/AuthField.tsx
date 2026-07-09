"use client";

/**
 * Shared labelled input for auth forms (U1). Sets the correct autocomplete hint and surfaces an
 * inline, accessible error. Never logs or echoes the value elsewhere.
 */
interface AuthFieldProps {
  id: string;
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string;
  required?: boolean;
}

export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  error,
  required = true,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        data-testid={`${id}-input`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md border border-gray-300 px-3 py-2 text-base outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
      {error ? (
        <p id={errorId} data-testid={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
