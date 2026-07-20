import Link from "next/link";
import { SemanticSearch } from "@/components/medicines/semantic-search";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <section className="py-16 md:py-28 bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <Badge variant="primary" className="mb-6">
            LISTA ANVISA
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-[var(--color-text)]">
            Medicamentos
            <br />
            Intercambiáveis
          </h1>
          <p className="mt-4 text-base text-muted max-w-2xl mx-auto">
            Consulte medicamentos similares e seus respectivos medicamentos de
            referência conforme dados abertos ANVISA
          </p>
        </div>

        <SemanticSearch />

        <p className="mt-8 text-center">
          <Link
            href="/buscar-avancado"
            className="text-sm font-medium text-muted hover:text-[var(--color-text)] underline transition-colors"
          >
            Busca avançada e listagem completa →
          </Link>
        </p>

        <div className="mt-10 border border-border rounded-md p-6 bg-[var(--color-bg)]">
          <p className="text-sm leading-relaxed text-[var(--color-text)]">
            Lista de Medicamentos Similares e seus respectivos medicamentos de
            referência, conforme <strong>RDC 58/2014</strong>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)]">
            Dúvidas ou maiores esclarecimentos sobre como realizar a
            intercambialidade clique{" "}
            <Link
              href="https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/similares"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--color-brand)] hover:underline"
            >
              aqui
            </Link>{" "}
            e acesse a lista oficial no site da Anvisa.
          </p>
        </div>
      </div>
    </section>
  );
}
