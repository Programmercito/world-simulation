export interface Food {
  id: string;
  x: number;
  y: number;
  energyValue: number;
  isConsumed: boolean;
  // Propiedades de movimiento (la comida se mueve como un bichito)
  speed: number; // Velocidad de movimiento
  angle: number; // Ángulo de dirección actual (en radianes)
  wiggleOffset: number; // Offset para animación de wiggle/bamboleo
}
