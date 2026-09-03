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
