/**
 * Ícones da interface, em SVG e na cor do texto (currentColor).
 * A interface não usa emoji nem símbolo de texto como ícone: cada aparelho desenha
 * diferente e o leitor de tela lê o nome do emoji. Sempre decorativos (aria-hidden):
 * o nome da ação vai no aria-label do botão.
 */

type Props = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function IconeSom({ className = 'h-6 w-6' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  );
}

export function IconeCerto({ className = 'h-5 w-5' }: Props) {
  return (
    <svg {...base} strokeWidth={3} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconeFechar({ className = 'h-5 w-5' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconeVoltar({ className = 'h-5 w-5' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M9 13.5L4.5 9 9 4.5" />
      <path d="M4.5 9H14a5.5 5.5 0 0 1 0 11h-3" />
    </svg>
  );
}
