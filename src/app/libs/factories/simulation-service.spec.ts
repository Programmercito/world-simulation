import { SimulationService } from './simulation-service';

describe('SimulationService food mechanics', () => {
  let ctx: CanvasRenderingContext2D;
  let service: SimulationService;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 400;
    ctx = canvas.getContext('2d')!;
    service = new SimulationService(ctx, 2, 2, 5, 500, 400, 0);
  });

  it('adds a batch of food and logs the event', () => {
    service.addFoodBatch(10);

    expect(service.getStats().food).toBe(15);
    expect(service.getEventLog().some((e) => e.message === '🍔 +10 food added')).toBe(true);
  });

  it('removes a batch clamped to available food and logs the event', () => {
    service.addFoodBatch(20);
    service.removeFoodBatch(50);

    expect(service.getStats().food).toBe(0);
    expect(service.getEventLog().some((e) => e.message.includes('food removed'))).toBe(true);
  });

  it('removes a partial batch when more food is available', () => {
    service.addFoodBatch(20);
    service.removeFoodBatch(8);

    expect(service.getStats().food).toBe(17);
  });

  it('places food at requested world coordinates', () => {
    service.placeFoodAt(123, 234);

    const placed = service.getFoodSources().slice(-1)[0];
    expect(placed.x).toBe(123);
    expect(placed.y).toBe(234);
    expect(service.getEventLog().some((e) => e.message.includes('Food placed at'))).toBe(true);
  });

  it('clamps placeFoodAt coordinates to world bounds', () => {
    service.placeFoodAt(-100, 1000);

    const placed = service.getFoodSources().slice(-1)[0];
    expect(placed.x).toBe(0);
    expect(placed.y).toBe(400);
  });

  it('keeps the event log capped at the last entries', () => {
    for (let i = 0; i < 6; i++) {
      service.addFoodBatch(1);
    }

    expect(service.getEventLog().length).toBeLessThanOrEqual(5);
  });

  it('moves an individual toward its chosen mate', () => {
    const world = service['world'];
    const [individual, mate] = world.individuals;
    Object.assign(individual, { x: 100, y: 100, currentState: 'seekingMate', targetId: mate.id });
    Object.assign(mate, { x: 200, y: 100 });

    service['moveIndividual'](individual);
    expect(individual.x).toBeGreaterThan(100);
    expect(individual.y).toBe(100);
  });

  it('recovers energy while resting without moving', () => {
    const individual = service['world'].individuals[0];
    Object.assign(individual, { x: 100, y: 100, energy: 15, hunger: 0, age: 1 });
    service['world'].individuals = [individual];
    service['update']();

    expect(individual.currentState).toBe('resting');
    expect(individual.energy).toBeGreaterThan(15);
    expect(individual.x).toBe(100);
    expect(individual.y).toBe(100);
  });

  it('does not reproduce twice with the same parent in one tick', () => {
    const world = service['world'];
    const parents = world.individuals.slice(0, 3);
    world.individuals = parents;
    world.tick = 100;
    for (const parent of parents) {
      Object.assign(parent, {
        civilizationId: 'same',
        x: 100,
        y: 100,
        currentState: 'seekingMate',
        energy: 100,
        hunger: 0,
        cooldownUntil: 0,
        targetId: undefined,
      });
    }

    service['handleReproduction']();
    expect(world.individuals.length).toBe(4);
    expect(parents.reduce((total, parent) => total + parent.offspringCount, 0)).toBe(2);
  });
});
