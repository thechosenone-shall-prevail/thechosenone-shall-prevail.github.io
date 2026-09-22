// CLASSIFIED THREAT INTELLIGENCE & RESEARCH DOSSIERS
// Technical writeups authored by Sameer Shah

const technicalArticles = {
    'meedr-bleeder': {
        title: 'MEEDR Bleeder: Circumventing ManageEngine EDR Minifilter From Ring 0 & User-Mode',
        date: 'March 2026',
        readTime: '15 min read',
        tag: 'Kernel Evasion · Ring 0 · BYOVD',
        classification: 'VENDOR ACKNOWLEDGED (ZOHO)',
        abstract: 'Production findings against ManageEngine UEMS/EDR v1.0.80.10 under maximum enterprise detection policy. Details a semantic comparison flaw in the anti-ransomware minifilter (MEARWFltDriver.sys) permitting silent shadow-copy destruction, paired with a Ring 0 BYOVD daemon-kill chain via CVE-2023-52271.',
        content: `
            <div class="dossier-header-block">
                <div class="dossier-stamp">DECLASSIFIED // VENDOR COORDINATED</div>
                <h2>MEEDR Bleeder: Circumventing ManageEngine EDR Minifilter From Ring 0 & User-Mode</h2>
                <div class="dossier-meta-grid">
                    <div><span>TARGET:</span> ManageEngine UEMS / EDR v1.0.80.10</div>
                    <div><span>VENDOR:</span> Zoho Corporation (Acknowledged)</div>
                    <div><span>PRIMITIVES:</span> Minifilter Path Logic Flaw + Ring 0 BYOVD</div>
                    <div><span>SEVERITY:</span> CRITICAL (EDR Telemetry Blinding)</div>
                </div>
            </div>

            <h3>Executive Summary</h3>
            <p>
                During offensive security evaluation of ManageEngine Unified Endpoint Management & Security (UEMS) and EDR agent (<code>v1.0.80.10</code>), two critical vulnerabilities were identified and weaponized into an evasion chain capable of blinding endpoint telemetry and deleting system backup infrastructure without triggering alerts under maxed enterprise policies (Aggressive Detection, Kill Process, Deep AV, Decoy Files active).
            </p>

            <h3>Vector I — Minifilter Semantic Comparison Defect (Silent VSS Deletion)</h3>
            <p>
                ManageEngine deploys a kernel-mode filesystem minifilter driver (<code>MEARWFltDriver.sys</code>) registered at an altitude designed to intercept raw volume operations and protect Volume Shadow Copies (VSS) from malicious deletion (a primary ransomware indicator).
            </p>
            <p>
                When a process issues <code>DeviceIoControl</code> with the control code <code>IOCTL_VOLSNAP_DELETE_SNAPSHOT</code> (<code>0x534038</code>), the driver's I/O dispatch routine attempts to validate the target snapshot device path against protected base volume paths.
            </p>
            <p>
                Reverse-engineering the dispatch routine in Ghidra revealed a catastrophic semantic logic error:
            </p>

            <pre><code class="language-c">// Decompiled driver logic excerpt: MEARWFltDriver.sys
NTSTATUS PreDeviceIoControl(PFLT_CALLBACK_DATA Data) {
    if (IoControlCode == IOCTL_VOLSNAP_DELETE_SNAPSHOT) {
        // Target path extracted from IRP buffer:
        // e.g. "\\Device\\HarddiskVolumeShadowCopy20"
        PWCHAR TargetBuffer = (PWCHAR)Data->Iopb->Parameters.DeviceIoControl.Type3InputBuffer;
        
        // Base volume path:
        // e.g. "\\Device\\HarddiskVolume3"
        PWCHAR BaseVolume = VolumeContext->VolumeName.Buffer;

        // DEFECT: Using wcsstr to verify if base volume string is contained inside shadow copy path:
        if (wcsstr(TargetBuffer, BaseVolume) != NULL) {
            // Match found -> block snapshot deletion
            Data->IoStatus.Status = STATUS_ACCESS_DENIED;
            return FLT_PREOP_COMPLETE;
        }
    }
    // Comparison failed -> allow I/O request to pass down driver stack
    return FLT_PREOP_SUCCESS_NO_CALLBACK;
}</code></pre>

            <p>
                Because <code>\\Device\\HarddiskVolumeShadowCopy20</code> never contains the substring <code>\\Device\\HarddiskVolume3</code>, <code>wcsstr()</code> evaluates to <code>NULL</code> on every shadow-copy deletion attempt. The blocking logic never executes. An adversary can cleanly delete all volume snapshots via raw IOCTLs without a single alert emitted to the central SIEM.
            </p>

            <div class="code-preview-box">
                <div class="code-preview-title">Kernel DebugView Verification Trace</div>
                <pre><code>[Kernel DebugView - MEARWFltDriver.sys]
Buffer : 70 D\\Device\\HarddiskVolumeShadowCopy20
VolumeName : \\Device\\HarddiskVolume3
Mismatch                           <-- Semantic check fails
[VSS snapshot 20 DELETED SILENTLY]

Positive Control Verification:
Buffer : 48 \\Device\\HarddiskVolume3
Matched perfectly
IOCTL_VOLSNAP_DELETE_SNAPSHOT BLOCKED (STATUS_ACCESS_DENIED)</code></pre>
            </div>

            <h3>Vector II — Ring 0 Telemetry Severance via BYOVD (CVE-2023-52271)</h3>
            <p>
                To eliminate real-time process monitoring, file integrity monitoring, and network callbacks, user-mode tampering was combined with a Bring Your Own Vulnerable Driver (BYOVD) primitive.
            </p>
            <ol>
                <li><strong>Reflective In-Memory Stager:</strong> Embedded inside a signed, trusted host binary (<code>powershell.exe</code>) avoiding disk-drop artifacts.</li>
                <li><strong>Driver Weaponization:</strong> The signed vulnerable driver <code>wsftprm.sys</code> (CVE-2023-52271) was dropped and registered via service control manager.</li>
                <li><strong>Kernel Termination Sweep:</strong> An arbitrary kernel memory write / call primitive was leveraged to invoke <code>ZwTerminateProcess</code> directly from Ring 0 against the entire ManageEngine process tree:
                    <ul>
                        <li><code>cmdAgent.exe</code> (Communication Agent)</li>
                        <li><code>udrAgent.exe</code> (EDR Engine)</li>
                        <li><code>fwsys.exe</code> (Host Firewall Daemon)</li>
                    </ul>
                </li>
            </ol>
            <p>
                Because execution originated from within the kernel context (Ring 0), the user-mode hook protections and process self-defense mechanisms enforced by the agent could not intercept the termination signal.
            </p>

            <h3>Vendor Disclosure & Timeline</h3>
            <p>
                Findings, reproduction steps, kernel debug logs, and remediation guidance were submitted to the Zoho Security Team. The vendor confirmed the behavioral gap in the minifilter string comparison and initiated patch engineering for subsequent enterprise releases.
            </p>
        `
    },

    'burning-sun': {
        title: 'Burning Sun: Windows Defender Signature Pipeline Race Condition to SYSTEM',
        date: 'April 2026',
        readTime: '18 min read',
        tag: 'Windows LPE · 0-Day · Kernel Internals',
        classification: '0-DAY // ACTIVE RESEARCH',
        abstract: 'Local privilege escalation vulnerability chain targeting Windows Defender real-time protection signature updates. Exploits an unprivileged race condition using Cloud Files API placeholders, NTFS oplocks, and Storage Tiering COM junction redirection to achieve arbitrary NT AUTHORITY\\SYSTEM code execution.',
        content: `
            <div class="dossier-header-block">
                <div class="dossier-stamp">CLASSIFIED // RESEARCH DISCLOSURE</div>
                <h2>Burning Sun: Windows Defender Signature Pipeline Race Condition to SYSTEM</h2>
                <div class="dossier-meta-grid">
                    <div><span>TARGET:</span> Windows Defender Real-Time Protection Engine</div>
                    <div><span>VECTOR:</span> Cloud Files API + NTFS Oplock + Storage Tiering COM</div>
                    <div><span>PRIVILEGE:</span> Low-Privilege User -> NT AUTHORITY\\SYSTEM</div>
                    <div><span>STATUS:</span> Unpatched (As of April 2026)</div>
                </div>
            </div>

            <h3>Vulnerability Overview</h3>
            <p>
                <code>Burning Sun</code> is a weaponized Local Privilege Escalation (LPE) chain exploiting a Time-of-Check to Time-of-Use (TOCTOU) file-system race condition in the Windows Defender signature staging engine. By chaining Windows Cloud Files filter callbacks with opportunistic locks (oplocks) and COM junction redirection, an unprivileged user can force the elevated Defender service (<code>MsMpEng.exe</code>) to write arbitrary payloads into protected system paths, including <code>C:\\Windows\\System32</code>.
            </p>

            <h3>The Attack Chain</h3>

            <h4>Phase 1: Cloud Files API Placeholder Staging</h4>
            <p>
                The exploit creates a virtual filesystem sync root utilizing the Windows Cloud Files API (<code>cfapi.dll</code>). Files in this directory exist as sparse hydration placeholders. When an external process touches the file, the filesystem filter halts the read/write request and fires a user-mode callback to the sync provider.
            </p>

            <h4>Phase 2: The Signature Extraction Race</h4>
            <p>
                During routine signature definition decompression or real-time file scanning, <code>MsMpEng.exe</code> operates under <code>NT AUTHORITY\\SYSTEM</code> privileges. When it attempts to scan or extract unpacked signatures into a temporary working folder, it issues standard Win32 <code>CreateFileW</code> calls.
            </p>

            <pre><code class="language-cpp">// Pseudocode exploit primitive
// Set an exclusive opportunistic lock on the target directory/placeholder
HANDLE hTarget = CreateFileW(
    L"C:\\Users\\Operator\\AppData\\Local\\Temp\\DefStage.tmp",
    GENERIC_READ | GENERIC_WRITE,
    FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
    NULL,
    OPEN_EXISTING,
    FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OVERLAPPED,
    NULL
);

REQUEST_OPLOCK_INPUT_BUFFER inputBuf = { 0 };
REQUEST_OPLOCK_OUTPUT_BUFFER outputBuf = { 0 };
inputBuf.StructureVersion = REQUEST_OPLOCK_CURRENT_VERSION;
inputBuf.StructureLength = sizeof(inputBuf);
inputBuf.RequestedOplockLevel = OPLOCK_LEVEL_CACHE_READ | OPLOCK_LEVEL_CACHE_HANDLE;

// DeviceIoControl halts execution the instant MsMpEng touches the target
DeviceIoControl(hTarget, FSCTL_REQUEST_OPLOCK, &inputBuf, sizeof(inputBuf), ...);</code></pre>

            <h4>Phase 3: Junction Redirection & Storage Tiering COM Abuse</h4>
            <p>
                The moment <code>MsMpEng</code> initiates file creation, the oplock breaks. The thread is held in a wait state inside the kernel. While execution is frozen:
            </p>
            <ol>
                <li>The exploit replaces the temporary directory with an NTFS mount point (reparse point) pointing to <code>\\RPC Control\\</code>.</li>
                <li>An object manager symbolic link is established between the expected temporary file name and a protected DLL location in <code>C:\\Windows\\System32\\</code>.</li>
                <li>The oplock is released, causing <code>MsMpEng</code> to complete the write directly into <code>System32</code> with SYSTEM privileges.</li>
                <li>A secondary trigger invokes a COM server (e.g. Storage Tiering Engine or Windows Update orchestrator) that loads the newly dropped DLL, delivering immediate arbitrary code execution as <code>NT AUTHORITY\\SYSTEM</code>.</li>
            </ol>

            <h3>Impact & Defense Mitigations</h3>
            <p>
                This flaw demonstrates that real-time security scanners that parse untrusted files or update definitions in world-writable temp directories remain susceptible to filesystem redirection primitives unless strict non-reparse point checking and transaction isolation are enforced.
            </p>
        `
    },

    'ad-advanced': {
        title: 'Active Directory Advanced Attacks: GPO, Delegation, and Persistence',
        date: 'February 2025',
        readTime: '70 min read',
        tag: 'Active Directory · Attack Graphs · Kerberos',
        classification: 'TACTICAL REFERENCE',
        abstract: 'Comprehensive reference manual on the modern Active Directory attack surface. Architectural deep dives into GPO abuse pipelines, Kerberos unconstrained/constrained/RBCD delegation, NTLM relay mechanics across SMB/HTTP/LDAP, and the complete Kerberos ticket family (Golden, Silver, Diamond, Sapphire).',
        content: `
            <div class="dossier-header-block">
                <div class="dossier-stamp">TACTICAL MANUAL // OPERATIONAL FIELD GUIDE</div>
                <h2>Active Directory Advanced Attacks: GPO, Delegation, and Persistence</h2>
                <div class="dossier-meta-grid">
                    <div><span>DOMAIN:</span> Active Directory / Kerberos Infrastructure</div>
                    <div><span>FOCUS:</span> Trust Abuse, Delegation Chains & Attack Graphs</div>
                    <div><span>READING DURATION:</span> 70 Minutes Complete Reference</div>
                    <div><span>STATUS:</span> STANDARD ENGAGEMENT DOCTRINE</div>
                </div>
            </div>

            <h3>Operational Focus</h3>
            <ul>
                <li><strong>Group Policy Objects (GPO):</strong> Architecture, permission ACL enumeration, and covert execution pipelines.</li>
                <li><strong>Kerberos Delegation:</strong> Unconstrained, constrained (S4U2Self / S4U2Proxy), and Resource-Based Constrained Delegation (RBCD).</li>
                <li><strong>NTLM Relay Infrastructure:</strong> SMB-to-LDAP signing bypass, AD CS HTTP enrollment endpoints, and shadow credentials.</li>
                <li><strong>Advanced Kerberos Ticket Forgery:</strong> Golden, Silver, Diamond, and Sapphire tickets with operational tradecraft.</li>
                <li><strong>Replication Abuse:</strong> DCSync mechanics, DirSync filtering, and DCShadow rogue replication.</li>
            </ul>

            <h2>1. Group Policy Object (GPO) Architecture & Weaponization</h2>
            <p>
                GPOs represent the centralized configuration backbone of enterprise Windows domains. They are composed of two decoupled elements:
            </p>
            <ul>
                <li><strong>Group Policy Container (GPC):</strong> Stored in Active Directory LDAP (<code>CN=Policies,CN=System,DC=domain,DC=com</code>). Maintains version numbers, GUIDs, and link state.</li>
                <li><strong>Group Policy Template (GPT):</strong> Stored in SYSVOL (<code>\\\\domain\\SYSVOL\\domain\\Policies\\{GUID}</code>). Contains actual registry files (<code>Registry.pol</code>), scripts, and scheduled tasks.</li>
            </ul>

            <h3>GPO Abuse Primitives</h3>
            <p>
                When an operator identifies write permissions (<code>WriteProperty</code>, <code>WriteDacl</code>, <code>WriteOwner</code>, or <code>GenericWrite</code>) on a GPO, immediate escalation to all machines in the linked OU is achievable.
            </p>

            <pre><code class="language-powershell"># PowerView: Enumerate GPOs with anomalous write permissions
Get-DomainObjectAcl -SearchBase "CN=Policies,CN=System,DC=domain,DC=com" -ResolveGUIDs |
    Where-Object { 
        $_.ActiveDirectoryRights -match "WriteProperty|WriteDacl|WriteOwner|GenericAll|GenericWrite" -and
        $_.SecurityIdentifier -match "S-1-5-21-.*-(513|545|[0-9]{4,})" 
    }</code></pre>

            <p>
                Weaponization techniques include injecting Immediate Scheduled Tasks into <code>Machine\\Preferences\\ScheduledTasks\\ScheduledTasks.xml</code> running as <code>NT AUTHORITY\\SYSTEM</code> or modifying User Rights Assignment policies to grant <code>SeDebugPrivilege</code> or local administrative rights.
            </p>

            <h2>2. Kerberos Delegation Exploitation</h2>
            <p>
                Delegation allows a front-end service (e.g. web server) to impersonate a client when requesting resources from a back-end service (e.g. database).
            </p>

            <h3>A. Unconstrained Delegation</h3>
            <p>
                When a computer account has <code>TRUSTED_FOR_DELEGATION</code> set in <code>userAccountControl</code>, any user authenticating to it deposits their forwardable Ticket Granting Ticket (TGT) directly into the LSASS process memory of that server.
            </p>
            <p>
                By coercing authentication from a Domain Controller (e.g. via the PrinterBug / MS-RPRN or PetitPotam / MS-EFSR), the DC's machine account TGT is dumped from memory via Rubeus or Mimikatz, providing instant DCSync capability.
            </p>

            <h3>B. Constrained Delegation (S4U Extensions)</h3>
            <p>
                Constrained delegation limits impersonation to specific services listed in <code>msDS-AllowedToDelegateTo</code>. It leverages Microsoft's Kerberos extensions:
            </p>
            <ul>
                <li><strong>S4U2Self:</strong> Allows a service to obtain a TGS to itself on behalf of any user without requiring their password.</li>
                <li><strong>S4U2Proxy:</strong> Allows the service to present that TGS to obtain another TGS for the downstream target service specified in <code>msDS-AllowedToDelegateTo</code>.</li>
            </ul>

            <h3>C. Resource-Based Constrained Delegation (RBCD)</h3>
            <p>
                Unlike traditional delegation configured by Domain Admins, RBCD is configured on the <em>target</em> computer account via the <code>msDS-AllowedToActOnBehalfOfOtherIdentity</code> attribute. Any user with write access to this attribute (e.g., <code>GenericWrite</code> over a computer object) can register an attacker-controlled machine account and impersonate local administrative users against the target.
            </p>

            <h2>3. Advanced Ticket Forgery (Diamond & Sapphire)</h2>
            <p>
                While Golden Tickets forge a completely synthetic TGT using the <code>krbtgt</code> NTLM/AES key, modern EDR and Active Directory telemetry engines detect anomalous attributes (e.g., non-existent ticket request events, missing PAC signatures, mismatched ticket options).
            </p>
            <p>
                <strong>The Diamond Ticket:</strong> Rather than synthesizing a ticket from scratch, the operator requests a legitimate TGT from the KDC, decrypts it using the <code>krbtgt</code> key, surgically modifies the PAC to add high-privilege group SIDs (such as Enterprise Admins 519), re-signs the PAC, and re-encrypts the ticket. This produces a valid, KDC-issued timestamp and sequence structure that evades behavioral telemetry.
            </p>
            <p>
                <strong>The Sapphire Ticket:</strong> Leverages S4U2Self to obtain a genuine PAC for an elevated account (e.g., Domain Admin), and transplants that legitimate PAC into the operator's ticket, completely bypassing custom PAC-parsing heuristics.
            </p>

            <h2>4. Replication Attacks (DCSync & DCShadow)</h2>
            <p>
                <strong>DCSync:</strong> Simulates the Directory Replication Service (DRS) Remote Protocol (<code>MS-DRSR</code>) using <code>DSGetNCChanges</code>. Requires <code>DS-Replication-Get-Changes</code> and <code>DS-Replication-Get-Changes-All</code> permissions. Pulls password hashes (including <code>krbtgt</code>) directly from the DC without running code on the domain controller itself.
            </p>
            <p>
                <strong>DCShadow:</strong> Registers a temporary, rogue Domain Controller in the configuration partition and pushes directory changes (such as modifying <code>SIDHistory</code> or adding users to <code>Domain Admins</code>) directly via incoming replication. Because modifications arrive via replication traffic rather than standard LDAP writes, standard SIEM LDAP auditing triggers fail to generate alerts.
            </p>
        `
    },

    'disk-wiper': {
        title: 'Scorched Earth: Low-Level Windows Disk Wiper Mechanics in C',
        date: 'April 2025',
        readTime: '20 min read',
        tag: 'Low-Level Internals · Win32 I/O · Storage Subsystem',
        classification: 'TECHNICAL ANALYSIS',
        abstract: 'Engineering analysis of raw volume and physical disk I/O manipulation in Windows. Examines how user-mode applications bypass filesystem abstraction layers to overwrite Master Boot Records (MBR), GUID Partition Tables (GPT), and Volume Boot Records, along with kernel-level telemetry and defensive interception models.',
        content: `
            <div class="dossier-header-block">
                <div class="dossier-stamp">TECHNICAL ANALYSIS // DEFENSIVE RESEARCH</div>
                <h2>Scorched Earth: Low-Level Windows Disk Wiper Mechanics in C</h2>
                <div class="dossier-meta-grid">
                    <div><span>SUBSYSTEM:</span> Win32 Raw Disk I/O & Storage Stack</div>
                    <div><span>PRIMITIVES:</span> CreateFileW PhysicalDrive, IOCTL_DISK Manipulation</div>
                    <div><span>TARGET STRUCTURES:</span> MBR (Sector 0), GPT (Sectors 1-33), VBR</div>
                    <div><span>DEFENSIVE RELEVANCE:</span> Storage Minifilter Telemetry & EDR Drivers</div>
                </div>
            </div>

            <div class="classified-alert-box">
                <strong>OPERATIONAL DISCLOSURE:</strong> This technical analysis investigates the mechanics of raw physical sector destruction observed in modern destructive cyber weapons (NotPetya, HermeticWiper, WhisperGate). All analysis is conducted from an engineering perspective to inform kernel minifilter detection and storage telemetry rules.
            </div>

            <h3>1. Direct Physical Drive Access Without Filesystem Meddling</h3>
            <p>
                Windows abstracts storage via the NTFS/ReFS filesystems, enforcing file-level Discretionary Access Control Lists (DACLs). However, Win32 exposes device paths that allow elevated processes to interface directly with physical sector blocks:
            </p>

            <pre><code class="language-c">// Direct handle acquisition to the primary system disk
HANDLE hDisk = CreateFileW(
    L"\\\\.\\PhysicalDrive0",
    GENERIC_READ | GENERIC_WRITE,
    FILE_SHARE_READ | FILE_SHARE_WRITE,
    NULL,
    OPEN_EXISTING,
    0,
    NULL
);

if (hDisk == INVALID_HANDLE_VALUE) {
    // Requires SE_RESTORE_NAME / Local Administrator privileges
    return GetLastError();
}</code></pre>

            <p>
                When a handle is acquired to <code>\\\\.\\PhysicalDrive0</code>, every subsequent read/write call traverses directly through <code>partmgr.sys</code>, <code>disk.sys</code>, and the storage port driver, entirely bypassing the file system layer (<code>ntfs.sys</code>). Filesystem permissions are completely irrelevant at this layer.
            </p>

            <h3>2. Annihilation of Partition Architecture (MBR & GPT)</h3>
            <p>
                The storage controller relies on predefined structures at the head of the physical medium to locate OS loaders and volume partitions:
            </p>

            <h4>A. Sector 0 — Master Boot Record (MBR)</h4>
            <p>
                The initial 512 bytes of the drive house the bootcode, the 4-entry primary partition table, and the boot signature <code>0x55AA</code> at offsets 510–511. Zeroing Sector 0 destroys partition offset references for legacy BIOS systems.
            </p>

            <h4>B. Sectors 1 through 33 — GUID Partition Table (GPT)</h4>
            <p>
                Modern UEFI systems store partition coordinates in the primary GPT header (Sector 1) and partition entries (Sectors 2–33). A secondary backup copy is stored at the physical end of the disk.
            </p>

            <pre><code class="language-c">// Zeroing Primary GPT Structures
LARGE_INTEGER seekOffset;
seekOffset.QuadPart = 512; // Sector 1

// Seek to GPT Header
SetFilePointerEx(hDisk, seekOffset, NULL, FILE_BEGIN);

// Zero primary header + 128 partition array entries
DWORD bytesWritten = 0;
BYTE zeroBuffer[512 * 33] = { 0 };
WriteFile(hDisk, zeroBuffer, sizeof(zeroBuffer), &bytesWritten, NULL);</code></pre>

            <h3>3. The First Megabyte Cryptographic Overwrite</h3>
            <p>
                Targeting the initial 1MB (256 blocks of 4KB) with pseudo-random high-entropy bytes destroys:
            </p>
            <ul>
                <li>The Volume Boot Record (VBR) and BIOS Parameter Block (BPB).</li>
                <li>EFI System Partition (ESP) bootloaders (<code>bootmgfw.efi</code>).</li>
                <li>Master File Table (MFT) mirror pointers.</li>
            </ul>
            <p>
                Because high-entropy pseudo-random bytes are written instead of zeros, the destroyed sectors simulate encrypted blocks, complicating incident response and file recovery.
            </p>

            <h3>4. Defensive Telemetry & Minifilter Interception</h3>
            <p>
                Defensive engineering against low-level wipers relies on:
            </p>
            <ol>
                <li><strong>Kernel Altitude Interception:</strong> Minifilters registered on volume stacks intercepting <code>IRP_MJ_CREATE</code> targeting <code>\\Device\\Harddisk*</code> from unverified user processes.</li>
                <li><strong>IOCTL Monitoring:</strong> Flagging calls to <code>IOCTL_DISK_GET_DRIVE_LAYOUT_EX</code>, <code>FSCTL_LOCK_VOLUME</code>, and <code>FSCTL_DISMOUNT_VOLUME</code>.</li>
                <li><strong>Protected Process Light (PPL):</strong> Isolating endpoint protection services to prevent wiper processes from disabling security agents prior to disk destruction.</li>
            </ol>
        `
    }
};

// Expose globally
window.technicalArticles = technicalArticles;
