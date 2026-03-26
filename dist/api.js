import axios from 'axios';
import axiosRetry from 'axios-retry';
import { API_CONFIG, POLLING_CONFIG } from './settings.js';
import { SomfyProtectAuth } from './auth.js';
import { SomfyProtectApiError, } from './types.js';
/**
 * Somfy Protect API Client
 */
export class SomfyProtectApi {
    log;
    axios;
    auth;
    constructor(log, username, password, storagePath) {
        this.log = log;
        this.auth = new SomfyProtectAuth(log, username, password, storagePath);
        // Create axios instance
        this.axios = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Homebridge-Somfy-Protect',
            },
        });
        // Configure retry logic
        axiosRetry(this.axios, {
            retries: POLLING_CONFIG.MAX_RETRY_ATTEMPTS,
            retryDelay: (retryCount) => {
                return retryCount * POLLING_CONFIG.RETRY_DELAY;
            },
            retryCondition: (error) => {
                // Retry on network errors and 5xx status codes
                return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                    (error.response?.status ?? 0) >= 500;
            },
            onRetry: (retryCount, error) => {
                this.log.debug(`Retry attempt ${retryCount} after error:`, error.message);
            },
        });
        // Request interceptor to add auth token
        this.axios.interceptors.request.use(async (config) => {
            try {
                const token = await this.auth.getAccessToken();
                config.headers.Authorization = `Bearer ${token}`;
            }
            catch (error) {
                this.log.error('Failed to get access token:', error);
                throw error;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for error handling
        this.axios.interceptors.response.use((response) => response, async (error) => {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                // Handle authentication errors
                if (status === 401) {
                    this.log.warn('Authentication error, attempting to refresh token');
                    try {
                        await this.auth.forceRefresh();
                        // Retry the original request
                        if (error.config) {
                            const token = await this.auth.getAccessToken();
                            error.config.headers.Authorization = `Bearer ${token}`;
                            return this.axios.request(error.config);
                        }
                    }
                    catch (refreshError) {
                        this.log.error('Token refresh failed:', refreshError);
                    }
                }
                const message = error.response?.data?.message || error.message;
                throw new SomfyProtectApiError(message, status, error.response?.data);
            }
            throw error;
        });
    }
    /**
     * Get all sites
     */
    async getSites() {
        try {
            this.log.debug('Fetching all sites');
            const response = await this.axios.get('/v3/site');
            return response.data.items;
        }
        catch (error) {
            this.log.error('Failed to get sites:', error);
            throw error;
        }
    }
    /**
     * Get site by ID
     */
    async getSite(siteId) {
        try {
            this.log.debug(`Fetching site ${siteId}`);
            const response = await this.axios.get(`/v3/site/${siteId}`);
            return response.data;
        }
        catch (error) {
            this.log.error(`Failed to get site ${siteId}:`, error);
            throw error;
        }
    }
    /**
     * Set security level for a site
     */
    async setSecurityLevel(siteId, level) {
        try {
            this.log.info(`Setting security level to '${level}' for site ${siteId}`);
            const response = await this.axios.put(`/v3/site/${siteId}/security`, { status: level });
            return response.data;
        }
        catch (error) {
            this.log.error(`Failed to set security level for site ${siteId}:`, error);
            throw error;
        }
    }
    /**
     * Stop alarm
     */
    async stopAlarm(siteId) {
        try {
            this.log.info(`Stopping alarm for site ${siteId}`);
            await this.axios.put(`/v3/site/${siteId}/alarm/stop`, {});
        }
        catch (error) {
            this.log.error(`Failed to stop alarm for site ${siteId}:`, error);
            throw error;
        }
    }
    /**
     * Trigger panic alarm
     */
    async triggerPanic(siteId, mode = 'alarm') {
        try {
            this.log.warn(`Triggering ${mode} panic for site ${siteId}`);
            await this.axios.post(`/v3/site/${siteId}/panic`, { type: mode });
        }
        catch (error) {
            this.log.error(`Failed to trigger panic for site ${siteId}:`, error);
            throw error;
        }
    }
    /**
     * Get all devices for a site
     */
    async getDevices(siteId) {
        try {
            this.log.debug(`Fetching devices for site ${siteId}`);
            const response = await this.axios.get(`/v3/site/${siteId}/device`);
            return response.data.items;
        }
        catch (error) {
            this.log.error(`Failed to get devices for site ${siteId}:`, error);
            throw error;
        }
    }
    /**
     * Get device by ID
     */
    async getDevice(siteId, deviceId) {
        try {
            this.log.debug(`Fetching device ${deviceId} for site ${siteId}`);
            const response = await this.axios.get(`/v3/site/${siteId}/device/${deviceId}`);
            return response.data;
        }
        catch (error) {
            this.log.error(`Failed to get device ${deviceId}:`, error);
            throw error;
        }
    }
    /**
     * Clear cached authentication token (for troubleshooting)
     */
    clearAuthToken() {
        this.auth.clearToken();
    }
}
//# sourceMappingURL=api.js.map