
import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class HeaderComponent {
  search = output<string>();

  // CNJ pattern: NNNNNNN-DD.AAAA.J.TR.OOOO
  private cnjPattern = /^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/;
  
  searchControl = new FormControl('0012345-67.2024.8.26.0001', [
    Validators.required, 
    Validators.pattern(this.cnjPattern)
  ]);

  submitSearch(): void {
    if (this.searchControl.valid && this.searchControl.value) {
      this.search.emit(this.searchControl.value);
    } else {
      this.searchControl.markAsTouched();
    }
  }
}
