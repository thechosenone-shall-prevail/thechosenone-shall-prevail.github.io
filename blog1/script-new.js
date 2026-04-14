// Comprehensive Cybersecurity Blog - Educational Content
// Written in a teacher-friendly, progressive learning style

const articles = {
    'dns-deep-dive': {
        title: 'Understanding DNS: The Internet\'s Phone Book',
        date: 'January 15, 2025',
        readTime: '20 min read',
        tag: 'Networking',
        difficulty: 'Beginner',
        content: `
            <div class="article-header">
                <h1>🌐 Understanding DNS: The Internet's Phone Book</h1>
                <p class="article-meta">A beginner-friendly guide to one of the internet's most fundamental protocols</p>
            </div>

            <div class="learning-objectives">
                <h3>📚 What You'll Learn</h3>
                <ul>
                    <li>How DNS translates domain names to IP addresses</li>
                    <li>The step-by-step DNS resolution process</li>
                    <li>Different types of DNS records and their purposes</li>
                    <li>Practical DNS commands for troubleshooting</li>
                    <li>Common DNS security threats and protections</li>
                </ul>
            </div>

            <h2>🎯 Introduction: Why DNS Matters</h2>
            
            <p>Imagine if you had to remember phone numbers for everyone you wanted to call. No names, just numbers. That would be incredibly difficult, right? This is exactly the problem DNS solves for the internet.</p>

            <p>Every device on the internet has an IP address - a unique number like <code>142.250.185.46</code>. But humans are much better at remembering names like <code>google.com</code> than long strings of numbers. DNS is the system that bridges this gap.</p>

            <div class="analogy-box">
                <strong>🎓 Teacher's Analogy:</strong> Think of DNS like a massive, distributed phone book. When you want to call "Pizza Place," you look up their number in the phone book. Similarly, when you type "google.com," DNS looks up its IP address so your computer can connect to it.
            </div>

            <h2>📖 The Basics: What is DNS?</h2>

            <p><strong>DNS (Domain Name System)</strong> is a hierarchical, distributed database that translates human-readable domain names into machine-readable IP addresses.</p>

            <p>Let's break that down:</p>
            <ul>
                <li><strong>Hierarchical:</strong> Organized in levels (root → TLD → domain → subdomain)</li>
                <li><strong>Distributed:</strong> No single server has all the answers; it's spread across millions of servers worldwide</li>
                <li><strong>Database:</strong> Stores mappings between names and addresses</li>
            </ul>

            <h3>Why Do We Need DNS?</h3>
            <p>Without DNS, you'd need to remember:</p>
            <ul>
                <li>Facebook: <code>31.13.72.36</code></li>
                <li>Google: <code>142.250.185.46</code></li>
                <li>Amazon: <code>54.239.28.85</code></li>
                <li>YouTube: <code>172.217.14.206</code></li>
            </ul>
            <p>And that's just IPv4! IPv6 addresses are even longer: <code>2606:2800:220:1:248:1893:25c8:1946</code></p>

            <h2>🔄 How DNS Works: Step-by-Step</h2>

            <p>Let's follow what happens when you type <code>www.example.com</code> into your browser:</p>

            <h3>Step 1: Check Local Cache</h3>
            <p>Your computer first checks if it already knows the answer. It looks in:</p>
            <ol>
                <li><strong>Browser cache:</strong> Recent lookups stored by your browser</li>
                <li><strong>Operating system cache:</strong> System-level DNS cache</li>
                <li><strong>Hosts file:</strong> A local file that can override DNS (<code>/etc/hosts</code> on Linux/Mac, <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code> on Windows)</li>
            </ol>

            <div class="command-box">
                <h4>💻 Try It Yourself:</h4>
                <pre><code># View your hosts file (Linux/Mac)
$ cat /etc/hosts

# View DNS cache (Windows)
C:\\> ipconfig /displaydns

# Clear DNS cache (Linux with systemd)
$ sudo systemd-resolve --flush-caches

# Clear DNS cache (Windows)
C:\\> ipconfig /flushdns

# Clear DNS cache (Mac)
$ sudo dscacheutil -flushcache</code></pre>
            </div>

            <h3>Step 2: Ask the Recursive Resolver</h3>
            <p>If the answer isn't cached locally, your computer asks a <strong>recursive resolver</strong> (also called a recursive DNS server). This is typically:</p>
            <ul>
                <li>Your ISP's DNS server (automatically configured)</li>
                <li>A public DNS service like:
                    <ul>
                        <li>Google: <code>8.8.8.8</code> and <code>8.8.4.4</code></li>
                        <li>Cloudflare: <code>1.1.1.1</code> and <code>1.0.0.1</code></li>
                        <li>Quad9: <code>9.9.9.9</code></li>
                    </ul>
                </li>
            </ul>

            <p>The recursive resolver's job is to do all the work for you. It will ask multiple servers until it finds the answer.</p>

            <h3>Step 3: Query the Root Name Server</h3>
            <p>If the recursive resolver doesn't have the answer cached, it starts at the top of the DNS hierarchy: the <strong>root name servers</strong>.</p>

            <p>There are 13 root name server addresses (labeled A through M), but they're actually hundreds of physical servers distributed worldwide using a technique called <strong>anycast</strong>.</p>

            <p>The root server doesn't know where <code>www.example.com</code> is, but it knows who handles <code>.com</code> domains. It responds with: "I don't know, but ask the .com TLD servers."</p>

            <h3>Step 4: Query the TLD Name Server</h3>
            <p>The recursive resolver now asks a <strong>TLD (Top-Level Domain) name server</strong> for <code>.com</code>. </p>

            <p>The TLD server doesn't know the exact IP either, but it knows which name servers are authoritative for <code>example.com</code>. It responds with: "Ask ns1.example.com or ns2.example.com."</p>

            <h3>Step 5: Query the Authoritative Name Server</h3>
            <p>Finally, the recursive resolver asks the <strong>authoritative name server</strong> for <code>example.com</code>. This server has the actual answer!</p>

            <p>It responds with: "<code>www.example.com</code> is at <code>93.184.216.34</code>"</p>

            <h3>Step 6: Return the Answer</h3>
            <p>The recursive resolver:</p>
            <ol>
                <li>Caches the answer (so it doesn't have to ask again soon)</li>
                <li>Returns the IP address to your computer</li>
                <li>Your computer caches it too</li>
                <li>Your browser can now connect to the website!</li>
            </ol>

            <div class="timeline-box">
                <h4>⏱️ How Fast is This?</h4>
                <p>This entire process typically takes <strong>20-120 milliseconds</strong>! That's faster than you can blink. And if the answer is cached anywhere along the way, it's even faster - often under 10ms.</p>
            </div>

            <h2>📝 DNS Record Types</h2>

            <p>DNS doesn't just store IP addresses. It stores many types of information in different <strong>record types</strong>:</p>

            <h3>A Record (Address Record)</h3>
            <p>Maps a domain name to an IPv4 address.</p>
            <pre><code>example.com.    IN    A    93.184.216.34</code></pre>
            <p><strong>Use case:</strong> The most common record type. Points your domain to a server.</p>

            <h3>AAAA Record (IPv6 Address Record)</h3>
            <p>Maps a domain name to an IPv6 address.</p>
            <pre><code>example.com.    IN    AAAA    2606:2800:220:1:248:1893:25c8:1946</code></pre>
            <p><strong>Use case:</strong> For IPv6-enabled servers.</p>

            <h3>CNAME Record (Canonical Name)</h3>
            <p>Creates an alias from one domain to another.</p>
            <pre><code>www.example.com.    IN    CNAME    example.com.</code></pre>
            <p><strong>Use case:</strong> Point multiple names to the same place. Common for <code>www</code> subdomain.</p>

            <div class="warning-box">
                <strong>⚠️ Important:</strong> A CNAME cannot coexist with other records for the same name. You can't have both a CNAME and an A record for <code>www.example.com</code>.
            </div>

            <h3>MX Record (Mail Exchange)</h3>
            <p>Specifies mail servers for the domain.</p>
            <pre><code>example.com.    IN    MX    10 mail.example.com.
example.com.    IN    MX    20 mail2.example.com.</code></pre>
            <p><strong>Use case:</strong> Tells email servers where to deliver mail for your domain. The number (10, 20) is the priority - lower numbers are tried first.</p>

            <h3>TXT Record (Text Record)</h3>
            <p>Stores arbitrary text. Often used for verification and security.</p>
            <pre><code>example.com.    IN    TXT    "v=spf1 include:_spf.google.com ~all"</code></pre>
            <p><strong>Use cases:</strong></p>
            <ul>
                <li>SPF (Sender Policy Framework) - email authentication</li>
                <li>DKIM (DomainKeys Identified Mail) - email signing</li>
                <li>Domain verification (Google, Microsoft, etc.)</li>
                <li>DMARC policies</li>
            </ul>

            <h3>NS Record (Name Server)</h3>
            <p>Specifies which name servers are authoritative for the domain.</p>
            <pre><code>example.com.    IN    NS    ns1.example.com.
example.com.    IN    NS    ns2.example.com.</code></pre>
            <p><strong>Use case:</strong> Delegates authority for a domain to specific name servers.</p>

            <h3>PTR Record (Pointer Record)</h3>
            <p>Used for reverse DNS lookups (IP to domain name).</p>
            <pre><code>34.216.184.93.in-addr.arpa.    IN    PTR    example.com.</code></pre>
            <p><strong>Use case:</strong> Email servers often check PTR records to verify sender identity.</p>

            <h3>SOA Record (Start of Authority)</h3>
            <p>Contains administrative information about the zone.</p>
            <pre><code>example.com.    IN    SOA    ns1.example.com. admin.example.com. (
                                2025011501  ; Serial
                                3600        ; Refresh
                                1800        ; Retry
                                604800      ; Expire
                                86400 )     ; Minimum TTL</code></pre>

            <h2>🛠️ Practical DNS Commands</h2>

            <p>As a cybersecurity professional, you'll use these commands constantly:</p>

            <h3>dig (Domain Information Groper)</h3>
            <p>The most powerful DNS query tool for Linux/Mac:</p>

            <pre><code># Basic lookup
$ dig example.com

# Get just the IP address
$ dig example.com +short

# Query specific record type
$ dig example.com MX
$ dig example.com TXT
$ dig example.com NS

# Trace the full resolution path
$ dig example.com +trace

# Query a specific DNS server
$ dig @8.8.8.8 example.com
$ dig @1.1.1.1 example.com

# Reverse DNS lookup
$ dig -x 93.184.216.34

# Get all record types
$ dig example.com ANY

# Check DNSSEC
$ dig example.com +dnssec</code></pre>

            <h3>nslookup</h3>
            <p>Cross-platform tool (works on Windows, Linux, Mac):</p>

            <pre><code># Basic lookup
$ nslookup example.com

# Query specific DNS server
$ nslookup example.com 8.8.8.8

# Interactive mode
$ nslookup
> set type=MX
> example.com
> set type=TXT
> example.com
> exit

# Reverse lookup
$ nslookup 93.184.216.34</code></pre>

            <h3>host</h3>
            <p>Simple and fast:</p>

            <pre><code># Basic lookup
$ host example.com

# All records
$ host -a example.com

# Reverse lookup
$ host 93.184.216.34

# Query specific server
$ host example.com 8.8.8.8</code></pre>

            <div class="practice-box">
                <h4>🎯 Practice Exercise:</h4>
                <p>Try these commands on your own system:</p>
                <ol>
                    <li>Look up the IP address of google.com</li>
                    <li>Find the mail servers for gmail.com</li>
                    <li>Trace the DNS resolution path for your favorite website</li>
                    <li>Do a reverse lookup on 8.8.8.8</li>
                </ol>
            </div>

            <h2>🔒 DNS Security</h2>

            <p>DNS was designed in the 1980s when the internet was much smaller and more trusting. Today, it faces many security challenges:</p>

            <h3>1. DNS Spoofing / Cache Poisoning</h3>
            <p><strong>The Attack:</strong> An attacker tricks a DNS resolver into caching false information.</p>
            
            <p><strong>Example Scenario:</strong></p>
            <ol>
                <li>You try to visit <code>bank.com</code></li>
                <li>Your DNS resolver has been poisoned</li>
                <li>It returns the attacker's IP instead of the real bank</li>
                <li>You enter your credentials on the fake site</li>
                <li>Attacker steals your login information</li>
            </ol>

            <p><strong>Protection:</strong></p>
            <ul>
                <li>Use DNSSEC (cryptographic signatures)</li>
                <li>Use trusted DNS resolvers</li>
                <li>Implement source port randomization</li>
                <li>Keep DNS software updated</li>
            </ul>

            <h3>2. DNS Tunneling</h3>
            <p><strong>The Attack:</strong> Attackers hide data or commands inside DNS queries to bypass firewalls.</p>

            <p>Since DNS is rarely blocked (it's essential for internet functionality), attackers can:</p>
            <ul>
                <li>Exfiltrate stolen data</li>
                <li>Establish command and control channels</li>
                <li>Bypass network restrictions</li>
            </ul>

            <p><strong>Detection:</strong> Look for unusually long DNS queries or high query volumes to suspicious domains.</p>

            <h3>3. DDoS via DNS Amplification</h3>
            <p><strong>The Attack:</strong> Attackers exploit open DNS resolvers to amplify attack traffic.</p>

            <p><strong>How it works:</strong></p>
            <ol>
                <li>Attacker sends small DNS query (60 bytes)</li>
                <li>Spoofs source IP to victim's address</li>
                <li>DNS server responds with large answer (3000+ bytes)</li>
                <li>Victim receives 50x amplified traffic</li>
            </ol>

            <p><strong>Protection:</strong></p>
            <ul>
                <li>Don't run open DNS resolvers</li>
                <li>Implement rate limiting</li>
                <li>Use Response Rate Limiting (RRL)</li>
            </ul>

            <h3>4. DNS Hijacking</h3>
            <p><strong>The Attack:</strong> Changing DNS settings at the router or registrar level.</p>

            <p><strong>Protection:</strong></p>
            <ul>
                <li>Enable two-factor authentication on domain registrar</li>
                <li>Use registry lock</li>
                <li>Monitor DNS records for unauthorized changes</li>
                <li>Secure your router with strong passwords</li>
            </ul>

            <h2>🔐 Modern DNS Security: DNSSEC, DoH, and DoT</h2>

            <h3>DNSSEC (DNS Security Extensions)</h3>
            <p>Adds cryptographic signatures to DNS records to ensure authenticity.</p>

            <pre><code># Check if a domain uses DNSSEC
$ dig example.com +dnssec

# Validate DNSSEC chain
$ dig @8.8.8.8 example.com +dnssec +multiline</code></pre>

            <h3>DNS-over-HTTPS (DoH)</h3>
            <p>Encrypts DNS queries using HTTPS, preventing ISPs and attackers from seeing which websites you visit.</p>

            <p><strong>Popular DoH Providers:</strong></p>
            <ul>
                <li>Cloudflare: <code>https://1.1.1.1/dns-query</code></li>
                <li>Google: <code>https://dns.google/dns-query</code></li>
                <li>Quad9: <code>https://dns.quad9.net/dns-query</code></li>
            </ul>

            <h3>DNS-over-TLS (DoT)</h3>
            <p>Similar to DoH but uses TLS directly on port 853.</p>

            <pre><code># Configure DoT on Linux (systemd-resolved)
$ sudo nano /etc/systemd/resolved.conf

[Resolve]
DNS=1.1.1.1#cloudflare-dns.com
DNSOverTLS=yes

$ sudo systemctl restart systemd-resolved</code></pre>

            <h2>🎓 Key Takeaways</h2>

            <div class="summary-box">
                <ul>
                    <li>✅ DNS translates domain names to IP addresses</li>
                    <li>✅ The resolution process involves multiple servers: recursive resolver, root, TLD, and authoritative</li>
                    <li>✅ Caching at multiple levels makes DNS fast</li>
                    <li>✅ Different record types serve different purposes (A, AAAA, MX, TXT, etc.)</li>
                    <li>✅ DNS has security vulnerabilities but modern protections exist (DNSSEC, DoH, DoT)</li>
                    <li>✅ Tools like dig, nslookup, and host are essential for troubleshooting</li>
                </ul>
            </div>

            <h2>🚀 Next Steps</h2>

            <p>Now that you understand DNS, you can:</p>
            <ol>
                <li>Set up your own DNS server (try BIND or Unbound)</li>
                <li>Configure DoH in your browser for privacy</li>
                <li>Practice DNS enumeration for penetration testing</li>
                <li>Monitor DNS logs for security threats</li>
                <li>Learn about DNS in cloud environments (Route 53, Cloud DNS)</li>
            </ol>

            <div class="congratulations-box">
                <h3>🎁 Congratulations!</h3>
                <p>You've completed your journey through DNS! You now understand one of the internet's most critical protocols.</p>
                <blockquote class="motivational-quote">
                    "The beautiful thing about learning is that no one can take it away from you." - B.B. King
                </blockquote>
                <p>Keep exploring, keep questioning, and remember: every expert was once a beginner who refused to give up! 🌟</p>
            </div>
        `
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { articles };
}
