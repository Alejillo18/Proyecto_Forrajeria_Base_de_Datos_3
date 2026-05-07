-- SCRIPT FINAL COMPLETO
-- Ejecutar en psql: psql -U postgres -d forrajeria_2 -f script_final.sql

SET client_encoding = 'UTF8';

-- ========================================
-- 1. LIMPIAR ÍNDICES EXISTENTES
-- ========================================
DROP INDEX IF EXISTS idx_ventas_fecha;
DROP INDEX IF EXISTS idx_clientes_dni;
DROP INDEX IF EXISTS idx_detalle_venta_id_venta;
DROP INDEX IF EXISTS idx_detalle_venta_id_producto;

-- ========================================
-- 2. EXPLAIN ANTES DE ÍNDICES
-- ========================================
\echo '========================================'
\echo 'EXPLAIN ANALYZE - SIN INDICES'
\echo '========================================'

EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
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

-- ========================================
-- 3. CREAR ÍNDICES
-- ========================================
\echo '========================================'
\echo 'CREANDO INDICES...'
\echo '========================================'

CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_clientes_dni ON clientes(dni_cuit);
CREATE INDEX idx_detalle_venta_id_venta ON detalle_venta(id_venta);
CREATE INDEX idx_detalle_venta_id_producto ON detalle_venta(id_producto);

-- ========================================
-- 4. EXPLAIN DESPUÉS DE ÍNDICES
-- ========================================
\echo '========================================'
\echo 'EXPLAIN ANALYZE - CON INDICES'
\echo '========================================'

EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
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

-- ========================================
-- 5. EJECUTAR CONSULTA 100 VECES PARA PG_STAT_STATEMENTS
-- ========================================
\echo '========================================'
\echo 'EJECUTANDO CONSULTA 100 VECES...'
\echo '========================================'

DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..100 LOOP
        PERFORM 
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
    END LOOP;
END $$;

-- ========================================
-- 6. MOSTRAR TOP 5 CONSULTAS
-- ========================================
\echo '========================================'
\echo 'TOP 5 CONSULTAS (pg_stat_statements)'
\echo '========================================'

SELECT 
    left(query, 100) AS query_short,
    calls,
    total_exec_time::int AS total_time_ms,
    mean_exec_time::numeric(10,3) AS avg_time_ms,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 5;

\echo '========================================'
\echo 'ANALISIS COMPLETADO'
\echo '========================================'
