import {
  spawn,
  exec,
  type ChildProcessWithoutNullStreams,
} from "child_process";
import path from "path";

const pythonScriptPath: string = path.join(
  process.cwd(),
  "src",
  "stream_rssi.py",
);

const LOCK_THRESHOLD = -75; // Anything weaker (e.g., -76 to -90) triggers the lock
const WINDOW_SIZE = 5; // Number of signals to average out (prevents accidental locks)

const rssiHistory: number[] = [];
let isWorkstationLocked = false;

console.log("Proximity Lock Engine: ACTIVE");
console.log(`Desk Baseline: ~ -40 dBm`);
console.log(`Lock Threshold set to: ${LOCK_THRESHOLD} dBm`);
console.log("------------------------------------------------------------");

const pythonWorker: ChildProcessWithoutNullStreams = spawn("python", [
  pythonScriptPath,
]);

pythonWorker.stdout.on("data", (data: Buffer) => {
  const cleanOutput: string = data.toString().trim();
  const lines: string[] = cleanOutput.split(/\r?\n/);

  lines.forEach((line: string) => {
    const rssi: number = parseInt(line, 10);

    if (!isNaN(rssi)) {
      rssiHistory.push(rssi);
      if (rssiHistory.length > WINDOW_SIZE) rssiHistory.shift(); // Remove oldest reading

      const sum = rssiHistory.reduce((acc, val) => acc + val, 0);
      const rollingAverage = Math.round(sum / rssiHistory.length);

      console.log(
        `[Signal] Live: ${rssi} dBm | Smoothed Avg: ${rollingAverage} dBm`,
      );

      if (rollingAverage <= LOCK_THRESHOLD && !isWorkstationLocked)
        triggerWindowsLock();
      else if (rollingAverage > LOCK_THRESHOLD) isWorkstationLocked = false;
    }
  });
});

/**
 * Fires the native Windows API call to lock the screen instantly
 */
function triggerWindowsLock(): void {
  isWorkstationLocked = true;
  console.log("\n[ALERT] Signal threshold breached! Walking away detected.");
  console.log("Locking Windows Workstation...");

  exec("rundll32.exe user32.dll,LockWorkStation", (error) => {
    if (error) console.error(`Failed to lock workstation: ${error.message}`);
    else {
      console.log("Workstation successfully locked.\n");
      rssiHistory.length = 0;
    }
  });
}

pythonWorker.stderr.on("data", (data: Buffer) => {
  console.error(`[Sensor Error]: ${data.toString()}`);
});

pythonWorker.on("close", (code: number | null) => {
  console.log(`\nSensor went offline. Exit Code: ${code}`);
});
