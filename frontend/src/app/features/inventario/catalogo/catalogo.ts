import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ProductoForrajeria {
  id: string;
  sku: string;
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
  
  private http = inject(HttpClient);

  public productos: ProductoForrajeria[] = [];

  public mostrarModalFraccionar = false;
  public mostrarModalCargarStock = false;
  public mostrarModalNuevoProducto = false;

  public productoSeleccionado: ProductoForrajeria | null = null;
  public cantidadBolsasAFraccionar = 1;

  public idProductoACargar: string | null = null;
  public cantidadBolsasACargar = 1;

  public nuevoProducto = {
    nombre: '',
    categoria: 'Caninos',
    stockBolsas: 0,
    pesoPorBolsaKg: 20,
    stockMinimoBolsas: 2
  };

  ngOnInit(): void {
    this.cargarProductos();
  }

  public cargarProductos(): void {
    this.http.get('http://localhost:8080/api/productos').subscribe({
      next: (res: any) => {
        const data = res.datos || [];
        this.productos = data.map((p: any) => ({
          id: p._id,
          sku: p.sku,
          nombre: p.nombre_producto,
          categoria: 'General',
          stockBolsas: p.stock_bolsas_cerradas || 0,
          pesoPorBolsaKg: p.peso_bolsa_kg || 0,
          stockKilosSueltos: p.stock_kilos_granel || 0,
          stockMinimoBolsas: p.stock_minimo || 0
        }));
      },
      error: () => {
        alert('Ocurrió un error al intentar cargar el inventario desde la base de datos.');
      }
    });
  }

  public get productosCriticos(): ProductoForrajeria[] {
    return this.productos.filter(p => p.stockBolsas <= p.stockMinimoBolsas);
  }

  public abrirModalFraccionamiento(producto: ProductoForrajeria): void {
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

    const productoTarget = this.productoSeleccionado;
    const kilosASumar = this.cantidadBolsasAFraccionar * productoTarget.pesoPorBolsaKg;
    
    const payload = {
      stock_bolsas_cerradas: productoTarget.stockBolsas - this.cantidadBolsasAFraccionar,
      stock_kilos_granel: productoTarget.stockKilosSueltos + kilosASumar
    };

    this.http.put(`http://localhost:8080/api/productos/${productoTarget.id}`, payload).subscribe({
      next: () => {
        alert(`Fraccionamiento exitoso: Se descontaron ${this.cantidadBolsasAFraccionar} bolsas y se sumaron ${kilosASumar} kg al stock suelto.`);
        this.cargarProductos();
        this.cerrarModales();
      },
      error: () => {
        alert('Hubo un error al intentar fraccionar el producto en la base de datos.');
      }
    });
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

    const productoTarget = this.productos.find(p => p.id === this.idProductoACargar);
    
    if (productoTarget) {
      const payload = {
        stock_bolsas_cerradas: productoTarget.stockBolsas + this.cantidadBolsasACargar
      };

      this.http.put(`http://localhost:8080/api/productos/${productoTarget.id}`, payload).subscribe({
        next: () => {
          alert(`Stock actualizado: Se sumaron ${this.cantidadBolsasACargar} bolsas a "${productoTarget.nombre}".`);
          this.cargarProductos();
          this.cerrarModales();
        },
        error: () => {
          alert('Hubo un error al intentar ingresar el stock en la base de datos.');
        }
      });
    }
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

    const payload = {
      sku: 'CAT-' + Math.floor(Math.random() * 90000 + 10000).toString(),
      nombre_producto: this.nuevoProducto.nombre,
      peso_bolsa_kg: this.nuevoProducto.pesoPorBolsaKg,
      stock_bolsas_cerradas: this.nuevoProducto.stockBolsas,
      stock_kilos_granel: 0,
      stock_minimo: this.nuevoProducto.stockMinimoBolsas
    };

    this.http.post('http://localhost:8080/api/productos', payload).subscribe({
      next: () => {
        alert(`Producto "${this.nuevoProducto.nombre}" creado exitosamente en el catálogo.`);
        this.cargarProductos();
        this.cerrarModales();
      },
      error: (err: any) => {
        const msj = err.error?.message || 'Error al conectar con la base de datos.';
        alert(`No se pudo crear el producto: ${msj}`);
      }
    });
  }
}