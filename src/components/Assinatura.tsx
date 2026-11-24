/**
 * Assinatura no fim da página: a logo tekidev leva pro Instagram e o ícone ao lado pro GitHub.
 * Links com área de toque de 44 px e abrindo em outra aba, pra lista não se perder.
 */

const INSTAGRAM = 'https://www.instagram.com/tekidev/';
const GITHUB = 'https://github.com/tekiidev';

export function Assinatura() {
  return (
    <div className="flex items-center justify-center gap-2 pb-6 text-babacu/70">
      <a
        href={INSTAGRAM}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="tekidev no Instagram"
        className="flex min-h-11 items-center rounded-xl px-2 opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/tekidev.svg" alt="tekidev" width={92} height={30} className="h-[30px] w-auto" />
      </a>
      <a
        href={GITHUB}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="tekidev no GitHub"
        className="flex h-11 w-11 items-center justify-center rounded-xl opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-6 w-6">
          <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
        </svg>
      </a>
    </div>
  );
}
