-- QUERY PLANNER
-- ============================================

-- 1. CONSULTA BASE (sin índices)
EXPLAIN ANALYZE
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

-- 2. CREACIÓN DE ÍNDICES
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_clientes_dni ON clientes(dni_cuit);
CREATE INDEX idx_detalle_venta_id_venta ON detalle_venta(id_venta);
CREATE INDEX idx_detalle_venta_id_producto ON detalle_venta(id_producto);

-- 3. CONSULTA CON ÍNDICES (después)
EXPLAIN ANALYZE
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