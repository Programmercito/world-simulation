export interface Civilization {
  id: string;
  name: string;
  color: string;
  foundingGeneration: number;

  // Reglas internas
  reproductionRules: {
    minAge: number;
    energyThreshold: number;
    maxOffspring: number;
  };

  // Evolución
  mutationBias: {
    aggression: number;
    curiosity: number;
    resilience: number;
  };

  // Estadísticas
  population: number;
  totalDeaths: number;
  totalBirths: number;
  totalKills?: number;
}