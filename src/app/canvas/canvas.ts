import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { SimulationService } from '../libs/factories/simulation-service';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss'
})
export class Canvas implements AfterViewInit {
  @ViewChild('worldCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private simulationService!: SimulationService;

  ngAfterViewInit() {
    const canvasElement = this.canvas.nativeElement;
    const ctx = canvasElement.getContext('2d');
    if (ctx) {
      this.simulationService = new SimulationService(ctx);
      this.simulationService.start();
    }
  }
}
