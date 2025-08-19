// src/components/ProductCard.tsx
import React from "react";
import { Product } from "../types";

type Props = {
  product: Product;
  onDetails?: (product: Product) => void;
};

const formatPrice = (price?: number) =>
  price == null
    ? "—"
    : new Intl.NumberFormat("ro-RO", {
        style: "currency",
        currency: "RON",
        maximumFractionDigits: 2,
      }).format(price);

export default function ProductCard({ product, onDetails }: Props) {
  const src = product.imageBase64 || product.image || "";

  return (
    <article className="card">
      <div className="card__media">
        {src ? <img src={src} alt={product.name} loading="lazy" /> : <div />}
        {(product.tags?.length ?? 0) > 0 && (
          <div className="card__badges">
            {product.tags?.includes("popular") && (
              <span className="badge badge--purple">Popular</span>
            )}
            {product.tags?.includes("new") && (
              <span className="badge badge--teal">New</span>
            )}
          </div>
        )}
      </div>

      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <div className="card__meta">
          <span className="price">{formatPrice(product.price)}</span>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => onDetails?.(product)}
          >
            Detalii
          </button>
        </div>
      </div>
    </article>
  );
}
