
export interface AntiDevtoolsConfig {
    ondevtoolopen?: () => void;
    ondevtoolclose?: () => void;
    interval?: number;
    clearIntervalWhenDevOpenTrigger?: boolean;
}

const defaultConfig: AntiDevtoolsConfig = {
    ondevtoolopen: () => {
        window.location.href = "about:blank";
    },
    ondevtoolclose: undefined,
    interval: 500,
    clearIntervalWhenDevOpenTrigger: false,
};

export class AntiDevtools {
    private config: AntiDevtoolsConfig;
    private isDevToolOpen: boolean = false;
    private intervalId: number | null = null;

    constructor(options?: AntiDevtoolsConfig) {
        this.config = { ...defaultConfig, ...options };
        if (typeof window !== 'undefined') {
            this.init();
        }
    }

    private triggerOpen() {
        if (!this.isDevToolOpen) {
            this.isDevToolOpen = true;
            if (this.config.ondevtoolopen) {
                this.config.ondevtoolopen();
            }
            if (this.config.clearIntervalWhenDevOpenTrigger && this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }
    }

    private triggerClose() {
        if (this.isDevToolOpen) {
            this.isDevToolOpen = false;
            if (this.config.ondevtoolclose) {
                this.config.ondevtoolclose();
            }
        }
    }

    /**
     * Method 1: Console Object Property Trap
     */
    private consoleDetection() {
        const element = new Image();
        let detected = false;

        // We need to use Object.defineProperty on the Image object
        // But since we can't reliably trigger it without console.dir/log which might not work in all environments as expected
        // We will stick to the logic provided in the original script but typed

        Object.defineProperty(element, 'id', {
            get: () => {
                detected = true;
                this.triggerOpen();
                return 'devtools-detector';
            }
        });

        // Use console.dir for better property inspection
        // @ts-ignore
        console.dir(element);
        console.clear();

        return detected;
    }

    /**
     * Method 3: Window Size Detection
     */
    private sizeDetection() {
        const widthThreshold = 200;
        const heightThreshold = 200;

        // Account for browser chrome (toolbars, scrollbars, etc)
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;

        // More conservative thresholds to avoid false positives
        if (widthDiff > widthThreshold || heightDiff > heightThreshold) {
            this.triggerOpen();
            return true;
        } else {
            this.triggerClose();
            return false;
        }
    }

    /**
     * Method 5: DevTools Protocol Detection (Chrome)
     */
    private chromeDevtoolsDetection() {
        // @ts-ignore
        if (window.chrome && window.chrome.devtools) {
            this.triggerOpen();
            return true;
        }
        return false;
    }

    /**
     * Method 6: Firebug Detection (Legacy Firefox)
     */
    private firebugDetection() {
        // @ts-ignore
        if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
            this.triggerOpen();
            return true;
        }
        return false;
    }

    private detect = () => {
        // Prioritize more reliable detection methods
        this.consoleDetection();
        // regexpDetection(); // Can cause false positives - omitted
        this.sizeDetection();
        // toStringDetection(); // Can cause false positives - omitted
        this.chromeDevtoolsDetection();
        this.firebugDetection();
    }

    public init() {
        if (this.intervalId) return;

        // Start detection interval
        this.intervalId = window.setInterval(this.detect, this.config.interval);

        // Also check on window resize (catches undocking DevTools)
        window.addEventListener('resize', this.detect);

        // Initial check
        this.detect();
    }

    public destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        window.removeEventListener('resize', this.detect);
    }
}
