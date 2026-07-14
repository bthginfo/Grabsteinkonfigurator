import Link from "next/link";

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f5f3] text-[#202421]">
      <header className="border-b border-black/10 bg-white px-4 sm:px-6">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center bg-[#17624b] text-sm font-semibold text-white">GA</span>
            <span>
              <span className="font-display block text-lg leading-none">Grabmal Atelier</span>
              <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.15em] text-[#747b76] sm:block">Persönlicher Entwurf</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center border-b border-transparent text-sm font-medium text-[#626a65] hover:border-[#17624b] hover:text-[#17624b]"
          >
            Entwurf verlassen
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">{children}</div>
    </div>
  );
}
