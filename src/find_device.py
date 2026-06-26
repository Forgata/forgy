import asyncio
from bleak import BleakScanner


async def main():
    print("Searching for your BossKey beacon... (Scanning for 10 seconds)")
    print("-" * 60)

    # return_adv=True returns a dictionary of { address: (device, advertisement_data) }
    discovered_devices = await BleakScanner.discover(timeout=10.0, return_adv=True)

    found = False

    # 1. Look specifically for your configured phone beacon
    for address, (device, adv_data) in discovered_devices.items():
        name = device.name if device.name else "Unknown"
        if "BossKey" in name:
            print(f"🎉 FOUND IT!")
            print(f"Device Name: {name}")
            print(f"MAC Address: {address}")
            print(f"Current RSSI: {adv_data.rssi} dBm")
            print("-" * 60)
            found = True

    # 2. Fallback dump if it wasn't caught by the explicit name match
    if not found:
        print("Could not find an exact match for 'BossKey'.")
        print("Dumping all nearby raw signals to verify what your PC can see:\n")
        print(f"{'Address (ID)':<25} {'RSSI':<10} {'Detected Name'}")
        print("-" * 60)

        # Sort by signal strength so closest objects are at the top
        sorted_devices = sorted(
            discovered_devices.items(), key=lambda item: item[1][1].rssi, reverse=True
        )

        for address, (device, adv_data) in sorted_devices:
            name = device.name if device.name else "Unknown/Hidden"
            print(f"{address:<25} {adv_data.rssi:<10} {name}")
        print("-" * 60)


if __name__ == "__main__":
    asyncio.run(main())
