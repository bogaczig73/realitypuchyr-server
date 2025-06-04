updateState: async (id: number, status: 'ACTIVE' | 'SOLD'): Promise<Property> => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/properties/${id}/state`, { status });
        return transformProperty(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to update property status');
        }
        throw error;
    }
}, 