import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Landing } from './landing/landing';
import { WorldView } from './world-view/world-view';
import { WorldConfig } from './libs/models/world-config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Landing, WorldView],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected simulationStarted = signal(false);
  readonly worldConfig = signal<WorldConfig>({
    worldWidth: 1080,
    worldHeight: 1920,
    initialFood: 30,
    initialCivilizations: 5,
    initialIndividuals: 8,
    foodSpawnInterval: 60,
  });

  onCreateWorld(config: WorldConfig) {
    this.worldConfig.set(config);

    if (this.simulationStarted()) {
      // Destroy the current world view and recreate it with the new config.
      this.simulationStarted.set(false);
      setTimeout(() => this.simulationStarted.set(true), 0);
    } else {
      this.simulationStarted.set(true);
    }
  }
}
