"use client";

import { useActionState } from "react";
import { loginAdminAction } from "@/lib/actions/admin-actions";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdminAction, null);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-[#35433c]">
          Admin-Passwort
        </span>
        <input
          autoComplete="current-password"
          className="min-h-11 rounded-md border border-[#cbd5cf] bg-white px-3 text-[#17231e] transition focus:border-[#12644f]"
          name="password"
          required
          type="password"
        />
      </label>
      {state?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#12644f] px-5 text-sm font-semibold text-white hover:bg-[#0c4f3e] disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Anmelden..." : "Anmelden"}
      </button>
    </form>
  );
}
