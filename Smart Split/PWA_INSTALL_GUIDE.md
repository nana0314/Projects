# PWA Installation Guide

Smart Split is now a Progressive Web App (PWA) that can be installed on both iOS and Android devices!

## How to Install

### Android (Chrome/Edge)

1. Open Smart Split in Chrome or Edge browser
2. You'll see an "Install" banner at the bottom of the screen
3. Tap "Install" to add Smart Split to your home screen
4. Alternatively:
   - Tap the menu (three dots) in the browser
   - Select "Install app" or "Add to Home screen"

### iOS (Safari)

1. Open Smart Split in Safari browser
2. Tap the Share button (square with arrow pointing up)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired
5. Tap "Add" in the top right corner

## Features

Once installed, Smart Split will:
- ✅ Work offline (with cached data)
- ✅ Launch like a native app
- ✅ Have its own icon on your home screen
- ✅ Run in fullscreen mode (no browser UI)
- ✅ Load faster on subsequent visits

## Requirements

- **Android**: Chrome 67+ or Edge 79+
- **iOS**: Safari on iOS 11.3+
- **HTTPS**: The app must be served over HTTPS (already configured)

## Troubleshooting

### Install button not showing?
- Make sure you're using a supported browser
- Clear browser cache and reload
- Check that you're accessing the site over HTTPS

### Icons not showing?
- Generate icons using `public/generate-icons.html`
- Or use an online tool like https://realfavicongenerator.net/
- Place icons in `public/icons/` directory
- Rebuild and redeploy the app

### Service Worker not working?
- Check browser console for errors
- Ensure you're on HTTPS
- Clear site data and reload

## Development

To test PWA features locally:
1. Build the app: `npm run build`
2. Serve the `out` directory with a local HTTPS server
3. Or use Firebase emulator: `firebase emulators:start --only hosting`
