/**
 * Somfy Protect API Types
 */
export interface SomfyProtectConfig {
    platform: string;
    name?: string;
    username: string;
    password: string;
    siteId?: string;
    pollingInterval?: number;
    debug?: boolean;
    httpPort?: number;
    httpToken?: string;
    enableSwitch?: boolean;
    switchArmMode?: SecurityLevel;
}
export interface OAuthToken {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token: string;
    issuedAt: number;
}
export interface Site {
    site_id: string;
    name: string;
    label: string;
    brand: string;
    security_level: SecurityLevel;
    diagnosis?: {
        is_everything_ok: boolean;
    };
}
export interface Device {
    device_id: string;
    site_id: string;
    box_id: string;
    label: string;
    device_definition: {
        device_definition_id: string;
        type: DeviceType;
        label: string;
    };
    status?: {
        battery_level?: number;
        battery_state?: string;
        reclink_quality?: number;
        rlink_quality_percent?: number;
        temperature?: number;
        last_status_at?: number;
    };
    diagnosis?: {
        is_everything_ok: boolean;
    };
    settings?: Record<string, unknown>;
}
export type SecurityLevel = 'disarmed' | 'armed' | 'partial';
export type DeviceType = 'link' | 'myfox_camera' | 'indoor_camera' | 'outdoor_camera' | 'pir' | 'tag' | 'remote' | 'indoor_siren' | 'outdoor_siren' | 'smoke' | 'extender';
export interface SetSecurityLevelResponse {
    task_id: string;
    site_id: string;
}
export interface ApiError {
    error: string;
    error_description?: string;
    message?: string;
}
/**
 * Homebridge API Error
 */
export declare class SomfyProtectApiError extends Error {
    statusCode?: number | undefined;
    response?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: unknown | undefined);
}
