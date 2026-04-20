// Pixel art: 12 colunas × 18 linhas, cada pixel = 8 unidades SVG
// Transparente = '.'

const P = 8;

//          012345678901  (12 colunas)
const GRID = [
  "..TTTTTTTT..",  //  0 – copa do troféu (topo)
  ".DTTTTTTTTD.",  //  1 – profundidade da copa
  ".DTTTGTTTTD.",  //  2 – brilho G na copa
  ".DTTTTTTTTD.",  //  3 – base da copa
  "S....TTTT..S",  //  4 – haste + braços levantados
  "S.DTTTTTTD.S",  //  5 – base do troféu + braços
  "..HHHHHHHH..",  //  6 – cabelo
  "..SEESSEES..",  //  7 – olhos
  "..SSSSSSSS..",  //  8 – rosto
  "...SMMMMS...",  //  9 – sorriso
  "..SSSSSSSS..",  // 10 – queixo
  "..SSSSSSSS..",  // 11 – pescoço
  "SSBBBBBBBBSS",  // 12 – corpo + braços (topo)
  "S.BBBBBBBB.S",  // 13 – corpo + braços (baixo)
  "..BBBBBBBB..",  // 14 – corpo
  "....LL.LL...",  // 15 – pernas
  "....LL.LL...",  // 16 – pernas
  "...FFF.FFF..",  // 17 – sapatos (ligeiramente mais largos)
];

type CK = "T" | "D" | "G" | "H" | "S" | "E" | "M" | "B" | "L" | "F";
type CM = Record<CK, string>;

const COLORS: Record<1 | 2 | 3, CM> = {
  1: {
    T: "#FFD700", D: "#A67800", G: "#FFF8C0",  // troféu dourado
    H: "#FFE566",                               // cabelo loiro
    B: "#48BAB8",                               // corpo teal (Comprec)
    S: "#FFCB8E", E: "#1A2030", M: "#C06060",  // pele / olhos / boca
    L: "#1E2E3E", F: "#111820",                // calça / sapato
  },
  2: {
    T: "#B8BEC4", D: "#5F7480", G: "#E8ECED",  // troféu prata
    H: "#1C1008",                               // cabelo escuro
    B: "#2980B9",                               // corpo azul
    S: "#FFCB8E", E: "#1A2030", M: "#C06060",
    L: "#1E2E3E", F: "#111820",
  },
  3: {
    T: "#CD7F32", D: "#8B4513", G: "#D4A96A",  // troféu bronze
    H: "#6B3A1F",                               // cabelo castanho
    B: "#C0392B",                               // corpo vermelho
    S: "#FFCB8E", E: "#1A2030", M: "#C06060",
    L: "#1E2E3E", F: "#111820",
  },
};

export function TrophyCharacter({ rank }: { rank: 1 | 2 | 3 }) {
  const cm = COLORS[rank];

  const rects = [];
  for (let row = 0; row < GRID.length; row++) {
    const line = GRID[row];
    for (let col = 0; col < line.length; col++) {
      const key = line[col];
      if (key === ".") continue;
      const fill = cm[key as CK];
      if (!fill) continue;
      rects.push(
        <rect key={`${row}-${col}`} x={col * P} y={row * P} width={P} height={P} fill={fill} />
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${12 * P} ${18 * P}`}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      shapeRendering="crispEdges"
      style={
        {
          imageRendering: "pixelated",
          filter: "drop-shadow(3px 3px 0px rgba(0,0,0,0.55))",
        } as React.CSSProperties
      }
    >
      {rects}
    </svg>
  );
}
