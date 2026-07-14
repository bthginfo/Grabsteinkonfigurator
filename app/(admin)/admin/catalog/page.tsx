import { redirect } from "next/navigation";
import { CatalogImportForm } from "@/components/admin/CatalogImportForm";
import { getActiveCatalog } from "@/lib/catalog";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";

export default async function AdminCatalogPage() {
  if (!isAdminConfigured()) {
    redirect("/admin");
  }
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const catalog = await getActiveCatalog();
  const initialJson = JSON.stringify(catalog, null, 2);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Katalog
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aktiver Preis- und Produktkatalog. Änderungen wirken auf neue
          Preisberechnungen, PDFs und E-Mails.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="Basispreise" value={catalog.bases.length} />
        <Metric label="USt" value={`${(catalog.vatRate * 100).toFixed(0)} %`} />
        <Metric label="Montage netto" value={`${catalog.montageNet} ${catalog.currency}`} />
        <Metric label="Ornament netto" value={`${catalog.ornamentEach} ${catalog.currency}`} />
      </div>

      <CatalogImportForm initialJson={initialJson} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
