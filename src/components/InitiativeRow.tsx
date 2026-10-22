import { useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2 } from "lucide-react";
import type { Initiative } from "@/lib/initiatives";

function Card({ item }: { item: Initiative }) {
  const done = item.status === "concluido";
  return (
    <article className="group relative aspect-[16/10] w-72 shrink-0 snap-start overflow-hidden rounded-xl bg-primary shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated sm:w-80">
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        width={1024}
        height={640}
        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${done ? "opacity-60 grayscale" : ""}`}
      />
      <div className="absolute inset-0 bg-card-fade" />
      <div className="absolute left-3 top-3 flex gap-2">
        <span className="rounded-md bg-card/90 px-2 py-0.5 text-xs font-semibold text-primary">{item.category}</span>
        {done && (
          <span className="flex items-center gap-1 rounded-md bg-success px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            <CheckCircle2 className="h-3 w-3" /> Concluído
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
        <h3 className="text-lg font-bold leading-tight">{item.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm opacity-80">
          <Calendar className="h-3.5 w-3.5" /> {item.date}
        </p>
      </div>
    </article>
  );
}

export function InitiativeRow({ title, items }: { title: string; items: Initiative[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 340, behavior: "smooth" });
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-6 md:px-10">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-[#0B2545] md:text-2xl">
          {title}
        </h2>
        <div className="flex gap-2">
          {[-1, 1].map((d) => (
            <button
              key={d}
              onClick={() => scroll(d)}
              aria-label={d < 0 ? "Anterior" : "Próximo"}
              className="rounded-full border border-border bg-card p-2 text-primary transition hover:bg-muted"
            >
              {d < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} className="scrollbar-none flex snap-x gap-4 overflow-x-auto px-6 pb-4 pt-1 md:px-10">
        {items.map((i) => <Card key={i.id} item={i} />)}
      </div>
    </section>
  );
}
