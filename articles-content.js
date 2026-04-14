// Comprehensive Technical Articles for Cybersecurity Blog
// This file contains all detailed writeups

const comprehensiveArticles = {
    'dns-deep-dive': {
        title: 'Understanding DNS: A Deep Dive into the Internet\'s Phone Book',
        date: 'January 15, 2025',
        readTime: '25 min read',
        tag: 'Networking',
        difficulty: 'Beginner',
        content: `
            <h1>🌐 Understanding DNS: A Deep Dive into the Internet's Phone Book</h1>
            
            <div class="article-intro">
                <p>Every time you type a URL into your browser, a complex series of events occurs behind the scenes. The Domain Name System (DNS) is one of the internet's fundamental protocols, yet many people don't fully understand how it works. Let's dive deep into DNS, from basic queries to advanced security considerations.</p>
            </div>

            <h2>📖 What is DNS?</h2>
            
            <p>DNS is essentially the internet's phone book. Just like you use a phone book to look up someone's phone number by their name, DNS translates human-readable domain names (like <code>google.com</code>) into IP addresses (like <code>142.250.185.46</code>) that computers use to identify each other on the network.</p>

            <p>Without DNS, you'd have to remember the IP address of every website you want to visit. Imagine trying to remember that Facebook is <code>31.13.72.36</code> or that Amazon is <code>54.239.28.85</code>. Not very practical, right?</p>

            <div class="info-box">
                <strong>💡 Fun Fact:</strong> The DNS system handles over 2.4 billion queries per day, making it one of the most critical infrastructure components of the internet!
            </div>

            <h2>🔄 How DNS Works: The Query Process</h2>

            <p>When you type "example.com" into your browser, here's the complete journey:</p>

            <h3>Step 1: Browser Cache Check</h3>
            <p>Your browser first checks its own cache to see if it recently looked up this domain. Modern browsers cache DNS records for performance. You can view Chrome's DNS cache by visiting:</p>
            <pre><code>chrome://net-internals/#dns</code></pre>

            <h3>Step 2: Operating System Cache</h3>
            <p>If not in the browser cache, the OS checks its own DNS cache. On different systems:</p>

            <pre><code># Linux (systemd)
$ sudo systemd-resolve --statistics

# Windows
C:\\> ipconfig /displaydns

# macOS
$ dscacheutil -cachedump -entries Host

# Clear DNS cache
# Linux
$ sudo systemd-resolve --flush-caches

# Windows
C:\\> ipconfig /flushdns

# macOS
$ sudo dscacheutil -flushcache</code></pre>

            <h3>Step 3: Recursive Resolver Query</h3>
            <p>If still not found, your computer sends a query to a recursive DNS resolver. This is usually:</p>
            <ul>
                <li>Your ISP's DNS server (automatically assigned via DHCP)</li>
                <li>Google Public DNS: <code>8.8.8.8</code> and <code>8.8.4.4</code></li>
                <li>Cloudflare DNS: <code>1.1.1.1</code> and <code>1.0.0.1</code></li>
                <li>Quad9: <code>9.9.9.9</code></li>
            </ul>

            <h3>Step 4: Root Name Server</h3>
            <p>The recursive resolver starts by querying one of the 13 root name servers (actually 13 IP addresses, but hundreds of physical servers worldwide using anycast). These servers don't know where example.com is, but they know where to find the .com top-level domain (TLD) servers.</p>

            <div class="code-example">
                <pre><code># Query a root server directly
$ dig @a.root-servers.net com NS</code></pre>
            </div>

            <h3>Step 5: TLD Name Server</h3>
            <p>The resolver then queries the .com TLD server, which responds with the authoritative name server for example.com.</p>

            <h3>Step 6: Authoritative Name Server</h3>
            <p>Finally, the resolver queries the authoritative name server for example.com, which returns the IP address. This entire process typically takes less than 100 milliseconds!</p>

            <h2>📝 DNS Record Types</h2>

            <p>DNS supports various record types, each serving a different purpose:</p>

            <table class="dns-table">
                <tr>
                    <th>Record Type</th>
                    <th>Purpose</th>
                    <th>Example</th>
                </tr>
                <tr>
                    <td><strong>A</strong></td>
                    <td>Maps domain to IPv4 address</td>
                    <td>example.com → 93.184.216.34</td>
                </tr>
                <tr>
                    <td><strong>AAAA</strong></td>
                    <td>Maps domain to IPv6 address</td>
                    <td>example.com → 2606:2800:220:1:248:1893:25c8:1946</td>
                </tr>
                <tr>
                    <td><strong>CNAME</strong></td>
                    <td>Creates an alias for another domain</td>
                    <td>www.example.com → example.com</td>
                </tr>
                <tr>
                    <td><strong>MX</strong></td>
                    <td>Specifies mail servers</td>
                    <td>example.com → mail.example.com (priority 10)</td>
                </tr>
                <tr>
                    <td><strong>TXT</strong></td>
                    <td>Stores text information</td>
                    <td>SPF, DKIM, domain verification</td>
                </tr>
                <tr>
                    <td><strong>NS</strong></td>
                    <td>Specifies authoritative name servers</td>
                    <td>example.com → ns1.example.com</td>
                </tr>
                <tr>
                    <td><strong>SOA</strong></td>
                    <td>Start of Authority</td>
                    <td>Contains admin info, serial number</td>
                </tr>
                <tr>
                    <td><strong>PTR</strong></td>
                    <td>Reverse DNS lookup</td>
                    <td>93.184.216.34 → example.com</td>
                </tr>
                <tr>
                    <td><strong>SRV</strong></td>
                    <td>Service location</td>
                    <td>_service._proto.name → target:port</td>
                </tr>
            </table>

            <h2>🛠️ Practical DNS Commands</h2>

            <h3>Using dig (Domain Information Groper)</h3>
            <p>The most powerful DNS query tool for Linux/macOS:</p>

            <pre><code># Basic A record lookup
$ dig example.com

# Output explanation:
# ;; QUESTION SECTION: - What you asked
# ;; ANSWER SECTION: - The response
# ;; Query time: - How long it took
# ;; SERVER: - Which DNS server answered

# Specific record type
$ dig example.com MX
$ dig example.com AAAA
$ dig example.com TXT

# Trace full DNS resolution path (shows all steps)
$ dig example.com +trace

# Query specific DNS server
$ dig @8.8.8.8 example.com
$ dig @1.1.1.1 example.com

# Short answer only (just the IP)
$ dig example.com +short

# Reverse DNS lookup
$ dig -x 93.184.216.34

# Get all records
$ dig example.com ANY

# Check DNSSEC validation
$ dig example.com +dnssec

# Batch queries from file
$ dig -f domains.txt +short</code></pre>

            <h3>Using nslookup</h3>
            <p>Cross-platform DNS query tool:</p>

            <pre><code># Basic lookup
$ nslookup example.com

# Query specific DNS server
$ nslookup example.com 1.1.1.1

# Interactive mode
$ nslookup
> set type=MX
> example.com
> set type=TXT
> example.com
> exit

# Reverse lookup
$ nslookup 93.184.216.34

# Debug mode (verbose output)
$ nslookup -debug example.com</code></pre>

            <h3>Using host</h3>
            <p>Simple and fast DNS lookup:</p>

            <pre><code># Simple lookup
$ host example.com

# All record types
$ host -a example.com

# Reverse lookup
$ host 93.184.216.34

# Verbose output
$ host -v example.com

# Query specific server
$ host example.com 8.8.8.8</code></pre>

            <h2>🔒 DNS Security Considerations</h2>

            <h3>1. DNS Spoofing/Cache Poisoning</h3>
            <p>Attackers can inject false DNS records into a resolver's cache, redirecting users to malicious sites. This was famously exploited in the Kaminsky attack (2008).</p>

            <div class="warning-box">
                <strong>⚠️ Attack Scenario:</strong> An attacker poisons your DNS cache to redirect <code>bank.com</code> to their phishing site. You think you're on the real bank website, but you're actually giving credentials to the attacker!
            </div>

            <p><strong>Protection:</strong></p>
            <ul>
                <li>Use DNSSEC (DNS Security Extensions)</li>
                <li>Implement source port randomization</li>
                <li>Use trusted DNS resolvers</li>
                <li>Enable DNS-over-HTTPS (DoH) or DNS-over-TLS (DoT)</li>
            </ul>

            <h3>2. DNS Tunneling</h3>
            <p>Attackers can use DNS queries to exfiltrate data or establish command and control channels. Since DNS is rarely blocked, it's an attractive vector.</p>

            <pre><code># Example of DNS tunneling detection
# Look for unusual query patterns
$ tcpdump -i eth0 -n port 53 | grep -E '[a-z0-9]{30,}'

# Monitor DNS query lengths
$ tshark -i eth0 -Y "dns" -T fields -e dns.qry.name | awk '{print length, $0}' | sort -rn</code></pre>

            <h3>3. DDoS via DNS Amplification</h3>
            <p>Attackers send DNS queries with a spoofed source IP (the victim's IP) to open DNS resolvers. The responses, which are much larger than the queries, flood the victim.</p>

            <p><strong>Amplification Factor:</strong> A 60-byte query can generate a 3000-byte response (50x amplification!)</p>

            <h3>4. DNS Hijacking</h3>
            <p>Compromising DNS settings at the router or registrar level to redirect all traffic.</p>

            <h2>🔐 DNSSEC: Securing DNS</h2>

            <p>DNSSEC adds cryptographic signatures to DNS records, ensuring authenticity and integrity.</p>

            <pre><code># Check if a domain uses DNSSEC
$ dig example.com +dnssec +short

# Validate DNSSEC chain
$ dig @8.8.8.8 example.com +dnssec

# Check DNSSEC validation status
$ delv example.com</code></pre>

            <h2>🌍 DNS-over-HTTPS (DoH) and DNS-over-TLS (DoT)</h2>

            <p>Traditional DNS queries are sent in plaintext, allowing ISPs and attackers to see which websites you visit. DoH and DoT encrypt DNS queries.</p>

            <h3>Configure DoH in Firefox:</h3>
            <ol>
                <li>Go to Settings → Privacy & Security</li>
                <li>Scroll to "DNS over HTTPS"</li>
                <li>Enable and select a provider (Cloudflare, NextDNS, etc.)</li>
            </ol>

            <h3>Configure DoT on Linux:</h3>
            <pre><code># Using systemd-resolved
$ sudo nano /etc/systemd/resolved.conf

# Add:
[Resolve]
DNS=1.1.1.1#cloudflare-dns.com
DNSOverTLS=yes

# Restart service
$ sudo systemctl restart systemd-resolved</code></pre>

            <h2>🎯 DNS in Penetration Testing</h2>

            <h3>DNS Enumeration</h3>
            <pre><code># Zone transfer attempt (often blocked)
$ dig @ns1.example.com example.com AXFR

# Subdomain brute forcing
$ for sub in www mail ftp admin; do
    dig $sub.example.com +short
done

# Using dnsrecon
$ dnsrecon -d example.com -t std

# Using fierce
$ fierce --domain example.com

# Using dnsenum
$ dnsenum example.com</code></pre>

            <h3>Finding Subdomains</h3>
            <pre><code># Using subfinder
$ subfinder -d example.com

# Using amass
$ amass enum -d example.com

# Certificate transparency logs
$ curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u</code></pre>

            <h2>🏆 Best Practices</h2>

            <ol>
                <li><strong>Use reputable DNS resolvers:</strong> Google (8.8.8.8), Cloudflare (1.1.1.1), Quad9 (9.9.9.9)</li>
                <li><strong>Enable DNSSEC validation</strong> on your resolver</li>
                <li><strong>Use DoH or DoT</strong> to encrypt DNS queries</li>
                <li><strong>Monitor DNS logs</strong> for unusual patterns</li>
                <li><strong>Implement DNS filtering</strong> to block malicious domains</li>
                <li><strong>Keep DNS software updated</strong> (BIND, Unbound, etc.)</li>
                <li><strong>Use split-horizon DNS</strong> for internal/external separation</li>
                <li><strong>Implement rate limiting</strong> to prevent abuse</li>
            </ol>

            <h2>🎓 Conclusion</h2>

            <p>DNS is a critical component of internet infrastructure that we use thousands of times per day without thinking about it. Understanding how DNS works, its security implications, and how to properly configure and monitor it is essential for any cybersecurity professional.</p>

            <p>From basic name resolution to advanced security features like DNSSEC and DoH, DNS continues to evolve to meet the challenges of the modern internet. Whether you're troubleshooting connectivity issues, performing reconnaissance during a penetration test, or hardening your network's security posture, a deep understanding of DNS is invaluable.</p>

            <div class="success-box">
                <h3>🎁 Congratulations!</h3>
                <p>You've completed this comprehensive DNS deep dive! You now understand one of the internet's most fundamental protocols.</p>
                <blockquote>"The expert in anything was once a beginner." - Helen Hayes</blockquote>
                <p>Keep learning, keep hacking, and remember: every DNS query is a small miracle of distributed systems working in harmony! 🚀</p>
            </div>
        `
    }
};
