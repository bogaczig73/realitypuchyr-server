const validateProperty = (req, res, next) => {
    const { name, price } = req.body;
    const errors = [];

    // Validate required fields
    if (!name) {
        errors.push('Name is required');
    }

    if (!price) {
        errors.push('Price is required');
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        errors.push('Price must be a positive number');
    }

    // If there are any errors, return them
    if (errors.length > 0) {
        console.log('Validation errors:', errors);
        console.log('Request body:', req.body);
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors
        });
    }

    next();
};

module.exports = {
    validateProperty
}; 