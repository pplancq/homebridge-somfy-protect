import type { Logging } from 'homebridge';
/**
 * HTTP API Server for automation integrations
 * Provides REST endpoints for controlling the alarm system
 */
export declare class HttpApiServer {
    private readonly log;
    private readonly port;
    private readonly token;
    private readonly disarmCallback;
    private server?;
    constructor(log: Logging, port: number, token: string | undefined, disarmCallback: () => Promise<void>);
    /**
     * Start the HTTP server
     */
    start(): void;
    /**
     * Stop the HTTP server
     */
    stop(): void;
}
