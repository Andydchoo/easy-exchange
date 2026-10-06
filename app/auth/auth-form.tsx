"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "@/app/auth/actions";

type Field = {
  name: string;
  label: string;
  type: string;
  autoComplete: string;
};

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
  footer: { text: string; href: string; linkLabel: string };
  initialError?: string;
};

export function AuthForm({
  action,
  fields,
  submitLabel,
  footer,
  initialError,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    error: initialError,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1 text-sm">
          {field.label}
          <input
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
      ))}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm text-green-700">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
      <p className="text-sm">
        {footer.text}{" "}
        <Link href={footer.href} className="underline">
          {footer.linkLabel}
        </Link>
      </p>
    </form>
  );
}
