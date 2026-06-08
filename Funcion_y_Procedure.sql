-- ============================================
-- Script: modificar_procedimiento_con_logs.sql
-- Descripción: Reemplazar el bloque EXCEPTION del procedimiento
--              pr_registrar_venta con la nueva versión que registra
--              errores en audit_logs antes de hacer ROLLBACK.
-- ============================================

-- Creación del tipo compuesto para items del carrito (idempotente)
DO $$ BEGIN
    CREATE TYPE tipo_item_carrito AS (
        id_producto UUID,
        cantidad DECIMAL(12,2)
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION fn_obtener_precio_producto(
    p_id_producto productos.id_producto%TYPE
)
RETURNS productos.precio_venta%TYPE
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_precio productos.precio_venta%TYPE;
BEGIN
    SELECT precio_venta INTO v_precio
    FROM productos
    WHERE id_producto = p_id_producto;
    
    RETURN COALESCE(v_precio, 0.00);
END;
$$;

CREATE OR REPLACE PROCEDURE pr_registrar_venta(
    p_id_cliente clientes.id_cliente%TYPE,
    p_id_vendedor vendedores.id_vendedor%TYPE,
    p_metodo_pago ventas.metodo_pago%TYPE,
    p_items tipo_item_carrito[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id_venta ventas.id_venta%TYPE;
    v_total ventas.total%TYPE := 0.00;
    v_item tipo_item_carrito;
    v_precio productos.precio_venta%TYPE;
BEGIN
    -- Establecer punto de guardado para poder recuperarnos ante fallos

    -- Crear la cabecera de venta
    INSERT INTO ventas (id_cliente, id_vendedor, metodo_pago, total)
    VALUES (p_id_cliente, p_id_vendedor, p_metodo_pago, 0)
    RETURNING id_venta INTO v_id_venta;

    -- Procesar cada item del carrito
    FOREACH v_item IN ARRAY p_items
    LOOP
        -- Obtener el precio del producto desde la tabla productos
        v_precio := fn_obtener_precio_producto(v_item.id_producto);

        -- Insertar detalle de venta
        INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
        VALUES (v_id_venta, v_item.id_producto, v_item.cantidad, v_precio, v_item.cantidad * v_precio);

        -- Actualizar el total acumulado
        v_total := COALESCE(v_total, 0) + (v_item.cantidad * v_precio);
    END LOOP;

    -- Actualizar el total de la venta
    UPDATE ventas SET total = v_total WHERE id_venta = v_id_venta;

    -- Confirmar la operacion

EXCEPTION
    WHEN OTHERS THEN
        
        DECLARE
            v_sqlstate TEXT;
            v_mensaje TEXT;
        BEGIN
            GET STACKED DIAGNOSTICS 
                v_sqlstate = RETURNED_SQLSTATE,
                v_mensaje = MESSAGE_TEXT;
            
            INSERT INTO audit_logs (
                sqlstate,
                mensaje_error,
                procedimiento,
                parametros
            ) VALUES (
                v_sqlstate,
                v_mensaje,
                'pr_registrar_venta',
                jsonb_build_object(
                    'p_id_cliente', p_id_cliente,
                    'p_id_vendedor', p_id_vendedor,
                    'p_metodo_pago', p_metodo_pago,
                    'p_items', p_items::text
                )
            );
        END;
        
        
        
        RAISE EXCEPTION 'Error en el proceso de venta: %', SQLERRM;
END;
$$;

--TRIGGER PARA VALIDAR EL DETALLE DE LA VENTA: 

CREATE OR REPLACE FUNCTION fn_tg_validar_detalle_venta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_stock_actual productos.stock%TYPE;
BEGIN
    IF NEW.cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad vendida debe ser mayor a cero. Producto ID: %', NEW.id_producto;
    END IF;
    SELECT stock INTO v_stock_actual
    FROM productos
    WHERE id_producto = NEW.id_producto;
    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto ID: %. Stock disponible: %, Solicitado: %', 
            NEW.id_producto, v_stock_actual, NEW.cantidad;
    END IF;
    UPDATE productos 
    SET stock = stock - NEW.cantidad 
    WHERE id_producto = NEW.id_producto;
    RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER tg_before_detalle_ventas
BEFORE INSERT ON detalle_ventas
FOR EACH ROW
EXECUTE FUNCTION fn_tg_validar_detalle_venta();