
import { Component, ChangeDetectionStrategy, input, effect, signal, inject } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-digital-lawyer-tips',
  templateUrl: './digital-lawyer-tips.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalLawyerTipsComponent {
  stageName = input.required<string>();
  
  private geminiService = inject(GeminiService);

  tip = signal<string | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const currentStage = this.stageName();
      if (currentStage) {
        this.loadTip(currentStage);
      }
    }, { allowSignalWrites: true });
  }

  async loadTip(stage: string) {
    this.loading.set(true);
    this.error.set(null);
    this.tip.set(null);
    try {
      const fetchedTip = await this.geminiService.getDigitalLawyerTip(stage);
      this.tip.set(fetchedTip);
    } catch (e) {
      this.error.set('Não foi possível carregar a dica.');
    } finally {
      this.loading.set(false);
    }
  }
}
