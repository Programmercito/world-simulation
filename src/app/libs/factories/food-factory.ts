import { Food } from "../models/food";

export class FoodFactory {
    createRandomFood(worldWidth: number = 2000, worldHeight: number = 2000): Food {
        return {
            id: crypto.randomUUID(),
            x: Math.random() * worldWidth,
            y: Math.random() * worldHeight,
            energyValue: 20 + Math.random() * 80,
            isConsumed: false
        };
    }
}