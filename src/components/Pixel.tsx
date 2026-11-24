import { FIGURAS, PALETA, retangulos, type NomeFigura } from '@/lib/figuras.ts';

const CACHE = new Map<NomeFigura, ReturnType<typeof retangulos>>();

/** Figura em pixel art. Decorativa: o nome do item sempre aparece junto. */
export function Pixel({ figura, className = 'h-12 w-12' }: { figura: NomeFigura; className?: string }) {
  let rects = CACHE.get(figura);
  if (!rects) {
    rects = retangulos(FIGURAS[figura]);
    CACHE.set(figura, rects);
  }
  return (
    <svg viewBox="0 0 12 12" className={className} shapeRendering="crispEdges" aria-hidden="true">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={PALETA[r.cor]} />
      ))}
    </svg>
  );
}
