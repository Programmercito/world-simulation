import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorldConfig } from '../world-config/world-config';
import { WorldConfig as WorldConfigModel } from '../libs/models/world-config';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, WorldConfig],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  @Output() createWorld = new EventEmitter<WorldConfigModel>();

  onCreateWorld(config: WorldConfigModel) {
    this.createWorld.emit(config);
  }
}
