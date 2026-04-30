import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  from?: number | null;
  to?: number | null;
  total?: number;
}

export function Pagination({
  currentPage,
  lastPage,
  onPageChange,
  from,
  to,
  total,
}: PaginationProps) {
  const pages = Array.from({ length: lastPage }, (_, index) => index + 1).slice(
    Math.max(currentPage - 3, 0),
    Math.min(currentPage + 2, lastPage),
  );

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Halaman {currentPage} dari {Math.max(lastPage, 1)}
        </p>
        {typeof total === "number" ? (
          <p className="text-xs text-[color:var(--muted)]">
            Menampilkan {from ?? 0}-{to ?? 0} dari {total} data
          </p>
        ) : null}
      </div>

      {lastPage > 1 ? (
        <>
          <Button
            className="h-10 rounded-xl px-4"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            variant="outline"
          >
            Sebelumnya
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {pages.map((page) => (
              <button
                className={cn(
                  "h-10 min-w-10 rounded-xl border px-3 text-sm font-medium transition",
                  currentPage === page
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-border bg-white/80 text-slate-700 hover:bg-white",
                )}
                key={page}
                onClick={() => onPageChange(page)}
                type="button"
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            className="h-10 rounded-xl px-4"
            disabled={currentPage === lastPage}
            onClick={() => onPageChange(currentPage + 1)}
            variant="outline"
          >
            Berikutnya
          </Button>
        </>
      ) : (
        <div className="rounded-full border border-border bg-[color:var(--input)] px-4 py-2 text-sm text-[color:var(--muted)]">
          Satu halaman
        </div>
      )}
    </div>
  );
}
