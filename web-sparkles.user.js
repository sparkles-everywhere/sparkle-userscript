// ==UserScript==
// @name         Web Sparkles
// @namespace    https://scriptcat.org/
// @version      1.0
// @description  Adds animated sparkle effects to any webpage
// @author       Yeosangist
// @match        *://*/*
// @updateURL    https://github.com/Yeosangist/sparkleSuite/raw/refs/heads/main/web-sparkles.user.js
// @downloadURL  https://github.com/Yeosangist/sparkleSuite/raw/refs/heads/main/web-sparkles.user.js
// @license      CC BY-NC-SA 4.0
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================
    // Configuration
    // ============================================================

    const CONFIG = {
        sparkleCount: 3,
        minSize: 2,
        maxSize: 5,
        minLifetime: 1500,
        maxLifetime: 2000,
        minDelay: 100,
        maxDelay: 500,
        wiggleDistance: 8,
        maxRotation: 15,
        autoDetect: true,
        forceColor: null, // 'light' or 'dark' to override auto-detection
    };

    // ============================================================
    // Star SVG paths
    // ============================================================

    const STAR_PATHS = {
        diamond: (size) => {
            const long = size * 2;
            const short = size * 0.35;
            return `M 0,-${long} L ${short},-${short} L ${long},0 L ${short},${short} L 0,${long} L -${short},${short} L -${long},0 L -${short},-${short} Z`;
        },
        hollow_diamond: (size) => {
            const long = size * 2;
            const short = size * 0.35;
            return `M 0,-${long} L ${short},-${short} L ${long},0 L ${short},${short} L 0,${long} L -${short},${short} L -${long},0 L -${short},-${short} Z`;
        },
        soft_star: (size) => {
            const outer = size * 1.8;
            const inner = size * 0.42;
            let path = '';
            for (let i = 0; i < 10; i++) {
                const angle = -Math.PI / 2 + i * Math.PI / 5;
                const radius = i % 2 === 0 ? outer : inner;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                path += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)},${y.toFixed(2)}`;
            }
            return path + ' Z';
        },
        six_point: (size) => {
            const outer = size * 1.8;
            const inner = size * 0.38;
            let path = '';
            for (let i = 0; i < 12; i++) {
                const angle = -Math.PI / 2 + i * Math.PI / 6;
                const radius = i % 2 === 0 ? outer : inner;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                path += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)},${y.toFixed(2)}`;
            }
            return path + ' Z';
        },
        eight_point: (size) => {
            const outer = size * 1.9;
            const inner = size * 0.32;
            let path = '';
            for (let i = 0; i < 16; i++) {
                const angle = -Math.PI / 2 + i * Math.PI / 8;
                const radius = i % 2 === 0 ? outer : inner;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                path += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)},${y.toFixed(2)}`;
            }
            return path + ' Z';
        }
    };

    const STAR_TYPES = Object.keys(STAR_PATHS);

    // ============================================================
    // Utility functions
    // ============================================================

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomInt(min, max) {
        return Math.floor(random(min, max + 1));
    }

    // ============================================================
    // CSS Styles
    // ============================================================

    const style = document.createElement('style');
    style.textContent = `
        #universal-sparkles-container {
            position: fixed;
            inset: 0;
            pointer-events: none;
            user-select: none;
            overflow: hidden;
            z-index: 2147483647;
        }

        .universal-sparkle {
            position: absolute;
            pointer-events: none;
            user-select: none;
            opacity: 0;
            filter: drop-shadow(0 0 3px var(--glow-color, rgba(255, 255, 255, 0.8)));
            animation-name: universal-sparkle-anim;
            animation-timing-function: ease-in-out;
            animation-fill-mode: forwards;
        }

        @keyframes universal-sparkle-anim {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) rotate(var(--start-rotation)) scale(0.2);
            }
            20% {
                opacity: var(--max-alpha);
                transform: translate(-50%, -50%) rotate(calc(var(--start-rotation) + var(--rotation-amount))) scale(1);
            }
            50% {
                opacity: calc(var(--max-alpha) * 0.85);
                transform: translate(-50%, -50%) rotate(calc(var(--start-rotation) - var(--rotation-amount) * 0.5)) scale(1.1);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -50%) rotate(calc(var(--start-rotation) + var(--rotation-amount) * 1.5)) scale(0.3);
            }
        }
    `;
    document.head.appendChild(style);

    // ============================================================
    // Background color detection
    // ============================================================

    function getLuminance(r, g, b) {
        // Relative luminance formula
        const [lr, lg, lb] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function rgbStringToRgb(rgbString) {
        const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }
        return null;
    }

    function detectBackgroundColor() {
        // Try to get computed background color of body
        const bodyStyle = window.getComputedStyle(document.body);
        const bgColor = bodyStyle.backgroundColor;

        let rgb = rgbStringToRgb(bgColor);
        
        // If transparent, try html element
        if (!rgb || (rgb.r === 0 && rgb.g === 0 && rgb.b === 0 && bgColor.includes('0, 0, 0'))) {
            const htmlStyle = window.getComputedStyle(document.documentElement);
            const htmlBgColor = htmlStyle.backgroundColor;
            rgb = rgbStringToRgb(htmlBgColor);
        }

        // If still no valid color, default to light (assume white background)
        if (!rgb) {
            return 'light';
        }

        const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
        
        // Threshold of 0.5 to determine dark vs light
        return luminance < 0.5 ? 'dark' : 'light';
    }

    function updateSparkleColor() {
        if (CONFIG.forceColor) {
            if (CONFIG.forceColor === 'dark') {
                currentSparkleColor = 'black';
                currentGlowColor = 'rgba(0, 0, 0, 0.8)';
            } else {
                currentSparkleColor = 'white';
                currentGlowColor = 'rgba(255, 255, 255, 0.8)';
            }
        } else if (CONFIG.autoDetect) {
            const bgType = detectBackgroundColor();
            if (bgType === 'dark') {
                currentSparkleColor = 'white';
                currentGlowColor = 'rgba(255, 255, 255, 0.8)';
            } else {
                currentSparkleColor = 'black';
                currentGlowColor = 'rgba(0, 0, 0, 0.8)';
            }
        } else {
            currentSparkleColor = 'white';
            currentGlowColor = 'rgba(255, 255, 255, 0.8)';
        }
    }

    // ============================================================
    // Container
    // ============================================================

    let container = null;
    let stopped = false;
    let currentSparkleColor = 'white';
    let currentGlowColor = 'rgba(255, 255, 255, 0.8)';
    let activeTimeouts = [];
    let isInitialized = false;

    function initContainer() {
        if (container) {
            // Clean up existing sparkles if container already exists
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            return;
        }
        
        container = document.createElement('div');
        container.id = 'universal-sparkles-container';
        document.body.appendChild(container);
        
        updateSparkleColor();
    }

    // ============================================================
    // Sparkle creation
    // ============================================================

    function createSparkleSVG(starType, size, hollow) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size * 4);
        svg.setAttribute('height', size * 4);
        svg.setAttribute('viewBox', `${-size * 2} ${-size * 2} ${size * 4} ${size * 4}`);
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', STAR_PATHS[starType](size));
        path.setAttribute('fill', hollow ? 'none' : currentSparkleColor);
        
        if (hollow) {
            path.setAttribute('stroke', currentSparkleColor);
            path.setAttribute('stroke-width', Math.max(0.5, size * 0.15));
        }
        
        svg.appendChild(path);
        return svg;
    }

    function spawnSparkle() {
        if (stopped || !container) return;

        const starType = STAR_TYPES[randomInt(0, STAR_TYPES.length - 1)];
        const hollow = starType === 'hollow_diamond';
        const size = random(CONFIG.minSize, CONFIG.maxSize);
        const lifetime = random(CONFIG.minLifetime, CONFIG.maxLifetime);
        const maxAlpha = random(0.6, 1.0);
        const startRotation = random(-CONFIG.maxRotation, CONFIG.maxRotation);
        const rotationAmount = random(-CONFIG.maxRotation, CONFIG.maxRotation);

        const sparkle = document.createElement('div');
        sparkle.className = 'universal-sparkle';
        
        const svg = createSparkleSVG(starType, size, hollow);
        sparkle.appendChild(svg);

        sparkle.style.left = `${random(2, 98)}%`;
        sparkle.style.top = `${random(2, 98)}%`;
        sparkle.style.setProperty('--start-rotation', `${startRotation}deg`);
        sparkle.style.setProperty('--rotation-amount', `${rotationAmount}deg`);
        sparkle.style.setProperty('--max-alpha', maxAlpha);
        sparkle.style.setProperty('--glow-color', currentGlowColor);
        sparkle.style.animationDuration = `${lifetime}ms`;

        container.appendChild(sparkle);

        sparkle.addEventListener('animationend', () => sparkle.remove(), { once: true });

        scheduleNext();
    }

    // ============================================================
    // Scheduling
    // ============================================================

    function scheduleNext() {
        if (stopped) return;
        
        const delay = random(CONFIG.minDelay, CONFIG.maxDelay);
        const timeoutId = setTimeout(() => {
            // Remove from active timeouts when it fires
            const index = activeTimeouts.indexOf(timeoutId);
            if (index > -1) {
                activeTimeouts.splice(index, 1);
            }
            spawnSparkle();
        }, delay);
        activeTimeouts.push(timeoutId);
    }

    // ============================================================
    // Lifecycle
    // ============================================================

    function start() {
        if (stopped) {
            stopped = false;
        }
        
        // Clear any existing timeouts
        activeTimeouts.forEach(id => clearTimeout(id));
        activeTimeouts = [];
        
        initContainer();
        
        // Only spawn initial batch if not already initialized
        if (!isInitialized) {
            isInitialized = true;
            for (let i = 0; i < CONFIG.sparkleCount; i++) {
                const timeoutId = setTimeout(() => {
                    const index = activeTimeouts.indexOf(timeoutId);
                    if (index > -1) {
                        activeTimeouts.splice(index, 1);
                    }
                    spawnSparkle();
                }, random(0, 2000));
                activeTimeouts.push(timeoutId);
            }
        }
    }

    function stop() {
        stopped = true;
        
        // Clear all pending timeouts
        activeTimeouts.forEach(id => clearTimeout(id));
        activeTimeouts = [];
        
        // Remove container
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            container.remove();
            container = null;
        }
        
        isInitialized = false;
    }

    // ============================================================
    // Page visibility handling
    // ============================================================

    function handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, stop sparkles to save resources
            stop();
        } else {
            // Page is visible again, restart
            start();
        }
    }

    // ============================================================
    // Initialize
    // ============================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    // Handle page visibility changes (bfcache, tab switching, etc.)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle page unload
    window.addEventListener('beforeunload', stop);

    // Expose for debugging and control
    window.universalSparkles = {
        start,
        stop,
        CONFIG,
        setAutoDetect: (enabled) => {
            CONFIG.autoDetect = enabled;
            CONFIG.forceColor = null;
            updateSparkleColor();
        },
        setDarkMode: () => {
            CONFIG.forceColor = 'dark';
            CONFIG.autoDetect = false;
            updateSparkleColor();
        },
        setLightMode: () => {
            CONFIG.forceColor = 'light';
            CONFIG.autoDetect = false;
            updateSparkleColor();
        },
        detectBackground: detectBackgroundColor,
        getCurrentColor: () => currentSparkleColor
    };

})();
