import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorldConfig } from './world-config';
import { WorldConfig as WorldConfigModel } from '../libs/models/world-config';

describe('WorldConfig', () => {
  let component: WorldConfig;
  let fixture: ComponentFixture<WorldConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorldConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(WorldConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits the current configuration when create is requested', () => {
    setInputValue('[data-testid="worldWidth"]', '1200');
    setInputValue('[data-testid="worldHeight"]', '800');
    setInputValue('[data-testid="initialFood"]', '50');
    setInputValue('[data-testid="initialCivilizations"]', '3');
    setInputValue('[data-testid="initialIndividuals"]', '10');
    setInputValue('[data-testid="foodSpawnInterval"]', '30');

    let emitted: WorldConfigModel | undefined;
    component.createWorld.subscribe((cfg) => (emitted = cfg));

    const submitBtn = fixture.nativeElement.querySelector('[data-testid="createWorldBtn"]');
    submitBtn.click();

    expect(emitted).toEqual({
      worldWidth: 1200,
      worldHeight: 800,
      initialFood: 50,
      initialCivilizations: 3,
      initialIndividuals: 10,
      foodSpawnInterval: 30,
    });
  });

  it('clamps invalid dimensions and counts to safe defaults', () => {
    setInputValue('[data-testid="worldWidth"]', '100');
    setInputValue('[data-testid="initialFood"]', '-5');

    let emitted: WorldConfigModel | undefined;
    component.createWorld.subscribe((cfg) => (emitted = cfg));

    const submitBtn = fixture.nativeElement.querySelector('[data-testid="createWorldBtn"]');
    submitBtn.click();

    expect(emitted?.worldWidth).toBe(500);
    expect(emitted?.initialFood).toBe(1);
  });

  function setInputValue(selector: string, value: string) {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
});
