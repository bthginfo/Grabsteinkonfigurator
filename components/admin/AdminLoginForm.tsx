"use client";

import { useActionState } from "react";
import { loginAdminAction } from "@/lib/actions/admin-actions";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdminAction, null);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          Admin-Passwort
        </span>
        <input
          autoComplete="current-password"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          name="password"
          required
          type="password"
        />
      </label>
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      ) : null}
      <button
        className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        disabled={pending}
        type="submit"
      >
        {pending ? "Anmelden..." : "Anmelden"}
      </button>
    </form>
  );
}
