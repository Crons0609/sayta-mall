-- ============================================================================
-- SAYTA MALL — MIGRACIÓN: Empresas de Delivery & Envíos Locales
-- Archivo: 001_create_delivery_companies.sql
-- Motor: PostgreSQL / MySQL / Supabase / Neon / Render Postgres
-- ============================================================================

-- 1. Tabla de Empresas de Delivery
CREATE TABLE IF NOT EXISTS empresas_delivery (
    id VARCHAR(64) PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    whatsapp VARCHAR(25) NOT NULL,
    telefono VARCHAR(25),
    email VARCHAR(120),
    zonas_cobertura JSONB DEFAULT '[]'::jsonb,  -- Array de zonas: ["Chichigalpa", "Chinandega"]
    costo_envio NUMERIC(10, 2) DEFAULT 0.00,
    logo TEXT,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    orders_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_empresas_delivery_estado ON empresas_delivery(estado);
CREATE INDEX IF NOT EXISTS idx_empresas_delivery_deleted ON empresas_delivery(deleted);

-- 2. Modificación de la tabla Pedidos (Orders)
-- Agrega columnas de integración con delivery y canal de compra
DO $$
BEGIN
    -- Añadir columna empresa_delivery_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'empresa_delivery_id'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN empresa_delivery_id VARCHAR(64) REFERENCES empresas_delivery(id);
    END IF;

    -- Añadir canal_pedido ('web' o 'whatsapp')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'canal_pedido'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN canal_pedido VARCHAR(20) DEFAULT 'web';
    END IF;

    -- Añadir costo_envio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'costo_envio'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN costo_envio NUMERIC(10, 2) DEFAULT 0.00;
    END IF;

    -- Añadir direccion_entrega
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'direccion_entrega'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN direccion_entrega TEXT;
    END IF;

    -- Añadir referencias_entrega
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'referencias_entrega'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN referencias_entrega TEXT;
    END IF;
END $$;

-- 3. Empresas de prueba iniciales (Semilla de datos)
INSERT INTO empresas_delivery (
    id, nombre, whatsapp, telefono, email, zonas_cobertura, costo_envio, logo, estado, deleted
) VALUES 
(
    'del-sayta-express', 
    'Sayta Express Repartos', 
    '+50588881234', 
    '23456789', 
    'envios@saytamall.com', 
    '["Chichigalpa Centro", "Reparto San Antonio", "Zona Ingenio"]'::jsonb, 
    50.00, 
    'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=150&q=80', 
    TRUE, 
    FALSE
),
(
    'del-flash-occidente', 
    'Flash Delivery Occidente', 
    '+50587654321', 
    '23451122', 
    'flash.occidente@delivery.com', 
    '["Chichigalpa", "Chinandega", "Posoltega", "Corinto"]'::jsonb, 
    60.00, 
    'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=150&q=80', 
    TRUE, 
    FALSE
)
ON CONFLICT (id) DO NOTHING;
