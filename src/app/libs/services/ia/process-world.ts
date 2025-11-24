import { Injectable } from '@angular/core';
import { Individual } from '../../models/individual';
import { World } from '../../models/world';
import { Food } from '../../models/food';

@Injectable({
  providedIn: 'root'
})
export class ProcessWorld {

  /**
   * Procesa la IA de un individuo basado en su ADN y el estado del mundo.
   */
  public processIndividual(individual: Individual, world: World): void {
    // Inicializar propiedades si no existen
    if (!individual.lastFoodLocations) individual.lastFoodLocations = [];
    if (individual.fearLevel === undefined) individual.fearLevel = 0;
    
    // Reducir miedo gradualmente con el tiempo
    individual.fearLevel = (individual.fearLevel || 0) - 0.01;
    individual.fearLevel = Math.max(0, individual.fearLevel);

    // Si el objetivo de comida ya no existe, lo olvidamos.
    if (individual.targetId && !world.foodSources.find(f => f.id === individual.targetId)) {
      individual.targetId = undefined;
      individual.currentState = 'wandering';
    }

    // Usar curiosidad para ajustar el rango de visión
    const visionMultiplier = 1 + (individual.dna.curiosity - 0.5) * 0.5;
    const effectiveVisionRange = individual.visionRange * visionMultiplier;

    // Usar resiliencia para decidir umbrales de hambre y energía
    const hungerThreshold = 25 - (individual.dna.resilience - 0.5) * 10; // Umbral más alto
    const energyThreshold = 45 - (individual.dna.resilience - 0.5) * 10; // Menos exigente
    
    // Detectar amenazas cercanas y aumentar miedo
    this.detectThreats(individual, world, effectiveVisionRange);

    // PRIORIDAD 0: Huir si hay mucho miedo (supervivencia inmediata)
    if (individual.fearLevel > 0.7 && individual.energy > 10) {
      individual.currentState = 'fleeing';
      individual.targetId = undefined;
      return; // Salir temprano, el miedo domina todo
    }

    // PRIORIDAD 1: Si tienes hambre CRÍTICA, es urgente buscar comida o cazar
    if (individual.hunger > hungerThreshold) {
      // Buscar comida visible primero
      const closestFood = this.findClosestFood(individual, world, effectiveVisionRange);
      
      if (closestFood) {
        // Comida visible - ir por ella
        individual.currentState = 'seekingFood';
        individual.targetId = closestFood.id;
        individual.explorationTarget = undefined;
        // Recordar esta ubicación
        this.rememberFoodLocation(individual, closestFood.x, closestFood.y, world.tick);
      } else if (individual.currentState === 'hunting') {
        // Ya está cazando, mantener el estado
        const prey = world.individuals.find(i => i.id === individual.targetId && i.isAlive);
        if (!prey) {
          // Presa perdida
          individual.currentState = 'exploring';
          individual.targetId = undefined;
        }
      } else if (individual.hunger > 95 && individual.energy > 25) {
        // Hambre EXTREMA y aún tiene energía para cazar (último recurso)
        const prey = this.findWeakestPrey(individual, world, effectiveVisionRange);
        if (prey) {
          individual.currentState = 'hunting';
          individual.targetId = prey.id;
          individual.explorationTarget = undefined;
        } else {
          // No hay presa, explorar con memoria
          this.exploreWithMemory(individual, world);
        }
      } else {
        // Hambre normal, explorar inteligentemente
        this.exploreWithMemory(individual, world);
      }
    } else if (individual.age > 3 && individual.energy > energyThreshold && individual.cooldownUntil < world.tick) {
      // PRIORIDAD 2: Si tienes buena salud y edad, considera reproducirte
      // Buscar pareja cercana compatible
      const potentialMate = this.findCompatibleMate(individual, world, effectiveVisionRange);
      if (potentialMate) {
        individual.currentState = 'seekingMate';
        individual.targetId = potentialMate.id;
        individual.socialBond = potentialMate.id; // Crear vínculo temporal
      } else {
        individual.currentState = 'wandering';
      }
      individual.explorationTarget = undefined;
    } else {
      // PRIORIDAD 3: Deambular o seguir al grupo
      if (individual.socialBond) {
        const bondedIndividual = world.individuals.find(i => i.id === individual.socialBond && i.isAlive);
        if (bondedIndividual) {
          const distance = Math.hypot(individual.x - bondedIndividual.x, individual.y - bondedIndividual.y);
          if (distance > effectiveVisionRange * 0.5) {
            // Seguir al individuo vinculado si está lejos
            individual.currentState = 'following';
            individual.targetId = individual.socialBond;
          } else {
            individual.currentState = 'wandering';
          }
        } else {
          individual.socialBond = undefined;
          individual.currentState = 'wandering';
        }
      } else {
        individual.currentState = 'wandering';
      }
      individual.targetId = undefined;
      individual.explorationTarget = undefined;
    }
  }

