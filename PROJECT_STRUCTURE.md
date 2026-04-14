# Project Structure - Cybersecurity Blog

## Directory Layout

```
blog1/
│
├── index.html                          # Main HTML file
├── styles.css                          # Main stylesheet
├── script.js                           # Main JavaScript
├── script-new.js                       # Additional scripts
│
├── articles/                           # 📁 Comprehensive Articles Directory
│   ├── README.md                       # Documentation
│   ├── index.js                        # Article index
│   ├── active-directory.js             # AD Fundamentals (45 min)
│   ├── mastering-nmap.js               # Nmap Guide (50 min)
│   ├── sql-injection.js                # SQL Injection (55 min)
│   ├── linux-privilege-escalation.js   # Linux PrivEsc (60 min)
│   ├── windows-privilege-escalation.js # Windows PrivEsc (65 min)
│   └── ssh-deep-dive.js                # SSH Deep Dive (45 min)
│
├── articles-loader.js                  # Dynamic article loader
├── articles-content.js                 # Legacy article content
├── comprehensive-articles.js           # Legacy comprehensive articles
│
├── ARTICLES_SUMMARY.md                 # Article implementation summary
└── PROJECT_STRUCTURE.md                # This file

```

## Article Topics Coverage

### 🔐 Active Directory (Advanced)
- AD Architecture & Components
- Kerberos & NTLM Authentication
- LDAP Queries
- AS-REP Roasting & Kerberoasting
- Golden/Silver Tickets
- BloodHound & PowerView
- Lateral Movement
- Defense & Detection

### 🌐 Nmap Mastery (Intermediate)
- All Scan Types
- NSE Scripts
- Service Detection
- OS Fingerprinting
- Firewall Evasion
- Performance Optimization
- Practical Examples

### 💉 SQL Injection (Intermediate)
- In-band SQLi
- Blind SQLi
- Out-of-band SQLi
- Database-Specific Exploitation
- SQLMap Usage
- WAF Bypass
- Prevention Techniques

### 🐧 Linux Privilege Escalation (Advanced)
- Enumeration Tools
- SUID/SGID Exploitation
- Kernel Exploits
- Sudo Abuse
- Cron Jobs
- Capabilities
- Container Escapes

### 🪟 Windows Privilege Escalation (Advanced)
- Token Impersonation
- Service Exploitation
- DLL Hijacking
- Registry Exploitation
- UAC Bypass
- Kernel Exploits
- Credential Harvesting

### 🔑 SSH Deep Dive (Intermediate)
- SSH Protocol
- Authentication Methods
- Configuration & Hardening
- Port Forwarding
- Tunneling
- Security Best Practices
- Exploitation Techniques

## Key Features

✨ **Modular Architecture**
- Each article in separate file
- Easy to maintain and update
- Clean code organization

⚡ **Performance Optimized**
- Dynamic loading
- On-demand content fetching
- Reduced initial load time

📚 **Comprehensive Content**
- 6 complete articles
- ~90 KB of content
- 380+ minutes of reading
- Practical commands & examples

🎯 **Professional Quality**
- Consistent formatting
- Code syntax highlighting
- Security warnings
- Conclusion quotes

## Usage

### For Developers

```javascript
// Load an article
const article = await loadArticleContent('mastering-nmap');

// Access metadata
const articles = window.comprehensiveArticles;
console.log(articles['mastering-nmap'].title);
```

### For Content Creators

1. Create new article file in `articles/` directory
2. Follow existing article structure
3. Add to `articles-loader.js`
4. Update documentation

## Statistics

- **Total Articles:** 6 comprehensive guides
- **Total Content:** ~90 KB
- **Total Read Time:** 380 minutes (6+ hours)
- **Difficulty Levels:** 
  - Intermediate: 3 articles
  - Advanced: 3 articles
- **Topics Covered:**
  - Active Directory
  - Network Security
  - Web Security
  - Linux Security
  - Windows Security

## Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Animations:** Anime.js
- **Live2D:** Character animations
- **Structure:** Modular JavaScript
- **Loading:** Dynamic imports

## Future Enhancements

- [ ] Add search functionality
- [ ] Implement article bookmarking
- [ ] Add progress tracking
- [ ] Include interactive code examples
- [ ] Add article comments/discussions
- [ ] Implement dark/light theme toggle
- [ ] Add print-friendly versions
- [ ] Include downloadable PDFs

---

**Project Status:** ✅ Complete
**Last Updated:** October 10, 2025
**Version:** 2.0
