# Web Sparkles

A userscript that adds animated sparkle effects to any webpage. The sparkles automatically adapt to the page's background color for optimal visibility.

## Features

- **Automatic color detection**: Sparkles automatically switch between white (for dark backgrounds) and black (for light backgrounds)
- **Multiple star shapes**: Includes diamond, hollow diamond, soft star, six-point, and eight-point stars
- **Smooth animations**: Sparkles fade in, wiggle, rotate, and fade out naturally
- **Performance optimized**: Pauses when tab is hidden to save resources
- **Configurable**: Exposed API for runtime control and customization
- **Universal compatibility**: Works on any webpage

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [ScriptCat](https://scriptcat.org/)
2. Click the install link or copy the script content
3. Paste into your userscript manager and save

## Configuration

Edit the `CONFIG` object in the script to customize behavior:

```javascript
const CONFIG = {
    sparkleCount: 3,       // Number of sparkles to spawn initially
    minSize: 2,            // Minimum sparkle size
    maxSize: 5,            // Maximum sparkle size
    minLifetime: 1500,     // Minimum animation duration (ms)
    maxLifetime: 2000,     // Maximum animation duration (ms)
    minDelay: 100,         // Minimum delay between sparkles (ms)
    maxDelay: 500,         // Maximum delay between sparkles (ms)
    wiggleDistance: 8,     // Maximum wiggle distance
    maxRotation: 15,       // Maximum rotation angle (degrees)
    autoDetect: true,      // Auto-detect background color
    forceColor: null,      // Override: 'light' or 'dark'
};
```

## Star Types

The script includes five different star shapes:

- **diamond**: Classic 4-point diamond
- **hollow_diamond**: Outlined 4-point diamond
- **soft_star**: Rounded 5-point star
- **six_point**: Sharp 6-point star
- **eight_point**: Detailed 8-point star

Stars are randomly selected for each sparkle.
