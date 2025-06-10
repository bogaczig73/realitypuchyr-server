const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'API key is required',
            message: 'Please provide an API key in the X-API-Key header'
        });
    }

    // Get the valid API key from environment variables
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
        console.error('API_KEY environment variable is not set');
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'API key validation is not properly configured'
        });
    }

    if (apiKey !== validApiKey) {
        return res.status(403).json({
            error: 'Invalid API key',
            message: 'The provided API key is not valid'
        });
    }

    next();
};

module.exports = validateApiKey; 