  private detectThreats(individual: Individual, world: World, visionRange: number): void {
    // Buscar individuos agresivos cercanos de otras civilizaciones
    const threats = world.individuals.filter(other => 
      other.isAlive &&
      other.id !== individual.id &&
      other.civilizationId !== individual.civilizationId &&
      other.dna.aggression > 0.7 &&
      Math.hypot(individual.x - other.x, individual.y - other.y) < visionRange * 0.8
    );
    
    if (threats.length > 0) {
      individual.fearLevel = Math.min(1, (individual.fearLevel || 0) + 0.2);
    }
  }

  private rememberFoodLocation(individual: Individual, x: number, y: number, tick: number): void {
    if (!individual.lastFoodLocations) individual.lastFoodLocations = [];
    
    // Agregar nueva ubicación
    individual.lastFoodLocations.push({ x, y, timestamp: tick });
    
    // Mantener solo las últimas 5 ubicaciones
    if (individual.lastFoodLocations.length > 5) {
      individual.lastFoodLocations.shift();
    }
  }

  private exploreWithMemory(individual: Individual, world: World): void {
    individual.currentState = 'exploring';
    
    // Si tiene memoria de comida, ir a esas ubicaciones primero
    if (individual.lastFoodLocations && individual.lastFoodLocations.length > 0) {
      // Ir a la ubicación más reciente si no tiene objetivo
      if (!individual.explorationTarget) {
        const recentLocation = individual.lastFoodLocations[individual.lastFoodLocations.length - 1];
        individual.explorationTarget = { x: recentLocation.x, y: recentLocation.y };
      }
    }
    // Si no, explorar aleatoriamente
    if (!individual.explorationTarget) {
      individual.explorationTarget = {
        x: Math.random() * world.width,
        y: Math.random() * world.height
      };
    }
  }

  private findCompatibleMate(individual: Individual, world: World, visionRange: number): Individual | null {
    const potentialMates = world.individuals.filter(other =>
      other.isAlive &&
      other.id !== individual.id &&
      other.civilizationId === individual.civilizationId &&
      other.age > 3 &&
      other.energy > 50 &&
      other.currentState === 'seekingMate' &&
      other.cooldownUntil < world.tick &&
      Math.hypot(individual.x - other.x, individual.y - other.y) < visionRange
    );

    if (potentialMates.length === 0) return null;
    
    // Preferir parejas con DNA similar (más realista)
    potentialMates.sort((a, b) => {
      const similarityA = Math.abs(individual.dna.resilience - a.dna.resilience) +
                         Math.abs(individual.dna.curiosity - a.dna.curiosity);
      const similarityB = Math.abs(individual.dna.resilience - b.dna.resilience) +
                         Math.abs(individual.dna.curiosity - b.dna.curiosity);
      return similarityA - similarityB;
    });
    
    return potentialMates[0];
  }

  private findClosestFood(individual: Individual, world: World, visionRange: number): Food | null {
    let closestFood: Food | null = null;
    let minDistance = visionRange;

    for (const food of world.foodSources) {
      if (food.isConsumed) continue;

      const distance = Math.hypot(individual.x - food.x, individual.y - food.y);
      if (distance < minDistance) {
        minDistance = distance;
        closestFood = food;
      }
    }
    return closestFood;
  }

  private findWeakestPrey(hunter: Individual, world: World, visionRange: number): Individual | null {
    const preys = world.individuals.filter(ind => 
      ind.isAlive &&
      ind.id !== hunter.id &&
      ind.civilizationId !== hunter.civilizationId && // Solo atacar otras civilizaciones
      ind.energy < hunter.energy * 0.8 && // Solo atacar más débiles
      Math.hypot(hunter.x - ind.x, hunter.y - ind.y) < visionRange
    );

    if (preys.length === 0) return null;

    // Ordenar por energía (más débil primero) y devolver el más cercano de los débiles
    preys.sort((a, b) => a.energy - b.energy);
    return preys[0];
  }
}