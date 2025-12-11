
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Movimentacao } from '../../models/processo.model';

@Component({
  selector: 'app-status-card',
  templateUrl: './status-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusCardComponent {
  movimentacao = input.required<Movimentacao>();

  readonly corClasses = computed(() => {
    switch (this.movimentacao().cor) {
      case 'verde':
        return 'bg-green-500';
      case 'amarelo':
        return 'bg-yellow-500';
      case 'vermelho':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  });
}
