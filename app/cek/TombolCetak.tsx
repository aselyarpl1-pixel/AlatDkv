"use client";

// Tombol untuk mencetak bukti peminjaman
export default function TombolCetak() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 print:hidden"
    >
      <span aria-hidden="true">🖨️</span>
      Cetak Bukti
    </button>
  );
}
