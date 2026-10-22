import { Link } from "@tanstack/react-router";
import gremioSeal from "@/assets/gremio.avif";

type LogoProps = {
  /** White wordmark for dark backgrounds */
  light?: boolean;
  /** When false, render as a non-link block */
  link?: boolean;
  className?: string;
};

export function Logo({ light = false, link = true, className = "" }: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={gremioSeal}
        alt=""
        width={44}
        height={44}
        className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
      />
      <p
        className={`text-[11px] font-extrabold uppercase leading-tight tracking-wide sm:text-xs ${
          light ? "text-white" : "text-[#0B2545]"
        }`}
      >
        Grêmio Politécnico
        <br />
        da USP
      </p>
    </div>
  );

  if (!link) return content;

  return (
    <Link to="/inicio" className="transition hover:opacity-90" aria-label="Grêmio Politécnico da USP">
      {content}
    </Link>
  );
}
