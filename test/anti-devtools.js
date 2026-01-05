(function () {
    const config = {
        ondevtoolopen: () => {
            window.location.href = "about:blank";
        },
        ondevtoolclose: null,
        onScriptInjection: null,
        interval: 500,
        clearIntervalWhenDevOpenTrigger: false,
        detectExtensions: true,
    };

    // Configuration method exposed to the global scope
    window.AntiDevtools = function (options) {
        if (options) {
            Object.keys(options).forEach(key => {
                if (config.hasOwnProperty(key)) {
                    config[key] = options[key];
                }
            });
        }
    };

    let isDevToolOpen = false;
    let isFirstTrigger = true;
    let intervalId = null;
    let originalFunctions = {};

    function triggerOpen() {
        if (!isDevToolOpen) {
            isDevToolOpen = true;
            if (isFirstTrigger) {
                isFirstTrigger = false;
                if (config.ondevtoolopen) {
                    config.ondevtoolopen();
                }
                if (config.clearIntervalWhenDevOpenTrigger && intervalId) {
                    clearInterval(intervalId);
                }
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

    function triggerScriptInjection(details) {
        if (config.onScriptInjection) {
            config.onScriptInjection(details);
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
                detected = true;
                triggerOpen();
                return 'devtools-detector';
            }
        });

        // Use console.dir for better property inspection
        console.dir(element);
        console.clear();
        
        return detected;
    }

    /**
     * Method 2: RegExp toString Detection
     * DevTools changes the behavior of RegExp.toString
     */
    function regexpDetection() {
        const reg = /./;
        let detected = false;
        
        const originalToString = reg.toString;
        reg.toString = function() {
            detected = true;
            triggerOpen();
            return originalToString.call(this);
        };
        
        console.log(reg);
        console.clear();
        
        return detected;
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
     * Extension Detection: Monitor for userscript injections
     * Detects Tampermonkey, Greasemonkey, Violentmonkey and similar userscript managers
     */
    function detectExtensions() {
        if (!config.detectExtensions) return;

        // Detect Tampermonkey/Greasemonkey/Violentmonkey global objects
        const userscriptManagers = [
            'GM_info',           // Greasemonkey/Tampermonkey
            'GM',                // GM4 API
            'unsafeWindow',      // Greasemonkey
            'GM_xmlhttpRequest', // Common GM function
            'GM_getValue',
            'GM_setValue',
            'GM_addStyle',
            'cloneInto',         // Firefox Greasemonkey
            'exportFunction'     // Firefox Greasemonkey
        ];

        userscriptManagers.forEach(api => {
            if (typeof window[api] !== 'undefined') {
                triggerScriptInjection({
                    method: 'userscriptDetection',
                    api: api,
                    type: 'Tampermonkey/Greasemonkey/Violentmonkey',
                    timestamp: Date.now()
                });
            }
        });

        // Check for Tampermonkey-specific info
        if (typeof GM_info !== 'undefined') {
            triggerScriptInjection({
                method: 'userscriptInfo',
                scriptManager: GM_info.scriptHandler,
                version: GM_info.version,
                scripts: GM_info.scripts ? GM_info.scripts.length : 0,
                timestamp: Date.now()
            });
        }

        // Monitor for script element injections
        const originalAppendChild = Element.prototype.appendChild;
        const originalInsertBefore = Element.prototype.insertBefore;

        Element.prototype.appendChild = function(node) {
            if (node.tagName === 'SCRIPT' && !node.hasAttribute('data-antidevtools-allowed')) {
                const stack = new Error().stack || '';
                
                // Detect userscript injection patterns
                if (stack.includes('chrome-extension://') || 
                    stack.includes('moz-extension://') ||
                    stack.includes('userscript.html') ||
                    stack.includes('GM_') ||
                    node.textContent.includes('@grant')) {
                    
                    triggerScriptInjection({
                        method: 'appendChild',
                        element: node,
                        src: node.src,
                        content: node.textContent.substring(0, 100),
                        type: 'userscript',
                        timestamp: Date.now()
                    });
                }
            }
            return originalAppendChild.call(this, node);
        };

        Element.prototype.insertBefore = function(newNode, referenceNode) {
            if (newNode.tagName === 'SCRIPT' && !newNode.hasAttribute('data-antidevtools-allowed')) {
                const stack = new Error().stack || '';
                
                if (stack.includes('chrome-extension://') || 
                    stack.includes('moz-extension://') ||
                    stack.includes('userscript.html') ||
                    newNode.textContent.includes('@grant')) {
                    
                    triggerScriptInjection({
                        method: 'insertBefore',
                        element: newNode,
                        src: newNode.src,
                        content: newNode.textContent.substring(0, 100),
                        type: 'userscript',
                        timestamp: Date.now()
                    });
                }
            }
            return originalInsertBefore.call(this, newNode, referenceNode);
        };

        // Detect script tags with Tampermonkey metadata
        const checkExistingScripts = () => {
            const scripts = document.querySelectorAll('script');
            scripts.forEach(script => {
                const content = script.textContent || '';
                // Check for Tampermonkey metadata block
                if (content.includes('==UserScript==') || 
                    content.includes('@name') || 
                    content.includes('@namespace') ||
                    content.includes('@grant GM_')) {
                    
                    triggerScriptInjection({
                        method: 'existingScript',
                        element: script,
                        type: 'userscript',
                        metadata: content.substring(0, 200),
                        timestamp: Date.now()
                    });
                }
            });
        };

        // Check immediately and after DOM loads
        checkExistingScripts();
        setTimeout(checkExistingScripts, 100);
        setTimeout(checkExistingScripts, 500);

        // Monitor MutationObserver for DOM changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'SCRIPT') {
                            const content = node.textContent || '';
                            const src = node.src || '';
                            
                            // Check for userscript patterns
                            if (content.includes('==UserScript==') ||
                                content.includes('@grant') ||
                                src.includes('chrome-extension://') ||
                                src.includes('moz-extension://')) {
                                
                                triggerScriptInjection({
                                    method: 'MutationObserver',
                                    element: node,
                                    src: src,
                                    type: 'userscript',
                                    timestamp: Date.now()
                                });
                            }
                        }
                        
                        // Check for injected iframes (some userscripts use this)
                        if (node.tagName === 'IFRAME') {
                            const src = node.src || '';
                            if (src.includes('chrome-extension://') || 
                                src.includes('moz-extension://')) {
                                
                                triggerScriptInjection({
                                    method: 'iframeInjection',
                                    element: node,
                                    src: src,
                                    type: 'userscript',
                                    timestamp: Date.now()
                                });
                            }
                        }
                    }
                });
            });
        });

        // Start observing
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // Detect common DevTools extension hooks
        const devtoolsHooks = [
            '__REACT_DEVTOOLS_GLOBAL_HOOK__',
            '__VUE_DEVTOOLS_GLOBAL_HOOK__',
            '__REDUX_DEVTOOLS_EXTENSION__',
            '__APOLLO_DEVTOOLS_GLOBAL_HOOK__'
        ];

        devtoolsHooks.forEach(hook => {
            if (window[hook]) {
                triggerScriptInjection({
                    method: 'devtoolsHook',
                    hook: hook,
                    timestamp: Date.now()
                });
            }
        });

        // Store for cleanup if needed
        originalFunctions.observer = observer;
    }

    /**
     * Combined Detection Loop
     * Uses multiple methods for comprehensive detection
     */
    function detect() {
        // Prioritize more reliable detection methods
        // Comment out methods that cause false positives
        
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
        
        // Initialize extension detection
        detectExtensions();
        
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