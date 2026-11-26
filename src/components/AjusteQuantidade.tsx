import { ajustar } from '@/lib/quantidade.ts';
import { IconeMais, IconeMenos } from '@/components/Icones.tsx';
import { rotuloQuantidade, type Item } from '@/lib/items.ts';

type Props = {
  item: Item;
  onMudar: (item: Item, direcao: 1 | -1) => void;
  className?: string;
};

/** − e + da quantidade, com alvos de toque de 44 px. O preço estimado acompanha. */
export function AjusteQuantidade({ item, onMudar, className = '' }: Props) {
  const qtd = rotuloQuantidade(item);
  return (
    <div role="group" aria-label={`Quantidade de ${item.nome}`} className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        type="button"
        disabled={!ajustar(item, -1)}
        onClick={() => onMudar(item, -1)}
        aria-label={`Menos ${item.nome}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-areia-escura text-babacu disabled:opacity-40"
      >
        <IconeMenos />
      </button>
      <span className="min-w-16 text-center text-base font-bold text-noite" aria-live="polite">
        {qtd || 'quanto?'}
      </span>
      <button
        type="button"
        onClick={() => onMudar(item, 1)}
        aria-label={`Mais ${item.nome}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-areia-escura text-babacu"
      >
        <IconeMais />
      </button>
    </div>
  );
}
