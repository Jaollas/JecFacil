
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Movimentacao, Processo, ProcessoResponse, StatusCor } from '../models/processo.model';

// Interfaces for the expected Datajud API response structure
interface DatajudMovimento {
  dataHora: string;
  nome: string;
}

interface DatajudSource {
  numeroProcesso: string;
  dataAjuizamento: string;
  movimentos: DatajudMovimento[];
}

interface DatajudHit {
  _source: DatajudSource;
}

interface DatajudResponse {
  hits: {
    hits: DatajudHit[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class DatajudService {
  private http = inject(HttpClient);

  // By using a proxy, we can bypass browser CORS restrictions for this demo.
  // Switched to a more reliable proxy to avoid network failures.
  private readonly PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';
  private readonly API_URL = 'https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search';
  
  // The API key provided for Datajud access.
  private readonly DATAJUD_API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

  findProcess(numero: string): Observable<ProcessoResponse> {
    const cleanNumero = numero.replace(/[.-]/g, '');
    
    const body = {
      "query": {
        "match": {
          "numeroProcesso": cleanNumero
        }
      },
      // Sort by date to ensure the latest movements are first if the API doesn't guarantee order
      "sort": [
        { "dataAjuizamento": "desc" }
      ],
      "size": 1 // We only need the most relevant result
    };

    const headers = new HttpHeaders({
      'Authorization': `Basic ${this.DATAJUD_API_KEY}`
    });

    return this.http.post<DatajudResponse>(`${this.PROXY_URL}${this.API_URL}`, body, { headers }).pipe(
      map(response => {
        if (!response.hits.hits || response.hits.hits.length === 0) {
          // This is an expected "Not Found" response from the API.
          // We throw an error that the component will catch and display to the user.
          throw new Error('Processo não encontrado. Verifique o número e tente novamente.');
        }
        return { processo: this.transformData(response), isMock: false };
      }),
      catchError(err => {
        if (err instanceof Error && err.message.includes('Processo não encontrado')) {
            return throwError(() => err);
        }

        // Updated error logging for proxy/network issues
        if (err.status === 0) {
          console.error(
            'Datajud API call via proxy failed due to a network error. ' +
            'The proxy service may be down. Falling back to mock data.', 
            err.message
          );
        } else {
          console.error(
            `Datajud API call via proxy failed with status ${err.status}. Check API Key if status is 401/403. Falling back to mock data.`, 
            err.error || err.message
          );
        }

        const mockProcesso = this.transformData(this.getMockData(numero));
        return of({ processo: mockProcesso, isMock: true });
      })
    );
  }

  private transformData(response: DatajudResponse): Processo {
    const source = response.hits.hits[0]._source;
    
    // 1. Create a unified list of events with original dates to sort reliably
    const eventos = (source.movimentos || []).map(mov => ({
        dataOriginal: new Date(mov.dataHora),
        titulo: this.simplifyMovimento(mov.nome)
    }));
    eventos.push({
        dataOriginal: new Date(source.dataAjuizamento),
        titulo: 'Processo Distribuído'
    });

    // 2. Sort by the actual Date object, descending (newest first)
    eventos.sort((a, b) => b.dataOriginal.getTime() - a.dataOriginal.getTime());

    // 3. Now, map to the final display format
    const historicoCompleto: Movimentacao[] = eventos.map(e => ({
        titulo: e.titulo,
        data: e.dataOriginal.toLocaleDateString('pt-BR')
    }));

    if (historicoCompleto.length === 0) {
        throw new Error("Não foi possível processar os dados do processo: histórico vazio.");
    }

    const ultimaMovimentacao = historicoCompleto[0];
    const { etapaAtualIndex, cor } = this.determineCurrentStage(historicoCompleto);

    return {
      numero: this.formatProcessoNumero(source.numeroProcesso),
      etapaAtualIndex: etapaAtualIndex,
      ultimaMovimentacao: {
        ...ultimaMovimentacao,
        cor: cor,
        descricao: this.getMovimentoDescricao(ultimaMovimentacao.titulo)
      },
      historico: historicoCompleto.slice(1),
    };
  }

  private determineCurrentStage(historico: Movimentacao[]): { etapaAtualIndex: number, cor: StatusCor } {
    const movimentos = historico.map(h => h.titulo.toLowerCase());
    if (movimentos.some(m => m.includes('arquivado') || m.includes('baixado'))) return { etapaAtualIndex: 4, cor: 'verde' };
    if (movimentos.some(m => m.includes('sentença') || m.includes('julgado'))) return { etapaAtualIndex: 3, cor: 'verde' };
    if (movimentos.some(m => m.includes('audiência'))) return { etapaAtualIndex: 2, cor: 'amarelo' };
    if (movimentos.some(m => m.includes('citação'))) return { etapaAtualIndex: 1, cor: 'amarelo' };
    return { etapaAtualIndex: 0, cor: 'amarelo' };
  }

  private simplifyMovimento(nome: string): string {
    const lowerCaseNome = nome.toLowerCase();
    if (lowerCaseNome.includes('audiência de conciliação designada')) return 'Audiência de Conciliação Marcada';
    if (lowerCaseNome.includes('citação')) return 'Citação do Réu Realizada';
    if (lowerCaseNome.includes('distribuído por sorteio')) return 'Processo Distribuído';
    if (lowerCaseNome.includes('sentença registrada')) return 'Sentença Publicada';
    if (lowerCaseNome.includes('juntada de petição')) return 'Novo Documento Adicionado';
    return nome;
  }

  private getMovimentoDescricao(titulo: string): string {
    const descricoes: { [key: string]: string } = {
        'Audiência de Conciliação Marcada': 'Sua audiência foi agendada. É uma reunião para tentar um acordo amigável. Sua presença é muito importante.',
        'Citação do Réu Realizada': 'A outra parte do processo foi oficialmente comunicada sobre a ação judicial. Agora, ela tem um prazo para apresentar sua defesa.',
        'Sentença Publicada': 'O juiz(a) analisou o caso e deu uma decisão. Verifique o conteúdo da sentença para saber o resultado.',
        'Processo Distribuído': 'Seu processo foi recebido pelo sistema de justiça e encaminhado para a vara responsável, onde será julgado.',
        'Novo Documento Adicionado': 'Um novo documento ou petição foi anexado ao processo pelas partes ou pelo juiz.'
    };
    return descricoes[titulo] || 'Esta é uma atualização padrão do sistema. Para mais detalhes, consulte os autos do processo.';
  }

  private formatProcessoNumero(numero: string): string {
    if (numero.length !== 20) return numero;
    const p1 = numero.substring(0, 7);
    const p2 = numero.substring(7, 9);
    const p3 = numero.substring(9, 13);
    const p4 = numero.substring(13, 14);
    const p5 = numero.substring(14, 16);
    const p6 = numero.substring(16, 20);
    return `${p1}-${p2}.${p3}.${p4}.${p5}.${p6}`;
  }

  private getMockData(numero: string): DatajudResponse {
    const cleanNumero = numero.replace(/[.-]/g, '');
    return {
      "hits": {
        "hits": [
          {
            "_source": {
              "numeroProcesso": cleanNumero,
              "dataAjuizamento": "2024-07-01T10:00:00Z",
              "movimentos": [
                { "dataHora": "2024-07-15T14:30:00Z", "nome": "Ato Ordinatório - Citação" },
                { "dataHora": "2024-07-20T11:00:00Z", "nome": "Juntada de Petição Inicial" },
                { "dataHora": "2024-08-25T09:00:00Z", "nome": "Audiência de Conciliação Designada" }
              ]
            }
          }
        ]
      }
    };
  }
}
