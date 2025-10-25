import { Food } from "../models/food";

export class FoodFactory {
    createRandomFood(): Food {
        return {
            id: crypto.randomUUID(),
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            energyValue: 20 + Math.random() * 80,
            isConsumed: false
        };
    }
}