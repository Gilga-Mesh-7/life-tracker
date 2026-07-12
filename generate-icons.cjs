const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Dark background (matches your app's stone-900)
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, size, size);
  
  // Draw gradient circle ring
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const lineWidth = size * 0.08;
  
  // Blue to green gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6'); // blue-500
  gradient.addColorStop(1, '#22c55e'); // green-500
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  
  // Draw the ring (incomplete circle for progress effect)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0.2 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();
  
  // Draw checkmark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const checkSize = size * 0.25;
  const checkX = centerX - checkSize / 2;
  const checkY = centerY;
  
  ctx.beginPath();
  ctx.moveTo(checkX + checkSize * 0.1, checkY);
  ctx.lineTo(checkX + checkSize * 0.4, checkY + checkSize * 0.3);
  ctx.lineTo(checkX + checkSize * 0.9, checkY - checkSize * 0.4);
  ctx.stroke();
  
  // Save the file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated ${outputPath}`);
}

// Generate both sizes
const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

generateIcon(192, path.join(publicDir, 'pwa-192x192.png'));
generateIcon(512, path.join(publicDir, 'pwa-512x512.png'));

console.log('\n✅ Icons generated successfully in the public folder!');