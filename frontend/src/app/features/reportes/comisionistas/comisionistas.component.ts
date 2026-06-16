import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendedoresService } from '../../../core/services/vendedores';

@Component({
  selector: 'app-comisionistas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comisionistas.component.html'
})
export class ComisionistasComponent implements OnInit {
  private vendedoresService = inject(VendedoresService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  public vendedores: any[] = [];
  
  public nombre_vendedor = '';
  public comision_porcentaje = 0;
  
  public editandoId: string | null = null;
  public nombreEditado = '';
  public comisionEditada = 0;
  public activoEditado = true;

  public mensajeExito = '';
  public mensajeError = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarComisionistas();
    }
  }

  public cargarComisionistas(): void {
    this.vendedoresService.getVendedores().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.vendedores = res;
        } else if (res && Array.isArray(res.vendedores)) {
          this.vendedores = res.vendedores;
        } else if (res && Array.isArray(res.data)) {
          this.vendedores = res.data;
        } else {
          this.vendedores = [];
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.mensajeError = 'Error al cargar el listado de comisionistas.';
        this.cdr.detectChanges();
      }
    });
  }

  public guardarComisionista(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (!this.nombre_vendedor.trim()) {
      this.mensajeError = 'El nombre del comisionista es obligatorio.';
      return;
    }

    const payload = {
      nombre_vendedor: this.nombre_vendedor,
      comision_porcentaje: this.comision_porcentaje
    };

    this.vendedoresService.crearVendedor(payload).subscribe({
      next: () => {
        this.mensajeExito = 'Comisionista registrado con éxito.';
        this.nombre_vendedor = '';
        this.comision_porcentaje = 0;
        this.cargarComisionistas();
      },
      error: (err: any) => {
        if (err.error && typeof err.error === 'object' && err.error.message) {
          this.mensajeError = err.error.message;
        } else if (typeof err.error === 'string') {
          this.mensajeError = err.error;
        } else {
          this.mensajeError = 'Error al intentar guardar el comisionista.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  public iniciarEdicion(vendedor: any): void {
    const idReal = vendedor.id_vendedor !== undefined ? vendedor.id_vendedor : vendedor.id;
    
    this.editandoId = idReal !== undefined && idReal !== null ? String(idReal) : '';
    this.nombreEditado = vendedor.nombre_vendedor !== undefined ? String(vendedor.nombre_vendedor) : '';
    this.comisionEditada = vendedor.comision_porcentaje !== undefined ? Number(vendedor.comision_porcentaje) : 0;
    this.activoEditado = vendedor.activo !== undefined ? vendedor.activo : true;
    
    this.cdr.detectChanges();
  }

  public cancelarEdicion(): void {
    this.editandoId = null;
  }

  public actualizarComisionista(id: string): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    const idAEnviar = id || this.editandoId;

    if (!idAEnviar) {
      this.mensajeError = 'No se pudo determinar el ID del comisionista a actualizar.';
      return;
    }

    if (!this.nombreEditado.trim()) {
      this.mensajeError = 'El nombre no puede quedar vacío.';
      return;
    }

    const payload = {
      nombre_vendedor: this.nombreEditado,
      comision_porcentaje: this.comisionEditada,
      activo: this.activoEditado
    };

    this.vendedoresService.actualizarVendedor(idAEnviar, payload).subscribe({
      next: () => {
        this.editandoId = null;
        this.mensajeExito = 'Comisionista actualizado correctamente.';
        this.cargarComisionistas();
      },
      error: (err: any) => {
        if (err.error && typeof err.error === 'object' && err.error.message) {
          this.mensajeError = err.error.message;
        } else {
          this.mensajeError = 'Error al intentar actualizar los datos.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}