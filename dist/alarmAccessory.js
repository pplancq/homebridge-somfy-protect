import { SomfyProtectApiError } from './types.js';
/**
 * Somfy Protect Alarm Accessory
 * Represents a Somfy Protect alarm system in HomeKit
 */
export class SomfyProtectAlarmAccessory {
    platform;
    accessory;
    api;
    enableSwitch;
    switchArmMode;
    service;
    switchService;
    isReachable = true;
    STALENESS_THRESHOLD = 60000; // 60 seconds
    boundHandleSiteUpdate;
    constructor(platform, accessory, api, enableSwitch = false, switchArmMode = 'armed') {
        this.platform = platform;
        this.accessory = accessory;
        this.api = api;
        this.enableSwitch = enableSwitch;
        this.switchArmMode = switchArmMode;
        const site = this.accessory.context.site;
        // Set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Somfy')
            .setCharacteristic(this.platform.Characteristic.Model, 'Somfy Protect')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, site.site_id)
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, '2.0.0')
            .setCharacteristic(this.platform.Characteristic.Name, site.label);
        // Get or create Security System service
        this.service = this.accessory.getService(this.platform.Service.SecuritySystem)
            || this.accessory.addService(this.platform.Service.SecuritySystem);
        this.service.setCharacteristic(this.platform.Characteristic.Name, site.label);
        // Set valid values for characteristics
        this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
            .setProps({
            validValues: [
                this.platform.Characteristic.SecuritySystemCurrentState.STAY_ARM,
                this.platform.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
                this.platform.Characteristic.SecuritySystemCurrentState.DISARMED,
                this.platform.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED,
            ],
        });
        this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
            .setProps({
            validValues: [
                this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM,
                this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM,
                this.platform.Characteristic.SecuritySystemTargetState.DISARM,
            ],
        });
        // Register handlers using modern API
        this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
            .onGet(this.getCurrentState.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
            .onGet(this.getTargetState.bind(this))
            .onSet(this.setTargetState.bind(this));
        // Add StatusFault characteristic to show connection issues in Home app
        this.service.getCharacteristic(this.platform.Characteristic.StatusFault)
            .onGet(this.getStatusFault.bind(this));
        // Listen for site updates from platform (EventEmitter pattern)
        this.boundHandleSiteUpdate = this.handleSiteUpdate.bind(this);
        this.platform.events.on('siteUpdated', this.boundHandleSiteUpdate);
        // Setup optional arm/disarm switch
        if (this.enableSwitch) {
            this.setupSwitchService();
        }
        else {
            // Remove switch service if it was previously enabled (config migration)
            const existingSwitch = this.accessory.getService(this.platform.Service.Switch);
            if (existingSwitch) {
                this.accessory.removeService(existingSwitch);
            }
        }
        // Set initial state
        this.updateCharacteristics();
    }
    /**
     * Convert Somfy security level to HomeKit current state
     */
    somfyToHomekitCurrentState(level) {
        switch (level) {
            case 'armed':
                return this.platform.Characteristic.SecuritySystemCurrentState.AWAY_ARM;
            case 'partial':
                return this.platform.Characteristic.SecuritySystemCurrentState.STAY_ARM;
            case 'disarmed':
                return this.platform.Characteristic.SecuritySystemCurrentState.DISARMED;
            default:
                this.platform.log.warn(`Unknown security level: ${level}`);
                return this.platform.Characteristic.SecuritySystemCurrentState.DISARMED;
        }
    }
    /**
     * Convert Somfy security level to HomeKit target state
     */
    somfyToHomekitTargetState(level) {
        switch (level) {
            case 'armed':
                return this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM;
            case 'partial':
                return this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM;
            case 'disarmed':
                return this.platform.Characteristic.SecuritySystemTargetState.DISARM;
            default:
                this.platform.log.warn(`Unknown security level: ${level}`);
                return this.platform.Characteristic.SecuritySystemTargetState.DISARM;
        }
    }
    /**
     * Convert HomeKit target state to Somfy security level
     */
    homekitToSomfyLevel(state) {
        switch (state) {
            case this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM:
                return 'armed';
            case this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM:
                return 'partial';
            case this.platform.Characteristic.SecuritySystemTargetState.DISARM:
                return 'disarmed';
            default:
                this.platform.log.warn(`Unknown target state: ${state}`);
                return 'disarmed';
        }
    }
    /**
     * Setup optional arm/disarm Switch service
     */
    setupSwitchService() {
        const site = this.accessory.context.site;
        this.switchService = this.accessory.getService(this.platform.Service.Switch)
            || this.accessory.addService(this.platform.Service.Switch, `${site.label} Switch`, 'arm-switch');
        this.switchService.setCharacteristic(this.platform.Characteristic.Name, `${site.label} Switch`);
        this.switchService.getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.getSwitchState.bind(this))
            .onSet(this.setSwitchState.bind(this));
    }
    /**
     * Returns true if the current security level should turn the switch ON.
     * Any armed state (armed or partial) turns the switch ON.
     * Only disarmed turns it OFF.
     */
    isSwitchOn(level) {
        return level !== 'disarmed';
    }
    /**
     * Get the switch state based on the current security level
     */
    getSwitchState() {
        const site = this.accessory.context.site;
        return this.isSwitchOn(site.security_level);
    }
    /**
     * Handle switch ON/OFF: arm or disarm the alarm
     */
    async setSwitchState(value) {
        const site = this.accessory.context.site;
        const targetLevel = value ? this.switchArmMode : 'disarmed';
        this.platform.log.info(`Switch: setting ${site.label} to ${targetLevel}`);
        try {
            await this.api.setSecurityLevel(site.site_id, targetLevel);
            // Update local cache optimistically
            site.security_level = targetLevel;
            this.accessory.context.site = site;
            // Sync SecuritySystem characteristics
            this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState, this.somfyToHomekitCurrentState(targetLevel));
            this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemTargetState, this.somfyToHomekitTargetState(targetLevel));
            this.platform.log.info(`Switch: successfully set ${site.label} to ${targetLevel}`);
        }
        catch (error) {
            this.handleError('setting switch state', error);
            // Revert switch to actual state on error
            this.switchService?.updateCharacteristic(this.platform.Characteristic.On, this.isSwitchOn(site.security_level));
            throw new this.platform.homebridgeApi.hap.HapStatusError(-70402 /* this.platform.homebridgeApi.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    /**
     * Get current security state
     */
    async getCurrentState() {
        try {
            // Check if data is stale
            const lastUpdate = this.accessory.context.lastUpdate;
            const isStale = !lastUpdate || (Date.now() - lastUpdate > this.STALENESS_THRESHOLD);
            if (isStale) {
                this.isReachable = false;
                this.service.updateCharacteristic(this.platform.Characteristic.StatusFault, this.platform.Characteristic.StatusFault.GENERAL_FAULT);
                throw new this.platform.homebridgeApi.hap.HapStatusError(-70402 /* this.platform.homebridgeApi.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
            }
            this.isReachable = true;
            const site = this.accessory.context.site;
            this.platform.log.debug(`Getting current state for ${site.label}: ${site.security_level}`);
            return this.somfyToHomekitCurrentState(site.security_level);
        }
        catch (error) {
            if (error instanceof this.platform.homebridgeApi.hap.HapStatusError) {
                throw error;
            }
            this.handleError('getting current state', error);
            throw new this.platform.homebridgeApi.hap.HapStatusError(-70402 /* this.platform.homebridgeApi.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    /**
     * Get target security state
     */
    async getTargetState() {
        try {
            const site = this.accessory.context.site;
            this.platform.log.debug(`Getting target state for ${site.label}: ${site.security_level}`);
            return this.somfyToHomekitTargetState(site.security_level);
        }
        catch (error) {
            this.platform.log.error('Error getting target state:', error);
            throw new this.platform.homebridgeApi.hap.HapStatusError(-70402 /* this.platform.homebridgeApi.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    /**
     * Set target security state
     */
    async setTargetState(value) {
        try {
            const site = this.accessory.context.site;
            const targetLevel = this.homekitToSomfyLevel(value);
            this.platform.log.info(`Setting ${site.label} to ${targetLevel}`);
            // Send command to Somfy API
            await this.api.setSecurityLevel(site.site_id, targetLevel);
            // Update local cache optimistically
            site.security_level = targetLevel;
            this.accessory.context.site = site;
            // Update current state characteristic to match
            this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState, this.somfyToHomekitCurrentState(targetLevel));
            // Sync switch if enabled
            this.switchService?.updateCharacteristic(this.platform.Characteristic.On, this.isSwitchOn(targetLevel));
            this.platform.log.info(`Successfully set ${site.label} to ${targetLevel}`);
        }
        catch (error) {
            this.handleError('setting target state', error);
            // Revert to actual state on error
            const site = this.accessory.context.site;
            this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemTargetState, this.somfyToHomekitTargetState(site.security_level));
            throw new this.platform.homebridgeApi.hap.HapStatusError(-70402 /* this.platform.homebridgeApi.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE */);
        }
    }
    /**
     * Get StatusFault characteristic (shows connection issues in Home app)
     */
    async getStatusFault() {
        const lastUpdate = this.accessory.context.lastUpdate;
        const isStale = !lastUpdate || (Date.now() - lastUpdate > this.STALENESS_THRESHOLD);
        if (isStale || !this.isReachable) {
            return this.platform.Characteristic.StatusFault.GENERAL_FAULT;
        }
        return this.platform.Characteristic.StatusFault.NO_FAULT;
    }
    /**
     * Handle site update event from platform (EventEmitter pattern)
     */
    handleSiteUpdate(siteId, updatedSite) {
        const currentSite = this.accessory.context.site;
        if (siteId === currentSite.site_id) {
            // Update context
            this.accessory.context.site = updatedSite;
            this.accessory.context.lastUpdate = Date.now();
            // Update characteristics
            this.updateCharacteristics();
            // Update reachability
            this.isReachable = true;
            this.service.updateCharacteristic(this.platform.Characteristic.StatusFault, this.platform.Characteristic.StatusFault.NO_FAULT);
        }
    }
    /**
     * Update characteristics based on current site data
     */
    updateCharacteristics() {
        const site = this.accessory.context.site;
        const currentState = this.somfyToHomekitCurrentState(site.security_level);
        const targetState = this.somfyToHomekitTargetState(site.security_level);
        this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState, currentState);
        this.service.updateCharacteristic(this.platform.Characteristic.SecuritySystemTargetState, targetState);
        // Sync switch state
        if (this.switchService) {
            this.switchService.updateCharacteristic(this.platform.Characteristic.On, this.isSwitchOn(site.security_level));
        }
        this.platform.log.debug(`Updated characteristics for ${site.label}: ${site.security_level}`);
    }
    /**
     * Handle errors with improved user-friendly messages
     */
    handleError(operation, error) {
        if (error instanceof SomfyProtectApiError) {
            if (error.statusCode === 401) {
                this.platform.log.error(`Authentication failed while ${operation}. Please check your credentials in config.`);
            }
            else if (error.statusCode === 429) {
                this.platform.log.error(`Rate limited by Somfy API while ${operation}. Slowing down requests.`);
            }
            else if (error.statusCode && error.statusCode >= 500) {
                this.platform.log.error(`Somfy API server error while ${operation}. Will retry automatically.`);
            }
            else {
                this.platform.log.error(`Failed ${operation}: ${error.message}`);
            }
        }
        else if (error instanceof Error) {
            this.platform.log.error(`Error ${operation}:`, error.message);
        }
        else {
            this.platform.log.error(`Unknown error ${operation}:`, error);
        }
    }
    /**
     * Cleanup method (called on shutdown)
     */
    destroy() {
        this.platform.events.removeListener('siteUpdated', this.boundHandleSiteUpdate);
        this.platform.log.debug('Cleaned up alarm accessory');
    }
}
//# sourceMappingURL=alarmAccessory.js.map