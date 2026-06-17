-- CreateTable
CREATE TABLE "membresias" (
    "id_membresia" UUID NOT NULL DEFAULT generate_uuidv7(),
    "nombre_membresia" VARCHAR(50) NOT NULL,
    "descuento_porcentaje" DECIMAL(5,2) DEFAULT 0,
    "puntos_minimos" INTEGER NOT NULL,

    CONSTRAINT "membresias_pkey" PRIMARY KEY ("id_membresia")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id_proveedor" UUID NOT NULL DEFAULT generate_uuidv7(),
    "cuit" BIGINT NOT NULL,
    "nombre_empresa" VARCHAR(50) NOT NULL,
    "contacto_nombre" VARCHAR(50),
    "telefono" BIGINT,
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id_proveedor")
);

-- CreateTable
CREATE TABLE "vendedores" (
    "id_vendedor" UUID NOT NULL DEFAULT generate_uuidv7(),
    "nombre_vendedor" VARCHAR(50) NOT NULL,
    "comision_porcentaje" DECIMAL(5,2) DEFAULT 0,
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "vendedores_pkey" PRIMARY KEY ("id_vendedor")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" UUID NOT NULL DEFAULT generate_uuidv7(),
    "nombre_cliente" VARCHAR(50) NOT NULL,
    "dni_cuit" BIGINT NOT NULL,
    "telefono" BIGINT,
    "direccion" VARCHAR(50),
    "email" VARCHAR(256),
    "id_membresia" UUID,
    "activo" BOOLEAN DEFAULT true,
    "fecha_creacion" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id_venta" UUID NOT NULL DEFAULT generate_uuidv7(),
    "fecha" DATE DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(12,2) NOT NULL,
    "metodo_pago" VARCHAR(50) DEFAULT 'Efectivo',
    "id_cliente" UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    "id_vendedor" UUID DEFAULT '00000000-0000-0000-0000-000000000000',

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id_venta")
);

-- CreateTable
CREATE TABLE "productos" (
    "id_producto" UUID NOT NULL DEFAULT generate_uuidv7(),
    "sku" VARCHAR(50) NOT NULL,
    "nombre_producto" VARCHAR(50) NOT NULL,
    "descripcion_producto" TEXT,
    "precio_costo" DECIMAL(12,2),
    "precio_venta" DECIMAL(12,2),
    "stock_actual" DECIMAL(12,2) DEFAULT 0,
    "stock_minimo" DECIMAL(12,2) DEFAULT 0,
    "unidad_medida" VARCHAR(15),
    "id_proveedor" UUID,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "envios" (
    "id_envio" UUID NOT NULL DEFAULT generate_uuidv7(),
    "direccion_entrega" VARCHAR(50),
    "estado" VARCHAR(20) DEFAULT 'Pendiente',
    "fecha_envio" DATE NOT NULL,
    "id_venta" UUID,

    CONSTRAINT "envios_pkey" PRIMARY KEY ("id_envio")
);

-- CreateTable
CREATE TABLE "detalle_venta" (
    "id_detalle_venta" UUID NOT NULL DEFAULT generate_uuidv7(),
    "cantidad" DECIMAL(12,2) NOT NULL,
    "precio_unitario_historico" DECIMAL(12,2) NOT NULL,
    "id_venta" UUID,
    "id_producto" UUID,

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("id_detalle_venta")
);

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "fk_membresia" FOREIGN KEY ("id_membresia") REFERENCES "membresias"("id_membresia") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "fk_cliente" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "fk_vendedor" FOREIGN KEY ("id_vendedor") REFERENCES "vendedores"("id_vendedor") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "fk_proveedor" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores"("id_proveedor") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "fk_venta" FOREIGN KEY ("id_venta") REFERENCES "ventas"("id_venta") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "fk_venta" FOREIGN KEY ("id_venta") REFERENCES "ventas"("id_venta") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "fk_producto" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE NO ACTION;
