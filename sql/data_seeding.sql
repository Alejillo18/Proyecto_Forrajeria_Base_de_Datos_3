INSERT INTO membresias(nombre_membresia,descuento_porcentaje,puntos_minimos)
SELECT 'Nombre membresia ' || i,
ROUND((random() * 100) :: numeric, 2),
FLOOR(random()*10001)::int
FROM generate_series(1,10) AS i;

INSERT INTO proveedores (cuit, nombre_empresa, contacto_nombre, telefono)
SELECT 
    (FLOOR(random() * 100000000000))::bigint,
    'Empresa ' || i,                           
    'Contacto ' || i,                          
    (FLOOR(random() * 10000000000))::bigint
FROM generate_series(1, 100000) AS i;

INSERT INTO vendedores (nombre_vendedor, comision_porcentaje, activo)
SELECT 
    'Vendedor ' || i,
	ROUND((random() * 100) :: numeric, 2),                                    
	random() > 0.5
FROM generate_series(1, 1000) AS i;

INSERT INTO clientes(nombre_cliente,dni_cuit,telefono,direccion,email,id_membresia,fecha_creacion)
SELECT
'Cliente ' || i,
(FLOOR(random() * 100000000))::bigint,
(FLOOR(random() * 10000000000))::bigint,
'Direccion ' || i,
'Email@falso  ' || i,
(SELECT id_membresia FROM membresias ORDER BY random() LIMIT 1),
(CURRENT_DATE - (random()*365)::int)
FROM generate_series(1,200000) AS i;

INSERT INTO productos (sku,nombre_producto,descripcion_producto, precio_costo,precio_venta, stock_actual, stock_minimo, unidad_medida, id_proveedor)
SELECT
    'SKU-' || LPAD(n::text, 6, '0') as sku,
    'Producto Modelo ' || n as nombre_producto,
    (SELECT string_agg(palabra, ' ') 
     FROM (
        SELECT (ARRAY['lorem', 'ipsum', 'calidad', 'premium', 'importado', 'nacional', 'duradero'])[floor(random() * 7 + 1)] as palabra
        FROM generate_series(1, 10)
     ) AS palabras_temp) || '.' as descripcion_producto,
    ROUND((random() * 1000)::numeric, 2) as precio_costo,
    ROUND((random() * 2000 + 1000)::numeric, 2) as precio_venta,
    ROUND((random() * 100)::numeric, 2) as stock_actual,
    ROUND((random() * 10)::numeric, 2) as stock_minimo,
    CASE
        WHEN r < 0.1 THEN 'Kilogramos'
        WHEN r < 0.3 THEN 'Litro'
        WHEN r < 0.6 THEN 'Onza'
        ELSE 'Libra'
    END as unidad_medida,
    (SELECT id_proveedor FROM proveedores TABLESAMPLE system(1) LIMIT 1)
   FROM (
    SELECT 
        n, 
        random() as r 
    FROM generate_series(1, 300000) AS n
) AS subconsulta;

INSERT INTO ventas(fecha,id_cliente,id_vendedor,total,metodo_pago)
SELECT
(CURRENT_DATE - (random()*365)::int),
(SELECT id_cliente FROM clientes TABLESAMPLE system(1) LIMIT 1),
(SELECT id_vendedor FROM vendedores TABLESAMPLE system(5) LIMIT 1),
ROUND((random()*1000000)::numeric,2),
	CASE
		WHEN r < 0.1 THEN 'Efectivo'
		WHEN r < 0.3 THEN 'QR'
		WHEN r < 0.6 THEN 'Debito'
		ELSE 'Credito'
	END
FROM(SELECT random() as r FROM generate_series(1, 500000)) AS i;

INSERT INTO envios (id_venta, direccion_entrega, estado,fecha_envio)
SELECT
(SELECT id_venta FROM ventas TABLESAMPLE system(1) LIMIT 1),
	'Direccion ' || i,
	CASE
		WHEN r < 0.1 THEN 'pendiente'
		WHEN r < 0.3 THEN 'despachado'
		WHEN r < 0.6 THEN 'en camino'
		ELSE 'entregado'
	END,
	(CURRENT_DATE - (random()*365)::int)
FROM (
    SELECT i, random() AS r 
    FROM generate_series(1, 100000) AS i
) AS subconsulta;

INSERT INTO detalle_venta(id_venta,id_producto,cantidad,precio_unitario_historico)
SELECT
(SELECT id_venta FROM ventas TABLESAMPLE system(1) LIMIT 1),
(SELECT id_producto FROM productos TABLESAMPLE system(1) LIMIT 1),
FLOOR((random()*100)::int),
ROUND((random()*100000)::numeric,2)
FROM generate_series(1,500000);