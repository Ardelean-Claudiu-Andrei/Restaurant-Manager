// Chip.tsx
import React from "react";

type Props = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const Chip = React.forwardRef<HTMLButtonElement, Props>(
  ({ label, active, onClick }, ref) => (
    <button
      ref={ref}
      className={`chip ${active ? "chip--active" : ""}`}
      onClick={onClick}
      type="button"
      aria-pressed={!!active}
    >
      {label}
    </button>
  )
);
Chip.displayName = "Chip";
export default Chip;
