import Link from "next/link";
import { redirect } from "next/navigation";
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
      <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Bestellungen
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Die neuesten Entwürfe und Aufträge aus der Datenbank.
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Noch keine Entwürfe vorhanden.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Referenz</th>
                <th className="px-4 py-3 font-medium">E-Mail</th>
                <th className="px-4 py-3 font-medium">Aktualisiert</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {order.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {order.customerEmail ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(order.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateOrderStatusAction} className="flex gap-2">
                      <input name="orderId" type="hidden" value={order.id} />
                      <select
                        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                        className="rounded-lg border border-zinc-300 px-3 py-1 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        type="submit"
                      >
                        Speichern
                      </button>
                    </form>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      className="font-medium text-zinc-800 underline-offset-4 hover:underline dark:text-zinc-200"
                      href={`/konfigurator/d/${order.id}`}
                    >
                      Öffnen
                    </Link>
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
