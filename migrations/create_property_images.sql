CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id); 