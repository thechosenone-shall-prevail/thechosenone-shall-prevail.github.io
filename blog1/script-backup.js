// Article Database with Full Technical Content
const articles = {
    'dns-deep-dive': {
        title: 'Understanding DNS: A Deep Dive into the Internet\'s Phone Book',
        date: 'January 15, 2025',
        readTime: '15 min read',
        tag: 'Networking',
        content: `
            <h1>Understanding DNS: A Deep Dive into the Internet's Phone Book</h1>
            
            <p>Every time you type a URL into your browser, a complex series of events occurs behind the scenes. The Domain Name System (DNS) is one of the internet's fundamental protocols, yet many people don't fully understand how it works. Let's dive deep into DNS, from basic queries to advanced security considerations.</p>

            <h2>What is DNS?</h2>
            
            <p>DNS is essentially the internet's phone book. Just like you use a phone book to look up someone's phone number by their name, DNS translates human-readable domain names (like google.com) into IP addresses (like 142.250.185.46) that computers use to identify each other on the network.</p>

            <p>Without DNS, you'd have to remember the IP address of every website you want to visit. Imagine trying to remember that Facebook is 31.13.72.36 or that Amazon is 54.239.28.85. Not very practical, right?</p>

            <h2>How DNS Works: The Query Process</h2>

            <p>When you type "example.com" into your browser, here's what happens:</p>

            <h3>1. Browser Cache Check</h3>
            <p>Your browser first checks its own cache to see if it recently looked up this domain. If found, it uses the cached IP address immediately.</p>

            <h3>2. Operating System Cache</h3>
            <p>If not in the browser cache, the OS checks its own DNS cache. On Linux, you can view this with:</p>

            <pre><code>$ sudo systemd-resolve --statistics</code></pre>

            <h3>3. Recursive Resolver Query</h3>
            <p>If still not found, your computer sends a query to a recursive DNS resolver (usually provided by your ISP or services like Google's 8.8.8.8 or Cloudflare's 1.1.1.1).</p>

            <h3>4. Root Name Server</h3>
            <p>The recursive resolver starts by querying one of the 13 root name servers. These servers don't know where example.com is, but they know where to find the .com top-level domain (TLD) servers.</p>

            <h3>5. TLD Name Server</h3>
            <p>The resolver then queries the .com TLD server, which responds with the authoritative name server for example.com.</p>

            <h3>6. Authoritative Name Server</h3>
            <p>Finally, the resolver queries the authoritative name server for example.com, which returns the IP address.</p>

            <h2>DNS Record Types</h2>

            <p>DNS supports various record types, each serving a different purpose:</p>

            <ul>
                <li><strong>A Record</strong>: Maps a domain to an IPv4 address</li>
                <li><strong>AAAA Record</strong>: Maps a domain to an IPv6 address</li>
                <li><strong>CNAME Record</strong>: Creates an alias for another domain</li>
                <li><strong>MX Record</strong>: Specifies mail servers for the domain</li>
                <li><strong>TXT Record</strong>: Stores text information (often used for SPF, DKIM)</li>
                <li><strong>NS Record</strong>: Specifies authoritative name servers</li>
                <li><strong>SOA Record</strong>: Start of Authority, contains domain administrative info</li>
                <li><strong>PTR Record</strong>: Reverse DNS lookup (IP to domain)</li>
            </ul>

            <h2>Practical DNS Commands</h2>

            <h3>Using dig (Domain Information Groper)</h3>
            <pre><code># Basic A record lookup
$ dig example.com

# Specific record type
$ dig example.com MX

# Trace full DNS resolution path
$ dig example.com +trace

# Query specific DNS server
$ dig @8.8.8.8 example.com

# Short answer only
$ dig example.com +short</code></pre>

            <h3>Using nslookup</h3>
            <pre><code># Basic lookup
$ nslookup example.com

# Query specific DNS server
$ nslookup example.com 1.1.1.1

# Interactive mode
$ nslookup
> set type=MX
> example.com</code></pre>

            <h3>Using host</h3>
            <pre><code># Simple lookup
$ host example.com

# All record types
$ host -a example.com

# Reverse lookup
$ host 93.184.216.34</code></pre>

            <h2>DNS Security Considerations</h2>

            <h3>DNS Spoofing/Cache Poisoning</h3>
            <p>Attackers can inject false DNS records into a resolver's cache, redirecting users to malicious sites. This is why DNSSEC (DNS Security Extensions) was developed.</p>

            <h3>DNS Zone Transfer</h3>
            <p>Zone transfers allow secondary DNS servers to replicate DNS records from primary servers. Misconfigured servers might allow unauthorized zone transfers, exposing all DNS records:</p>

            <pre><code># Attempt zone transfer
$ dig axfr @ns1.example.com example.com

# Using host
$ host -l example.com ns1.example.com</code></pre>

            <p>If successful, this reveals all subdomains and can be valuable for reconnaissance during penetration testing.</p>

            <h3>DNS Tunneling</h3>
            <p>Attackers can use DNS queries to exfiltrate data or establish command-and-control channels, bypassing firewalls that allow DNS traffic.</p>

            <h2>DNS in Penetration Testing</h2>

            <p>During reconnaissance, DNS enumeration is crucial:</p>

            <h3>Subdomain Enumeration</h3>
            <pre><code># Using dnsrecon
$ dnsrecon -d example.com -t std

# Using fierce
$ fierce -dns example.com

# Using amass
$ amass enum -d example.com</code></pre>

            <h3>DNS Brute Forcing</h3>
            <pre><code># Using dnsenum
$ dnsenum --enum example.com

# Using gobuster
$ gobuster dns -d example.com -w wordlist.txt</code></pre>

            <h2>Configuring Your Own DNS Server</h2>

            <p>Setting up a local DNS server can be useful for testing or privacy:</p>

            <pre><code># Install dnsmasq on Linux
$ sudo apt install dnsmasq

# Edit configuration
$ sudo nano /etc/dnsmasq.conf

# Add custom DNS entries
$ echo "192.168.1.100 myserver.local" | sudo tee -a /etc/hosts

# Restart service
$ sudo systemctl restart dnsmasq</code></pre>

            <h2>DNS Privacy: DNS over HTTPS (DoH) and DNS over TLS (DoT)</h2>

            <p>Traditional DNS queries are sent in plaintext, allowing ISPs and others to see what sites you're visiting. Modern solutions encrypt DNS queries:</p>

            <ul>
                <li><strong>DNS over HTTPS (DoH)</strong>: Sends DNS queries over HTTPS (port 443)</li>
                <li><strong>DNS over TLS (DoT)</strong>: Encrypts DNS queries using TLS (port 853)</li>
            </ul>

            <h3>Configuring DoH in Firefox</h3>
            <p>Firefox has built-in DoH support. Go to Settings → Network Settings → Enable DNS over HTTPS, and select a provider like Cloudflare or NextDNS.</p>

            <h3>System-wide DoT on Linux</h3>
            <pre><code># Using systemd-resolved
$ sudo nano /etc/systemd/resolved.conf

# Add these lines:
[Resolve]
DNS=1.1.1.1 9.9.9.9
DNSOverTLS=yes

# Restart service
$ sudo systemctl restart systemd-resolved</code></pre>

            <h2>Common DNS Issues and Troubleshooting</h2>

            <h3>DNS Propagation Delays</h3>
            <p>When you change DNS records, it can take 24-48 hours for changes to propagate globally. You can check propagation status at whatsmydns.net.</p>

            <h3>Clearing DNS Cache</h3>
            <pre><code># Windows
> ipconfig /flushdns

# macOS
$ sudo dscacheutil -flushcache

# Linux (systemd-resolved)
$ sudo systemd-resolve --flush-caches

# Linux (nscd)
$ sudo /etc/init.d/nscd restart</code></pre>

            <h2>Conclusion</h2>

            <p>DNS is a critical component of internet infrastructure. Understanding how it works not only helps you troubleshoot connectivity issues but is also essential for security testing and network analysis. Whether you're configuring servers, performing reconnaissance, or just browsing the web, DNS is working behind the scenes to make everything possible.</p>

            <p>Next time you type a URL, take a moment to appreciate the complex, distributed system that translates that friendly domain name into an IP address in milliseconds!</p>
        `
    },

    'vpn-explained': {
        title: 'How VPNs Actually Work: From Tunneling to Encryption',
        date: 'January 12, 2025',
        readTime: '12 min read',
        tag: 'Networking',
        content: `
            <h1>How VPNs Actually Work: From Tunneling to Encryption</h1>

            <p>Virtual Private Networks (VPNs) have become increasingly popular for privacy and security. But how do they actually work? Let's dive deep into the technology that makes VPNs possible.</p>

            <h2>What is a VPN?</h2>

            <p>A VPN creates a secure, encrypted connection between your device and a remote server. All your internet traffic is routed through this encrypted tunnel, making it appear as if you're browsing from the VPN server's location rather than your actual location.</p>

            <h2>Core Components of a VPN</h2>

            <h3>1. Tunneling</h3>
            <p>Tunneling is the process of encapsulating one network protocol within another. Your data is wrapped in additional headers that allow it to travel securely across the internet.</p>

            <p>Common VPN tunneling protocols:</p>
            <ul>
                <li><strong>OpenVPN</strong>: Open-source, highly configurable, supports TCP and UDP</li>
                <li><strong>WireGuard</strong>: Modern, fast, uses state-of-the-art cryptography</li>
                <li><strong>IPsec</strong>: Industry standard, often used for site-to-site VPNs</li>
                <li><strong>L2TP/IPsec</strong>: Layer 2 Tunneling Protocol with IPsec for security</li>
                <li><strong>PPTP</strong>: Point-to-Point Tunneling Protocol (legacy, not secure)</li>
            </ul>

            <h3>2. Encryption</h3>
            <p>Encryption scrambles your data so only authorized parties can read it. VPNs typically use:</p>

            <ul>
                <li><strong>AES-256</strong>: Advanced Encryption Standard with 256-bit keys (military-grade)</li>
                <li><strong>ChaCha20</strong>: Modern stream cipher used by WireGuard</li>
                <li><strong>RSA</strong>: For key exchange and authentication</li>
            </ul>

            <h3>3. Authentication</h3>
            <p>VPNs use various authentication methods to verify identity:</p>

            <ul>
                <li>Pre-shared keys (PSK)</li>
                <li>Digital certificates</li>
                <li>Username and password</li>
                <li>Two-factor authentication (2FA)</li>
            </ul>

            <h2>How VPN Traffic Flows</h2>

            <p>Here's what happens when you connect to a VPN:</p>

            <ol>
                <li><strong>VPN Client Initiation</strong>: Your device connects to the VPN server</li>
                <li><strong>Authentication</strong>: The server verifies your credentials</li>
                <li><strong>Key Exchange</strong>: Both parties establish encryption keys</li>
                <li><strong>Tunnel Establishment</strong>: A secure tunnel is created</li>
                <li><strong>Traffic Routing</strong>: All internet traffic goes through the tunnel</li>
                <li><strong>Decryption</strong>: The VPN server decrypts and forwards your requests</li>
                <li><strong>Return Path</strong>: Responses come back through the same tunnel</li>
            </ol>

            <h2>Setting Up Your Own VPN Server</h2>

            <h3>Using OpenVPN on Ubuntu</h3>

            <pre><code># Update system
$ sudo apt update && sudo apt upgrade -y

# Install OpenVPN and Easy-RSA
$ sudo apt install openvpn easy-rsa -y

# Set up PKI directory
$ make-cadir ~/openvpn-ca
$ cd ~/openvpn-ca

# Initialize PKI
$ ./easyrsa init-pki

# Build CA
$ ./easyrsa build-ca nopass

# Generate server certificate
$ ./easyrsa gen-req server nopass
$ ./easyrsa sign-req server server

# Generate Diffie-Hellman parameters
$ ./easyrsa gen-dh

# Generate HMAC signature
$ openvpn --genkey secret ta.key

# Copy files to OpenVPN directory
$ sudo cp pki/ca.crt pki/private/server.key pki/issued/server.crt \\
  pki/dh.pem ta.key /etc/openvpn/

# Create server configuration
$ sudo nano /etc/openvpn/server.conf</code></pre>

            <p>Basic server.conf:</p>

            <pre><code>port 1194
proto udp
dev tun

ca ca.crt
cert server.crt
key server.key
dh dh.pem
tls-auth ta.key 0

server 10.8.0.0 255.255.255.0
ifconfig-pool-persist /var/log/openvpn/ipp.txt

push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

keepalive 10 120
cipher AES-256-CBC
auth SHA256
user nobody
group nogroup
persist-key
persist-tun

status /var/log/openvpn/status.log
log-append /var/log/openvpn/openvpn.log
verb 3</code></pre>

            <pre><code># Enable IP forwarding
$ sudo nano /etc/sysctl.conf
# Uncomment: net.ipv4.ip_forward=1

$ sudo sysctl -p

# Configure firewall
$ sudo ufw allow 1194/udp
$ sudo ufw allow OpenSSH

# Add NAT rule
$ sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE

# Save iptables rules
$ sudo apt install iptables-persistent

# Start OpenVPN
$ sudo systemctl start openvpn@server
$ sudo systemctl enable openvpn@server</code></pre>

            <h3>Setting Up WireGuard (Modern Alternative)</h3>

            <p>WireGuard is faster and simpler than OpenVPN:</p>

            <pre><code># Install WireGuard
$ sudo apt install wireguard

# Generate keys
$ wg genkey | tee privatekey | wg pubkey > publickey

# Create server configuration
$ sudo nano /etc/wireguard/wg0.conf</code></pre>

            <p>wg0.conf:</p>

            <pre><code>[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = [SERVER_PRIVATE_KEY]

# Enable IP forwarding
PostUp = sysctl -w net.ipv4.ip_forward=1
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = [CLIENT_PUBLIC_KEY]
AllowedIPs = 10.0.0.2/32</code></pre>

            <pre><code># Start WireGuard
$ sudo wg-quick up wg0
$ sudo systemctl enable wg-quick@wg0

# Check status
$ sudo wg show</code></pre>

            <h2>VPN Protocols Comparison</h2>

            <table border="1" cellpadding="10">
                <tr>
                    <th>Protocol</th>
                    <th>Speed</th>
                    <th>Security</th>
                    <th>Compatibility</th>
                    <th>Use Case</th>
                </tr>
                <tr>
                    <td>WireGuard</td>
                    <td>Fastest</td>
                    <td>Excellent</td>
                    <td>Good</td>
                    <td>Modern VPN, best overall</td>
                </tr>
                <tr>
                    <td>OpenVPN</td>
                    <td>Good</td>
                    <td>Excellent</td>
                    <td>Excellent</td>
                    <td>Most compatible</td>
                </tr>
                <tr>
                    <td>IPsec/IKEv2</td>
                    <td>Very Good</td>
                    <td>Excellent</td>
                    <td>Good</td>
                    <td>Mobile devices</td>
                </tr>
                <tr>
                    <td>L2TP/IPsec</td>
                    <td>Moderate</td>
                    <td>Good</td>
                    <td>Very Good</td>
                    <td>Legacy systems</td>
                </tr>
                <tr>
                    <td>PPTP</td>
                    <td>Fast</td>
                    <td>Poor</td>
                    <td>Excellent</td>
                    <td>Avoid (insecure)</td>
                </tr>
            </table>

            <h2>VPN Security Considerations</h2>

            <h3>Kill Switch</h3>
            <p>A kill switch blocks all internet traffic if the VPN connection drops, preventing data leaks:</p>

            <pre><code># UFW-based kill switch
$ sudo ufw default deny outgoing
$ sudo ufw default deny incoming
$ sudo ufw allow out on tun0
$ sudo ufw allow out to [VPN_SERVER_IP] port [VPN_PORT]
$ sudo ufw enable</code></pre>

            <h3>DNS Leaks</h3>
            <p>Even with a VPN, DNS requests might leak. Test at dnsleaktest.com and configure DNS properly:</p>

            <pre><code># Force DNS through VPN (systemd-resolved)
$ sudo nano /etc/systemd/resolved.conf

[Resolve]
DNS=10.8.0.1
Domains=~.</code></pre>

            <h3>IPv6 Leaks</h3>
            <p>If your VPN doesn't support IPv6, disable it to prevent leaks:</p>

            <pre><code># Disable IPv6
$ sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1
$ sudo sysctl -w net.ipv6.conf.default.disable_ipv6=1</code></pre>

            <h2>Commercial vs Self-Hosted VPNs</h2>

            <h3>Commercial VPN Advantages:</h3>
            <ul>
                <li>Multiple server locations worldwide</li>
                <li>No setup required</li>
                <li>Shared IP addresses (better anonymity)</li>
                <li>Professional support</li>
            </ul>

            <h3>Self-Hosted VPN Advantages:</h3>
            <ul>
                <li>Complete control over your data</li>
                <li>No monthly fees after initial setup</li>
                <li>Customize encryption and protocols</li>
                <li>Dedicated IP address</li>
                <li>Learning experience</li>
            </ul>

            <h2>Testing Your VPN</h2>

            <pre><code># Check your IP address
$ curl ifconfig.me

# Detailed connection test
$ curl -s https://ipinfo.io/json

# DNS leak test
$ nslookup dnsleaktest.com

# WebRTC leak test (browser)
Visit: browserleaks.com/webrtc</code></pre>

            <h2>Conclusion</h2>

            <p>VPNs are powerful tools for privacy and security, but they're not magic bullets. Understanding how they work helps you use them effectively and troubleshoot issues. Whether you choose a commercial VPN or set up your own, make sure you understand the security implications and test thoroughly.</p>

            <p>For most users, a combination of a well-configured VPN, HTTPS Everywhere, and good security practices provides strong privacy protection online.</p>
        `
    },

    'linux-beginner': {
        title: 'Getting Started with Linux: Installation and Essential Commands',
        date: 'January 10, 2025',
        readTime: '20 min read',
        tag: 'Linux',
        content: `
            <h1>Getting Started with Linux: Installation and Essential Commands</h1>

            <p>Linux is the operating system of choice for cybersecurity professionals, developers, and tech enthusiasts. This comprehensive guide will take you from zero to comfortable with Linux basics.</p>

            <h2>Why Linux for Cybersecurity?</h2>

            <ul>
                <li><strong>Open Source</strong>: Full transparency and community support</li>
                <li><strong>Security Tools</strong>: Most security tools are built for Linux first</li>
                <li><strong>Customization</strong>: Complete control over your system</li>
                <li><strong>Command Line Power</strong>: Automation and scripting capabilities</li>
                <li><strong>Server Dominance</strong>: Most servers run Linux</li>
            </ul>

            <h2>Choosing Your First Distribution</h2>

            <h3>For Beginners:</h3>
            <ul>
                <li><strong>Ubuntu</strong>: User-friendly, great documentation, large community</li>
                <li><strong>Linux Mint</strong>: Based on Ubuntu, even more beginner-friendly</li>
                <li><strong>Pop!_OS</strong>: Ubuntu-based, great for gaming and development</li>
            </ul>

            <h3>For Security/Penetration Testing:</h3>
            <ul>
                <li><strong>Kali Linux</strong>: Pre-loaded with 600+ security tools</li>
                <li><strong>Parrot OS</strong>: Lightweight alternative to Kali</li>
                <li><strong>BlackArch</strong>: Arch-based with 2800+ tools</li>
            </ul>

            <h3>For Learning:</h3>
            <ul>
                <li><strong>Arch Linux</strong>: Build from scratch, deep understanding</li>
                <li><strong>Gentoo</strong>: Compile everything, ultimate customization</li>
            </ul>

            <h2>Installing Linux (Ubuntu Example)</h2>

            <h3>1. Create Bootable USB</h3>

            <pre><code># On Linux
$ sudo dd if=ubuntu-22.04.iso of=/dev/sdb bs=4M status=progress

# Or use a GUI tool like Rufus (Windows) or balenaEtcher (cross-platform)</code></pre>

            <h3>2. Boot from USB</h3>
            <p>Restart your computer and press F12/F2/Del (depends on manufacturer) to enter BIOS/UEFI settings. Set USB as first boot device.</p>

            <h3>3. Installation Options</h3>
            <ul>
                <li><strong>Try Ubuntu</strong>: Live session without installing</li>
                <li><strong>Install Ubuntu</strong>: Permanent installation</li>
                <li><strong>Dual Boot</strong>: Keep Windows and install Linux alongside</li>
            </ul>

            <h3>4. Partitioning (Manual - Recommended for Learning)</h3>

            <p>Typical partition scheme:</p>
            <ul>
                <li><strong>/boot</strong>: 500MB (bootloader and kernels)</li>
                <li><strong>/</strong>: 30-50GB (root filesystem)</li>
                <li><strong>/home</strong>: Remaining space (your files)</li>
                <li><strong>swap</strong>: 1-2x RAM size (virtual memory)</li>
            </ul>

            <h2>Essential Linux Commands</h2>

            <h3>Navigation & File Operations</h3>

            <pre><code># Print working directory
$ pwd

# List files and directories
$ ls
$ ls -la  # Long format with hidden files
$ ls -lh  # Human-readable sizes

# Change directory
$ cd /home/user/Documents
$ cd ..     # Parent directory
$ cd ~      # Home directory
$ cd -      # Previous directory

# Create directory
$ mkdir newdir
$ mkdir -p parent/child/grandchild  # Create nested

# Remove directory
$ rmdir emptydir
$ rm -r directory  # Remove recursively (with files)

# Create empty file
$ touch newfile.txt

# Copy files
$ cp source.txt destination.txt
$ cp -r sourcedir/ destdir/  # Recursive (directories)

# Move/rename files
$ mv oldname.txt newname.txt
$ mv file.txt /new/location/

# Remove files
$ rm file.txt
$ rm -f file.txt  # Force remove
$ rm -rf directory/  # Dangerous! Remove recursively and forcefully</code></pre>

            <h3>Viewing File Contents</h3>

            <pre><code># Display entire file
$ cat file.txt

# Display with line numbers
$ cat -n file.txt

# View file page by page
$ less file.txt  # Press q to quit, / to search

# View first 10 lines
$ head file.txt
$ head -n 20 file.txt  # First 20 lines

# View last 10 lines
$ tail file.txt
$ tail -n 20 file.txt  # Last 20 lines
$ tail -f /var/log/syslog  # Follow file in real-time

# Count lines, words, characters
$ wc file.txt
$ wc -l file.txt  # Lines only</code></pre>

            <h3>File Permissions</h3>

            <pre><code># View permissions
$ ls -l file.txt
# Output: -rw-r--r-- 1 user group 1234 Jan 10 12:00 file.txt

# Change permissions (numeric)
$ chmod 755 script.sh  # rwxr-xr-x
$ chmod 644 file.txt   # rw-r--r--

# Change permissions (symbolic)
$ chmod u+x script.sh  # Add execute for user
$ chmod g-w file.txt   # Remove write for group
$ chmod o= file.txt    # Remove all for others

# Change ownership
$ chown user:group file.txt
$ chown -R user:group directory/  # Recursive</code></pre>

            <p>Permission breakdown:</p>
            <ul>
                <li><strong>r (4)</strong>: Read permission</li>
                <li><strong>w (2)</strong>: Write permission</li>
                <li><strong>x (1)</strong>: Execute permission</li>
            </ul>

            <p>Examples:</p>
            <ul>
                <li><strong>755</strong>: rwxr-xr-x (Owner: all, Group: read+execute, Others: read+execute)</li>
                <li><strong>644</strong>: rw-r--r-- (Owner: read+write, Group: read, Others: read)</li>
                <li><strong>600</strong>: rw------- (Owner: read+write, Group: none, Others: none)</li>
            </ul>

            <h3>Searching & Finding</h3>

            <pre><code># Find files by name
$ find /home -name "*.txt"
$ find . -name "config*"
$ find /var -type d -name "log*"  # Directories only

# Find files by size
$ find /home -size +100M  # Larger than 100MB
$ find /home -size -1M    # Smaller than 1MB

# Find files modified in last 7 days
$ find /home -mtime -7

# Execute command on found files
$ find . -name "*.log" -exec rm {} \\;

# Search file contents
$ grep "error" /var/log/syslog
$ grep -r "TODO" .  # Recursive search
$ grep -i "error" file.txt  # Case-insensitive
$ grep -n "error" file.txt  # Show line numbers
$ grep -v "error" file.txt  # Invert match (exclude)

# Locate (faster, uses database)
$ sudo updatedb  # Update database
$ locate filename.txt</code></pre>

            <h3>Process Management</h3>

            <pre><code># View running processes
$ ps aux
$ ps aux | grep firefox

# Real-time process viewer
$ top
$ htop  # Better interface (needs installation)

# Kill process
$ kill 1234  # By PID
$ kill -9 1234  # Force kill
$ killall firefox  # By name

# Background/foreground jobs
$ command &  # Run in background
$ jobs  # List background jobs
$ fg %1  # Bring job 1 to foreground
$ bg %1  # Resume job 1 in background

# Process priority
$ nice -n 10 command  # Lower priority
$ renice -n -5 -p 1234  # Change priority</code></pre>

            <h3>System Information</h3>

            <pre><code># System information
$ uname -a  # All system info
$ uname -r  # Kernel version
$ hostname  # Computer name
$ hostnamectl  # Detailed host info

# CPU information
$ lscpu
$ cat /proc/cpuinfo

# Memory information
$ free -h  # Human-readable
$ cat /proc/meminfo

# Disk usage
$ df -h  # Filesystem disk space
$ du -sh *  # Directory sizes
$ du -sh /var/log  # Specific directory

# PCI devices
$ lspci
$ lsusb  # USB devices

# Network information
$ ip addr show  # IP addresses
$ ip route show  # Routing table
$ ss -tuln  # Listening ports
$ netstat -tuln  # Alternative (older)</code></pre>

            <h3>Package Management (Ubuntu/Debian)</h3>

            <pre><code># Update package lists
$ sudo apt update

# Upgrade installed packages
$ sudo apt upgrade
$ sudo apt full-upgrade  # Intelligent upgrade

# Install package
$ sudo apt install package-name

# Remove package
$ sudo apt remove package-name
$ sudo apt purge package-name  # Remove with config files

# Search packages
$ apt search keyword
$ apt show package-name  # Package info

# Clean up
$ sudo apt autoremove  # Remove unused dependencies
$ sudo apt autoclean  # Clean package cache</code></pre>

            <h3>User & Group Management</h3>

            <pre><code># Create user
$ sudo useradd -m -s /bin/bash newuser
$ sudo passwd newuser

# Delete user
$ sudo userdel -r username  # -r removes home directory

# Modify user
$ sudo usermod -aG sudo username  # Add to sudo group
$ sudo usermod -L username  # Lock account

# View users
$ cat /etc/passwd
$ who  # Logged-in users
$ w  # Detailed who

# Create group
$ sudo groupadd developers

# View groups
$ groups
$ cat /etc/group</code></pre>

            <h3>Networking Commands</h3>

            <pre><code># Ping
$ <code>ping</code> google.com
$ <code>ping</code> -c 4 8.8.8.8  # 4 packets only

# Traceroute
$ traceroute google.com

# DNS lookup
$ nslookup google.com
$ dig google.com

# Download files
$ wget https://example.com/file.zip
$ curl -O https://example.com/file.zip

# Network connections
$ ss -tupn  # Active connections
$ netstat -tupn  # Alternative

# Configure network (temporary)
$ sudo ip addr add 192.168.1.100/24 dev eth0
$ sudo ip link set eth0 up</code></pre>

            <h3>Text Processing</h3>

            <pre><code># Sort lines
$ sort file.txt
$ sort -r file.txt  # Reverse
$ sort -n numbers.txt  # Numeric sort

# Remove duplicates
$ uniq file.txt
$ sort file.txt | uniq  # Sort first

# Cut columns
$ cut -d: -f1 /etc/passwd  # First field, : delimiter

# Text replacement
$ sed 's/old/new/' file.txt  # First occurrence per line
$ sed 's/old/new/g' file.txt  # All occurrences

# AWK processing
$ awk '{print $1}' file.txt  # Print first column
$ awk -F: '{print $1}' /etc/passwd  # Custom delimiter</code></pre>

            <h3>Compression & Archives</h3>

            <pre><code># Create tar archive
$ tar -cvf archive.tar directory/

# Create compressed tar.gz
$ tar -czvf archive.tar.gz directory/

# Extract tar archive
$ tar -xvf archive.tar
$ tar -xzvf archive.tar.gz

# Extract to specific directory
$ tar -xzvf archive.tar.gz -C /target/directory/

# Zip files
$ zip archive.zip file1 file2
$ zip -r archive.zip directory/

# Unzip
$ unzip archive.zip
$ unzip archive.zip -d /target/directory/</code></pre>

            <h2>Essential Shortcuts</h2>

            <ul>
                <li><strong>Ctrl + C</strong>: Kill current process</li>
                <li><strong>Ctrl + Z</strong>: Suspend current process</li>
                <li><strong>Ctrl + D</strong>: Exit shell/logout</li>
                <li><strong>Ctrl + L</strong>: Clear screen</li>
                <li><strong>Ctrl + A</strong>: Move to beginning of line</li>
                <li><strong>Ctrl + E</strong>: Move to end of line</li>
                <li><strong>Ctrl + U</strong>: Delete from cursor to beginning</li>
                <li><strong>Ctrl + K</strong>: Delete from cursor to end</li>
                <li><strong>Ctrl + R</strong>: Search command history</li>
                <li><strong>Tab</strong>: Autocomplete</li>
                <li><strong>↑/↓</strong>: Navigate command history</li>
            </ul>

            <h2>Useful Tips for Beginners</h2>

            <h3>1. Use man pages</h3>
            <pre><code>$ man command-name
$ man ls  # Learn about ls command</code></pre>

            <h3>2. Command history</h3>
            <pre><code>$ history  # View command history
$ !123  # Execute command #123 from history
$ !!  # Execute last command
$ sudo !!  # Execute last command with sudo</code></pre>

            <h3>3. Pipe and redirection</h3>
            <pre><code># Pipe output to another command
$ ls -l | grep ".txt"

# Redirect output to file
$ echo "Hello" > file.txt  # Overwrite
$ echo "World" >> file.txt  # Append

# Redirect errors
$ command 2> error.log
$ command &> all-output.log  # Both stdout and stderr</code></pre>

            <h3>4. Command substitution</h3>
            <pre><code>$ echo "Current directory: $(pwd)"
$ files=$(ls *.txt)
$ echo "Today is $(date +%Y-%m-%d)"</code></pre>

            <h2>Next Steps</h2>

            <p>Now that you have the basics, here's what to learn next:</p>

            <ol>
                <li>Shell scripting (bash)</li>
                <li>Text editors (vim/nano)</li>
                <li>System administration (services, logs, cron)</li>
                <li>Security basics (firewall, SSH hardening)</li>
                <li>Advanced networking</li>
            </ol>

            <p>Practice these commands daily. Set up a virtual machine and experiment freely – you can always rebuild it! The best way to learn Linux is by using it.</p>

            <h2>Conclusion</h2>

            <p>Linux might seem intimidating at first, but with practice, you'll find it incredibly powerful and efficient. The command line gives you control and automation capabilities that are essential for cybersecurity and development work.</p>

            <p>Don't be afraid to make mistakes – they're the best way to learn. Keep this guide handy as a reference, and soon these commands will become second nature!</p>
        `
    },

    'tcpip-fundamentals': {
        title: 'TCP/IP Protocol Suite: The Foundation of Modern Networking',
        date: 'January 8, 2025',
        readTime: '18 min read',
        tag: 'Networking',
        content: `
            <h1>TCP/IP Protocol Suite: The Foundation of Modern Networking</h1>

            <p>The TCP/IP protocol suite is the engine that powers the internet. It's a set of communication protocols that define how data is sent, routed, and received over a network. Understanding its layered architecture is fundamental for any cybersecurity professional. Let's break it down layer by layer.</p>

            <h2>The Four-Layer TCP/IP Model</h2>

            <p>While the OSI model has seven layers, the TCP/IP model is a more practical, four-layer model:</p>

            <ol>
                <li><strong>Application Layer</strong>: Where user-facing applications interact with the network (e.g., HTTP, FTP, SMTP).</li>
                <li><strong>Transport Layer</strong>: Handles host-to-host communication, ensuring data integrity and flow control (e.g., TCP, UDP).</li>
                <li><strong>Internet Layer</strong>: Manages addressing and routing of data packets across networks (e.g., IP, ICMP).</li>
                <li><strong>Link Layer (or Network Access Layer)</strong>: Deals with the physical transmission of data over the local network (e.g., Ethernet, Wi-Fi).</li>
            </ol>

            <h2>Layer 4: Application Layer</h2>

            <p>This is the layer you interact with most directly. It provides protocols for specific services.</p>

            <ul>
                <li><strong>HTTP/HTTPS</strong>: For web browsing.</li>
                <li><strong>FTP/SFTP</strong>: For file transfers.</li>
                <li><strong>SMTP, POP3, IMAP</strong>: For email.</li>
                <li><strong>DNS</strong>: For domain name resolution.</li>
            </ul>

            <pre><code># Example: An HTTP GET request
GET /index.html HTTP/1.1
Host: example.com
User-Agent: MyBrowser/1.0</code></pre>

            <h2>Layer 3: Transport Layer</h2>

            <p>This layer ensures that data arrives reliably and in order. The two main protocols are TCP and UDP.</p>

            <h3>TCP (Transmission Control Protocol)</h3>
            <p>TCP is connection-oriented, meaning it establishes a connection before sending data using a \"three-way handshake.\" It guarantees delivery, order, and error-checking.</p>

            <p><strong>Three-Way Handshake:</strong></p>
            <ol>
                <li><strong>SYN</strong>: Client sends a SYN (synchronize) packet to the server.</li>
                <li><strong>SYN-ACK</strong>: Server replies with a SYN-ACK (synchronize-acknowledge) packet.</li>
                <li><strong>ACK</strong>: Client sends an ACK (acknowledge) packet, establishing the connection.</li>
            </ol>

            <p>Use TCP for applications that require high reliability, like web browsing, email, and file transfers.</p>

            <h3>UDP (User Datagram Protocol)</h3>
            <p>UDP is connectionless and \"fire-and-forget.\" It's faster than TCP because it doesn't guarantee delivery or order. It's ideal for time-sensitive applications like video streaming, online gaming, and VoIP where speed is more important than perfect reliability.</p>

            <pre><code># Using netcat to send UDP data
$ echo \"Hello UDP\" | nc -u 192.168.1.10 5000</code></pre>

            <h2>Layer 2: Internet Layer</h2>

            <p>This layer is responsible for logical addressing and routing. It ensures packets get from the source to the destination across multiple networks.</p>

            <h3>IP (Internet Protocol)</h3>
            <p>IP provides the addressing scheme (IPv4 and IPv6) that gives every device on the internet a unique address. It handles the routing of packets but doesn't guarantee delivery—that's TCP's job.</p>

            <h3>ICMP (Internet Control Message Protocol)</h3>
            <p>ICMP is used for diagnostics and error reporting. The most common use is the <code>ping</code> command, which uses ICMP Echo Request and Echo Reply messages to test connectivity.</p>

            <pre><code>$ <code>ping</code> google.com
PING google.com (142.250.185.46) 56(84) bytes of data.
64 bytes from lhr25s33-in-f14.1e100.net (142.250.185.46): icmp_seq=1 ttl=118 time=15.2 ms</code></pre>

            <h2>Layer 1: Link Layer</h2>

            <p>This is the lowest layer, responsible for the physical transmission of data. It deals with MAC addresses, which are unique hardware identifiers for network interfaces.</p>

            <h3>ARP (Address Resolution Protocol)</h3>
            <p>ARP resolves an IP address to a physical MAC address on a local network. When your computer wants to send a packet to a local IP, it sends an ARP request asking, \"Who has this IP address?\" The device with that IP replies with its MAC address.</p>

            <pre><code># View your system's ARP cache
$ arp -a</code></pre>

            <h2>Data Encapsulation</h2>

            <p>As data moves down the layers, it's broken into smaller pieces and wrapped in headers—a process called encapsulation. Each layer adds its own header containing information relevant to that layer.</p>

            <ul>
                <li><strong>Application Layer</strong>: Data</li>
                <li><strong>Transport Layer</strong>: TCP/UDP Header + Data = <strong>Segment/Datagram</strong></li>
                <li><strong>Internet Layer</strong>: IP Header + Segment = <strong>Packet</strong></li>
                <li><strong>Link Layer</strong>: Frame Header + Packet + Frame Trailer = <strong>Frame</strong></li>
            </ul>
            <p>The process is reversed at the receiving end (de-encapsulation).</p>

            <h2>Conclusion</h2>

            <p>The TCP/IP suite is a masterpiece of layered design, allowing the complex system of the internet to function reliably. For cybersecurity professionals, understanding how data is encapsulated, addressed, and transported is crucial for network analysis, penetration testing, and defending against attacks. Every packet tells a story, and knowing the language of TCP/IP is how you read it.</p>
        `
    }
};

