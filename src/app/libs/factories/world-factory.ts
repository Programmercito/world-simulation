
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
        initialCivilizations: number = 3,
        initialIndividualsPerCivilization: number = 20,
        initialFoodSources: number = 1200
    ): World {
        const width = 2000;
        const height = 2000;

        const civilizations: Civilization[] = [];
        for (let i = 0; i < initialCivilizations; i++) {
            civilizations.push(this.civilizationFactory.create());
        }

        const individuals: Individual[] = [];
        civilizations.forEach(civ => {
            for (let i = 0; i < initialIndividualsPerCivilization; i++) {
                // Usamos el color de la civilización para sus individuos
                individuals.push(this.individualFactory.createIndividual(civ.id, 'human', civ.color));
            }
        });

        const foodSources: Food[] = [];
        for (let i = 0; i < initialFoodSources; i++) {
            foodSources.push(this.foodFactory.createRandomFood(width, height));
        }

        return {
            width,
            height,
            civilizations,
            individuals,
            foodSources,
            tick: 0,
            cycleDurationMs: 50,
            foodSpawnRate: 0.15,
            maxPopulation: 500,
        };
    }
}
