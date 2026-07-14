import Link from "next/link";
import { Boxes, ExternalLink, FileJson2, LogOut } from "lucide-react";
import { logoutAdminAction } from "@/lib/actions/admin-actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAdminAuthenticated();
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f2f5f3] text-[#17231e]">
      <header className="border-b border-[#d8dfda] bg-white px-4 sm:px-6">
        <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center justify-between gap-5">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-[#13231d] text-sm font-bold text-white">G</span><span className="text-sm font-semibold">Studio Verwaltung</span></Link>
            {authenticated ? <nav className="hidden items-center gap-1 sm:flex">
              <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[#3e4c45] hover:bg-[#edf2ef]"><Boxes className="size-4" /> Anfragen</Link>
              <Link href="/admin/catalog" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[#66736d] hover:bg-[#edf2ef]"><FileJson2 className="size-4" /> Katalog</Link>
            </nav> : null}
          </div>
          <div className="flex items-center gap-1">
            <Link href="/" title="Website öffnen" className="grid size-10 place-items-center rounded-md text-[#66736d] hover:bg-[#edf2ef] hover:text-[#17231e]"><ExternalLink className="size-4" /></Link>
            {authenticated ? <form action={logoutAdminAction}><button title="Abmelden" className="grid size-10 place-items-center rounded-md text-[#66736d] hover:bg-[#edf2ef] hover:text-[#17231e]" type="submit"><LogOut className="size-4" /></button></form> : null}
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</div>
    </div>
  );
}
