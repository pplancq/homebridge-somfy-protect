import type { Logging } from 'homebridge';
import { type Site, type Device, type SecurityLevel, type SetSecurityLevelResponse } from './types.js';
/**
 * Somfy Protect API Client
 */
export declare class SomfyProtectApi {
    private readonly log;
    private readonly axios;
    private readonly auth;
    constructor(log: Logging, username: string, password: string, storagePath: string);
    /**
     * Get all sites
     */
    getSites(): Promise<Site[]>;
    /**
     * Get site by ID
     */
    getSite(siteId: string): Promise<Site>;
    /**
     * Set security level for a site
     */
    setSecurityLevel(siteId: string, level: SecurityLevel): Promise<SetSecurityLevelResponse>;
    /**
     * Stop alarm
     */
    stopAlarm(siteId: string): Promise<void>;
    /**
     * Trigger panic alarm
     */
    triggerPanic(siteId: string, mode?: 'silent' | 'alarm'): Promise<void>;
    /**
     * Get all devices for a site
     */
    getDevices(siteId: string): Promise<Device[]>;
    /**
     * Get device by ID
     */
    getDevice(siteId: string, deviceId: string): Promise<Device>;
    /**
     * Clear cached authentication token (for troubleshooting)
     */
    clearAuthToken(): void;
}
