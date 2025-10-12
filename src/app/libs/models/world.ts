interface World {
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