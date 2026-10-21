export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-extrabold text-accent-foreground">GP</div>
      <div className={`leading-tight ${light ? "text-primary-foreground" : "text-primary"}`}>
        <p className="text-sm font-bold">Grêmio Politécnico</p>
        <p className="text-xs opacity-70">Universidade de São Paulo</p>
      </div>
    </div>
  );
}
