(function () {
    const config = {
        ondevtoolopen: () => {
            window.location.href = "about:blank";
        },
        ondevtoolclose: null,
        interval: 500,
        clearIntervalWhenDevOpenTrigger: false,
    }

    // Configuration method exposed to the global scope
    window.AntiDevtools = function (options) {
        if (options) {
            Object.keys(options).forEach(key => {
                if (config.hasOwnProperty(key)) {
                    config[key] = options[key];
                }
            })
        }
    }

    let isDevToolOpen = false;
    let intervalId = null;

    function triggerOpen() {
        if (!isDevToolOpen) {
            isDevToolOpen = true;
            if (config.ondevtoolopen) {
                config.ondevtoolopen();
            }
            if (config.clearIntervalWhenDevOpenTrigger && intervalId) {
                clearInterval(intervalId);
            }
        }
    }

    function triggerClose() {
        if (isDevToolOpen) {
            isDevToolOpen = false;
            if (config.ondevtoolclose) {
                config.ondevtoolclose();
            }
        }
    }

    /**
     * Method 1: Console Object Property Trap
     * Browsers invoke getters when console tries to display the object
     */
    function consoleDetection() {
        const element = new Image();
        let detected = false;
        
        Object.defineProperty(element, 'id', {
            get: function () {
                detected = true
                triggerOpen()
                return 'devtools-detector'
            }
        })

        // Use console.dir for better property inspection
        console.dir(element)
        console.clear()
        
        return detected
    }

    /**
     * Method 3: Window Size Detection
     * Compare window.outerWidth/Height with window.innerWidth/Height
     * Significant differences indicate DevTools is docked
     */
    function sizeDetection() {
        const widthThreshold = 200;
        const heightThreshold = 200;
        
        // Account for browser chrome (toolbars, scrollbars, etc)
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        
        // More conservative thresholds to avoid false positives
        if (widthDiff > widthThreshold || heightDiff > heightThreshold) {
            triggerOpen();
            return true;
        } else {
            triggerClose();
            return false;
        }
    }

    /**
     * Method 4: toString Override Detection
     * Console calls toString when displaying objects
     */
    function toStringDetection() {
        let detected = false;
        const fake = {
            toString: function() {
                detected = true;
                triggerOpen();
                return '';
            }
        };
        
        console.log('%c', fake);
        console.clear();
        
        return detected;
    }

    /**
     * Method 5: DevTools Protocol Detection (Chrome)
     * Check if window.chrome.devtools exists
     */
    function chromeDevtoolsDetection() {
        if (window.chrome && window.chrome.devtools) {
            triggerOpen();
            return true;
        }
        return false;
    }

    /**
     * Method 6: Firebug Detection (Legacy Firefox)
     */
    function firebugDetection() {
        if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
            triggerOpen();
            return true;
        }
        return false;
    }

    /**
     * Combined Detection Loop
     * Uses multiple methods for comprehensive detection
     */
    function detect() {
        // Prioritize more reliable detection methods
        consoleDetection();
        // regexpDetection(); // Can cause false positives
        sizeDetection();
        // toStringDetection(); // Can cause false positives
        chromeDevtoolsDetection();
        firebugDetection();
    }

    /**
     * Initialize Detection
     */
    function init() {
        // Start detection interval
        intervalId = setInterval(detect, config.interval);
        
        // Also check on window resize (catches undocking DevTools)
        window.addEventListener('resize', detect);
        
        // Initial check
        detect();
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();