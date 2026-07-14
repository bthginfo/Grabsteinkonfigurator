import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Inbox } from "lucide-react";
import { updateOrderStatusAction } from "@/lib/actions/admin-actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { labelForOrderStatus, orderStatusOptions } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminHomePage() {
  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-[#e4cf9e] bg-[#fff9e8] p-5 text-sm text-[#654f21]">
        <h1 className="text-lg font-semibold">Admin noch nicht konfiguriert</h1>
        <p>
          Setze <code>ADMIN_PASSWORD</code> in der <code>.env</code>, damit der
          Admin-Bereich genutzt werden kann.
        </p>
      </div>
    );
  }

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const orders = await prisma.order.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#12644f]">Übersicht</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#17231e]">Anfragen</h1>
          <p className="mt-2 text-sm text-[#68756f]">Aktuelle Entwürfe, Kontaktdaten und Bearbeitungsstatus.</p>
        </div>
        <span className="text-sm font-medium tabular-nums text-[#68756f]">{orders.length} Einträge</span>
      </div>

      {orders.length === 0 ? (
        <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-[#cbd5cf] bg-white p-8 text-center"><div><Inbox className="mx-auto size-7 text-[#8a958f]" /><p className="mt-3 text-sm font-medium text-[#435149]">Noch keine Entwürfe vorhanden.</p></div></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#d8dfda] bg-white shadow-[0_10px_35px_rgba(30,48,39,0.06)]">
          <table className="min-w-full divide-y divide-[#dce2de] text-sm">
            <thead className="bg-[#f5f7f5] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#7c8882]">
              <tr>
                <th className="px-4 py-3 font-medium">Referenz</th>
                <th className="px-4 py-3 font-medium">E-Mail</th>
                <th className="px-4 py-3 font-medium">Aktualisiert</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8e5]">
              {orders.map((order) => (
                <tr key={order.id} className="transition hover:bg-[#f7faf8]">
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-[#435149]">
                    {order.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#35433c]">
                    {order.customerEmail ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#68756f]">
                    {formatDate(order.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateOrderStatusAction} className="flex gap-2">
                      <input name="orderId" type="hidden" value={order.id} />
                      <select
                        className="min-h-9 rounded-md border border-[#cbd5cf] bg-white px-2 text-sm text-[#24322b]"
                        defaultValue={order.status}
                        name="status"
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {labelForOrderStatus(status)}
                          </option>
                        ))}
                      </select>
                      <button
                        className="min-h-9 rounded-md border border-[#cbd5cf] px-3 font-medium text-[#435149] hover:bg-[#edf2ef]"
                        type="submit"
                      >
                        Speichern
                      </button>
                    </form>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link title="Entwurf öffnen" className="inline-flex items-center gap-2 font-semibold text-[#12644f] hover:text-[#0c4f3e]" href={`/konfigurator/d/${order.id}`}>Öffnen <ArrowUpRight className="size-4" /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
