import { IndividualFactory } from '../../factories/individual-factory';
import { Individual } from '../../models/individual';
import { World } from '../../models/world';
import { ProcessWorld } from './process-world';

describe('ProcessWorld decisions', () => {
  let process: ProcessWorld;
  let individual: Individual;
  let world: World;

  beforeEach(() => {
    process = new ProcessWorld();
    individual = new IndividualFactory().createIndividual('a', 'human', '#fff');
    Object.assign(individual, {
      id: 'one',
      x: 100,
      y: 100,
      age: 1,
      hunger: 0,
      energy: 100,
      visionRange: 100,
    });
    individual.dna.aggression = 0;
    world = {
      width: 500,
      height: 500,
      individuals: [individual],
      civilizations: [],
      foodSources: [],
      tick: 100,
      cycleDurationMs: 50,
      foodSpawnRate: 0,
      maxPopulation: 500,
    };
  });

  it('keeps the target when following a living social bond', () => {
    const friend = { ...individual, id: 'friend', x: 180 };
    individual.socialBond = friend.id;
    world.individuals.push(friend);

    process.processIndividual(individual, world);
    expect(individual.currentState).toBe('following');
    expect(individual.targetId).toBe(friend.id);
  });

  it('follows a companion when an aggressive individual has no prey', () => {
    const friend = { ...individual, id: 'friend', x: 180 };
    individual.dna.aggression = 0.9;
    individual.socialBond = friend.id;
    individual.currentState = 'seekingFood';
    individual.targetId = 'missing-food';
    world.individuals.push(friend);

    process.processIndividual(individual, world);
    expect(individual.currentState).toBe('following');
    expect(individual.targetId).toBe(friend.id);
  });

  it('rests when exhausted but searches for food when critically hungry', () => {
    individual.energy = 15;
    process.processIndividual(individual, world);
    expect(individual.currentState).toBe('resting');

    individual.hunger = 85;
    process.processIndividual(individual, world);
    expect(individual.currentState).toBe('exploring');
  });

  it('remembers a visible food source only once instead of every tick', () => {
    individual.hunger = 80;
    world.foodSources.push({
      id: 'food',
      x: 120,
      y: 100,
      energyValue: 20,
      isConsumed: false,
      speed: 0,
      angle: 0,
      wiggleOffset: 0,
    });
    process.processIndividual(individual, world);
    process.processIndividual(individual, world);
    expect(individual.lastFoodLocations?.length).toBe(1);
  });

  it('forgets a visited empty food location and explores elsewhere', () => {
    individual.hunger = 80;
    individual.lastFoodLocations = [{ x: 105, y: 100, timestamp: world.tick }];
    individual.explorationTarget = { x: 105, y: 100 };
    process.processIndividual(individual, world);
    expect(individual.lastFoodLocations?.length).toBe(0);
    expect(individual.explorationTarget).toBeDefined();
  });

  it('flees from an attacker even if the attacker is not naturally aggressive', () => {
    const attacker = {
      ...individual,
      id: 'attacker',
      civilizationId: 'b',
      x: 110,
      currentState: 'hunting',
      targetId: individual.id,
    };
    individual.fearLevel = 0.65;
    world.individuals.push(attacker);
    process.processIndividual(individual, world);
    expect(individual.currentState).toBe('fleeing');
  });
});
