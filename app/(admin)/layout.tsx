import Link from "next/link";
import { logoutAdminAction } from "@/lib/actions/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-semibold text-amber-900 dark:text-amber-200"
            >
              Bestellungen
            </Link>
            {authenticated ? (
              <Link
                href="/admin/catalog"
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                Katalog
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Zur Website
            </Link>
            {authenticated ? (
              <form action={logoutAdminAction}>
                <button
                  className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                  type="submit"
                >
                  Abmelden
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
