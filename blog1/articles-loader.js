// Comprehensive Articles Loader
// This file dynamically loads article content from separate files

const comprehensiveArticles = {
    'active-directory-basics': {
        title: 'Active Directory Fundamentals for Penetration Testers',
        date: 'January 20, 2025',
        readTime: '45 min read',
        tag: 'Active Directory',
        difficulty: 'Advanced',
        excerpt: 'Complete guide to AD architecture, Kerberos, NTLM, BloodHound, and advanced attack techniques.',
        content: null  // Will be loaded dynamically
    },
    'mastering-nmap': {
        title: 'Mastering Nmap: The Complete Network Scanner Guide',
        date: 'January 28, 2025',
        readTime: '50 min read',
        tag: 'Network Security',
        difficulty: 'Intermediate',
        excerpt: 'From basic scans to advanced NSE scripts, firewall evasion, and automated exploitation.',
        content: null
    },
    'sql-injection-explained': {
        title: 'SQL Injection Explained: From Basics to Advanced Exploitation',
        date: 'February 1, 2025',
        readTime: '55 min read',
        tag: 'Web Security',
        difficulty: 'Intermediate',
        excerpt: 'Master SQL injection: In-band, blind, out-of-band attacks, SQLMap, and prevention techniques.',
        content: null
    },
    'linux-privilege-escalation': {
        title: 'Linux Privilege Escalation: Complete Guide',
        date: 'February 5, 2025',
        readTime: '60 min read',
        tag: 'Linux Security',
        difficulty: 'Advanced',
        excerpt: 'SUID exploitation, kernel exploits, sudo abuse, cron jobs, and container escapes.',
        content: null
    },
    'windows-privilege-escalation': {
        title: 'Windows Privilege Escalation: Complete Guide',
        date: 'February 8, 2025',
        readTime: '65 min read',
        tag: 'Windows Security',
        difficulty: 'Advanced',
        excerpt: 'Token impersonation, service exploitation, UAC bypass, and credential harvesting.',
        content: null
    },
    'ssh-deep-dive': {
        title: 'SSH Deep Dive: Security, Configuration, and Exploitation',
        date: 'February 12, 2025',
        readTime: '45 min read',
        tag: 'Network Security',
        difficulty: 'Intermediate',
        excerpt: 'SSH protocol, key management, port forwarding, tunneling, and security hardening.',
        content: null
    }
};

// Function to load article content from external file
async function loadArticleContent(articleId) {
    const articleFiles = {
        'active-directory-basics': 'articles/active-directory.js',
        'mastering-nmap': 'articles/mastering-nmap.js',
        'sql-injection-explained': 'articles/sql-injection.js',
        'linux-privilege-escalation': 'articles/linux-privilege-escalation.js',
        'windows-privilege-escalation': 'articles/windows-privilege-escalation.js',
        'ssh-deep-dive': 'articles/ssh-deep-dive.js'
    };

    const filePath = articleFiles[articleId];
    if (!filePath) {
        console.error('Article not found:', articleId);
        return null;
    }

    try {
        // Load the script dynamically
        const response = await fetch(filePath);
        const scriptText = await response.text();
        
        // Execute the script to get the article object
        const scriptFunc = new Function(scriptText + '; return typeof activeDirectoryArticle !== "undefined" ? activeDirectoryArticle : (typeof nmapArticle !== "undefined" ? nmapArticle : (typeof sqlInjectionArticle !== "undefined" ? sqlInjectionArticle : (typeof linuxPrivEscArticle !== "undefined" ? linuxPrivEscArticle : (typeof windowsPrivEscArticle !== "undefined" ? windowsPrivEscArticle : sshArticle))));');
        const articleData = scriptFunc();
        
        return articleData;
    } catch (error) {
        console.error('Error loading article:', articleId, error);
        return null;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.comprehensiveArticles = comprehensiveArticles;
    window.loadArticleContent = loadArticleContent;
}
