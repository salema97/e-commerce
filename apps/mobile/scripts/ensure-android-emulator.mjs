#!/usr/bin/env node
/**
 * Ensures an Android emulator is running before Expo Android commands.
 * Skips when SKIP_ANDROID_EMULATOR=1 or when a device is already online.
 *
 * Env:
 *   ANDROID_HOME / ANDROID_SDK_ROOT — SDK root (default: D:\Development\Android on Windows)
 *   ANDROID_AVD — AVD name (default: first from `emulator -list-avds`)
 *   ANDROID_EMULATOR_BOOT_TIMEOUT_MS — boot wait timeout (default: 180000)
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const isWin = process.platform === 'win32';

function resolveSdkRoot() {
  const fromEnv = process.env.ANDROID_HOME?.trim() || process.env.ANDROID_SDK_ROOT?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates = [
    join(homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
    'D:\\Development\\Android',
    join(homedir(), 'Android', 'Sdk'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function bin(sdkRoot, name) {
  const sub = name === 'emulator' ? 'emulator' : 'platform-tools';
  const exe = isWin ? `${name}.exe` : name;
  return join(sdkRoot, sub, exe);
}

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: false,
    ...options,
  });
}

function listOnlineDevices(adbPath) {
  const result = run(adbPath, ['devices']);
  if (result.status !== 0) return [];

  return result.stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('*'))
    .filter((line) => /\tdevice$/.test(line))
    .map((line) => line.split('\t')[0]);
}

function listAvds(emulatorPath) {
  const result = run(emulatorPath, ['-list-avds']);
  if (result.status !== 0) return [];
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBoot(adbPath, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const devices = listOnlineDevices(adbPath);
    if (devices.length > 0) {
      const boot = run(adbPath, ['shell', 'getprop', 'sys.boot_completed']);
      if (boot.stdout.trim() === '1') return devices[0];
    }
    await sleep(2000);
  }

  throw new Error(`Emulator did not boot within ${timeoutMs}ms`);
}

function setupMetroPortForward(adbPath) {
  const metroPort = process.env.EXPO_METRO_PORT?.trim() || '8081';
  const result = run(adbPath, ['reverse', `tcp:${metroPort}`, `tcp:${metroPort}`]);
  if (result.status === 0) {
    console.log(`[android] adb reverse tcp:${metroPort} → host (Metro)`);
  }
}

async function main() {
  if (process.env.SKIP_ANDROID_EMULATOR === '1') {
    console.log('[android] SKIP_ANDROID_EMULATOR=1 — skipping emulator check');
    return;
  }

  const sdkRoot = resolveSdkRoot();
  if (!sdkRoot) {
    console.error(
      '[android] Android SDK not found. Set ANDROID_HOME (e.g. D:\\Development\\Android).',
    );
    process.exit(1);
  }

  const adbPath = bin(sdkRoot, 'adb');
  const emulatorPath = bin(sdkRoot, 'emulator');

  if (!existsSync(adbPath) || !existsSync(emulatorPath)) {
    console.error(`[android] adb/emulator missing under ${sdkRoot}`);
    process.exit(1);
  }

  const online = listOnlineDevices(adbPath);
  if (online.length > 0) {
    console.log(`[android] Device already online: ${online.join(', ')}`);
    setupMetroPortForward(adbPath);
    return;
  }

  const avds = listAvds(emulatorPath);
  const avd = process.env.ANDROID_AVD?.trim() || avds[0];
  if (!avd) {
    console.error('[android] No AVD found. Create one in Android Studio Device Manager.');
    process.exit(1);
  }

  console.log(`[android] Starting emulator AVD "${avd}"…`);

  const emulatorArgs = ['-avd', avd, '-no-snapshot-load'];
  const child = spawn(emulatorPath, emulatorArgs, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  const timeoutMs = Number(process.env.ANDROID_EMULATOR_BOOT_TIMEOUT_MS ?? '180000');
  const device = await waitForBoot(adbPath, timeoutMs);
  console.log(`[android] Emulator ready: ${device}`);
  setupMetroPortForward(adbPath);
}

main().catch((err) => {
  console.error(`[android] ${err.message}`);
  process.exit(1);
});
