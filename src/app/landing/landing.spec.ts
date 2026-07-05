import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Landing } from './landing';
import { WorldConfig } from '../world-config/world-config';
import { WorldConfig as WorldConfigModel } from '../libs/models/world-config';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the hero title and intro explanation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="hero-title"]')?.textContent).toContain(
      'World Simulation',
    );
    expect(compiled.querySelector('[data-testid="hero-intro"]')).toBeTruthy();
  });

  it('renders the how-it-works feature cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.feature-card');
    expect(cards.length).toBe(4);
    expect(compiled.textContent).toContain('Diseñá tu mundo');
    expect(compiled.textContent).toContain('Controlá la comida');
    expect(compiled.textContent).toContain('Mirá la IA evolucionar');
    expect(compiled.textContent).toContain('Descubrí al ganador');
  });

  it('renders the world-config form on the same page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-world-config')).toBeTruthy();
  });

  it('forwards create-world events from the config panel', () => {
    const createSpy = jasmine.createSpy('createWorld');
    component.createWorld.subscribe(createSpy);

    const expected: WorldConfigModel = {
      worldWidth: 100,
      worldHeight: 100,
      initialFood: 1,
      initialCivilizations: 1,
      initialIndividuals: 1,
      foodSpawnInterval: 0,
    };
    const configComponent = fixture.debugElement.query(By.directive(WorldConfig))
      .componentInstance as WorldConfig;
    configComponent.createWorld.emit(expected);

    expect(createSpy).toHaveBeenCalledWith(expected);
  });
});
