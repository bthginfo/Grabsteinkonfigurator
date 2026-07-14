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
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#12644f]">Produktdaten</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#17231e]">Katalog</h1>
        <p className="mt-2 text-sm text-[#68756f]">
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
    <div className="rounded-lg border border-[#d8dfda] bg-white p-5 shadow-[0_8px_28px_rgba(30,48,39,0.05)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7c8882]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-[#17231e] tabular-nums">
        {value}
      </p>
    </div>
  );
}
