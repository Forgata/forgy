import asyncio
import sys
from bleak import BleakScanner

TARGET_NAME = "Forgata"


def detection_callback(device, adv_data):

    if device.name and TARGET_NAME.lower() in device.name.lower():

        print(adv_data.rssi, flush=True)


async def main():

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
