-- Insert sample property
INSERT INTO properties (
    name,
    category,
    status,
    ownershipType,
    description,
    city,
    street,
    country,
    size,
    beds,
    baths,
    price,
    layout,
    virtualTour,
    files
) VALUES (
    '10765 Hillshire Ave, Baton Rouge, LA 70810, USA',
    'HOUSE',
    'ACTIVE',
    'OWNERSHIP',
    'Beautiful modern house with great amenities',
    'Baton Rouge',
    'Hillshire Ave',
    'USA',
    '8000sqf',
    '4 Beds',
    '4 Baths',
    5000.00,
    'Modern',
    '<iframe src="https://example.com/virtual-tour" width="100%" height="400"></iframe>',
    '[]'
);

-- Insert sample property image
INSERT INTO property_images (
    url,
    isMain,
    property_id
) VALUES (
    'https://example.com/property1.jpg',
    true,
    1
); 