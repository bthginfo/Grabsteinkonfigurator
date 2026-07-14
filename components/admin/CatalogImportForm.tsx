"use client";

import { useActionState } from "react";
import { importCatalogAction } from "@/lib/actions/admin-actions";

export function CatalogImportForm({ initialJson }: { initialJson: string }) {
  const [state, formAction, pending] = useActionState(importCatalogAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          Katalog-JSON
        </span>
        <textarea
          className="min-h-[28rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          defaultValue={initialJson}
          name="catalogJson"
          spellCheck={false}
        />
      </label>
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {state.message}
        </p>
      ) : null}
      <button
        className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        disabled={pending}
        type="submit"
      >
        {pending ? "Speichern..." : "Katalog speichern"}
      </button>
    </form>
  );
}
