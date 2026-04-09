import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export function AdminHeader({ email }: { email?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_48px_rgba(22,56,112,0.1)]">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
          Admin
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-lg font-black text-slate-950">관리자 페이지</h1>
          {email ? (
            <p className="truncate text-sm text-slate-500">{email}</p>
          ) : null}
        </div>
      </div>
      <AdminLogoutButton />
    </div>
  );
}
