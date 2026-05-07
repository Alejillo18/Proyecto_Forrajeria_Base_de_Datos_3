CREATE TABLE membresias(
id_membresia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
nombre_membresia VARCHAR(50) NOT NULL,
descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
puntos_minimos INT NOT NULL 
)

CREATE TABLE proveedores(
id_proveedor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
cuit BIGINT NOT NULL,
nombre_empresa VARCHAR(50) NOT NULL,
contacto_nombre VARCHAR(50),
telefono BIGINT
)


CREATE TABLE vendedores(
id_vendedor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
nombre_vendedor VARCHAR(50) NOT NULL,
comision_porcentaje DECIMAL(5,2) DEFAULT 0,
activo BOOLEAN DEFAULT true
)

CREATE TABLE clientes(
id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
nombre_cliente VARCHAR(50) NOT NULL,
dni_cuit BIGINT NOT NULL,
telefono BIGINT,
direccion VARCHAR(50),
email VARCHAR(256),
id_membresia UUID,
CONSTRAINT fk_membresia
      FOREIGN KEY(id_membresia) 
      REFERENCES membresias(id_membresia)
	  ON DELETE CASCADE ,
fecha_creacion DATE DEFAULT CURRENT_DATE
)

INSERT INTO clientes (id_cliente, nombre_cliente,dni_cuit, email) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Consumidor Final','00000000','ventas@anonimo.com');

INSERT INTO vendedores (id_vendedor,nombre_vendedor,activo)
VALUES('00000000-0000-0000-0000-000000000000','mostrador', True)

CREATE TABLE ventas(
id_venta UUID PRIMARY  KEY DEFAULT gen_random_uuid(),
fecha DATE DEFAULT CURRENT_DATE,
total DECIMAL(12,2) NOT NULL  ,
metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
id_cliente UUID DEFAULT '00000000-0000-0000-0000-000000000000',
--Por si el cliente no desea o no esta asociado, usamos un cliente fantasma con dicho uuid
--luego deberiamos crearlo
CONSTRAINT fk_cliente
	FOREIGN KEY(id_cliente)
	REFERENCES clientes(id_cliente)
	ON DELETE CASCADE ,
id_vendedor UUID DEFAULT '00000000-0000-0000-0000-000000000000',
--hacemos igual para los vendedores de mostrador, dichas ventas quedaran registradas bajo este id
CONSTRAINT fk_vendedor
FOREIGN KEY(id_vendedor)
REFERENCES vendedores(id_vendedor)
ON DELETE CASCADE 
)

CREATE TABLE productos(
id_producto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
sku VARCHAR(50) UNIQUE NOT NULL,
nombre_producto VARCHAR(50) NOT NULL,
descripcion_producto TEXT,
precio_costo DECIMAL(12,2),
precio_venta DECIMAL(12,2),
stock_actual DECIMAL(12,2) DEFAULT 0,
stock_minimo DECIMAL(12,2) DEFAULT 0,
unidad_medida VARCHAR(15),
id_proveedor UUID,
CONSTRAINT fk_proveedor
 	FOREIGN KEY(id_proveedor)
	REFERENCES proveedores(id_proveedor)
	ON DELETE CASCADE
)

CREATE TABLE envios(
id_envio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
direccion_entrega VARCHAR(50),
estado VARCHAR(20) DEFAULT 'Pendiente',
fecha_envio DATE NOT NULL,
id_venta UUID,
CONSTRAINT fk_venta
   FOREIGN KEY(id_venta)
   REFERENCES ventas(id_venta)
   ON DELETE CASCADE
)

CREATE TABLE detalle_venta(
id_detalle_venta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
cantidad DECIMAL(12,2) NOT NULL,
precio_unitario_historico DECIMAL(12,2) NOT NULL,
id_venta UUID,
	CONSTRAINT fk_venta
	FOREIGN KEY(id_venta)
	REFERENCES ventas(id_venta)
	ON DELETE CASCADE
	,
id_producto UUID,
	CONSTRAINT fk_producto
	FOREIGN KEY(id_producto)
	REFERENCES productos(id_producto)
	ON DELETE CASCADE
)