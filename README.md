# Proximity Workstation Lock

A Windows background security system that locks the workstation when a configured Bluetooth device moves out of range.

A Python BLE scanner reads the target device RSSI and streams it to a TypeScript Node.js engine. The engine averages signal strength, watches for a pause lockfile, and calls Windows `LockWorkStation` when the device goes too far away.

## Architecture

- **Hardware Sensor:** Python 3 + `bleak`
- **Orchestrator:** Node.js + TypeScript
- **OS Integration:** Windows lock via `rundll32.exe user32.dll,LockWorkStation`
- **Startup / management:** `run.bat`, `silent.vbs`, `toggle.bat`, `kill.bat`

## Prerequisites

1. Windows 11 with Bluetooth support.
2. Node.js 16+ installed and on `PATH`.
3. Python 3.10+ installed and on `PATH`.
4. A BLE advertiser app such as nRF Connect on Android.

## Setup

### 1. Configure the BLE target

In `src/stream_rssi.py`, set `TARGET_NAME` to the target broadcast name:

```python
TARGET_NAME = "Forgata"
```

In nRF Connect Advertiser, include:

- device name
- TX power level
- a complete local name record

Make sure the phone advertises a name that matches `TARGET_NAME`.

### 2. Install dependencies

```powershell
pip install bleak
npm install
```

### 3. Build the TypeScript engine

```powershell
npm run build
```

### 4. Tune thresholds

Open `src/main.ts` and update these values as needed:

```ts
const LOCK_THRESHOLD = -75;
const WINDOW_SIZE = 5;
```

`LOCK_THRESHOLD` is the rolling average RSSI threshold that triggers the lock.
`WINDOW_SIZE` controls how many recent readings are averaged.

### 5. Run the engine manually

```powershell
node dist/main.js
```

The engine will spawn `python src/stream_rssi.py`, read RSSI values, print live and smoothed signal output, and lock Windows when the average crosses the threshold.

## Silent startup

To run silently at boot:

1. Press `Win + R`, enter `shell:startup`, and press Enter.
2. Create a shortcut to `silent.vbs` in the Startup folder.

`silent.vbs` launches `run.bat` hidden.
`run.bat` starts the built engine from `dist/main.js`.

## Controls

- `toggle.bat` — toggles `paused.lock`. While paused, signal tracking continues but locking is bypassed.
- `kill.bat` — reads `app.pid`, terminates the specific Node process, and removes `app.pid` and `paused.lock`.

## Notes

- `app.pid` is written to the repo root by `src/main.ts`.
- The engine expects `python` to be callable from the system path.
- If you want to verify scanning separately, run:

```powershell
python src/stream_rssi.py
```
