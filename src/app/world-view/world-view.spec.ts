import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { WorldView } from './world-view';
import { WebSocketService, FoodEvent } from '../libs/services/websocket.service';
import { SimulationService } from '../libs/factories/simulation-service';
import { WorldConfig as WorldConfigModel } from '../libs/models/world-config';

const defaultConfig: WorldConfigModel = {
  worldWidth: 400,
  worldHeight: 200,
  initialFood: 5,
  initialCivilizations: 2,
  initialIndividuals: 2,
  foodSpawnInterval: 60,
};

class TestableWorldView extends WorldView {
  createdService?: jasmine.SpyObj<SimulationService>;

  override createSimulationService(
    _ctx: CanvasRenderingContext2D,
    _config: WorldConfigModel,
  ): SimulationService {
    const mock = {
      addFoodBatch: jasmine.createSpy('addFoodBatch'),
      removeFoodBatch: jasmine.createSpy('removeFoodBatch'),
      placeFoodAt: jasmine.createSpy('placeFoodAt'),
      start: jasmine.createSpy('start'),
      stop: jasmine.createSpy('stop'),
      getStats: jasmine.createSpy('getStats').and.returnValue({
        population: 0,
        food: 0,
        seekingMate: 0,
        tick: 0,
      }),
      getCivilizations: jasmine.createSpy('getCivilizations').and.returnValue([]),
      getEventLog: jasmine.createSpy('getEventLog').and.returnValue([]),
      setFoodSpawnInterval: jasmine.createSpy('setFoodSpawnInterval'),
      onStats: undefined as
        | ((stats: { population: number; food: number; seekingMate: number; tick: number }) => void)
        | undefined,
      onVictory: undefined as ((winner: string) => void) | undefined,
    } as unknown as jasmine.SpyObj<SimulationService>;
    this.createdService = mock;
    return mock as unknown as SimulationService;
  }
}

describe('WorldView', () => {
  let component: TestableWorldView;
  let fixture: ComponentFixture<TestableWorldView>;
  let wsEvents$: Subject<FoodEvent>;
  let mockWsService: jasmine.SpyObj<WebSocketService>;

  beforeEach(async () => {
    wsEvents$ = new Subject<FoodEvent>();
    mockWsService = jasmine.createSpyObj<WebSocketService>(['connect', 'disconnect'], {
      onFoodEvent: () => wsEvents$.asObservable(),
      onConnectionStatus: () => new Subject<boolean>().asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [TestableWorldView],
      providers: [{ provide: WebSocketService, useValue: mockWsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestableWorldView);
    component = fixture.componentInstance;
    component.config = defaultConfig;
  });

  it('creates and starts the simulation service after view init', () => {
    fixture.detectChanges();

    expect(component.createdService).toBeTruthy();
    expect(component.createdService!.start).toHaveBeenCalled();
    expect(mockWsService.connect).toHaveBeenCalled();
  });

  it('stops the service and disconnects on destroy', () => {
    fixture.detectChanges();
    fixture.destroy();

    expect(component.createdService!.stop).toHaveBeenCalled();
    expect(mockWsService.disconnect).toHaveBeenCalled();
  });

  it('calls addFoodBatch when batch add buttons are clicked', () => {
    fixture.detectChanges();

    const addBtn = fixture.nativeElement.querySelector(
      '[data-testid="addFood10"]',
    ) as HTMLButtonElement;
    addBtn.click();

    expect(component.createdService!.addFoodBatch).toHaveBeenCalledWith(10);
  });

  it('calls removeFoodBatch when batch remove buttons are clicked', () => {
    fixture.detectChanges();

    const removeBtn = fixture.nativeElement.querySelector(
      '[data-testid="removeFood10"]',
    ) as HTMLButtonElement;
    removeBtn.click();

    expect(component.createdService!.removeFoodBatch).toHaveBeenCalledWith(10);
  });

  it('places food at mapped world coordinates when placement mode is active', () => {
    fixture.detectChanges();
    const canvasEl = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    spyOn(canvasEl, 'getBoundingClientRect').and.returnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 100,
    } as DOMRect);

    const toggleBtn = fixture.nativeElement.querySelector(
      '[data-testid="togglePlacement"]',
    ) as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();

    canvasEl.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 50 }));

    expect(component.createdService!.placeFoodAt).toHaveBeenCalledWith(200, 100);
  });

  it('does not place food when placement mode is inactive', () => {
    fixture.detectChanges();
    const canvasEl = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;

    canvasEl.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 50 }));

    expect(component.createdService!.placeFoodAt).not.toHaveBeenCalled();
  });

  it('routes WebSocket ADD_FOOD events to addFoodBatch', () => {
    fixture.detectChanges();

    wsEvents$.next({ type: 'ADD_FOOD', quantity: 25, timestamp: Date.now() });

    expect(component.createdService!.addFoodBatch).toHaveBeenCalledWith(25);
  });

  it('routes WebSocket REMOVE_FOOD events to removeFoodBatch', () => {
    fixture.detectChanges();

    wsEvents$.next({ type: 'REMOVE_FOOD', quantity: 10, timestamp: Date.now() });

    expect(component.createdService!.removeFoodBatch).toHaveBeenCalledWith(10);
  });

  it('updates stats and event log when the service reports new stats', () => {
    fixture.detectChanges();
    component.createdService!.getEventLog.and.returnValue([
      { message: '🍔 +5 food added', tick: 1 },
    ]);

    component.createdService!.onStats!({ population: 10, food: 5, seekingMate: 2, tick: 7 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('10');
    expect(compiled.textContent).toContain('🍔 +5 food added');
  });

  it('updates civilization cards when the service reports new stats', () => {
    fixture.detectChanges();
    component.createdService!.getCivilizations.and.returnValue([
      { name: 'Aurora', color: '#ff0000', population: 5, kills: 1 },
    ]);

    component.createdService!.onStats!({ population: 5, food: 0, seekingMate: 0, tick: 1 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aurora');
  });
});
