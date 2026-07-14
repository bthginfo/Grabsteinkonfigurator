import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-11rem)] w-full max-w-md flex-col justify-center">
      <div className="rounded-lg border border-[#d8dfda] bg-white p-7 shadow-[0_18px_55px_rgba(28,47,38,0.1)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#12644f]">Verwaltung</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[#17231e]">Anmelden</h1>
        <p className="mt-2 text-sm leading-6 text-[#68756f]">Zugriff auf Anfragen, Statusverwaltung und Produktkatalog.</p>
        <div className="mt-7"><AdminLoginForm /></div>
      </div>
    </div>
  );
}
