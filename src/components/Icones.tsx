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

export function IconeLixeira({ className = 'h-6 w-6' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v5.5M14 11v5.5" />
    </svg>
  );
}

export function IconePausar({ className = 'h-6 w-6' }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

export function IconeMicrofone({ className = 'h-6 w-6' }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" />
    </svg>
  );
}

export function IconeEnviar({ className = 'h-6 w-6' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12l16-8-6 16-2.5-6.5z" fill="currentColor" />
    </svg>
  );
}

export function IconeCadeado({ className = 'h-5 w-5' }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconeSubir({ className = 'h-4 w-4' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function IconeTocar({ className = 'h-6 w-6' }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
    </svg>
  );
}

export function IconeMais({ className = 'h-5 w-5' }: Props) {
  return (
    <svg {...base} strokeWidth={2.75} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconeMenos({ className = 'h-5 w-5' }: Props) {
  return (
    <svg {...base} strokeWidth={2.75} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}
