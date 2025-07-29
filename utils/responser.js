const { successResponse, errorResponse } = require('share-utils');
function generateResonse( res, data) {
        if (!data || stocks.length === 0) {
            return errorResponse(res," No stocks found");
        }
        return successResponse(data, stocks);
    };

module.exports = {
    generateResonse
}