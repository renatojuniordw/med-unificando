"use client";

import { useState, useEffect, useRef } from "react";

interface SearchSuggestion {
  text: string;
  category: string;
}

const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  // Dor e analgesia
  { text: "dor de cabeça", category: "Dor" },
  { text: "dor nas costas", category: "Dor" },
  { text: "dor articular", category: "Dor" },
  { text: "dor muscular", category: "Dor" },
  { text: "dor de dente", category: "Dor" },
  { text: "analgesico para dor forte", category: "Dor" },
  
  // Anti-inflamatórios
  { text: "anti-inflamatório para articulação", category: "Anti-inflamatório" },
  { text: "anti-inflamatório para dor muscular", category: "Anti-inflamatório" },
  { text: "anti-inflamatório para artrite", category: "Anti-inflamatório" },
  { text: "anti-inflamatório para reumatismo", category: "Anti-inflamatório" },
  
  // Pressão e cardio
  { text: "remédio para pressão", category: "Pressão" },
  { text: "anti-hipertensivo", category: "Pressão" },
  { text: "remédio para coração", category: "Pressão" },
  { text: "medicamento para colesterol", category: "Pressão" },
  
  // Diabetes
  { text: "remédio para diabetes", category: "Diabetes" },
  { text: "insulina", category: "Diabetes" },
  { text: "antidiabético", category: "Diabetes" },
  
  // Alergia
  { text: "remédio para alergia", category: "Alergia" },
  { text: "antialérgico", category: "Alergia" },
  { text: "remédio para rinite", category: "Alergia" },
  
  // Resfriado e gripe
  { text: "remédio para gripe", category: "Resfriado" },
  { text: "remédio para tosse", category: "Resfriado" },
  { text: "remédio para resfriado", category: "Resfriado" },
  { text: "antigripal", category: "Resfriado" },
  
  // Estômago e digestão
  { text: "remédio para estômago", category: "Estômago" },
  { text: "remédio para azia", category: "Estômago" },
  { text: "remédio para gastrite", category: "Estâmago" },
  { text: "remédio para úlcera", category: "Estômago" },
  
  // Ansiedade e depressão
  { text: "remédio para ansiedade", category: "Ansiedade" },
  { text: "ansiolítico", category: "Ansiedade" },
  { text: "remédio para depressão", category: "Depressão" },
  { text: "antidepressivo", category: "Depressão" },
  
  // Infecções
  { text: "antibiótico", category: "Infecção" },
  { text: "remédio para infecção urinária", category: "Infecção" },
  { text: "remédio para infecção", category: "Infecção" },
  
  // Dermatologia
  { text: "remédio para pele", category: "Pele" },
  { text: "remeido para acne", category: "Pele" },
  { text: "remeido para micose", category: "Pele" },
  { text: "remeido para dermatite", category: "Pele" },
  
  // Oftalmologia
  { text: "remeido para olho", category: "Olhos" },
  { text: "colírio", category: "Olhos" },
  { text: "remeido para conjuntivite", category: "Olhos" },
  
  // Urologia
  { text: "remeido para bexiga", category: "Urinário" },
  { text: "remeido para próstata", category: "Urinário" },
  { text: "remeido para infecção urinária", category: "Urinário" },
]

interface SearchSuggestionsProps {
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
}

export function SearchSuggestions({ onSelect, isVisible }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showAll, setShowAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      // Mostrar sugestões agrupadas por categoria
      const grouped = SEARCH_SUGGESTIONS.reduce((acc, suggestion) => {
        if (!acc[suggestion.category]) {
          acc[suggestion.category] = [];
        }
        acc[suggestion.category].push(suggestion);
        return acc;
      }, {} as Record<string, SearchSuggestion[]>);

      // Pegar apenas uma sugestão por categoria para não sobrecarregar
      const topSuggestions = Object.values(grouped)
        .map(categorySuggestions => categorySuggestions[0])
        .slice(0, 6);

      setSuggestions(topSuggestions);
    }
  }, [isVisible]);

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div ref={containerRef} className="mt-4 space-y-3">
      <p className="text-xs text-muted font-medium">Sugestões de busca:</p>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(suggestion.text)}
            className="px-3 py-1.5 text-xs font-medium text-muted bg-[var(--color-bg-secondary)] border border-border rounded-full hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
          >
            {suggestion.text}
          </button>
        ))}
      </div>

      {!showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-xs text-[var(--color-brand)] hover:underline"
        >
          Ver mais sugestões
        </button>
      )}

      {showAll && (
        <div className="mt-2 p-3 bg-[var(--color-bg-secondary)] border border-border rounded-md max-h-48 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {SEARCH_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelect(suggestion.text)}
                className="text-left px-2 py-1 text-xs text-muted hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] rounded transition-colors"
              >
                <span className="font-medium">{suggestion.text}</span>
                <span className="ml-1 text-[10px] text-muted/70">({suggestion.category})</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="mt-2 text-xs text-[var(--color-brand)] hover:underline"
          >
            Ocultar sugestões
          </button>
        </div>
      )}
    </div>
  );
}