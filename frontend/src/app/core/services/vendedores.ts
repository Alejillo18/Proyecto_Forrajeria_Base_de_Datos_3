import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendedoresService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/vendedores';

  public getVendedores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  public crearVendedor(payload: { nombre_vendedor: string; comision_porcentaje: number }): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  public actualizarVendedor(id: string | number, payload: { nombre_vendedor: string; comision_porcentaje: number; activo: boolean }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }
}