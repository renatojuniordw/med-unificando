"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { hybridSearch } from "@/lib/actions/semantic-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SemanticResultsTable } from "@/components/medicines/semantic-results-table";
import { SearchResultsCards } from "@/components/medicines/search-results-cards";
import { ViewToggle } from "@/components/medicines/view-toggle";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import Link from "next/link";
import type { MedicineResult } from "@/types";

const SUGGESTIONS = [
  { text: "dor de cabeça", category: "Dor" },
  { text: "dor articular", category: "Dor" },
  { text: "dor muscular", category: "Dor" },
  { text: "anti-inflamatório para articulação", category: "Anti-inflamatório" },
  { text: "remédio para pressão", category: "Pressão" },
  { text: "antihipertensivo", category: "Pressão" },
  { text: "remédio para diabetes", category: "Diabetes" },
  { text: "antialérgico", category: "Alergia" },
  { text: "remédio para gripe", category: "Resfriado" },
  { text: "remédio para estômago", category: "Estômago" },
  { text: "remédio para ansiedade", category: "Ansiedade" },
  { text: "antibiótico", category: "Infecção" },
  { text: "remédio para colesterol", category: "Colesterol" },
  { text: "remédio para tosse", category: "Tosse" },
  { text: "insulina", category: "Diabetes" },
  { text: "antidepressivo", category: "Depressão" },
  { text: "remédio para pele", category: "Pele" },
  { text: "colírio", category: "Olhos" },
  { text: "remédio para infecção urinária", category: "Infecção" },
  { text: "relaxante muscular", category: "Músculo" },
];

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ score: number; medicine: MedicineResult }[]>([]);
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // para navegação por teclado
  const { recent, add: addRecent } = useRecentSearches();
  const inputRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputElRef = useRef<HTMLInputElement>(null);

  // Fechar autocomplete ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sugestões filtradas para autocomplete
  const filteredSuggestions = query.trim()
    ? SUGGESTIONS.filter((s) =>
        s.text.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 6)
    : [];

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [filteredSuggestions.length]);

  async function handleSearch(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setQuery(searchQuery);
    setShowSuggestions(false);
    setSuggestionsOpen(false);
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

  function handleSuggestion(text: string) {
    setQuery(text);
    handleSearch(text);
  }

  function toggleSuggestions() {
    setSuggestionsOpen((prev) => !prev);
    setShowSuggestions(false);
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (showSuggestions && activeIndex >= 0 && filteredSuggestions[activeIndex]) {
          handleSuggestion(filteredSuggestions[activeIndex].text);
        } else {
          handleSearch();
        }
        return;
      }

      if (!showSuggestions || filteredSuggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    },
    [showSuggestions, filteredSuggestions, activeIndex, query],
  );

  return (
    <div className="bg-[var(--color-bg)] border border-border rounded-md shadow-card p-6 md:p-8">
      {/* Cabeçalho minimalista */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="primary">BUSCA POR DESCRIÇÃO</Badge>
      </div>

      {/* Input + Buscar */}
      <div className="relative" ref={inputRef}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0 relative">
            <Input
              ref={inputElRef}
              label=""
              placeholder='Ex: "anti-inflamatório" ou "remédio para pressão"'
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!searched) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (!searched && query.trim()) setShowSuggestions(true);
              }}
              aria-describedby="search-description"
              aria-expanded={showSuggestions && filteredSuggestions.length > 0}
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
              }
            />

            {/* Botão limpar + indicador IA */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setSearched(false);
                    inputElRef.current?.focus();
                  }}
                  className="pointer-events-auto text-muted/40 hover:text-muted transition-colors text-sm leading-none p-0.5"
                  aria-label="Limpar busca"
                >
                  ✕
                </button>
              )}
              <span className="text-[10px] text-muted/30 pointer-events-none">
                IA
              </span>
            </div>

            {/* Autocomplete dropdown com navegação por teclado */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 left-0 right-0 mt-1 bg-[var(--color-bg)] border border-border rounded-md shadow-lg overflow-hidden"
                role="listbox"
              >
                {filteredSuggestions.map((s, i) => (
                  <button
                    key={i}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    type="button"
                    onClick={() => handleSuggestion(s.text)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                      i === activeIndex
                        ? "bg-brand-yellow/15 text-[var(--color-text)]"
                        : "text-[var(--color-text)] hover:bg-brand-yellow/10"
                    }`}
                  >
                    <span>{s.text}</span>
                    <span className="text-[10px] text-muted/60">
                      {s.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
      </div>

      {/* Aviso sutil — sumiu depois da primeira busca */}
      {!searched && (
        <p className="mt-2 text-[11px] text-muted/60 leading-relaxed">
          ⚠️ Resultados com IA — confirme com um profissional de saúde.
        </p>
      )}

      {/* Estado inicial: buscas recentes OU sugestões */}
      {!searched && (
        <div className="mt-4">
          {recent.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted/70 font-medium">
                  Buscas recentes
                </p>
                <button
                  type="button"
                  onClick={toggleSuggestions}
                  className="text-[11px] text-[var(--color-brand)] hover:underline"
                >
                  {suggestionsOpen ? "Ocultar sugestões" : "Ver sugestões"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.slice(0, 5).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestion(q)}
                    className="px-3 py-1 text-xs font-medium text-muted bg-[var(--color-bg-secondary)] border border-border rounded-full hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              {suggestionsOpen && (
                <div className="mt-3 p-3 bg-[var(--color-bg-secondary)] border border-border rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTIONS.slice(0, 12).map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSuggestion(s.text)}
                        className="text-left px-2 py-1 text-xs text-muted hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded transition-colors"
                      >
                        <span className="font-medium">{s.text}</span>
                        <span className="ml-1 text-[10px] text-muted/50">
                          ({s.category})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-muted/70 font-medium mb-2">
                Experimente buscar por:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.slice(0, 8).map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestion(s.text)}
                    className="px-3 py-1 text-xs font-medium text-muted bg-[var(--color-bg-secondary)] border border-border rounded-full hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <p id="search-description" className="sr-only">
        Digite uma descrição do medicamento para buscar
      </p>

      {/* Loading */}
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

      {/* Resultados com animação de fade-in */}
      {!loading && results.length > 0 && (
        <div className="mt-5 border-t border-border pt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs text-muted">
              {results.length} resultados por relevância
            </p>
            <ViewToggle view={view} onChange={setView} />
          </div>

          {view === "cards" ? (
            <SearchResultsCards results={results} searchQuery={query} />
          ) : (
            <SemanticResultsTable results={results} />
          )}
        </div>
      )}

      {/* Empty state útil */}  
      {!loading && searched && results.length === 0 && (
        <div className="mt-6 border-t border-border pt-6 text-center" role="status">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="text-3xl">🔍</div>
            <p className="text-sm text-muted font-medium">
              Nenhum resultado encontrado para &ldquo;{query}&rdquo;
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted/70">
                Tente reformular a busca:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSuggestion("anti-inflamatório")}
                  className="px-3 py-1 text-xs font-medium text-muted bg-[var(--color-bg-secondary)] border border-border rounded-full hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
                >
                  anti-inflamatório
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestion("dor de cabeça")}
                  className="px-3 py-1 text-xs font-medium text-muted bg-[var(--color-bg-secondary)] border border-border rounded-full hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
                >
                  dor de cabeça
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestion("antibiótico")}
                  className="px-3 py-1 text-xs font-medium text-muted bg-[var(--color-bg-secondary)] border border-border rounded-full hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
                >
                  antibiótico
                </button>
              </div>
            </div>
            <Link
              href="/buscar-avancado"
              className="inline-block text-xs text-[var(--color-brand)] hover:underline"
            >
              Ir para busca avançada →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}