"use client";

import { useState } from "react";
import { hybridSearch } from "@/lib/actions/semantic-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SemanticResultsTable } from "@/components/medicines/semantic-results-table";
import { RecentSearches } from "@/components/medicines/recent-searches";
import { SearchResultsCards } from "@/components/medicines/search-results-cards";
import { ViewToggle } from "@/components/medicines/view-toggle";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import type { MedicineResult } from "@/types";

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    { score: number; medicine: MedicineResult }[]
  >([]);
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const { recent, add: addRecent } = useRecentSearches();

  async function handleSearch(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setQuery(searchQuery);
    addRecent(searchQuery);

    try {
      const data = await hybridSearch(searchQuery, 20);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="primary">BUSCA POR DESCRIÇÃO</Badge>
        <Tooltip text='Digite sintomas ou usos ("anti-inflamatório para articulação"). A % indica o grau de similaridade — quanto maior, mais próximo do que você busca.'>
          <button
            type="button"
            tabIndex={0}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-muted border border-border bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors cursor-help"
            aria-label="Saiba mais sobre a busca por descrição"
          >
            ?
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <Input
            label=""
            placeholder='Ex: "anti-inflamatório para articulação" ou "remédio para pressão"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            aria-describedby="search-description"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="self-stretch sm:self-end min-h-[44px]"
        >
          {loading ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {!searched && (
        <RecentSearches searches={recent} onSelect={handleSearch} />
      )}

      <p id="search-description" className="sr-only">
        Digite uma descrição do medicamento para buscar
      </p>

      {loading && (
        <div
          className="mt-6 space-y-3"
          aria-live="polite"
          aria-label="Carregando resultados"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs text-muted">Resultados por relevância</p>
            <ViewToggle view={view} onChange={setView} />
          </div>

          {view === "cards" ? (
            <SearchResultsCards results={results} />
          ) : (
            <SemanticResultsTable results={results} />
          )}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="mt-4 text-sm text-muted" role="status">
          Nenhum resultado encontrado. Tente descrever de outra forma.
        </p>
      )}
    </div>
  );
}
