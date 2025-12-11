
export type StatusCor = 'verde' | 'amarelo' | 'vermelho';

export interface Movimentacao {
  titulo: string;
  data: string;
  descricao?: string;
  cor?: StatusCor;
}

export interface Etapa {
  nome: string;
  status: 'concluida' | 'atual' | 'pendente';
}

export interface Processo {
  numero: string;
  etapaAtualIndex: number;
  ultimaMovimentacao: Movimentacao;
  historico: Movimentacao[];
}

export interface ProcessoResponse {
  processo: Processo;
  isMock: boolean;
}
