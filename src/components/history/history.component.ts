import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Movimentacao } from '../../models/processo.model';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  historico = input.required<Movimentacao[]>();
  
  // Display only the last 3 items, in reverse chronological order
  displayHistory = computed(() => {
    // FIX: Removed .reverse() to maintain the reverse chronological order.
    // The input 'historico' is already sorted with the newest items first.
    return this.historico().slice(0, 3);
  });
}
