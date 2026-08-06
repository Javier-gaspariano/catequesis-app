"use client";

export default function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="fixed right-6 top-6 z-10 rounded-full bg-cielo px-6 py-3 font-display font-extrabold text-white shadow-lg hover:bg-cielo-oscuro print:hidden"
    >
      🖨️ Imprimir
    </button>
  );
}
