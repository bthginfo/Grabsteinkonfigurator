"use client";

import { useActionState } from "react";
import { importCatalogAction } from "@/lib/actions/admin-actions";

export function CatalogImportForm({ initialJson }: { initialJson: string }) {
  const [state, formAction, pending] = useActionState(importCatalogAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-[#35433c]">
          Katalog-JSON
        </span>
        <textarea
          className="min-h-[28rem] rounded-lg border border-[#cbd5cf] bg-[#111a16] px-4 py-3 font-mono text-xs leading-5 text-[#dfe9e3]"
          defaultValue={initialJson}
          name="catalogJson"
          spellCheck={false}
        />
      </label>
      {state?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}
      <button
        className="min-h-11 w-fit rounded-md bg-[#12644f] px-5 text-sm font-semibold text-white hover:bg-[#0c4f3e] disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Speichern..." : "Katalog speichern"}
      </button>
    </form>
  );
}
