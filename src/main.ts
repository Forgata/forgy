import {
  spawn,
  exec,
  type ChildProcessWithoutNullStreams,
} from "child_process";
import path from "path";
import fs from "fs";

const pythonScriptPath: string = path.join(
  process.cwd(),
  "src",
  "stream_rssi.py",
);
const pidFilePath: string = path.join(process.cwd(), "app.pid");
const pauseFilePath: string = path.join(process.cwd(), "paused.lock");

fs.writeFileSync(pidFilePath, process.pid.toString(), "utf-8");

if (fs.existsSync(pauseFilePath)) {
  fs.unlinkSync(pauseFilePath);
}

const LOCK_THRESHOLD = -75;
const WINDOW_SIZE = 5;

const rssiHistory: number[] = [];
let isWorkstationLocked = false;

console.log("Proximity Lock Engine: ACTIVE");
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
      if (rssiHistory.length > WINDOW_SIZE) {
        rssiHistory.shift();
      }

      const sum = rssiHistory.reduce((acc, val) => acc + val, 0);
      const rollingAverage = Math.round(sum / rssiHistory.length);

      const isPaused = fs.existsSync(pauseFilePath);

      if (isPaused) {
        console.log(
          `[PAUSED] Signal: ${rssi} dBm | Lock bypassed via lockfile.`,
        );
        return;
      }

      console.log(
        `[Signal] Live: ${rssi} dBm | Smoothed Avg: ${rollingAverage} dBm`,
      );

      if (rollingAverage <= LOCK_THRESHOLD && !isWorkstationLocked) {
        triggerWindowsLock();
      } else if (rollingAverage > LOCK_THRESHOLD) {
        isWorkstationLocked = false;
      }
    }
  });
});

function triggerWindowsLock(): void {
  isWorkstationLocked = true;
  exec("rundll32.exe user32.dll,LockWorkStation", (error) => {
    if (!error) {
      rssiHistory.length = 0;
    }
  });
}

pythonWorker.on("close", () => {
  if (fs.existsSync(pidFilePath)) fs.unlinkSync(pidFilePath);
});
