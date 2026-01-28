# PWA Icons Setup Guide

To complete the PWA setup, you need to generate icon files for the app. Here are two options:

## Option 1: Use the Icon Generator (Quick)

1. Open `public/generate-icons.html` in your browser
2. Click "Generate Icons" button
3. Download each icon file
4. Save them in the `public/icons/` directory with these names:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

## Option 2: Use an Online Tool

1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 PNG image of your app icon
3. Generate all required sizes
4. Download and place them in `public/icons/` directory

## Option 3: Create Icons Manually

Create PNG images with these specifications:
- Format: PNG with transparency
- Sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Design: Should include "SS" or Smart Split logo
- Background: Blue (#2563eb) or transparent
- Save in: `public/icons/` directory

## After Adding Icons

1. Rebuild the app: `npm run build`
2. Deploy: `firebase deploy --only hosting`

The PWA will be installable on both iOS and Android devices!
