--top 5 proveedores mas importantes que tenemos:
WITH ConteoProveedores AS (
    SELECT 
        p.nombre_empresa,
        SUM(dv.cantidad) as total_unidades_vendidas,
        COUNT(dv.id_producto) as cantidad_operaciones,
        DENSE_RANK() OVER (ORDER BY SUM(dv.cantidad) DESC) as ranking
    FROM proveedores p
    JOIN productos pr ON p.id_proveedor = pr.id_proveedor
    JOIN detalle_venta dv ON pr.id_producto = dv.id_producto
    GROUP BY p.id_proveedor, p.nombre_empresa
)
SELECT 
    ranking,
    nombre_empresa,
    total_unidades_vendidas,
    cantidad_operaciones
FROM ConteoProveedores
WHERE ranking <= 5
ORDER BY ranking ASC;



-- Top 3 de vendedores, quitando el vendedor de mostrador, para obtener los mejores distribuidores (facturas emitidas)
WITH RankingVendedores AS (
    SELECT 
        v.nombre_vendedor,
        COUNT(vnt.id_venta) as cantidad_ventas,
        SUM(vnt.total) as facturacion_total,
        RANK() OVER (ORDER BY COUNT(vnt.id_venta) DESC) as puesto
    FROM vendedores v
    JOIN ventas vnt ON v.id_vendedor = vnt.id_vendedor
    WHERE v.nombre_vendedor <> 'mostrador'
      AND v.id_vendedor <> '00000000-0000-0000-0000-000000000000'
    GROUP BY v.id_vendedor, v.nombre_vendedor
)
SELECT 
    puesto,
    nombre_vendedor,
    cantidad_ventas,
    facturacion_total
FROM RankingVendedores
WHERE puesto <= 3
ORDER BY puesto ASC;


-- ahora rankeados por dinero generado:
WITH RankingFinanciero AS (
    SELECT 
        v.nombre_vendedor,
        SUM(vnt.total) as facturacion_total,
        COUNT(vnt.id_venta) as cantidad_operaciones,
        DENSE_RANK() OVER (ORDER BY SUM(vnt.total) DESC) as puesto
    FROM vendedores v
    JOIN ventas vnt ON v.id_vendedor = vnt.id_vendedor
    WHERE v.nombre_vendedor <> 'mostrador'
      AND v.id_vendedor <> '00000000-0000-0000-0000-000000000000'
    GROUP BY v.id_vendedor, v.nombre_vendedor
)
SELECT 
    puesto,
    nombre_vendedor,
    facturacion_total,
    cantidad_operaciones
FROM RankingFinanciero
WHERE puesto <= 3
ORDER BY puesto ASC;


-- ranking mensual de los 5 clientes con mas compras (los clientes registrados): 
WITH ComprasClientesMes AS (
    SELECT 
        c.nombre_cliente,
        c.email,
        SUM(v.total) as monto_total_invertido,
        COUNT(v.id_venta) as cantidad_compras,
        DENSE_RANK() OVER (ORDER BY SUM(v.total) DESC) as puesto
    FROM clientes c
    JOIN ventas v ON c.id_cliente = v.id_cliente
    WHERE v.fecha >= date_trunc('month', CURRENT_DATE)
      AND v.fecha < date_trunc('month', CURRENT_DATE) + interval '1 month'
      AND c.id_cliente <> '00000000-0000-0000-0000-000000000000'
    GROUP BY c.id_cliente, c.nombre_cliente, c.email
)
SELECT 
    puesto,
    nombre_cliente,
    email,
    monto_total_invertido,
    cantidad_compras
FROM ComprasClientesMes
WHERE puesto <= 5
ORDER BY puesto ASC;


-- para la segunda consigna vamos a modificar la tabla de vendedores, para jerarquizarlos

ALTER TABLE vendedores 
ADD COLUMN id_supervisor UUID;
ALTER TABLE vendedores
ADD CONSTRAINT fk_supervisor
FOREIGN KEY (id_supervisor) 
REFERENCES vendedores(id_vendedor)
ON DELETE SET NULL;

BEGIN;

-- Limpiamos la tabla
TRUNCATE TABLE vendedores CASCADE;

-- Insertamos el Nivel 1: El Jefe Máximo
INSERT INTO vendedores (id_vendedor, nombre_vendedor, comision_porcentaje, id_supervisor)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gerente General (Nivel 1)', 15.00, NULL);

--Supervisores
INSERT INTO vendedores (id_vendedor, nombre_vendedor, comision_porcentaje, id_supervisor)
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Supervisor Zona Norte (Nivel 2)', 8.00, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Supervisor Zona Sur (Nivel 2)', 8.00, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

--Vendedores/Distribuidores
INSERT INTO vendedores (id_vendedor, nombre_vendedor, comision_porcentaje, id_supervisor)
VALUES 
(gen_random_uuid(), 'Distribuidor Córdoba (Nivel 3)', 3.50, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
(gen_random_uuid(), 'Distribuidor Salta (Nivel 3)', 3.50, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
(gen_random_uuid(), 'Distribuidor Mendoza (Nivel 3)', 3.50, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
(gen_random_uuid(), 'Distribuidor Neuquén (Nivel 3)', 3.50, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33');

-- re-insertamos al vendedor 'mostrador'
INSERT INTO vendedores (id_vendedor, nombre_vendedor, activo, id_supervisor)
VALUES ('00000000-0000-0000-0000-000000000000', 'mostrador', TRUE, NULL);

COMMIT;


CREATE VIEW vista_organigrama AS
WITH RECURSIVE organigrama AS (
    SELECT id_vendedor, nombre_vendedor, id_supervisor, 1 as nivel
    FROM vendedores
    WHERE id_supervisor IS NULL
    UNION ALL
    SELECT v.id_vendedor, v.nombre_vendedor, v.id_supervisor, o.nivel + 1
    FROM vendedores v
    JOIN organigrama o ON v.id_supervisor = o.id_vendedor
)

SELECT * FROM vista_organigrama;