import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distLocalesDir = path.join(__dirname, '..', 'dist', 'locales');

function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Deleted: ${dirPath}`);
  }
}

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Deleted: ${filePath}`);
  }
}

console.log('🔍 Cleaning Chinese locale files from production build...');

const cnDirs = ['zh-CN', 'zh'];

cnDirs.forEach(dirName => {
  const dirPath = path.join(distLocalesDir, dirName);
  deleteDirectory(dirPath);
});

const cnFiles = ['zh-CN.json', 'zh.json'];
const publicLocalesDir = path.join(__dirname, '..', 'public', 'locales');

cnFiles.forEach(fileName => {
  const filePath = path.join(publicLocalesDir, fileName);
  deleteFile(filePath);
});

console.log('\n✅ All Chinese locale files have been removed from production build.');
console.log('✅ Production build is now language-isolated (en/de/fr/es/it only).');
