interface AntiDevtoolsConfig {
    ondevtoolopen?: () => void;
    ondevtoolclose?: () => void;
    interval?: number;
    clearIntervalWhenDevOpenTrigger?: boolean;
}
declare class AntiDevtools {
    private config;
    private isDevToolOpen;
    private intervalId;
    constructor(options?: AntiDevtoolsConfig);
    private triggerOpen;
    private triggerClose;
    /**
     * Method 1: Console Object Property Trap
     */
    private consoleDetection;
    /**
     * Method 3: Window Size Detection
     */
    private sizeDetection;
    /**
     * Method 5: DevTools Protocol Detection (Chrome)
     */
    private chromeDevtoolsDetection;
    /**
     * Method 6: Firebug Detection (Legacy Firefox)
     */
    private firebugDetection;
    private detect;
    init(): void;
    destroy(): void;
}

export { AntiDevtools, type AntiDevtoolsConfig };
