CREATE OR REPLACE FUNCTION calcular_total_efectivo_turno(
    p_id_usuario INT,
    p_fecha_apertura TIMESTAMP
)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    v_total_efectivo DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(dv.cantidad * dv.precio_unitario_historico), 0.00)
    INTO v_total_efectivo
    FROM ventas v
    JOIN detalle_venta dv ON v.id_venta = dv.id_venta
    WHERE v.id_usuario = p_id_usuario
      AND v.metodo_pago = 'efectivo'
      AND v.fecha >= p_fecha_apertura;
    RETURN v_total_efectivo;
END;
$$ LANGUAGE plpgsql;