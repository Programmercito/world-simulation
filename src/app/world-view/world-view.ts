import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SimulationService } from '../libs/factories/simulation-service';
import { WebSocketService } from '../libs/services/websocket.service';
import { WorldConfig as WorldConfigModel } from '../libs/models/world-config';

@Component({
  selector: 'app-world-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './world-view.html',
  styleUrl: './world-view.scss',
})
export class WorldView implements AfterViewInit, OnDestroy {
  @Input({ required: true }) config!: WorldConfigModel;
  @Output() createWorld = new EventEmitter<WorldConfigModel>();
  @ViewChild('worldCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  protected simulationService?: SimulationService;
  protected stats = signal({ population: 0, food: 0, seekingMate: 0, tick: 0 });
  protected civilizations = signal<
    Array<{ name: string; color: string; population: number; kills: number }>
  >([]);
  protected eventLog = signal<Array<{ message: string; tick: number }>>([]);
  protected currentFoodInterval = signal(60);
  protected placementMode = signal(false);
  protected canvasInfo = signal('');

  private wsService = inject(WebSocketService);
  private foodEventSubscription?: Subscription;

  ngAfterViewInit() {
    this.wsService.connect();

    this.foodEventSubscription = this.wsService.onFoodEvent().subscribe((event) => {
      if (event.type === 'ADD_FOOD') {
        this.simulationService?.addFoodBatch(event.quantity);
      } else if (event.type === 'REMOVE_FOOD') {
        this.simulationService?.removeFoodBatch(event.quantity);
      }
    });

    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    this.simulationService = this.createSimulationService(ctx, this.config);
    this.simulationService.onStats = (stats) => this.updateStats(stats);
    this.simulationService.onVictory = (winner) => this.handleVictory(winner);

    this.currentFoodInterval.set(this.config.foodSpawnInterval);
    this.updateStats(this.simulationService.getStats());
    this.civilizations.set(this.simulationService.getCivilizations());
    this.eventLog.set(this.simulationService.getEventLog());
    this.updateCanvasInfo();
    this.simulationService.start();
  }

  protected createSimulationService(
    ctx: CanvasRenderingContext2D,
    config: WorldConfigModel,
  ): SimulationService {
    return new SimulationService(
      ctx,
      config.initialCivilizations,
      config.initialIndividuals,
      config.initialFood,
      config.worldWidth,
      config.worldHeight,
      config.foodSpawnInterval,
    );
  }

  private updateStats(stats: {
    population: number;
    food: number;
    seekingMate: number;
    tick: number;
  }) {
    this.stats.set(stats);
    this.civilizations.set(this.simulationService?.getCivilizations() ?? []);
    this.eventLog.set(this.simulationService?.getEventLog() ?? []);
  }

  private handleVictory(winnerName: string) {
    console.log(`🏆 Victoria! ${winnerName} ha ganado. Reiniciando en 20 segundos...`);
    setTimeout(() => {
      this.createWorld.emit(this.config);
    }, 20000);
  }

  ngOnDestroy() {
    this.simulationService?.stop();
    this.wsService.disconnect();
    this.foodEventSubscription?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateCanvasInfo();
  }

  protected increaseFoodInterval() {
    this.currentFoodInterval.update((v) => v + 1);
    this.simulationService?.setFoodSpawnInterval(this.currentFoodInterval());
  }

  protected decreaseFoodInterval() {
    this.currentFoodInterval.update((v) => Math.max(1, v - 1));
    this.simulationService?.setFoodSpawnInterval(this.currentFoodInterval());
  }

  protected addFoodBatch(quantity: number) {
    this.simulationService?.addFoodBatch(quantity);
  }

  protected removeFoodBatch(quantity: number) {
    this.simulationService?.removeFoodBatch(quantity);
  }

  protected togglePlacementMode() {
    this.placementMode.update((active) => !active);
  }

  protected onCanvasClick(event: MouseEvent) {
    if (!this.placementMode() || !this.simulationService) {
      return;
    }

    const canvasEl = event.target as HTMLCanvasElement;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = this.config.worldWidth / rect.width;
    const scaleY = this.config.worldHeight / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    this.simulationService.placeFoodAt(x, y);
  }

  private updateCanvasInfo() {
    if (!this.canvas) {
      return;
    }
    const canvasEl = this.canvas.nativeElement;
    const rect = canvasEl.getBoundingClientRect();
    const realW = canvasEl.width;
    const realH = canvasEl.height;
    const displayW = Math.round(rect.width);
    const displayH = Math.round(rect.height);
    this.canvasInfo.set(`${realW}x${realH} (display ${displayW}x${displayH})`);
  }
}
