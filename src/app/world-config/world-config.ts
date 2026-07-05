import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorldConfig as WorldConfigModel } from '../libs/models/world-config';

@Component({
  selector: 'app-world-config',
  imports: [CommonModule, FormsModule],
  templateUrl: './world-config.html',
  styleUrl: './world-config.scss',
})
export class WorldConfig {
  @Output() createWorld = new EventEmitter<WorldConfigModel>();

  config: WorldConfigModel = {
    worldWidth: 1080,
    worldHeight: 1920,
    initialFood: 30,
    initialCivilizations: 5,
    initialIndividuals: 8,
    foodSpawnInterval: 60,
  };

  onSubmit() {
    this.createWorld.emit(this.clampConfig(this.config));
  }

  private clampConfig(config: WorldConfigModel): WorldConfigModel {
    return {
      worldWidth: Math.max(500, Math.min(5000, config.worldWidth || 500)),
      worldHeight: Math.max(500, Math.min(5000, config.worldHeight || 500)),
      initialFood: Math.max(1, Math.min(5000, config.initialFood || 1)),
      initialCivilizations: Math.max(1, Math.min(20, config.initialCivilizations || 1)),
      initialIndividuals: Math.max(1, Math.min(100, config.initialIndividuals || 1)),
      foodSpawnInterval: Math.max(0, Math.min(60, config.foodSpawnInterval || 0)),
    };
  }
}
