// src/components/ProductDetailsModal.tsx
import React, { useEffect } from "react";
import { Product } from "../types";

type Props = { product: Product | null; onClose: () => void };

const formatPrice = (price?: number) =>
  price == null
    ? "—"
    : new Intl.NumberFormat("ro-RO", {
        style: "currency",
        currency: "RON",
        maximumFractionDigits: 2,
      }).format(price);

export default function ProductDetailsModal({ product, onClose }: Props) {
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [product, onClose]);

  if (!product) return null;

  const src = product.imageBase64 || product.image || "";

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button
          className="modal__close"
          type="button"
          aria-label="Închide"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Media */}
        <div className="modal__media">
          {src ? (
            <img src={src} alt={product.name} />
          ) : (
            <div style={{ height: 160 }} />
          )}
        </div>

        {/* Body (scrollabil) */}
        <div className="modal__body">
          <h3 className="modal__title">{product.name}</h3>
          <p className="modal__desc">{product.description || "—"}</p>
          <div className="modal__footerRow">
            <span className="modal__price">{formatPrice(product.price)}</span>
          </div>
        </div>

        {/* Actions (sticky jos pe mobil) */}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}
