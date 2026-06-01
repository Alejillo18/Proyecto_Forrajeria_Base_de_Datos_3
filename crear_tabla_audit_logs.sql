CREATE TABLE audit_logs (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sqlstate TEXT,
    mensaje_error TEXT,
    procedimiento TEXT,
    parametros JSONB,
    usuario TEXT DEFAULT current_user
);
