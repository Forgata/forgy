import asyncio
import sys
from bleak import BleakScanner

# We switch from an unstable MAC address to your phone's broadcast name
TARGET_NAME = "Forgata"


def detection_callback(device, adv_data):
    # Check if the device has a name and matches "Forgata" (case-insensitive)
    if device.name and TARGET_NAME.lower() in device.name.lower():
        # Flush the RSSI directly to Node.js via stdout
        print(adv_data.rssi, flush=True)


async def main():
    # Pass our dynamic name-matching callback to the scanner
    scanner = BleakScanner(detection_callback=detection_callback)
    await scanner.start()

    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        await scanner.stop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
