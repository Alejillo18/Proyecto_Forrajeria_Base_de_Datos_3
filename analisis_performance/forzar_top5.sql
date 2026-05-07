-- Script para forzar que la consulta aparezca en pg_stat_statements
SET client_encoding = 'UTF8';

-- Limpiar pg_stat_statements para empezar fresco
SELECT pg_stat_statements_reset();

-- Ejecutar variaciones de la consulta para que aparezca
-- Ejecución 1
SELECT 
    c.nombre_cliente,
    c.email,
    v.fecha,
    v.total,
    v.metodo_pago,
    p.nombre_producto,
    dv.cantidad,
    dv.precio_unitario_historico
FROM ventas v
JOIN clientes c ON c.id_cliente = v.id_cliente
JOIN detalle_venta dv ON dv.id_venta = v.id_venta
JOIN productos p ON p.id_producto = dv.id_producto
WHERE v.fecha BETWEEN '2024-01-01' AND '2024-12-31'
  AND c.dni_cuit = 12345678;

-- Ejecución 2 (con hint para evitar caché)
SELECT /*+ NO_CACHE */ 
    c.nombre_cliente,
    c.email,
    v.fecha,
    v.total,
    v.metodo_pago,
    p.nombre_producto,
    dv.cantidad,
    dv.precio_unitario_historico
FROM ventas v
JOIN clientes c ON c.id_cliente = v.id_cliente
JOIN detalle_venta dv ON dv.id_venta = v.id_venta
JOIN productos p ON p.id_producto = dv.id_producto
WHERE v.fecha BETWEEN '2024-01-01' AND '2024-12-31'
  AND c.dni_cuit = 12345678;

-- Ejecución 3
SELECT 
    c.nombre_cliente,
    c.email,
    v.fecha,
    v.total,
    v.metodo_pago,
    p.nombre_producto,
    dv.cantidad,
    dv.precio_unitario_historico
FROM ventas v
JOIN clientes c ON c.id_cliente = v.id_cliente
JOIN detalle_venta dv ON dv.id_venta = v.id_venta
JOIN productos p ON p.id_producto = dv.id_producto
WHERE v.fecha BETWEEN '2024-01-01' AND '2024-12-31'
  AND c.dni_cuit = 12345678;

-- Ejecución 4
SELECT 
    c.nombre_cliente,
    c.email,
    v.fecha,
    v.total,
    v.metodo_pago,
    p.nombre_producto,
    dv.cantidad,
    dv.precio_unitario_historico
FROM ventas v
JOIN clientes c ON c.id_cliente = v.id_cliente
JOIN detalle_venta dv ON dv.id_venta = v.id_venta
JOIN productos p ON p.id_producto = dv.id_producto
WHERE v.fecha BETWEEN '2024-01-01' AND '2024-12-31'
  AND c.dni_cuit = 12345678;

-- Ejecución 5
SELECT 
    c.nombre_cliente,
    c.email,
    v.fecha,
    v.total,
    v.metodo_pago,
    p.nombre_producto,
    dv.cantidad,
    dv.precio_unitario_historico
FROM ventas v
JOIN clientes c ON c.id_cliente = v.id_cliente
JOIN detalle_venta dv ON dv.id_venta = v.id_venta
JOIN productos p ON p.id_producto = dv.id_producto
WHERE v.fecha BETWEEN '2024-01-01' AND '2024-12-31'
  AND c.dni_cuit = 12345678;

-- Mostrar top 5
SELECT 
    left(query, 80) AS query_short,
    calls,
    total_exec_time::int AS total_time_ms,
    mean_exec_time::numeric(10,3) AS avg_time_ms,
    rows
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;
