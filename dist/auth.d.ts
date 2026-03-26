import type { Logging } from 'homebridge';
/**
 * Handles authentication and token management for Somfy Protect API
 */
export declare class SomfyProtectAuth {
    private readonly log;
    private readonly username;
    private readonly password;
    private token;
    private readonly tokenPath;
    private readonly axios;
    constructor(log: Logging, username: string, password: string, storagePath: string);
    /**
     * Load token from persistent storage
     */
    private loadToken;
    /**
     * Save token to persistent storage
     */
    private saveToken;
    /**
     * Check if current token is expired (with 60 second buffer)
     */
    private isTokenExpired;
    /**
     * Request a new access token
     */
    private requestNewToken;
    /**
     * Refresh the access token using refresh token
     */
    private refreshToken;
    /**
     * Get a valid access token (refreshes if needed)
     */
    getAccessToken(): Promise<string>;
    /**
     * Force a token refresh (useful for error recovery)
     */
    forceRefresh(): Promise<void>;
    /**
     * Clear cached token (useful for troubleshooting)
     */
    clearToken(): void;
}
