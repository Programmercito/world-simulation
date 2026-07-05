import { IndividualFactory } from './individual-factory';
import { CivilizationFactory } from './civilization-factory';
import { FoodFactory } from './food-factory';
import { World } from '../models/world';
import { Civilization } from '../models/civilization';
import { Individual } from '../models/individual';
import { Food } from '../models/food';
export class WorldFactory {
  private individualFactory = new IndividualFactory();
  private civilizationFactory = new CivilizationFactory();
  private foodFactory = new FoodFactory();

  create(
    initialCivilizations: number = 6,
    initialIndividualsPerCivilization: number = 50,
    initialFoodSources: number = 10,
    width: number = 2000,
    height: number = 2000,
    foodSpawnIntervalSeconds: number = 5,
  ): World {
    const civilizations: Civilization[] = [];
    for (let i = 0; i < initialCivilizations; i++) {
      civilizations.push(this.civilizationFactory.create());
    }

    const individuals: Individual[] = [];
    civilizations.forEach((civ) => {
      for (let i = 0; i < initialIndividualsPerCivilization; i++) {
        // Usamos el color de la civilización para sus individuos
        individuals.push(this.individualFactory.createIndividual(civ.id, 'human', civ.color));
      }
    });

    const foodSources: Food[] = [];
    for (let i = 0; i < initialFoodSources; i++) {
      foodSources.push(this.foodFactory.createRandomFood(width, height));
    }

    // Calcular foodSpawnRate basado en el intervalo en segundos
    // cycleDurationMs = 50ms por tick
    // Si foodSpawnIntervalSeconds = 5, queremos 1 comida cada 5 segundos = 5000ms
    // Ticks en ese intervalo = 5000 / 50 = 100 ticks
    // Probabilidad por tick = 1 / 100 = 0.01
    const cycleDurationMs = 50;
    let foodSpawnRate = 0;
    if (foodSpawnIntervalSeconds > 0) {
      const ticksPerInterval = (foodSpawnIntervalSeconds * 1000) / cycleDurationMs;
      foodSpawnRate = 1 / ticksPerInterval;
    }

    return {
      width,
      height,
      civilizations,
      individuals,
      foodSources,
      tick: 0,
      cycleDurationMs: cycleDurationMs,
      foodSpawnRate: foodSpawnRate,
      maxPopulation: 500,
    };
  }
}
