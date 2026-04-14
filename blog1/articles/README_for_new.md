# Educational Disk Wiper (Scorched Earth)

**⚠️ DISCLAIMER: This project is strictly for educational purposes and malware analysis research. DO NOT run this on your host machine or any system you care about. ONLY execute this inside an isolated Virtual Machine (VM). Running this will destroy your data, partition topology, and render the system fully unbootable. The author is not responsible for any damage caused by the misuse of this code. ⚠️**

## Overview

This repository contains a simple proof-of-concept disk wiper written in C. It is designed to demonstrate how user-mode applications can interact directly with low-level disk structures on Windows systems. By exploring this codebase, security researchers and students can learn about Win32 API hardware interactions, raw disk I/O, and the fragility of vital boot structures such as the Master Boot Record (MBR) and the GUID Partition Table (GPT).

This project was developed for a technical blog post to illustrate the mechanics behind destructive malware (wipers) so that security professionals can better understand how to analyze, detect, and mitigate such threats.

## How It Works: The Low-Level Mechanics

The application begins with a deceptive user interface (prompt) before moving into its payload if the user makes a specific choice. When executing the payload (`ExecuteScorchedEarth`), the program uses direct disk I/O to overwrite critical sections of the primary physical drive. Here is a step-by-step breakdown of its internal mechanics:

### 1. Acquiring Raw Disk Access
The program utilizes the standard Win32 `CreateFileW` API to get a handle to the first physical drive:
```c
HANDLE hDisk = CreateFileW(L"\\\\.\\PhysicalDrive0", 
    GENERIC_READ | GENERIC_WRITE, 
    ...
```
In Windows, the path `\\.\PhysicalDrive0` represents the primary hard disk (the drive that typically holds the OS and bootmgr). Accessing this device directly completely bypasses the file system (NTFS, FAT32) and targets the raw, physical sectors of the storage device. By design, modern Windows OS restricts this action; therefore, it strictly requires elevated (Administrator) privileges.

### 2. Obliterating the Boot Structures (MBR and GPT)
The first destructive phase involves neutralizing the disk's partition and boot information using `SetFilePointerEx` to navigate raw offsets:
*   **MBR Wipe (Sector 0):** The Master Boot Record (first 512 bytes) is overwritten with zeros. This destroys legacy bootcode and the MBR partition table.
*   **GPT Header & Table Wipe (Sectors 1-33):** Modern systems use UEFI and the GUID Partition Table. The wiper overwrites the primary GPT header (Sector 1) and the GPT array (Sectors 2-33). By erasing this, the OS instantly loses the layout and boundaries of all partitions on the disk.

### 3. The First Megabyte "Nuke"
The program iterates through the first 1 Megabyte (256 loops of 4KB segments) of the disk, writing completely random bytes generated via `rand()`. This is a common tactic in real-world wipers because the first 1MB holds critical boot structures, bootloader stages, and the beginnings of the primary partition's file system metadata (such as the NTFS Volume Boot Record). Once this area is randomized, bootstrap execution is impossible.

### 4. Hardware/Driver Interaction (Disk Geometry)
To perform scattered damage effectively, the wiper needs to know the boundaries (size) of the disk. It does this by communicating directly with the disk driver via an I/O Control (IOCTL) code:
```c
DeviceIoControl(hDisk, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX, ...)
```
This is an excellent example of user-to-kernel communication. The user-mode application sends an IOCTL command down to the kernel-mode storage driver to reliably retrieve hardware specifications (like the total sector count and disk size) across different Windows builds.

### 5. Scattered Sector Corruption
Using the total sector count retrieved via IOCTL, the wiper calculates 100 random sector offsets throughout the rest of the disk. It navigates to each of these random sectors and overwrites them with garbage data. Depending on where these overwrites land (e.g., inside the NTFS Master File Table, critical Windows Registry hives, or user files), it introduces sporadic, unpredictable, and devastating corruption across the drive, heavily frustrating forensic data recovery efforts.

## Key Win32 APIs Demonstrated

*   `CreateFileW`: Used to acquire a raw device handle rather than a standard file handle.
*   `SetFilePointerEx`: Used to navigate to exact byte offsets (and thus sector boundaries) on the raw physical disk.
*   `WriteFile`: Used to write the payload (zeros or random bytes) directly to the physical sectors.
*   `DeviceIoControl`: Used to query the underlying device driver for disk geometry data.

## Build Instructions

To compile this code, you will need a basic C compiler that supports the Windows API (e.g., GCC via MinGW, or MSVC via Visual Studio).

**Using GCC/MinGW:**
```cmd
gcc merged_game.c -o ScorchedEarth.exe
```

*Note: You must run the compiled executable as an Administrator for the disk-wiping functionality to work.*

## Execution Environment & Hardware Variances

It is important to note that different OEM hardware vendors (such as HP, Dell, Acer, etc.) pre-configure Windows with slightly different security defaults. Execution behavior on a Dell machine may vary from an Acer machine, for example, due to variations in Windows security features, OEM-specific endpoint protections, or strict default execution policies.

During testing with related payload delivery scripts (e.g., batch files), you may encounter active interference from these built-in defenses. In some cases, testing requires manually adjusting registry keys or temporarily disabling specific Windows security features to allow the payload to execute successfully. Keep these environmental variances in mind if the payload is blocked or fails to run, generally any way of delivery will warn or block it as it does not possess any evasion capabilities.
