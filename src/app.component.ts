
import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { StatusCardComponent } from './components/status-card/status-card.component';
import { DigitalLawyerTipsComponent } from './components/digital-lawyer-tips/digital-lawyer-tips.component';
import { HistoryComponent } from './components/history/history.component';
import { Processo, Etapa } from './models/processo.model';
import { DatajudService } from './services/datajud.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    TimelineComponent,
    StatusCardComponent,
    DigitalLawyerTipsComponent,
    HistoryComponent
  ]
})
export class AppComponent {
  private datajudService = inject(DatajudService);

  processo = signal<Processo | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  isMockData = signal<boolean>(false);

  private readonly nomesEtapas = ['Início', 'Citação', 'Audiência', 'Sentença', 'Finalizado'];

  readonly etapas = computed<Etapa[]>(() => {
    const proc = this.processo();
    if (!proc) return [];
    
    return this.nomesEtapas.map((nome, index) => ({
      nome,
      status: index < proc.etapaAtualIndex ? 'concluida' : (index === proc.etapaAtualIndex ? 'atual' : 'pendente')
    }));
  });

  readonly etapaAtualNome = computed<string>(() => {
    const proc = this.processo();
    if (!proc) return '';
    return this.nomesEtapas[proc.etapaAtualIndex];
  });

  async onSearchProcess(numero: string) {
    this.loading.set(true);
    this.error.set(null);
    this.processo.set(null);
    this.isMockData.set(false);
    
    try {
      const response = await firstValueFrom(this.datajudService.findProcess(numero));
      this.processo.set(response.processo);
      this.isMockData.set(response.isMock);
    } catch (err: any) {
      this.error.set(err.message || 'Ocorreu um erro desconhecido. Tente novamente mais tarde.');
    } finally {
      this.loading.set(false);
    }
  }
}
