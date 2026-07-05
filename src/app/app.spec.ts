import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { App } from './app';
import { WebSocketService, FoodEvent } from './libs/services/websocket.service';
import { WorldConfig as WorldConfigModel } from './libs/models/world-config';
import { Subject } from 'rxjs';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;

  beforeEach(async () => {
    const mockWs = jasmine.createSpyObj<WebSocketService>(['connect', 'disconnect'], {
      onFoodEvent: () => new Subject<FoodEvent>().asObservable(),
      onConnectionStatus: () => new Subject<boolean>().asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: WebSocketService, useValue: mockWs }],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('always renders the landing section on the single page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-landing')).toBeTruthy();
  });

  it('renders the world view below the landing after a create-world event', fakeAsync(() => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const config: WorldConfigModel = {
      worldWidth: 800,
      worldHeight: 600,
      initialFood: 10,
      initialCivilizations: 2,
      initialIndividuals: 4,
      foodSpawnInterval: 30,
    };
    component.onCreateWorld(config);
    tick();
    fixture.detectChanges();

    expect(compiled.querySelector('app-world-view')).toBeTruthy();
    expect(compiled.querySelector('app-landing')).toBeTruthy();
  }));

  it('re-initializes the world view when a new create-world event is emitted', fakeAsync(() => {
    fixture.detectChanges();
    const config: WorldConfigModel = {
      worldWidth: 800,
      worldHeight: 600,
      initialFood: 10,
      initialCivilizations: 2,
      initialIndividuals: 4,
      foodSpawnInterval: 30,
    };
    component.onCreateWorld(config);
    tick();
    fixture.detectChanges();

    const resetConfig: WorldConfigModel = { ...config, initialFood: 20 };
    component.onCreateWorld(resetConfig);
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-world-view')).toBeTruthy();
    expect(component.worldConfig()).toEqual(resetConfig);
  }));
});
