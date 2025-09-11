#!/usr/bin/env node

/**
 * PWA Icon Generation Script
 * Generates all required PWA icons and screenshots using Sharp
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

// Ensure public directory exists
await fs.mkdir(publicDir, { recursive: true });

// Icon specifications
const icons = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' }
];

// Create SVG template for NFL Pick'em app icon
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.1}"/>
  
  <!-- Border -->
  <rect x="2" y="2" width="${size-4}" height="${size-4}" fill="none" stroke="#374151" stroke-width="2" rx="${size * 0.08}"/>
  
  <!-- Football -->
  <ellipse cx="${size/2}" cy="${size * 0.45}" rx="${size * 0.08}" ry="${size * 0.05}" fill="#8B5A2B"/>
  <line x1="${size/2 - size * 0.03}" y1="${size * 0.45}" x2="${size/2 + size * 0.03}" y2="${size * 0.45}" stroke="white" stroke-width="1"/>
  
  <!-- Text -->
  <text x="${size/2}" y="${size * 0.25}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.12}">NFL</text>
  <text x="${size/2}" y="${size * 0.75}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.08}">PICK'EM</text>
</svg>
`;

// Create screenshot SVG templates
const createScreenshotSVG = (width, height, isMobile = false) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#f9fafb"/>
  
  <!-- Header -->
  <rect width="${width}" height="${height * 0.1}" fill="#1f2937"/>
  <text x="${width/2}" y="${height * 0.06}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${Math.floor(height * 0.04)}">NFL Pick'em App</text>
  
  ${Array.from({ length: isMobile ? 6 : 4 }, (_, i) => {
    const cardHeight = height * (isMobile ? 0.12 : 0.15);
    const cardWidth = width * 0.9;
    const cardX = (width - cardWidth) / 2;
    const cardY = height * 0.15 + i * (cardHeight + 20);
    
    return `
    <!-- Game Card ${i + 1} -->
    <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" fill="white" stroke="#e5e7eb" stroke-width="1" rx="8"/>
    <text x="${cardX + 20}" y="${cardY + cardHeight * 0.35}" fill="#374151" font-family="Arial, sans-serif" font-size="${Math.floor(height * 0.025)}">Chiefs vs Bills</text>
    <text x="${cardX + 20}" y="${cardY + cardHeight * 0.65}" fill="#6b7280" font-family="Arial, sans-serif" font-size="${Math.floor(height * 0.02)}">Sunday 1:00 PM</text>
    
    <!-- Pick Buttons -->
    <rect x="${cardX + cardWidth - 140}" y="${cardY + cardHeight * 0.2}" width="60" height="30" fill="#3b82f6" rx="4"/>
    <text x="${cardX + cardWidth - 110}" y="${cardY + cardHeight * 0.35 + 5}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${Math.floor(height * 0.02)}">KC</text>
    
    <rect x="${cardX + cardWidth - 70}" y="${cardY + cardHeight * 0.2}" width="60" height="30" fill="#e5e7eb" rx="4"/>
    <text x="${cardX + cardWidth - 40}" y="${cardY + cardHeight * 0.35 + 5}" text-anchor="middle" fill="#374151" font-family="Arial, sans-serif" font-size="${Math.floor(height * 0.02)}">BUF</text>
    `;
  }).join('')}
  
  ${isMobile ? `
  <!-- Mobile Bottom Navigation -->
  <rect x="0" y="${height - height * 0.1}" width="${width}" height="${height * 0.1}" fill="white" stroke="#e5e7eb" stroke-width="1"/>
  <circle cx="${width * 0.2}" cy="${height - height * 0.05}" r="15" fill="#3b82f6"/>
  <circle cx="${width * 0.5}" cy="${height - height * 0.05}" r="15" fill="#e5e7eb"/>
  <circle cx="${width * 0.8}" cy="${height - height * 0.05}" r="15" fill="#e5e7eb"/>
  ` : ''}
</svg>
`;

console.log('🏈 Generating NFL Pick\'em PWA icons...');

// Generate icons
for (const icon of icons) {
  const svgBuffer = Buffer.from(createIconSVG(icon.size));
  
  try {
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(path.join(publicDir, icon.name));
    
    console.log(`✅ Created ${icon.name} (${icon.size}x${icon.size})`);
  } catch (error) {
    console.error(`❌ Failed to create ${icon.name}:`, error.message);
  }
}

// Generate screenshots
const screenshots = [
  { width: 1280, height: 720, name: 'pwa-screenshot-wide.png', isMobile: false },
  { width: 750, height: 1334, name: 'pwa-screenshot-narrow.png', isMobile: true }
];

for (const screenshot of screenshots) {
  const svgBuffer = Buffer.from(createScreenshotSVG(screenshot.width, screenshot.height, screenshot.isMobile));
  
  try {
    await sharp(svgBuffer)
      .resize(screenshot.width, screenshot.height)
      .png()
      .toFile(path.join(publicDir, screenshot.name));
    
    console.log(`📱 Created ${screenshot.name} (${screenshot.width}x${screenshot.height})`);
  } catch (error) {
    console.error(`❌ Failed to create ${screenshot.name}:`, error.message);
  }
}

// Create favicon.ico (using the 32x32 PNG as base)
try {
  await sharp(path.join(publicDir, 'favicon-32x32.png'))
    .toFormat('png')
    .toFile(path.join(publicDir, 'favicon.ico'));
  
  console.log('✅ Created favicon.ico');
} catch (error) {
  console.error('❌ Failed to create favicon.ico:', error.message);
}

// Create safari-pinned-tab.svg
const safariIcon = `
<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="700pt" height="700pt" viewBox="0 0 700 700">
  <g transform="translate(0,700) scale(0.1,-0.1)" fill="#1f2937" stroke="none">
    <path d="M0 3500 l0 -3500 3500 0 3500 0 0 3500 0 3500 -3500 0 -3500 0 0 -3500z"/>
    <ellipse cx="350" cy="280" rx="80" ry="50" fill="#8B5A2B"/>
    <line x1="300" y1="280" x2="400" y2="280" stroke="white" stroke-width="10"/>
    <text x="350" y="180" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="120">NFL</text>
    <text x="350" y="420" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" font-size="80">PICK'EM</text>
  </g>
</svg>
`;

await fs.writeFile(path.join(publicDir, 'safari-pinned-tab.svg'), safariIcon);
console.log('🍎 Created safari-pinned-tab.svg');

console.log('\n🎉 All PWA assets generated successfully!');
console.log('\nGenerated files:');
icons.forEach(icon => console.log(`  📁 public/${icon.name}`));
screenshots.forEach(screenshot => console.log(`  📁 public/${screenshot.name}`));
console.log('  📁 public/favicon.ico');
console.log('  📁 public/safari-pinned-tab.svg');