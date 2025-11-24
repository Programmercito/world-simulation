import { Component, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../libs/factories/simulation-service';

@Component({
  selector: 'app-canvas',
  imports: [CommonModule, FormsModule],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss'
})
export class Canvas implements AfterViewInit {
  @ViewChild('worldCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statsDiv') statsDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasSize') canvasSize!: ElementRef<HTMLSpanElement>;
  private simulationService!: SimulationService;

  // Propiedades de configuración (optimizadas para mayor duración)
  simulationStarted = false;
  worldWidth = 2000;
  worldHeight = 2000;
  initialFood = 30; // Más comida inicial
  initialCivilizations = 5; // Menos civilizaciones
  initialIndividuals = 8; // Menos individuos por civilización
  foodSpawnInterval = 8; // Aparece comida cada 8 segundos (menos frecuente)
  civilizations: Array<{name: string, color: string, population: number, kills: number}> = [];
  winner: {name: string, color: string, population: number, kills: number} | null = null;

  ngAfterViewInit() {
    // No iniciamos automáticamente, esperamos a que el usuario configure y presione el botón
  }

  startSimulation() {
    this.simulationStarted = true;
    // Esperamos un tick para que el canvas se renderice
    setTimeout(() => {
      const canvasElement = this.canvas.nativeElement;
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        this.simulationService = new SimulationService(ctx, this.initialCivilizations, this.initialIndividuals, this.initialFood, this.worldWidth, this.worldHeight, this.foodSpawnInterval);
        // Register the stats callback so we render stats outside the canvas
        this.simulationService.onStats = (stats) => this.updateStats(stats);
        // Set initial stats immediately
        this.updateStats(this.simulationService.getStats());
        // Cargar civilizaciones
        this.civilizations = this.simulationService.getCivilizations();
        this.simulationService.start();
        // Update canvas size info
        this.updateCanvasInfo();
      }
    }, 0);
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
    // Actualizar población de civilizaciones
    if (this.simulationService) {
      this.civilizations = this.simulationService.getCivilizations();
      this.checkWinner();
    }
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

  addFood() {
    if (this.simulationService) {
      this.simulationService.addFood();
    }
  }

  private checkWinner() {
    const civilizationsAlive = this.civilizations.filter(civ => civ.population > 0);
    if (civilizationsAlive.length === 1 && !this.winner) {
      this.winner = civilizationsAlive[0];
      if (this.simulationService) {
        this.simulationService.playVictorySound();
        this.simulationService.stop();
      }
    }
  }

  restart() {
    this.winner = null;
    this.simulationStarted = false;
    this.civilizations = [];
    if (this.simulationService) {
      this.simulationService.stop();
    }
  }
}
