-- ESTRATEGIAS DE INDEXACIÓN - Forrajería
-- Alumno: Vicente Ybalo

-- ÍNDICES B-TREE

-- B-Tree en fecha de ventas (búsquedas por rango de fechas)
CREATE INDEX idx_btree_ventas_fecha
ON ventas USING BTREE (fecha);

-- B-Tree en fecha de creación de clientes
CREATE INDEX idx_btree_clientes_fecha_creacion
ON clientes USING BTREE (fecha_creacion);

-- B-Tree en fecha de envíos
CREATE INDEX idx_btree_envios_fecha_envio
ON envios USING BTREE (fecha_envio);

-- B-Tree en dni_cuit de clientes (búsquedas por rango numérico)
CREATE INDEX idx_btree_clientes_dni
ON clientes USING BTREE (dni_cuit);

-- B-Tree en total de ventas (filtros por rango de montos)
CREATE INDEX idx_btree_ventas_total
ON ventas USING BTREE (total);

-- ÍNDICES HASH

-- Hash en email de clientes (búsqueda exacta por email)
CREATE INDEX idx_hash_clientes_email
ON clientes USING HASH (email);

-- Hash en SKU de productos (búsqueda exacta por código)
CREATE INDEX idx_hash_productos_sku
ON productos USING HASH (sku);

-- Hash en descripción de productos (texto largo)
CREATE INDEX idx_hash_productos_descripcion
ON productos USING HASH (descripcion_producto);

-- Hash en método de pago de ventas (igualdad exacta)
CREATE INDEX idx_hash_ventas_metodo_pago
ON ventas USING HASH (metodo_pago);

-- Hash en estado de envíos (igualdad exacta)
CREATE INDEX idx_hash_envios_estado
ON envios USING HASH (estado);