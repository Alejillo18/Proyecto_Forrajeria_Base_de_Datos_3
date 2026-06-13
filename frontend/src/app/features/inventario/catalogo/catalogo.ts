import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ProductoForrajería {
  id: number;
  nombre: string;
  categoria: string;
  stockBolsas: number;
  pesoPorBolsaKg: number;
  stockKilosSueltos: number;
  stockMinimoBolsas: number;
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.sass'
})
export class CatalogoComponent implements OnInit {
  
  public productos: ProductoForrajería[] = [];

  public mostrarModalFraccionar = false;
  public mostrarModalCargarStock = false;
  public mostrarModalNuevoProducto = false;

  public productoSeleccionado: ProductoForrajería | null = null;
  public cantidadBolsasAFraccionar = 1;

  public idProductoACargar: number | null = null;
  public cantidadBolsasACargar = 1;

  public nuevoProducto = {
    nombre: '',
    categoria: 'Caninos',
    stockBolsas: 0,
    pesoPorBolsaKg: 20,
    stockMinimoBolsas: 2
  };

  ngOnInit(): void {}

  public get productosCriticos(): ProductoForrajería[] {
    return this.productos.filter(p => p.stockBolsas <= p.stockMinimoBolsas);
  }

  public abrirModalFraccionamiento(producto: ProductoForrajería): void {
    if (producto.stockBolsas <= 0) {
      alert('No hay bolsas disponibles para fraccionar de este producto.');
      return;
    }
    this.productoSeleccionado = producto;
    this.cantidadBolsasAFraccionar = 1;
    this.mostrarModalFraccionar = true;
  }

  public abrirModalCargarStock(): void {
    this.idProductoACargar = this.productos.length > 0 ? this.productos[0].id : null;
    this.cantidadBolsasACargar = 1;
    this.mostrarModalCargarStock = true;
  }

  public abrirModalNuevoProducto(): void {
    this.nuevoProducto = {
      nombre: '',
      categoria: 'Caninos',
      stockBolsas: 0,
      pesoPorBolsaKg: 20,
      stockMinimoBolsas: 2
    };
    this.mostrarModalNuevoProducto = true;
  }

  public cerrarModales(): void {
    this.mostrarModalFraccionar = false;
    this.mostrarModalCargarStock = false;
    this.mostrarModalNuevoProducto = false;
    this.productoSeleccionado = null;
    this.idProductoACargar = null;
  }

  public ejecutarFraccionamiento(): void {
    if (!this.productoSeleccionado) return;

    if (this.cantidadBolsasAFraccionar > this.productoSeleccionado.stockBolsas) {
      alert('No podés fraccionar más bolsas de las que hay en stock.');
      return;
    }

    if (this.cantidadBolsasAFraccionar <= 0) {
      alert('Ingresá una cantidad válida de bolsas.');
      return;
    }

    const productoTarget = this.productos.find(p => p.id === this.productoSeleccionado!.id);
    if (productoTarget) {
      const kilosASumar = this.cantidadBolsasAFraccionar * productoTarget.pesoPorBolsaKg;
      productoTarget.stockBolsas -= this.cantidadBolsasAFraccionar;
      productoTarget.stockKilosSueltos += kilosASumar;
      alert(`Fraccionamiento exitoso: Se descontaron ${this.cantidadBolsasAFraccionar} bolsas y se sumaron ${kilosASumar} kg al stock suelto.`);
    }

    this.cerrarModales();
  }

  public ejecutarCargaStock(): void {
    if (!this.idProductoACargar) {
      alert('Seleccioná un producto válido.');
      return;
    }

    if (this.cantidadBolsasACargar <= 0) {
      alert('Ingresá una cantidad de bolsas mayor a cero.');
      return;
    }

    const productoTarget = this.productos.find(p => p.id === Number(this.idProductoACargar));
    if (productoTarget) {
      productoTarget.stockBolsas += this.cantidadBolsasACargar;
      alert(`Stock actualizado: Se sumaron ${this.cantidadBolsasACargar} bolsas a "${productoTarget.nombre}".`);
    }

    this.cerrarModales();
  }

  public ejecutarCrearProducto(): void {
    if (!this.nuevoProducto.nombre.trim()) {
      alert('Por favor, ingresá el nombre del producto.');
      return;
    }

    if (this.nuevoProducto.pesoPorBolsaKg <= 0 || this.nuevoProducto.stockMinimoBolsas < 0 || this.nuevoProducto.stockBolsas < 0) {
      alert('Ingresá valores válidos numéricos.');
      return;
    }

    const nuevoId = this.productos.length > 0 ? Math.max(...this.productos.map(p => p.id)) + 1 : 1;

    const productoCreado: ProductoForrajería = {
      id: nuevoId,
      nombre: this.nuevoProducto.nombre,
      categoria: this.nuevoProducto.categoria,
      stockBolsas: this.nuevoProducto.stockBolsas,
      pesoPorBolsaKg: this.nuevoProducto.pesoPorBolsaKg,
      stockKilosSueltos: 0,
      stockMinimoBolsas: this.nuevoProducto.stockMinimoBolsas
    };

    this.productos.push(productoCreado);
    alert(`Producto "${productoCreado.nombre}" creado exitosamente en el catálogo.`);
    this.cerrarModales();
  }
}