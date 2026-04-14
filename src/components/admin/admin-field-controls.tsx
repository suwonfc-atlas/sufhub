"use client";

import Image from "next/image";
import { useState } from "react";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export interface AdminSelectOption {
  label: string;
  value: string;
}

async function uploadFileToBucket(file: File, bucket: string) {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase 연결 정보가 없습니다.");
  }

  const extension = file.name.split(".").pop() ?? "bin";
  const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export function AdminInputField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        {...props}
        className={cn(
          "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400",
          className,
        )}
      />
    </label>
  );
}

export function AdminSelectField({
  label,
  options,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: AdminSelectOption[];
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        {...props}
        className={cn(
          "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400",
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminTextareaField({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        {...props}
        className={cn(
          "min-h-24 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400",
          className,
        )}
      />
    </label>
  );
}

export function AdminCheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex w-fit items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-sky-600"
      />
      <span className="font-semibold">{label}</span>
    </label>
  );
}

export function AdminImageUploadField({
  label,
  value,
  onChange,
  bucket = "images",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  bucket?: "images" | "thumbnails" | "audio";
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-600 hover:border-sky-400 hover:text-sky-700">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            setError(null);

            try {
              const publicUrl = await uploadFileToBucket(file, bucket);
              onChange(publicUrl);
            } catch (uploadError) {
              setError(
                uploadError instanceof Error
                  ? uploadError.message
                  : "업로드에 실패했습니다.",
              );
            } finally {
              setIsUploading(false);
              event.target.value = "";
            }
          }}
        />
        {isUploading ? "업로드 중..." : "이미지 업로드"}
      </label>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Image src={value} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-500">{value}</p>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function AdminFileUploadField({
  label,
  value,
  onChange,
  bucket = "audio",
  accept,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  bucket?: "images" | "thumbnails" | "audio";
  accept?: string;
  emptyLabel?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-600 hover:border-sky-400 hover:text-sky-700">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            setError(null);

            try {
              const publicUrl = await uploadFileToBucket(file, bucket);
              onChange(publicUrl);
            } catch (uploadError) {
              setError(
                uploadError instanceof Error
                  ? uploadError.message
                  : "업로드에 실패했습니다.",
              );
            } finally {
              setIsUploading(false);
              event.target.value = "";
            }
          }}
        />
        {isUploading ? "업로드 중..." : emptyLabel ?? "파일 업로드"}
      </label>
      {value ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="truncate text-xs text-slate-500">{value}</p>
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function AdminImageListUploadField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-600 hover:border-sky-400 hover:text-sky-700">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);
            if (!files.length) return;

            setIsUploading(true);
            setError(null);

            try {
              const uploaded = [];
              for (const file of files) {
                uploaded.push(await uploadFileToBucket(file, "images"));
              }
              onChange([...values, ...uploaded]);
            } catch (uploadError) {
              setError(
                uploadError instanceof Error
                  ? uploadError.message
                  : "업로드에 실패했습니다.",
              );
            } finally {
              setIsUploading(false);
              event.target.value = "";
            }
          }}
        />
        {isUploading ? "업로드 중..." : "이미지 여러 개 업로드"}
      </label>
      {values.length ? (
        <div className="grid gap-2">
          {values.map((value, index) => (
            <div key={`${value}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Image src={value} alt="" width={56} height={56} className="h-14 w-14 rounded-lg object-cover" />
              <p className="min-w-0 flex-1 truncate text-xs text-slate-500">{value}</p>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, currentIndex) => currentIndex !== index))}
                className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function AdminFormMessage({
  message,
  status,
}: {
  message: string | null;
  status?: "success" | "error";
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm leading-6",
        status === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700",
      )}
    >
      {message}
    </div>
  );
}
