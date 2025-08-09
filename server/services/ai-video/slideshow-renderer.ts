import path from 'path';
import fs from 'fs/promises';
import fssync from 'fs';
import { spawn } from 'child_process';
import sharp from 'sharp';
import { createRequire } from 'module';

export interface SlideshowScene {
  title: string;
  description: string;
  duration: number; // seconds
}

export interface RenderOptions {
  width: number; // e.g., 1280
  height: number; // e.g., 720
  outDir: string; // absolute or relative path
  fileBaseName: string; // without extension
  ttsText?: string; // optional narration text to synthesize
  ttsVoice?: string; // optional voice name (Windows System.Speech)
  showText?: boolean; // draw text on slides; default false for cleaner visuals
  kenBurns?: boolean; // apply subtle pan/zoom; default true
  backgroundMusic?: 'none' | 'sine' | 'noise';
  musicVolumeDb?: number; // relative background volume, e.g., -26
}

export interface RenderResult {
  filePath: string;
  durationSeconds: number;
  thumbnailPath: string;
}

function toSvg(scene: SlideshowScene, width: number, height: number, showText: boolean): string {
  const title = escapeXml(scene.title ?? '').slice(0, 80);
  const desc = escapeXml(scene.description ?? '').slice(0, 300);
  const titleY = Math.round(height * 0.28);
  const textStartY = titleY + 40;
  const lines = wrapText(desc, 46).slice(0, 7);

  const tspanLines = lines
    .map((line, idx) => `<tspan x="64" dy="${idx === 0 ? 0 : 34}">${line}</tspan>`) 
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0b1020"/>
        <stop offset="100%" stop-color="#152238"/>
      </linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <g filter="url(#shadow)">
      <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="24" fill="#0f172a" opacity="0.8"/>
    </g>
    ${showText ? `<text x="64" y="${titleY}" fill="#ffffff" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="48" font-weight="700">${title}</text>` : ''}
    ${showText ? `<text x="64" y="${textStartY}" fill="#e5e7eb" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="26" xml:space="preserve" style="line-height:1.35">${tspanLines}</text>` : ''}
  </svg>`;
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? current + ' ' + w : w;
    if (candidate.length > maxCharsPerLine) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function writeImageForScene(scene: SlideshowScene, width: number, height: number, outPath: string, showText: boolean): Promise<void> {
  const svg = toSvg(scene, width, height, showText);
  const svgBuffer = Buffer.from(svg, 'utf-8');
  await sharp(svgBuffer)
    .png()
    .toFile(outPath);
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function runFfmpeg(args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = resolveFfmpegBinary() || 'ffmpeg';
    const proc = spawn(bin, args, { cwd, stdio: 'inherit' });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}. Ensure ffmpeg is installed or add a dependency like ffmpeg-static or @ffmpeg-installer/ffmpeg.`));
    });
  });
}

function resolveFfmpegBinary(): string | null {
  try {
    const require = createRequire(import.meta.url);
    const p = require('ffmpeg-static');
    if (typeof p === 'string' && p.length > 0) return p;
  } catch {}
  try {
    const require = createRequire(import.meta.url);
    const mod = require('@ffmpeg-installer/ffmpeg');
    if (mod && typeof mod.path === 'string' && mod.path.length > 0) return mod.path;
  } catch {}
  return null;
}

