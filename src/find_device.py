import asyncio
from bleak import BleakScanner


async def main():
    print("Searching for your BossKey beacon... (Scanning for 10 seconds)")
    print("-" * 60)

    discovered_devices = await BleakScanner.discover(timeout=10.0, return_adv=True)

    found = False

    for address, (device, adv_data) in discovered_devices.items():
        name = device.name if device.name else "Unknown"
        if "BossKey" in name:
            print(f"FOUND IT!")
            print(f"Device Name: {name}")
            print(f"MAC Address: {address}")
            print(f"Current RSSI: {adv_data.rssi} dBm")
            print("-" * 60)
            found = True

    if not found:
        print("Could not find an exact match for 'BossKey'.")
        print("Dumping all nearby raw signals to verify what your PC can see:\n")
        print(f"{'Address (ID)':<25} {'RSSI':<10} {'Detected Name'}")
        print("-" * 60)

        sorted_devices = sorted(
            discovered_devices.items(), key=lambda item: item[1][1].rssi, reverse=True
        )

        for address, (device, adv_data) in sorted_devices:
            name = device.name if device.name else "Unknown/Hidden"
            print(f"{address:<25} {adv_data.rssi:<10} {name}")
        print("-" * 60)


if __name__ == "__main__":
    asyncio.run(main())
