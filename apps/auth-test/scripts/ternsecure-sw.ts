import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import https from 'https';

async function downloadServiceWorker(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const data: any[] = [];
      response.on('data', (chunk) => data.push(chunk));
      response.on('end', () => resolve(Buffer.concat(data)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  try {
    const publicDir = join(process.cwd(), 'public');
    const swPath = join(publicDir, 'tern-secure-sw.js');
    const cdnUrl = 'https://cdn.lifesprintcare.ca/dist/service-worker.js';

    // Create public directory if it doesn't exist
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
      console.log('[TernSecure] Created public directory');
    }

    // Download and save service worker
    console.log('[TernSecure] Downloading service worker...');
    const content = await downloadServiceWorker(cdnUrl);
    await writeFile(swPath, content);
    
    console.log('[TernSecure] Service worker downloaded successfully to:', swPath);
  } catch (error) {
    console.error('[TernSecure] Setup failed:', error);
    process.exit(1);
  }
}

main();