import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductoForrajería {
  id?: string | number;
  nombre: string;
  categoria: string;
  stockBolsas: number;
  pesoPorBolsaKg: number;
  stockKilosSueltos: number;
  stockMinimoBolsas: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/productos';

  public getProductos(): Observable<ProductoForrajería[]> {
    return this.http.get<ProductoForrajería[]>(this.apiUrl);
  }

  public crearProducto(producto: ProductoForrajería): Observable<ProductoForrajería> {
    return this.http.post<ProductoForrajería>(this.apiUrl, producto);
  }

  public procesarAjuste(id: string | number, datosAjuste: { tipo: string, cantidad: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/ajuste/${id}`, datosAjuste);
  }
}