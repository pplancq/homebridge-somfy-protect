/**
 * Somfy Protect API Types
 */
/**
 * Homebridge API Error
 */
export class SomfyProtectApiError extends Error {
    statusCode;
    response;
    constructor(message, statusCode, response) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.name = 'SomfyProtectApiError';
    }
}
//# sourceMappingURL=types.js.map