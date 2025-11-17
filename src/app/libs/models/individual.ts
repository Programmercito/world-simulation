export interface Individual {
  id: string;
  name: string;
  race: string;
  civilizationId: string;

  // Posición en el canvas
  x: number;
  y: number;

  // Estado vital
  age: number;
  maxAge: number;
  energy: number;
  hunger: number;
  health: number;
  isAlive: boolean;

  // Capacidades físicas
  speed: number;
  visionRange: number;
  strength: number;
  fertility: boolean;

  // Genética y evolución
  dna: {
    aggression: number;
    curiosity: number;
    resilience: number;
    mutationRate: number;
  };

  // Ciclo de reproducción
  cooldownUntil: number;
  offspringCount: number;
  generation: number;

  // IA
  currentState: string;
  targetId?: string;
  path?: { x: number; y: number }[];

  // Visualización
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
}