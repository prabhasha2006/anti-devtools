(function () {
    const config = {
        onScriptInjection: null, // Will be set by user
        detectExtensions: true,
        checkInterval: 50,
        aggressiveMode: true,
        autoInit: true, // Auto-initialize by default
    };

    let initialized = false;

    // Configuration method exposed to the global scope
    window.AntiUserscript = function (options) {
        if (options) {
            Object.keys(options).forEach(key => {
                if (config.hasOwnProperty(key)) {
                    config[key] = options[key];
                }
            });
        }
        
        // Initialize if not already done
        if (!initialized && config.autoInit !== false) {
            init();
        }
    };

    let originalFunctions = {};
    let detectionIntervalId = null;

    function triggerScriptInjection(details) {
        if (config.onScriptInjection) {
            config.onScriptInjection(details);
        }
    }

    /**
     * Immediate userscript detection (runs before DOM loads)
     */
    function immediateUserscriptCheck() {
        // Check for Tampermonkey/Greasemonkey APIs immediately
        const userscriptAPIs = [
            'GM_info', 'GM', 'unsafeWindow', 'GM_xmlhttpRequest', 
            'GM_getValue', 'GM_setValue', 'GM_addStyle', 'GM_addElement',
            'GM_deleteValue', 'GM_listValues', 'GM_getResourceText',
            'GM_getResourceURL', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand',
            'GM_openInTab', 'GM_setClipboard', 'GM_notification',
            'GM_addValueChangeListener', 'GM_removeValueChangeListener',
            'GM_download', 'GM_getTab', 'GM_saveTab', 'GM_getTabs',
            'cloneInto', 'exportFunction'
        ];

        let detected = false;
        userscriptAPIs.forEach(api => {
            if (typeof window[api] !== 'undefined') {
                detected = true;
                triggerScriptInjection({
                    method: 'API_Detection',
                    api: api,
                    type: 'Tampermonkey/Greasemonkey/Violentmonkey',
                    timestamp: Date.now()
                });
            }
        });

        // Check for GM_info specifically with detailed info
        if (typeof GM_info !== 'undefined') {
            detected = true;
            try {
                const info = {
                    method: 'GM_info_detected',
                    scriptManager: GM_info.scriptHandler || 'Unknown',
                    version: GM_info.version || 'Unknown',
                    timestamp: Date.now()
                };
                
                if (GM_info.script) {
                    info.script = {
                        name: GM_info.script.name || 'Unknown',
                        namespace: GM_info.script.namespace || 'Unknown',
                        version: GM_info.script.version || 'Unknown',
                        description: GM_info.script.description || '',
                        matches: GM_info.script.matches || []
                    };
                }
                
                triggerScriptInjection(info);
            } catch (e) {
                triggerScriptInjection({
                    method: 'GM_info_error',
                    error: e.message,
                    timestamp: Date.now()
                });
            }
        }

        // Check for Tampermonkey-specific window properties
        const tmProps = ['GM', 'GM_info', 'unsafeWindow'];
        tmProps.forEach(prop => {
            try {
                if (window[prop] && typeof window[prop] === 'object') {
                    detected = true;
                    triggerScriptInjection({
                        method: 'TM_object_detected',
                        property: prop,
                        type: 'Tampermonkey',
                        timestamp: Date.now()
                    });
                }
            } catch (e) {
                // Property exists but throws error on access
                detected = true;
                triggerScriptInjection({
                    method: 'TM_object_protected',
                    property: prop,
                    timestamp: Date.now()
                });
            }
        });

        // Scan all window properties for suspicious names
        try {
            const allProps = Object.getOwnPropertyNames(window);
            const suspiciousProps = allProps.filter(prop => {
                const lower = prop.toLowerCase();
                return prop.startsWith('GM_') || 
                       lower.includes('tampermonkey') || 
                       lower.includes('greasemonkey') ||
                       lower.includes('violentmonkey') ||
                       lower.includes('userscript') ||
                       prop.startsWith('__tm') ||
                       prop.startsWith('__gm');
            });

            if (suspiciousProps.length > 0) {
                detected = true;
                triggerScriptInjection({
                    method: 'property_scan',
                    properties: suspiciousProps,
                    count: suspiciousProps.length,
                    type: 'userscript',
                    timestamp: Date.now()
                });
            }
        } catch (e) {
            // Error scanning properties
        }

        // Check for external script sources from extensions
        try {
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                const script = scripts[i];
                const src = script.src || '';
                
                // Skip if it's our own script or explicitly allowed
                if (script.hasAttribute('data-antiuserscript-allowed')) continue;
                if (src.includes('anti-userscript.js')) continue;
                if (src.includes('anti-devtools.js')) continue;
                
                if (src && (
                    src.includes('chrome-extension://') ||
                    src.includes('moz-extension://')
                )) {
                    detected = true;
                    triggerScriptInjection({
                        method: 'extension_script_src',
                        src: src,
                        timestamp: Date.now()
                    });
                }
            }
        } catch (e) {
            // Error checking scripts
        }

        return detected;
    }

    /**
     * Protect against userscript modifications
     */
    function protectAgainstUserscripts() {
        // Override eval to detect dynamic script execution
        const originalEval = window.eval;
        window.eval = function(code) {
            const stack = new Error().stack || '';
            if (stack.includes('chrome-extension://') || 
                stack.includes('moz-extension://') ||
                (typeof code === 'string' && (code.includes('@grant') || code.includes('==UserScript==')))) {
                
                triggerScriptInjection({
                    method: 'eval',
                    code: typeof code === 'string' ? code.substring(0, 100) : String(code).substring(0, 100),
                    type: 'userscript',
                    timestamp: Date.now()
                });
            }
            return originalEval.call(this, code);
        };

        // Override Function constructor
        const OriginalFunction = Function;
        window.Function = function(...args) {
            const code = args[args.length - 1] || '';
            if (typeof code === 'string' && 
                (code.includes('@grant') || code.includes('GM_'))) {
                
                triggerScriptInjection({
                    method: 'FunctionConstructor',
                    code: code.substring(0, 100),
                    type: 'userscript',
                    timestamp: Date.now()
                });
            }
            return OriginalFunction.apply(this, args);
        };
    }

    /**
     * Extension Detection: Monitor for userscript injections
     * Detects Tampermonkey, Greasemonkey, Violentmonkey and similar userscript managers
     */
    function detectExtensions() {
        if (!config.detectExtensions) return;

        // Monitor for script element injections
        const originalAppendChild = Element.prototype.appendChild;
        const originalInsertBefore = Element.prototype.insertBefore;

        Element.prototype.appendChild = function(node) {
            if (node.tagName === 'SCRIPT' && !node.hasAttribute('data-antiuserscript-allowed')) {
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
            if (newNode.tagName === 'SCRIPT' && !newNode.hasAttribute('data-antiuserscript-allowed')) {
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
     * Initialize Detection
     */
    function init() {
        if (initialized) return; // Prevent double initialization
        initialized = true;
        
        // Immediate check before anything else
        const initialDetection = immediateUserscriptCheck();
        
        // If already detected, might want to trigger immediately
        if (initialDetection && config.aggressiveMode) {
            // Already triggered in immediateUserscriptCheck
        }
        
        // Protect against modifications
        protectAgainstUserscripts();
        
        // Very frequent userscript checks
        detectionIntervalId = setInterval(immediateUserscriptCheck, config.checkInterval);
        
        // Also check on various events
        window.addEventListener('load', immediateUserscriptCheck);
        window.addEventListener('DOMContentLoaded', immediateUserscriptCheck);
        document.addEventListener('readystatechange', immediateUserscriptCheck);
        
        // Initialize extension detection
        detectExtensions();
    }

    // Run checks multiple times immediately (before user config)
    immediateUserscriptCheck();
    setTimeout(immediateUserscriptCheck, 0);
    setTimeout(immediateUserscriptCheck, 1);
    setTimeout(immediateUserscriptCheck, 10);
    setTimeout(immediateUserscriptCheck, 50);
    setTimeout(immediateUserscriptCheck, 100);
    
    protectAgainstUserscripts();

    // Don't auto-initialize here - wait for user to call AntiUserscript()
    // But if user never calls it, initialize after a delay
    setTimeout(() => {
        if (!initialized && config.autoInit) {
            init();
        }
    }, 500);

})();