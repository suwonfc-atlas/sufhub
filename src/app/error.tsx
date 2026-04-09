"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-rose-100 bg-white/90 p-8 shadow-[0_24px_80px_rgba(22,56,112,0.12)]">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
        Error State
      </p>
      <h1 className="mt-3 text-3xl font-black text-slate-950">
        화면을 불러오는 중 문제가 발생했습니다
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        {error.message || "잠시 후 다시 시도해 주세요."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        다시 시도
      </button>
    </div>
  );
}
