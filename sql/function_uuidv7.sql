CREATE OR REPLACE FUNCTION generate_uuidv7()
RETURNS uuid AS $$
DECLARE
    unix_time_ms BIGINT;
    uuid_bytes BYTEA;
BEGIN
    unix_time_ms := floor(extract(epoch from clock_timestamp()) * 1000)::BIGINT;
    uuid_bytes := gen_random_bytes(16);

    uuid_bytes := set_byte(uuid_bytes, 0, (unix_time_ms >> 40 & 255));
    uuid_bytes := set_byte(uuid_bytes, 1, (unix_time_ms >> 32 & 255));
    uuid_bytes := set_byte(uuid_bytes, 2, (unix_time_ms >> 24 & 255));
    uuid_bytes := set_byte(uuid_bytes, 3, (unix_time_ms >> 16 & 255));
    uuid_bytes := set_byte(uuid_bytes, 4, (unix_time_ms >> 8 & 255));
    uuid_bytes := set_byte(uuid_bytes, 5, (unix_time_ms & 255));

    uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
    uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);

    RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;