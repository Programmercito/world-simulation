import { Component, AfterViewInit, ElementRef, ViewChild, HostListener, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../libs/factories/simulation-service';
import { WebSocketService } from '../libs/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-canvas',
  imports: [CommonModule, FormsModule],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss'
})
export class Canvas implements AfterViewInit, OnDestroy {
  @ViewChild('worldCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statsDiv') statsDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasSize') canvasSize!: ElementRef<HTMLSpanElement>;
  private simulationService!: SimulationService;
  private wsService = inject(WebSocketService);
  private foodEventSubscription?: Subscription;

  // Propiedades de configuración (optimizadas para mayor duración)
  simulationStarted = false;
  worldWidth = 1080;
  worldHeight = 1920;
  initialFood = 30; // Más comida inicial
  initialCivilizations = 5; // Menos civilizaciones
  initialIndividuals = 8; // Menos individuos por civilización
  foodSpawnInterval = 8; // Aparece comida cada 8 segundos (menos frecuente)
  currentFoodInterval = 8; // Intervalo actual (se actualiza dinámicamente)
  civilizations: Array<{ name: string, color: string, population: number, kills: number }> = [];

  ngAfterViewInit() {
    // No iniciamos automáticamente, esperamos a que el usuario configure y presione el botón
  }

  startSimulation() {
    this.simulationStarted = true;
    this.currentFoodInterval = this.foodSpawnInterval; // Inicializar el intervalo actual

    // Connect to WebSocket server
    this.wsService.connect();

    // Subscribe to food events
    this.foodEventSubscription = this.wsService.onFoodEvent().subscribe(event => {
      console.log('🍔 Received food event:', event);
      if (this.simulationService) {
        if (event.type === 'ADD_FOOD') {
          this.simulationService.addFoodBatch(event.quantity);
        } else if (event.type === 'REMOVE_FOOD') {
          this.simulationService.removeFoodBatch(event.quantity);
        }
      }
    });

    // Esperamos un tick para que el canvas se renderice
    setTimeout(() => {
      const canvasElement = this.canvas.nativeElement;
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        this.simulationService = new SimulationService(ctx, this.initialCivilizations, this.initialIndividuals, this.initialFood, this.worldWidth, this.worldHeight, this.foodSpawnInterval);
        // Register the stats callback so we render stats outside the canvas
        this.simulationService.onStats = (stats) => this.updateStats(stats);
        // Register victory callback for auto-restart
        this.simulationService.onVictory = (winnerName) => this.handleVictory(winnerName);
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

  increaseFoodInterval() {
    if (this.simulationService) {
      this.currentFoodInterval = this.currentFoodInterval + 1; // Sin límite máximo
      this.simulationService.setFoodSpawnInterval(this.currentFoodInterval);
      console.log(`Intervalo de comida aumentado a ${this.currentFoodInterval}s`);
    }
  }

  decreaseFoodInterval() {
    if (this.simulationService) {
      this.currentFoodInterval = Math.max(1, this.currentFoodInterval - 1);
      this.simulationService.setFoodSpawnInterval(this.currentFoodInterval);
      console.log(`Intervalo de comida reducido a ${this.currentFoodInterval}s`);
    }
  }

  addFood() {
    if (this.simulationService) {
      this.simulationService.addFood();
    }
  }

  private handleVictory(winnerName: string) {
    console.log(`🏆 Victoria! ${winnerName} ha ganado. Reiniciando en 20 segundos...`);

    // Esperar 20 segundos y luego reiniciar
    setTimeout(() => {
      console.log('Reiniciando simulación...');
      this.restart();
      // Iniciar nueva simulación automáticamente
      setTimeout(() => {
        this.startSimulation();
      }, 100);
    }, 20000); // 20 segundos
  }



  restart() {
    this.simulationStarted = false;
    this.civilizations = [];
    if (this.simulationService) {
      this.simulationService.stop();
    }
    // Disconnect WebSocket
    this.wsService.disconnect();
    this.foodEventSubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.wsService.disconnect();
    this.foodEventSubscription?.unsubscribe();
  }
}
