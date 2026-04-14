// Articles Index
// Register articles here as they're added :D
const articleRegistry = {
    'ad-advanced-attacks': {
        title: 'Active Directory Advanced Attacks: GPO, Delegation, and Persistence',
        date: 'February 15, 2025',
        readTime: '70 min read',
        tag: 'Active Directory',
        difficulty: 'Advanced',
        loadFrom: 'articles/featured-AD.js'
    },
    'disk-wiper': {
        title: 'Scorched Earth: How Disk Wipers Actually Work (Low-Level Windows Edition)',
        date: 'April 14, 2025',
        readTime: '20 min read',
        tag: 'Malware Analysis',
        difficulty: 'Intermediate',
        loadFrom: 'articles/wiper.js'
    }
    // More articles coming soon!
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.articleRegistry = articleRegistry;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { articleRegistry };
}