// Article Modal Logic
function loadArticle(articleId) {
    const modal = document.getElementById('article-modal');
    const contentDiv = document.getElementById('article-content');
    if (articles[articleId]) {
        contentDiv.innerHTML = articles[articleId].content;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}
function closeArticle() {
    const modal = document.getElementById('article-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// Additional article stubs (these would be filled with full content similar to above)
const articleStubs = {
    'nmap-mastery': {
        title: 'Mastering Nmap: From Basic Scans to Advanced NSE Scripts',
        summary: 'Complete guide to network scanning and reconnaissance...'
    },
    'sql-injection': {
        title: 'SQL Injection Explained: From Theory to Exploitation',
        summary: 'Deep dive into SQL injection vulnerabilities and exploitation techniques...'
    },
    'active-directory-basics': {
        title: 'Active Directory Fundamentals for Penetration Testers',
        summary: 'Understanding AD architecture and common attack vectors...'
    },
    'linux-privesc': {
        title: 'Linux Privilege Escalation: A Comprehensive Methodology',
        summary: 'Systematic approach to escalating privileges on Linux systems...'
    },
    'burp-suite-guide': {
        title: 'Burp Suite Essentials: Your First Web Application Security Assessment',
        summary: 'Complete guide to using Burp Suite for web testing...'
    },
    'ssh-security': {
        title: 'SSH Deep Dive: Secure Remote Access and Advanced Techniques',
        summary: 'Everything about SSH from basics to advanced tunneling...'
    }
};

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('article-modal');
    if (event.target === modal) {
        closeArticle();
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Update active nav on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Keyboard shortcut to close modal (ESC key)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeArticle();
    }
});

console.log('Blog loaded successfully! 📚');
console.log('Articles available:', Object.keys(articles).length);
console.log('Made with 💙 for the cybersecurity community');

// Theme switcher logic
const themeToggle = document.getElementById('checkbox');
const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark-mode') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
} else {
    document.body.classList.remove('dark-mode');
    themeToggle.checked = false;
}

function switchTheme(e) {
    if (e.target.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light-mode');
    }
    // Sync checkbox state
    themeToggle.checked = document.body.classList.contains('dark-mode');
}

themeToggle.addEventListener('change', switchTheme, false);