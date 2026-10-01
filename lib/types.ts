export interface RankingEntry {
  pos: number;
  /** Id estavel do vendedor. Ausente na planilha legada e no rollback - ver a key em page.tsx. */
  id?: string;
  nome: string;
  total_repasse: number;
  qtd_vendas: number;
  ultima_venda: string;
  foto?: string;
}

/**
 * Totais de um quadro, somados no SERVIDOR sobre todos que pontuaram no período — inclusive quem
 * foi desligado e por isso não aparece na lista.
 *
 * Existe porque o painel somava a própria lista, e a lista exclui desligados: as vendas
 * aconteceram, mas sumiam do total no instante do desligamento. Somar no servidor também evita
 * que o nome do ex-colaborador precise atravessar a rede só para ser escondido aqui.
 */
export interface TotaisDoQuadro {
  qtd_vendas: number;
}

/** Opcional em toda a cadeia: a origem só passa a mandar a partir da v1.7.0 do backend. */
export interface TotaisRanking {
  mensal?: TotaisDoQuadro;
  anual?: TotaisDoQuadro;
}