export async function renderSlideshowVideo(
  scenes: SlideshowScene[],
  options: RenderOptions
): Promise<RenderResult> {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error('No scenes provided');
  }

  const width = options.width;
  const height = options.height;
  const outDirAbs = path.resolve(options.outDir);
  const jobDir = path.join(outDirAbs, `${options.fileBaseName}`);
  await ensureDir(jobDir);

  // 1) Generate one PNG per scene
  const imageFiles: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const file = path.join(jobDir, `scene_${String(i + 1).padStart(3, '0')}.png`);
    await writeImageForScene(scenes[i], width, height, file, options.showText ?? false);
    imageFiles.push(file);
  }

  // total duration for audio/music and filters
  const durationSeconds = scenes.reduce((acc, s) => acc + Math.max(3, Math.round(s.duration || 5)), 0);

  // 2) Build ffmpeg args using -loop 1 per image and concat filter (with optional Ken Burns)
  const outputMp4 = path.join(outDirAbs, `${options.fileBaseName}.mp4`);
  const inputArgs: string[] = [];
  const scalePad = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x0f172a,setsar=1`;
  const kb = (i: number, dur: number) => `zoompan=z='min(zoom+0.0004,1.04)':x='iw*(zoom-1)/2':y='ih*(zoom-1)/2':d=${dur*20}:fps=20,${scalePad}[v${i}]`;
  const staticChain = (i: number) => `${scalePad}[v${i}]`;
  const filterParts: string[] = [];
  const labels: string[] = [];
  scenes.forEach((scene, idx) => {
    const dur = Math.max(3, Math.round(scene.duration || 5));
    inputArgs.push('-loop', '1', '-t', String(dur), '-i', imageFiles[idx]);
    if (options.kenBurns ?? true) {
      filterParts.push(`[${idx}:v]${kb(idx, dur)}`);
    } else {
      filterParts.push(`[${idx}:v]${staticChain(idx)}`);
    }
    labels.push(`[v${idx}]`);
  });
  const videoFilter = `${filterParts.join(';')};${labels.join('')}concat=n=${labels.length}:v=1:a=0,format=yuv420p[v]`;
  const baseVideoFlags = ['-r', '20', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];

  // Optional TTS narration
  let audioPath: string | null = null;
  if (options.ttsText && options.ttsText.trim().length > 0) {
    try {
      audioPath = path.join(jobDir, 'narration.wav');
      await synthesizeSpeechToWav(options.ttsText, audioPath, options.ttsVoice);
    } catch (e) {
      audioPath = null; // continue without audio
    }
  }

  // Background music choice and volume
  const bgChoice = options.backgroundMusic ?? 'sine';
  const musicDb = options.musicVolumeDb ?? -26;
  const musicLinear = Math.pow(10, musicDb / 20).toFixed(4);

  const N = scenes.length; // index offset for dynamic inputs after images
  let ffArgs: string[] = [];

  if (audioPath && bgChoice !== 'none') {
    // images + lavfi bg + narration, mix audio
    const bgSrc = bgChoice === 'sine' ? 'sine=frequency=220:sample_rate=44100' : 'anoisesrc=color=pink:amplitude=0.2:sample_rate=44100';
    const combinedFilter = `${videoFilter};` +
      `[${N}:a]volume=${musicLinear}[bg];` +
      `[${N+1}:a]anull[narr];` +
      `[bg][narr]amix=inputs=2:duration=shortest:dropout_transition=0[a]`;

    ffArgs = [
      '-y',
      ...inputArgs,
      '-f', 'lavfi', '-t', String(durationSeconds), '-i', bgSrc,
      '-i', audioPath,
      '-filter_complex', combinedFilter,
      '-map', '[v]',
      '-map', '[a]',
      ...baseVideoFlags,
      '-c:a', 'aac', '-b:a', '128k',
      '-shortest',
      outputMp4,
    ];
  } else if (audioPath && bgChoice === 'none') {
    // images + narration only
    ffArgs = [
      '-y',
      ...inputArgs,
      '-i', audioPath,
      '-filter_complex', videoFilter,
      '-map', '[v]',
      '-map', `${N}:a`,
      ...baseVideoFlags,
      '-c:a', 'aac', '-b:a', '128k',
      '-shortest',
      outputMp4,
    ];
  } else if (!audioPath && bgChoice !== 'none') {
    // images + background only
    const bgSrc = bgChoice === 'sine' ? 'sine=frequency=220:sample_rate=44100' : 'anoisesrc=color=pink:amplitude=0.2:sample_rate=44100';
    const combinedFilter = `${videoFilter};[${N}:a]volume=${musicLinear}[a]`;
    ffArgs = [
      '-y',
      ...inputArgs,
      '-f', 'lavfi', '-t', String(durationSeconds), '-i', bgSrc,
      '-filter_complex', combinedFilter,
      '-map', '[v]',
      '-map', '[a]',
      ...baseVideoFlags,
      '-c:a', 'aac', '-b:a', '128k',
      '-shortest',
      outputMp4,
    ];
  } else {
    // silent
    ffArgs = [
      '-y',
      ...inputArgs,
      '-filter_complex', videoFilter,
      '-map', '[v]',
      ...baseVideoFlags,
      outputMp4,
    ];
  }

  await runFfmpeg(ffArgs);

  // 4) Choose first image as thumbnail
  const thumbPath = path.join(outDirAbs, `${options.fileBaseName}.thumb.jpg`);
  await sharp(imageFiles[0]).jpeg({ quality: 85 }).toFile(thumbPath);

  // 6) Best-effort cleanup of jobDir images but keep inputs for debugging
  try {
    // keep generated images for now; optionally clean with: await fs.rm(jobDir, { recursive: true, force: true });
    if (!fssync.existsSync(outputMp4)) {
      throw new Error('Video file not created');
    }
  } catch (e) {
    // ignore
  }

  return {
    filePath: outputMp4,
    durationSeconds,
    thumbnailPath: thumbPath,
  };
}

async function synthesizeSpeechToWav(text: string, outPath: string, voice?: string): Promise<void> {
  // Windows-only using System.Speech; on other OS this will throw
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-Command',
      'Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; if ($args.Length -gt 0) { $s.SelectVoice($args[0]) }; $s.Rate = 0; $s.Volume = 100; $s.SetOutputToWaveFile($args[1]); $null = $s.Speak([Console]::In.ReadToEnd()); $s.Dispose();'
    , voice ? voice : '', outPath]);
    let finished = false;
    ps.on('error', (err) => {
      if (!finished) {
        finished = true;
        reject(err);
      }
    });
    ps.on('close', (code) => {
      if (!finished) {
        finished = true;
        if (code === 0) resolve(); else reject(new Error('TTS process failed'));
      }
    });
    ps.stdin.write(text);
    ps.stdin.end();
  });
}


