import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import { EventEmitter } from 'events';
/**
 * Somfy Protect Platform
 * Discovers and manages Somfy Protect alarm systems
 */
export declare class SomfyProtectPlatform implements DynamicPlatformPlugin {
    readonly log: Logging;
    readonly homebridgeApi: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: Map<string, PlatformAccessory>;
    readonly events: EventEmitter<[never]>;
    private api;
    private pollingInterval?;
    private readonly config;
    private readonly accessoryInstances;
    private httpServer?;
    constructor(log: Logging, config: PlatformConfig, homebridgeApi: API);
    /**
     * Restore cached accessory from disk
     */
    configureAccessory(accessory: PlatformAccessory): void;
    /**
     * Discover Somfy Protect sites and register them as accessories
     */
    private discoverSites;
    /**
     * Register a Somfy Protect site as an accessory
     */
    private registerSite;
    /**
     * Remove accessories that no longer exist
     */
    private removeStaleAccessories;
    /**
     * Start polling for status updates
     */
    private startPolling;
    /**
     * Poll for status updates
     */
    private pollStatus;
    /**
     * Stop polling (called on shutdown)
     */
    stopPolling(): void;
    /**
     * Disarm all alarm systems (called by HTTP API)
     */
    private disarmAllAlarms;
}
