import { createDraftAndRedirect } from "@/lib/actions/draft-actions";

export default function KonfiguratorStartPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Konfigurator
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Lege einen neuen Entwurf an. Dein Fortschritt wird in der Datenbank gespeichert — du
          kannst die URL des Entwurfs später erneut aufrufen (solange die Bestellung existiert).
        </p>
      </div>
      <form action={createDraftAndRedirect} className="flex flex-col items-start gap-3">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Neuen Entwurf starten
        </button>
      </form>
    </div>
  );
}
