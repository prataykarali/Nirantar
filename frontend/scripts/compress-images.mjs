#!/usr/bin/env node
/**
 * Advanced Image Compression Script for Nirantar Assets
 * Uses Sharp with WebP/MozJPEG/quantized PNG to bring all asset sizes to KB range.
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const ASSETS_DIR = new URL('../public/assets/images', import.meta.url).pathname;

// Config
const MAX_WIDTH_BANNER = 1000;
const MAX_WIDTH_CHAR = 600;
const JPG_QUALITY = 70;
const PNG_QUALITY = 65;

let totalBefore = 0;
let totalAfter = 0;
let filesProcessed = 0;

async function getAllImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllImages(fullPath)));
    } else {
      const ext = extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function compressImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const name = basename(filePath);
  const isCharacter = filePath.includes('/characters/') || filePath.includes('/avatars/');
  const maxW = isCharacter ? MAX_WIDTH_CHAR : MAX_WIDTH_BANNER;
  
  try {
    const beforeStat = await stat(filePath);
    const beforeSize = beforeStat.size;
    
    let pipeline = sharp(filePath);
    const metadata = await pipeline.metadata();
    
    if (metadata.width && metadata.width > maxW) {
      pipeline = pipeline.resize(maxW, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    let outputBuffer;
    
    if (ext === '.png') {
      outputBuffer = await pipeline
        .png({ 
          quality: PNG_QUALITY,
          compressionLevel: 9,
          palette: true,
          colours: 192,
          effort: 10,
        })
        .toBuffer();
    } else {
      outputBuffer = await pipeline
        .jpeg({ 
          quality: JPG_QUALITY,
          mozjpeg: true,
          progressive: true,
        })
        .toBuffer();
    }
    
    const afterSize = outputBuffer.length;
    
    if (afterSize < beforeSize) {
      await sharp(outputBuffer).toFile(filePath);
      const beforeKB = (beforeSize / 1024).toFixed(0);
      const afterKB = (afterSize / 1024).toFixed(0);
      const savings = ((1 - afterSize / beforeSize) * 100).toFixed(0);
      console.log(`  ✓ ${name.padEnd(42)} ${beforeKB.padStart(6)}KB → ${afterKB.padStart(5)}KB  (${savings}% saved)`);
      totalBefore += beforeSize;
      totalAfter += afterSize;
      filesProcessed++;
    }
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('⚡ Fine-tuning image compression for ultra-fast loading...');
  const images = await getAllImages(ASSETS_DIR);
  for (const img of images) {
    await compressImage(img);
  }
  const totalBeforeMB = (totalBefore / (1024 * 1024)).toFixed(2);
  const totalAfterMB = (totalAfter / (1024 * 1024)).toFixed(2);
  const savedMB = ((totalBefore - totalAfter) / (1024 * 1024)).toFixed(2);
  console.log(`\n📊 Ultra compression saved additional ${savedMB} MB (${totalBeforeMB} MB → ${totalAfterMB} MB)`);
}

main().catch(console.error);
