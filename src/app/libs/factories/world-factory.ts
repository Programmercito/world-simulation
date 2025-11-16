
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
        initialCivilizations: number = 2,
        initialIndividualsPerCivilization: number = 10,
        initialFoodSources: number = 100
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
            foodSources.push(this.foodFactory.createRandomFood());
        }

        return {
            width,
            height,
            civilizations,
            individuals,
            foodSources,
            tick: 0,
            cycleDurationMs: 20,
            foodSpawnRate: 0.1,
            maxPopulation: 500,
        };
    }
}
