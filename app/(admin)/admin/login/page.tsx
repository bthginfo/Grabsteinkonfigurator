import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin anmelden
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Zugriff auf Bestellungen und Statusverwaltung.
        </p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
