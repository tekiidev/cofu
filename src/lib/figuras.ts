import type { Categoria } from './items.ts';
import { normalizar } from './parse.ts';

/**
 * Figuras em pixel art (12x12) pro modo figuras: cada letra é uma cor da paleta,
 * "." é vazio. Ficam no código, então funcionam offline e não dependem de licença.
 * Item sem figura própria usa a figura da categoria.
 */

export const PALETA = {
  k: '#2b1d12', // contorno (noite)
  b: '#6b4423', // babaçu
  n: '#a0673a', // marrom médio
  p: '#d9a441', // palha
  c: '#f1d79c', // palha clara
  a: '#e6dcc6', // areia escura
  w: '#ffffff',
  g: '#2f5d3a', // folha
  l: '#7cb36a', // verde claro
  r: '#c8553d', // terracota
  R: '#e04b3a', // vermelho
  m: '#f2a7a0', // rosa
  y: '#f4c430', // amarelo
  o: '#ef8a2b', // laranja
  u: '#3f86bf', // azul
  U: '#a8d4f0', // azul claro
} as const;

export type Cor = keyof typeof PALETA;

export const FIGURAS = {
  arroz: [
    '............',
    '............',
    '....wwww....',
    '..wwwwwwww..',
    '.wwawwwwaww.',
    '.kkkkkkkkkk.',
    '.krrrrrrrrk.',
    '..krrrrrrk..',
    '...krrrrk...',
    '....kkkk....',
    '............',
    '............',
  ],
  feijao: [
    '............',
    '............',
    '....nbnb....',
    '..bnbnbnbn..',
    '.nbnbnbnbnb.',
    '.kkkkkkkkkk.',
    '.kcccccccck.',
    '..kcccccck..',
    '...kcccck...',
    '....kkkk....',
    '............',
    '............',
  ],
  ovo: [
    '............',
    '....kkkk....',
    '...kwwwwk...',
    '..kwwwwwwk..',
    '..kwwwwwwk..',
    '.kwwwwwwwwk.',
    '.kwwwwwwwwk.',
    '.kwwwwwwwak.',
    '.kwwwwwwaak.',
    '..kwwwaaak..',
    '...kkkkkk...',
    '............',
  ],
  leite: [
    '............',
    '....kkkk....',
    '...kwwwwk...',
    '..kwwwwwwk..',
    '..kkkkkkkk..',
    '..kwwwwwwk..',
    '..kuuuuuuk..',
    '..kuwwwwuk..',
    '..kuwwwwuk..',
    '..kuuuuuuk..',
    '..kwwwwwwk..',
    '..kkkkkkkk..',
  ],
  cafe: [
    '....b..b....',
    '.....b..b...',
    '....b..b....',
    '............',
    '.kkkkkkkk...',
    '.kbbbbbbkkk.',
    '.kwwwwwwk.k.',
    '.kwwwwwwk.k.',
    '.kwwwwwwkk..',
    '..kwwwwk....',
    '...kkkk.....',
    '............',
  ],
  pao: [
    '............',
    '............',
    '............',
    '...kkkkkk...',
    '..kpcppcppk.',
    '.kppcppcpppk',
    '.kpppppppppk',
    '.knpppppppnk',
    '..knnnnnnnk.',
    '...kkkkkkk..',
    '............',
    '............',
  ],
  banana: [
    '............',
    '.........kb.',
    '........kyk.',
    '.......kyyk.',
    '......kyyyk.',
    '....kkyyyk..',
    '..kkyyyyk...',
    '.kyyyyykk...',
    '.kyyykk.....',
    '..kkk.......',
    '............',
    '............',
  ],
  tomate: [
    '............',
    '.....gg.....',
    '....gggg....',
    '..kkkkkkkk..',
    '.kRRRRRRwRk.',
    '.kRRRRRRRRk.',
    '.kRRRRRRRRk.',
    '.kRRRRRRRRk.',
    '.krRRRRRRrk.',
    '..krrrrrrk..',
    '...kkkkkk...',
    '............',
  ],
  maca: [
    '......b.....',
    '.....bgg....',
    '..kkk.kkk...',
    '.kRRRkRRRk..',
    'kRRwRRRRRRk.',
    'kRwRRRRRRRk.',
    'kRRRRRRRRRk.',
    'kRRRRRRRRRk.',
    '.kRRRRRRRk..',
    '.krRRRRRrk..',
    '..kkk.kkk...',
    '............',
  ],
  cenoura: [
    '........g.g.',
    '.........gg.',
    '........kgk.',
    '.......kook.',
    '......koook.',
    '.....kooook.',
    '....kooook..',
    '...kooook...',
    '..koook.....',
    '.kook.......',
    '.kk.........',
    '............',
  ],
  carne: [
    '............',
    '............',
    '...kkkkk....',
    '..krrrrrkk..',
    '.krrmrrrrrk.',
    '.krrrrrwrrk.',
    '.krrrrwwrrk.',
    '.krrrrrrrrk.',
    '..krrrrrrrk.',
    '...kkrrrkk..',
    '.....kkk....',
    '............',
  ],
  frango: [
    '............',
    '.......kkk..',
    '......kpppk.',
    '.....kppppk.',
    '....kpppppk.',
    '....kppnppk.',
    '...kpppppk..',
    '...kkpppk...',
    '..kwk.kkk...',
    '.kwwk.......',
    '.kwk........',
    '..k.........',
  ],
  peixe: [
    '............',
    '............',
    '............',
    '...kkkkkk..k',
    '..kUUUUUUkkk',
    '.kUkUUUUUUuk',
    '.kUUUUUUUuuk',
    '..kuuuuuukkk',
    '...kkkkkk..k',
    '............',
    '............',
    '............',
  ],
  queijo: [
    '............',
    '............',
    '........kk..',
    '......kkyyk.',
    '....kkyyyyk.',
    '..kkyyyyyyk.',
    '.kkkkkkkkkk.',
    '.kyyoyyyyyk.',
    '.kyyyyyoyyk.',
    '.kyoyyyyyyk.',
    '.kkkkkkkkkk.',
    '............',
  ],
  agua: [
    '....kkk.....',
    '....kuk.....',
    '...kUUUk....',
    '..kUUUUUk...',
    '..kUwUUUk...',
    '..kuuuuuk...',
    '..kUUUUUk...',
    '..kUwUUUk...',
    '..kUUUUUk...',
    '..kuuuuuk...',
    '..kUUUUUk...',
    '..kkkkkkk...',
  ],
  garrafa: [
    '....kkk.....',
    '....kRk.....',
    '....kgk.....',
    '...kgggk....',
    '..kgggggk...',
    '..kgUgggk...',
    '..kwwwwwk...',
    '..kwrrrwk...',
    '..kwwwwwk...',
    '..kgUgggk...',
    '..kgggggk...',
    '..kkkkkkk...',
  ],
  saco: [
    '............',
    '....k..k....',
    '.....kk.....',
    '....kaak....',
    '...kaaaak...',
    '..kaaaaaak..',
    '.kaabbbbaak.',
    '.kaabaabaak.',
    '.kaabbbbaak.',
    '.kaaaaaaaak.',
    '..kkkkkkkk..',
    '............',
  ],
  detergente: [
    '........U...',
    '....kkk..U..',
    '....kgk.....',
    '...kkkkk....',
    '...kllllk...',
    '..kllllllk..',
    '..klwwwwlk..',
    '..klwUUwlk..',
    '..klwwwwlk..',
    '..kllllllk..',
    '..kllllllk..',
    '..kkkkkkkk..',
  ],
  sabonete: [
    '............',
    '.......U.U..',
    '........U...',
    '............',
    '..kkkkkkkk..',
    '.kmmmmmmmmk.',
    '.kmwwmmmmmk.',
    '.kmmmmmmmmk.',
    '.kmmmmmmmmk.',
    '..kkkkkkkk..',
    '............',
    '............',
  ],
  caixa: [
    '............',
    '............',
    '.kkkkkkkkkk.',
    '.kppppnpppk.',
    '.kppppnpppk.',
    '.kkkkkkkkkk.',
    '.kppppppppk.',
    '.kppppppppk.',
    '.kppwwwwppk.',
    '.kppppppppk.',
    '.kkkkkkkkkk.',
    '............',
  ],
} satisfies Record<string, string[]>;

