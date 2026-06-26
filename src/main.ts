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
let pythonWorker: ChildProcessWithoutNullStreams | null = null;

console.log("Proximity Lock Engine: ACTIVE");
console.log("------------------------------------------------------------");

function startPythonSensor() {
  console.log("Initializing Bluetooth hardware link...");

  pythonWorker = spawn("python", [pythonScriptPath]);

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

        if (fs.existsSync(pauseFilePath)) {
          return;
        }

        if (rollingAverage <= LOCK_THRESHOLD && !isWorkstationLocked) {
          triggerWindowsLock();
        } else if (rollingAverage > LOCK_THRESHOLD) {
          isWorkstationLocked = false;
        }
      }
    });
  });

  pythonWorker.stderr.on("data", (data: Buffer) => {
    fs.appendFileSync(
      path.join(process.cwd(), "error.log"),
      `${new Date().toISOString()} - [Python Error]: ${data.toString().trim()}\n`,
    );
  });

  pythonWorker.on("close", (code) => {
    if (code !== 0 && fs.existsSync(pidFilePath)) {
      fs.appendFileSync(
        path.join(process.cwd(), "error.log"),
        `${new Date().toISOString()} - Hardware link dropped (Code ${code}). Reconnecting in 5s...\n`,
      );

      setTimeout(startPythonSensor, 5000);
    }
  });
}

function triggerWindowsLock(): void {
  isWorkstationLocked = true;
  exec("rundll32.exe user32.dll,LockWorkStation", (error) => {
    if (!error) {
      rssiHistory.length = 0;
    }
  });
}

process.on("exit", () => {
  if (fs.existsSync(pidFilePath)) fs.unlinkSync(pidFilePath);
});

startPythonSensor();
