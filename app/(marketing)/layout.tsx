export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Grabstein Konfigurator
          </span>
          <nav className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <a className="hover:text-zinc-900 dark:hover:text-zinc-200" href="/konfigurator">
              Konfigurator
            </a>
            <a className="hover:text-zinc-900 dark:hover:text-zinc-200" href="/admin">
              Admin
            </a>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
