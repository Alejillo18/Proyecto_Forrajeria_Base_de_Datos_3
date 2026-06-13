import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DetalleVenta {
  productoId: string | number;
  tipo: 'Bolsa' | 'Kilo';
  cantidad: number;
}

export interface VentaRequest {
  items: DetalleVenta[];
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/ventas';

  public registrarVenta(venta: VentaRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, venta);
  }
}