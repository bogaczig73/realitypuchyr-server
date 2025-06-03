-- Create properties table if it doesn't exist
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    sqf VARCHAR(50) NOT NULL,
    beds VARCHAR(50) NOT NULL,
    baths VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    layout VARCHAR(255),
    virtual_tour TEXT,
    files JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data if table is empty
INSERT INTO properties (name, image, sqf, beds, baths, price, layout, virtual_tour, files)
SELECT 
    '10765 Hillshire Ave, Baton Rouge, LA 70810, USA',
    'https://example.com/property1.jpg',
    '8000sqf',
    '4 Beds',
    '4 Baths',
    5000.00,
    'Modern',
    '<iframe src="https://example.com/virtual-tour" width="100%" height="400"></iframe>',
    '[]'
WHERE NOT EXISTS (SELECT 1 FROM properties LIMIT 1); 