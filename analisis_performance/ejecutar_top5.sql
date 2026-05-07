-- Script para ejecutar la consulta muchas veces
SET client_encoding = 'UTF8';

-- Ejecutar la consulta 150 veces usando un approach diferente
SELECT 'Iniciando ejecuciones...' AS mensaje;

DO $$
DECLARE
    i INTEGER;
    rec RECORD;
BEGIN
    FOR i IN 1..150 LOOP
        FOR rec IN 
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
              AND c.dni_cuit = 12345678
        LOOP
            -- Solo iterar, no hacer nada
            NULL;
        END LOOP;
    END LOOP;
END $$;

SELECT 'Ejecuciones completadas' AS mensaje;

-- Mostrar top 5
SELECT 
    left(query, 80) AS query_short,
    calls,
    total_exec_time::int AS total_time_ms,
    mean_exec_time::numeric(10,3) AS avg_time_ms,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 5;
