import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesarVentaComponent } from './procesar-venta.component';

describe('ProcesarVentaComponent', () => {
  let component: ProcesarVentaComponent;
  let fixture: ComponentFixture<ProcesarVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesarVentaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcesarVentaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
