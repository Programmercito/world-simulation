import { Component, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { SimulationService } from '../libs/factories/simulation-service';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss'
})
export class Canvas implements AfterViewInit {
  @ViewChild('worldCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statsDiv', { static: true }) statsDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasSize', { static: true }) canvasSize!: ElementRef<HTMLSpanElement>;
  private simulationService!: SimulationService;

  ngAfterViewInit() {
    const canvasElement = this.canvas.nativeElement;
    const ctx = canvasElement.getContext('2d');
    if (ctx) {
      this.simulationService = new SimulationService(ctx);
      // Register the stats callback so we render stats outside the canvas
      this.simulationService.onStats = (stats) => this.updateStats(stats);
      // Set initial stats immediately
      this.updateStats(this.simulationService.getStats());
      this.simulationService.start();
      // Update canvas size info
      this.updateCanvasInfo();
    }
  }

  private updateStats(stats: { population: number; food: number; seekingMate: number; tick: number }) {
    if (!this.statsDiv) return;
    const el = this.statsDiv.nativeElement;
    const elPop = el.querySelector('#population') as HTMLElement | null;
    const elFood = el.querySelector('#food') as HTMLElement | null;
    const elSeeking = el.querySelector('#seeking') as HTMLElement | null;
    const elTick = el.querySelector('#tick') as HTMLElement | null;
    if (elPop) elPop.innerText = String(stats.population);
    if (elFood) elFood.innerText = String(stats.food);
    if (elSeeking) elSeeking.innerText = String(stats.seekingMate);
    if (elTick) elTick.innerText = String(stats.tick);
  }

  private updateCanvasInfo() {
    if (!this.canvas) return;
    const canvasEl = this.canvas.nativeElement;
    const rect = canvasEl.getBoundingClientRect();
    const realW = canvasEl.width;
    const realH = canvasEl.height;
    const displayW = Math.round(rect.width);
    const displayH = Math.round(rect.height);
    const el = this.canvasSize?.nativeElement;
    if (el) el.innerText = `${realW}x${realH} (display ${displayW}x${displayH})`;
  }

  @HostListener('window:resize')
  onResize() {
    this.updateCanvasInfo();
  }
}
