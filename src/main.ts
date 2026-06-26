import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import path from "path";

// Target the Python tracking script
const pythonScriptPath: string = path.join(
  process.cwd(),
  "src",
  "stream_rssi.py",
);

console.log("Starting Proximity Link Engine (TypeScript)...");
console.log("Listening for your Redmi Note 14 via background Python loop...");
console.log("------------------------------------------------------------");

// Spawn Python as a background worker process
const pythonWorker: ChildProcessWithoutNullStreams = spawn("python", [
  pythonScriptPath,
]);

// Listen to the data stream coming from Python's console (stdout)
pythonWorker.stdout.on("data", (data: Buffer) => {
  const cleanOutput: string = data.toString().trim();

  // Split output by newlines in case multiple readings arrive simultaneously
  const lines: string[] = cleanOutput.split(/\r?\n/);

  lines.forEach((line: string) => {
    const rssi: number = parseInt(line, 10);

    if (!isNaN(rssi)) {
      // TypeScript safely handles our incoming signal strength
      console.log(`[TS Engine] Live Phone Signal: ${rssi} dBm`);

      // TODO: Phase 3 distance filtration/lock command logic goes here
    }
  });
});

// Capture any structural Python errors
pythonWorker.stderr.on("data", (data: Buffer) => {
  console.error(`[Python Worker Error]: ${data.toString()}`);
});

// Handle sudden worker terminations cleanly
pythonWorker.on("close", (code: number | null) => {
  console.log(
    `\nProximity link broke. Worker process exited with code ${code}`,
  );
});
