-- DIAGRAMA 1 (ANTES - SIN ÍNDICES)
-- Nodos Sequential Scan identificados:
-- Nodo	Tabla	Costo total	Filas planificadas
-- #3 (Escaneo Seq)	detalle_venta	17.50	750
-- #6 (Escaneo Seq)	ventas	15.70	2

-- Nodos Index Scan identificados:
-- Nodo	Tabla	Índice	Costo total
-- #8	clientes	clientes_pkey	2.36
-- #9	productos	productos_pkey	0.18

-- Nodo más costoso:
-- Escaneo Seq en detalle_venta (costo 17.50) - escanea 750 filas sin ningún índice, lo que genera el mayor impacto en el plan.

-- Problemas detectados:
-- - La tabla detalle_venta no tiene índice en id_venta, provocando un Sequential Scan costoso.
-- - La tabla ventas no tiene índice en fecha, obligando a escanear toda la tabla.
-- - Solo clientes y productos usan índices.

-- ========================================

-- DIAGRAMA 2 (DESPUÉS - CON ÍNDICES CREADOS)

-- Índices creados:
-- CREATE INDEX idx_ventas_fecha ON ventas(fecha);
-- CREATE INDEX idx_clientes_dni ON clientes(dni_cuit);
-- CREATE INDEX idx_detalle_venta_id_venta ON detalle_venta(id_venta);
-- CREATE INDEX idx_detalle_venta_id_producto ON detalle_venta(id_producto);

-- Nodos Sequential Scan identificados:
-- Nodo	Tabla	Costo total	Observación
-- #4 (Seq Scan)	clientes	1.01	Barato (solo 1 fila por filtro dni_cuit)

-- Nodos Index Scan / Bitmap Index Scan identificados:
-- Nodo	Tabla	Índice	Costo total
-- #6 (Bitmap Index Scan)	ventas	idx_ventas_fecha	1.27
-- #8 (Bitmap Index Scan)	detalle_venta	idx_detalle_venta_id_venta	0.73
-- #9 (Index Scan)	productos	productos_pkey	0.18

-- Nodo más costoso:
-- Seq Scan en clientes (costo 1.01) - pero es un costo marginal, representa menos del 1% del total del plan.

-- Mejoras obtenidas:
-- - ventas: pasó de Seq Scan (costo 15.70) a Bitmap Index Scan (costo 1.27)
-- - detalle_venta: pasó de Seq Scan (costo 17.50) a Bitmap Index Scan (costo 0.73)
-- - clientes: sigue siendo Seq Scan pero con costo bajo (1.01) por el filtro específico

-- ========================================

-- COMPARATIVA FINAL

-- Tabla		ANTES			DESPUÉS				MEJORA
-- ventas		Seq Scan (15.70)	Bitmap Index Scan (1.27)	↓ 91%
-- detalle_venta	Seq Scan (17.50)	Bitmap Index Scan (0.73)	↓ 95%
-- clientes	Index Scan (2.36)	Seq Scan (1.01)			Neutro (ya era bajo)

-- Costo total del plan: ~41.17 → ~13.07 (↓ 68%)

-- ========================================

-- CONCLUSIÓN

-- Los índices creados eliminaron los Sequential Scans costosos en las tablas ventas y detalle_venta, reemplazándolos por Bitmap Index Scans. El plan de ejecución pasó de un costo total estimado de 41.17 a 13.07, una mejora del 68%. El único Sequential Scan remanente (en clientes) es barato porque filtra por dni_cuit = 12345678 y solo procesa una fila.