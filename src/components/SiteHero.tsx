import type { ReactNode } from "react";
import gremioInvertido from "@/assets/gremio_invertido.avif";

type SiteHeroProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function SiteHero({ title, subtitle, children }: SiteHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gremio-hero text-white">
      <div className="relative z-10 grid items-center gap-4 px-6 pb-8 pt-5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] md:px-10 md:pb-10 md:pt-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl font-bold uppercase leading-[1.05] tracking-wide sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-1.5 text-sm text-white/85 md:text-base">{subtitle}</p> : null}
          {children ? <div className="mt-2 text-xs leading-relaxed text-white/75 md:text-sm">{children}</div> : null}
        </div>

        <div className="pointer-events-none relative mx-auto hidden h-28 w-28 items-center justify-center md:flex lg:h-36 lg:w-36">
          <img
            src={gremioInvertido}
            alt=""
            width={160}
            height={160}
            className="h-full w-full object-contain opacity-90 drop-shadow-sm"
          />
        </div>
      </div>

      <img
        src={gremioInvertido}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-6 top-3 h-24 w-24 object-contain opacity-25 md:hidden"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 leading-[0]" aria-hidden>
        <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="h-6 w-full fill-white md:h-8">
          <path d="M0,28 C240,56 480,0 720,20 C960,40 1200,56 1440,24 L1440,48 L0,48 Z" />
        </svg>
      </div>
    </section>
  );
}
