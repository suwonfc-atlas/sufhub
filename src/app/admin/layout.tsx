import type { ReactNode } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <div className="page-grid">
      <AdminHeader email={user?.email} />
      <div className="grid gap-4 xl:grid-cols-[14rem_1fr]">
        <AdminSidebar />
        <div className="grid gap-4">{children}</div>
      </div>
    </div>
  );
}
