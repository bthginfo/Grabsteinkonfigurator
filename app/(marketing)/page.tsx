import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Grabstein Konfigurator
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Phase 1: Wizard mit Speicherung in der Datenbank, Katalogpreise und Zusammenfassung.
        Architektur:{" "}
        <code className="rounded bg-zinc-100 px-1 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          docs/ARCHITECTURE.md
        </code>
        .
      </p>
      <Link
        href="/konfigurator"
        className="inline-flex w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Zum Konfigurator
      </Link>
    </main>
  );
}