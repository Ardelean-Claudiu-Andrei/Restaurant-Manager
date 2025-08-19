// ChipGroup.tsx
import React from "react";

type ChipGroupProps = {
  children: React.ReactNode;
  /** dacă vrei scroll orizontal pe mobil */
  scroll?: boolean;
  className?: string;
};

export function ChipGroup({ children, scroll, className }: ChipGroupProps) {
  return (
    <div
      className={`chip-group ${
        scroll ? "chip-group--scroll" : "chip-group--wrap"
      } ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
