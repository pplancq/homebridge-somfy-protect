import type { CharacteristicValue, PlatformAccessory } from 'homebridge';
import type { SomfyProtectPlatform } from './platform.js';
import type { SomfyProtectApi } from './api.js';
import type { SecurityLevel } from './types.js';
/**
 * Somfy Protect Alarm Accessory
 * Represents a Somfy Protect alarm system in HomeKit
 */
export declare class SomfyProtectAlarmAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly api;
    private readonly enableSwitch;
    private readonly switchArmMode;
    private service;
    private switchService?;
    private isReachable;
    private readonly STALENESS_THRESHOLD;
    private readonly boundHandleSiteUpdate;
    constructor(platform: SomfyProtectPlatform, accessory: PlatformAccessory, api: SomfyProtectApi, enableSwitch?: boolean, switchArmMode?: SecurityLevel);
    /**
     * Convert Somfy security level to HomeKit current state
     */
    private somfyToHomekitCurrentState;
    /**
     * Convert Somfy security level to HomeKit target state
     */
    private somfyToHomekitTargetState;
    /**
     * Convert HomeKit target state to Somfy security level
     */
    private homekitToSomfyLevel;
    /**
     * Setup optional arm/disarm Switch service
     */
    private setupSwitchService;
    /**
     * Returns true if the current security level should turn the switch ON.
     * Any armed state (armed or partial) turns the switch ON.
     * Only disarmed turns it OFF.
     */
    private isSwitchOn;
    /**
     * Get the switch state based on the current security level
     */
    private getSwitchState;
    /**
     * Handle switch ON/OFF: arm or disarm the alarm
     */
    private setSwitchState;
    /**
     * Get current security state
     */
    getCurrentState(): Promise<CharacteristicValue>;
    /**
     * Get target security state
     */
    getTargetState(): Promise<CharacteristicValue>;
    /**
     * Set target security state
     */
    setTargetState(value: CharacteristicValue): Promise<void>;
    /**
     * Get StatusFault characteristic (shows connection issues in Home app)
     */
    getStatusFault(): Promise<CharacteristicValue>;
    /**
     * Handle site update event from platform (EventEmitter pattern)
     */
    private handleSiteUpdate;
    /**
     * Update characteristics based on current site data
     */
    private updateCharacteristics;
    /**
     * Handle errors with improved user-friendly messages
     */
    private handleError;
    /**
     * Cleanup method (called on shutdown)
     */
    destroy(): void;
}