export type NomeFigura = keyof typeof FIGURAS;

const POR_CATEGORIA: Record<Categoria, NomeFigura> = {
  'Hortifrúti': 'cenoura',
  'Carnes e peixes': 'carne',
  'Laticínios e ovos': 'leite',
  'Mercearia': 'saco',
  'Padaria': 'pao',
  'Bebidas': 'garrafa',
  'Limpeza': 'detergente',
  'Higiene': 'sabonete',
  'Outros': 'caixa',
};

// Palavra (sem acento) -> figura. As frases mais longas são testadas primeiro.
const PALAVRAS: [string, NomeFigura][] = (
  [
    ['arroz', 'arroz'],
    ['feijao', 'feijao'],
    ['ovo', 'ovo'],
    ['leite', 'leite'],
    ['leite em po', 'saco'],
    ['cafe', 'cafe'],
    ['pao', 'pao'],
    ['paes', 'pao'],
    ['banana', 'banana'],
    ['tomate', 'tomate'],
    ['maca', 'maca'],
    ['cenoura', 'cenoura'],
    ['carne', 'carne'],
    ['bife', 'carne'],
    ['patinho', 'carne'],
    ['acem', 'carne'],
    ['costela', 'carne'],
    ['moida', 'carne'],
    ['frango', 'frango'],
    ['coxa', 'frango'],
    ['peixe', 'peixe'],
    ['pescada', 'peixe'],
    ['tilapia', 'peixe'],
    ['sardinha', 'peixe'],
    ['queijo', 'queijo'],
    ['agua', 'agua'],
    ['agua sanitaria', 'detergente'],
    ['refrigerante', 'garrafa'],
    ['refri', 'garrafa'],
    ['guarana', 'garrafa'],
    ['suco', 'garrafa'],
    ['cerveja', 'garrafa'],
    ['detergente', 'detergente'],
    ['sabao', 'detergente'],
    ['amaciante', 'detergente'],
    ['desinfetante', 'detergente'],
    ['sabonete', 'sabonete'],
  ] as [string, NomeFigura][]
).sort((a, b) => b[0].length - a[0].length);

export function figuraDoItem(nome: string, categoria: Categoria): NomeFigura {
  const n = ` ${normalizar(nome)} `;
  for (const [palavra, figura] of PALAVRAS) {
    if (n.includes(` ${palavra} `) || n.includes(` ${palavra}s `)) return figura;
  }
  return POR_CATEGORIA[categoria];
}

/** Junta pixels vizinhos da mesma cor numa linha só, pra o SVG ficar leve. */
export function retangulos(linhas: readonly string[]) {
  const rects: { x: number; y: number; w: number; cor: Cor }[] = [];
  linhas.forEach((linha, y) => {
    let x = 0;
    while (x < linha.length) {
      const ch = linha[x];
      let fim = x + 1;
      while (fim < linha.length && linha[fim] === ch) fim++;
      if (ch !== '.') rects.push({ x, y, w: fim - x, cor: ch as Cor });
      x = fim;
    }
  });
  return rects;
}
