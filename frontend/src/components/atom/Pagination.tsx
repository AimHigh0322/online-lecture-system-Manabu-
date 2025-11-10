import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

// Renders a compact, circular pagination like the provided design
export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped !== page) onChange(clamped);
  };

  // Determine visible pages with ellipses when totalPages > 5
  const buildPages = () => {
    const items: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }

    const left = Math.max(2, page - 2);
    const right = Math.min(totalPages - 1, page + 2);

    items.push(1);
    if (left > 2) items.push("ellipsis");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push("ellipsis");
    items.push(totalPages);
    return items;
  };
  const visible = buildPages();

  const baseBtn =
    "w-9 h-9 inline-flex items-center justify-center rounded-full border transition-colors select-none";

  return (
    <div
      className={
        "px-2 py-3 border-t border-gray-200 flex items-center justify-center gap-3 " +
        (className || "")
      }
    >
      {/* Prev */}
      <button
        aria-label="Previous page"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className={`${baseBtn} border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-100`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Numbers */}
      {visible.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`e-${idx}`}
            className="w-9 h-9 inline-flex items-center justify-center text-gray-400"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            className={
              p === page
                ? `${baseBtn} bg-indigo-500 text-white border-indigo-500`
                : `${baseBtn} border-gray-300 text-gray-700 hover:bg-gray-100`
            }
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        aria-label="Next page"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className={`${baseBtn} border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-100`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
