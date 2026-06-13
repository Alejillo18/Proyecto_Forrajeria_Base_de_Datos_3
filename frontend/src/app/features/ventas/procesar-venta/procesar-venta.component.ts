import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ProductoVenta {
  id: number;
  nombre: string;
  categoria: string;
  stockBolsas: number;
  pesoPorBolsaKg: number;
  stockKilosSueltos: number;
  precioBolsa: number;
  precioKilo: number;
}

interface ItemCarrito {
  producto: ProductoVenta;
  tipo: 'Bolsa' | 'Kilo';
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-procesar-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procesar-venta.component.html',
  styleUrl: './procesar-venta.component.sass'
})
export class ProcesarVentaComponent implements OnInit {

  public productos: ProductoVenta[] = [];

  public carrito: ItemCarrito[] = [];
  
  public idProductoSeleccionado: number | null = null;
  public tipoVenta: 'Bolsa' | 'Kilo' = 'Kilo';
  public cantidadAAgregar = 1;
  public totalVenta = 0;

  ngOnInit(): void {
    if (this.productos.length > 0) {
      this.idProductoSeleccionado = this.productos[0].id;
    }
  }

  public agregarAlCarrito(): void {
    if (!this.idProductoSeleccionado) return;

    const prod = this.productos.find(p => p.id === Number(this.idProductoSeleccionado));
    if (!prod) return;

    if (this.cantidadAAgregar <= 0) {
      alert('La cantidad debe ser mayor a cero.');
      return;
    }

    if (this.tipoVenta === 'Bolsa' && this.cantidadAAgregar > prod.stockBolsas) {
      alert(`Stock insuficiente. Solo quedan ${prod.stockBolsas} bolsas cerradas.`);
      return;
    }

    if (this.tipoVenta === 'Kilo' && this.cantidadAAgregar > prod.stockKilosSueltos) {
      alert(`Stock insuficiente. Solo quedan ${prod.stockKilosSueltos} kg sueltos.`);
      return;
    }

    const precioUnitario = this.tipoVenta === 'Bolsa' ? prod.precioBolsa : prod.precioKilo;
    const subtotal = this.cantidadAAgregar * precioUnitario;

    const itemExistente = this.carrito.find(item => item.producto.id === prod.id && item.tipo === this.tipoVenta);

    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + this.cantidadAAgregar;
      if (this.tipoVenta === 'Bolsa' && nuevaCantidad > prod.stockBolsas) {
        alert('No podés agregar esa cantidad, supera el stock disponible.');
        return;
      }
      if (this.tipoVenta === 'Kilo' && nuevaCantidad > prod.stockKilosSueltos) {
        alert('No podés agregar esa cantidad, supera el stock disponible.');
        return;
      }
      itemExistente.cantidad = nuevaCantidad;
      itemExistente.subtotal = itemExistente.cantidad * precioUnitario;
    } else {
      this.carrito.push({
        producto: prod,
        tipo: this.tipoVenta,
        cantidad: this.cantidadAAgregar,
        subtotal: subtotal
      });
    }

    this.calcularTotal();
    this.cantidadAAgregar = 1;
  }

  public eliminarItem(index: number): void {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  public calcularTotal(): void {
    this.totalVenta = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
  }

  public confirmarVenta(): void {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    this.carrito.forEach(item => {
      const prodOriginal = this.productos.find(p => p.id === item.producto.id);
      if (prodOriginal) {
        if (item.tipo === 'Bolsa') {
          prodOriginal.stockBolsas -= item.cantidad;
        } else {
          prodOriginal.stockKilosSueltos -= item.cantidad;
        }
      }
    });

    alert('Venta registrada con éxito. Se descontó la mercadería del stock.');
    this.carrito = [];
    this.totalVenta = 0;
  }
}