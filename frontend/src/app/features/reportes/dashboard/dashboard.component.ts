import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.sass'
})
export class DashboardComponent implements OnInit {

  public chartOptions: any;

  public stockCritico: any[] = [];
  public deudoresRecientes: any[] = [];
  
  public totalVentasMes = 0;
  public totalFiadoAcumulado = 0;
  public productosBajoStock = 0;

  ngOnInit(): void {
    this.inicializarGrafico();
  }

  private inicializarGrafico(): void {
    this.chartOptions = {
      series: [{
        name: "Ventas Diarias ($)",
        data: []
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
}