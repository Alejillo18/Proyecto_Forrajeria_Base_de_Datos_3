import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AuthService } from '../../../core/services/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.sass'
})
export class DashboardComponent implements OnInit {
  public authService: AuthService = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  public chartOptions: any;
  public stockCritico: any[] = [];
  public deudoresRecientes: any[] = [];
  
  public totalVentasMes = 0;
  public totalFiadoAcumulado = 0;
  public productosBajoStock = 0;
  public nuevoEmail = '';
  public nuevoPassword = '';
  public nuevoRol = 'Empleado';
  public mensajeExito = '';
  public mensajeError = '';

  ngOnInit(): void {
    this.inicializarGrafico();
    this.cargarDatosDashboard();
  }

  private inicializarGrafico(): void {
    this.chartOptions = {
      series: [{
        name: "Ventas Diarias ($)",
        data: [0, 0, 0, 0, 0, 0, 0]
      }],
      chart: {
        height: 320,
        type: "area",
        toolbar: { show: false },
        background: "transparent"
      },
      colors: ["#10b981"],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        labels: { style: { colors: "#94a3b8" } }
      },
      yaxis: {
        labels: { 
          style: { colors: "#94a3b8" },
          formatter: (val: number) => `$${val.toLocaleString('es-AR')}`
        }
      },
      grid: { borderColor: "#334155", strokeDashArray: 4 },
      theme: { mode: "dark" }
    };
  }

  private cargarDatosDashboard(): void {
    this.http.get('http://localhost:3000/api/reportes/dashboard').subscribe({
      next: (data: any) => {
        this.totalVentasMes = data.totalVentasMes || 0;
        this.totalFiadoAcumulado = data.totalFiadoAcumulado || 0;
        this.productosBajoStock = data.productosBajoStock || 0;
        this.stockCritico = data.stockCritico || [];
        this.deudoresRecientes = data.deudoresRecientes || [];

        if (data.ventasDiarias && data.ventasDiarias.length > 0) {
          this.chartOptions.series = [{
            name: "Ventas Diarias ($)",
            data: data.ventasDiarias
          }];
        }
        
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar las metricas del panel gerencial.';
        this.cdr.detectChanges();
      }
    });
  }

  public crearUsuario(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (!this.nuevoEmail || !this.nuevoPassword) {
      this.mensajeError = 'Por favor, completá todos los campos obligatorios.';
      this.cdr.detectChanges();
      return;
    }

    const payload = {
      email: this.nuevoEmail,
      password: this.nuevoPassword,
      rol: this.nuevoRol
    };

    this.authService.registrar(payload).subscribe({
      next: (res: any) => {
        this.mensajeExito = `Usuario ${res.email} registrado con éxito.`;
        this.nuevoEmail = '';
        this.nuevoPassword = '';
        this.nuevoRol = 'Empleado';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        if (err.error && typeof err.error === 'object' && err.error.message) {
          this.mensajeError = err.error.message;
        } else if (typeof err.error === 'string') {
          this.mensajeError = err.error;
        } else {
          this.mensajeError = 'Error al intentar crear el nuevo usuario.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}