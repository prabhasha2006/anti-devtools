// src/core/devtools.ts
var defaultConfig = {
  ondevtoolopen: () => {
    window.location.href = "about:blank";
  },
  ondevtoolclose: void 0,
  interval: 500,
  clearIntervalWhenDevOpenTrigger: false
};
var AntiDevtools = class {
  constructor(options) {
    this.isDevToolOpen = false;
    this.intervalId = null;
    this.detect = () => {
      this.consoleDetection();
      this.sizeDetection();
      this.chromeDevtoolsDetection();
      this.firebugDetection();
    };
    this.config = { ...defaultConfig, ...options };
    if (typeof window !== "undefined") {
      this.init();
    }
  }
  triggerOpen() {
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
  triggerClose() {
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
  consoleDetection() {
    const element = new Image();
    let detected = false;
    Object.defineProperty(element, "id", {
      get: () => {
        detected = true;
        this.triggerOpen();
        return "devtools-detector";
      }
    });
    console.dir(element);
    console.clear();
    return detected;
  }
  /**
   * Method 3: Window Size Detection
   */
  sizeDetection() {
    const widthThreshold = 200;
    const heightThreshold = 200;
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
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
  chromeDevtoolsDetection() {
    if (window.chrome && window.chrome.devtools) {
      this.triggerOpen();
      return true;
    }
    return false;
  }
  /**
   * Method 6: Firebug Detection (Legacy Firefox)
   */
  firebugDetection() {
    if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
      this.triggerOpen();
      return true;
    }
    return false;
  }
  init() {
    if (this.intervalId) return;
    this.intervalId = window.setInterval(this.detect, this.config.interval);
    window.addEventListener("resize", this.detect);
    this.detect();
  }
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    window.removeEventListener("resize", this.detect);
  }
};
export {
  AntiDevtools
};
//# sourceMappingURL=index.mjs.map