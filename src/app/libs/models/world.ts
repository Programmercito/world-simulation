import { Civilization } from "./civilization";
import { Food } from "./food";
import { Individual } from "./individual";

export interface World {
  width: number;
  height: number;
  individuals: Individual[];
  civilizations: Civilization[];
  foodSources: Food[];

  // Tiempo
  tick: number;
  cycleDurationMs: number;

  // Configuración
  foodSpawnRate: number;
  maxPopulation: number;
}