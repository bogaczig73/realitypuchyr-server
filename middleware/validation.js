const validateProperty = (req, res, next) => {
    // If the request body has a data field containing stringified JSON, parse it
    if (req.body.data) {
        try {
            req.body = JSON.parse(req.body.data);
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid request body format',
                details: 'The data field must contain valid JSON'
            });
        }
    }

    // Validate required fields
    const requiredFields = ['name', 'price', 'categoryId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: 'Missing required fields',
            details: missingFields.map(field => `${field} is required`)
        });
    }

    next();
};

const validatePropertyUpdate = (req, res, next) => {
    // If the request body has a data field containing stringified JSON, parse it
    if (req.body.data) {
        try {
            req.body = JSON.parse(req.body.data);
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid request body format',
                details: 'The data field must contain valid JSON'
            });
        }
    }

    // For updates, we only validate that at least one field is provided
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: 'No fields to update',
            details: 'At least one field must be provided for update'
        });
    }

    // Validate data types for provided fields
    const errors = [];

    if (req.body.price !== undefined && (isNaN(req.body.price) || req.body.price < 0)) {
        errors.push('price must be a valid positive number');
    }

    if (req.body.discountedPrice !== undefined && (isNaN(req.body.discountedPrice) || req.body.discountedPrice < 0)) {
        errors.push('discountedPrice must be a valid positive number');
    }

    if (req.body.latitude !== undefined && (isNaN(req.body.latitude) || req.body.latitude < -90 || req.body.latitude > 90)) {
        errors.push('latitude must be a valid number between -90 and 90');
    }

    if (req.body.longitude !== undefined && (isNaN(req.body.longitude) || req.body.longitude < -180 || req.body.longitude > 180)) {
        errors.push('longitude must be a valid number between -180 and 180');
    }

    if (req.body.size !== undefined && (isNaN(req.body.size) || req.body.size < 0)) {
        errors.push('size must be a valid positive number');
    }

    if (req.body.beds !== undefined && (isNaN(req.body.beds) || req.body.beds < 0)) {
        errors.push('beds must be a valid positive number');
    }

    if (req.body.baths !== undefined && (isNaN(req.body.baths) || req.body.baths < 0)) {
        errors.push('baths must be a valid positive number');
    }

    if (req.body.categoryId !== undefined && (isNaN(req.body.categoryId) || req.body.categoryId < 1)) {
        errors.push('categoryId must be a valid positive number');
    }

    if (req.body.status !== undefined && !['ACTIVE', 'SOLD', 'RENT', 'SHOWCASE'].includes(req.body.status.toUpperCase())) {
        errors.push('status must be one of: ACTIVE, SOLD, RENT, SHOWCASE');
    }

    if (req.body.ownershipType !== undefined && !['RENT', 'OWNERSHIP'].includes(req.body.ownershipType.toUpperCase())) {
        errors.push('ownershipType must be one of: RENT, OWNERSHIP');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    next();
};

module.exports = {
    validateProperty,
    validatePropertyUpdate
}; 