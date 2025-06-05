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

module.exports = {
    validateProperty
}; 