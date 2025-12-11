
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Etapa } from '../../models/processo.model';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent {
  etapas = input.required<Etapa[]>();
}
