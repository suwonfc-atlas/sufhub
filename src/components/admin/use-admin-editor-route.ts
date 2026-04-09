"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useAdminEditorRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode");
  const editId = searchParams.get("edit");
  const isCreate = mode === "new";
  const isEditing = Boolean(editId);
  const isEditorOpen = isCreate || isEditing;

  const openCreate = () => {
    router.push(`${pathname}?mode=new`, { scroll: false });
  };

  const openEdit = (id: string) => {
    router.push(`${pathname}?edit=${id}`, { scroll: false });
  };

  const closeEditor = () => {
    router.push(pathname, { scroll: false });
  };

  return {
    editId,
    isCreate,
    isEditing,
    isEditorOpen,
    openCreate,
    openEdit,
    closeEditor,
  };
}
