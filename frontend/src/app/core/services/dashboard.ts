import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardResponse {
  totalVentasMes: number;
  totalFiadoAcumulado: number;
  productosBajoStock: number;
  stockCritico: Array<{
    id: string;
    producto: string;
    stockActual: number;
    stockMinimo: number;
    unidad: string;
  }>;
  deudoresRecientes: Array<{
    id: number;
    cliente: string;
    telefono: string;
    ultimaCompra: string;
    saldoDebe: number;
  }>;
  graficoVentasDiarias: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/reportes/dashboard';

  public getMetrics(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
  }
}