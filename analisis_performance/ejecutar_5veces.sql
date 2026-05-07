-- Script para ejecutar la consulta directamente 100 veces
SET client_encoding = 'UTF8';

-- Ejecutar la consulta exacta muchas veces
SELECT 'Ejecutando consulta principal 100 veces...' AS mensaje;

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

-- Ejecución 2
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
