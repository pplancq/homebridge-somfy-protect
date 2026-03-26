/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export declare const PLATFORM_NAME = "SomfyProtect";
/**
 * This must match the name of your plugin as defined the package.json
 */
export declare const PLUGIN_NAME = "homebridge-somfy-protect";
/**
 * Somfy Protect API Configuration
 */
export declare const API_CONFIG: {
    BASE_URL: string;
    TOKEN_URL: string;
    CLIENT_ID: string;
    CLIENT_SECRET: string;
};
/**
 * Polling Configuration
 */
export declare const POLLING_CONFIG: {
    INITIAL_INTERVAL: number;
    FAST_INTERVAL: number;
    SLOW_INTERVAL: number;
    FAST_POLLING_DURATION: number;
    MAX_RETRY_ATTEMPTS: number;
    RETRY_DELAY: number;
};
