// Article Database
// Articles are loaded from individual files in /articles/
const articles = {
    // New articles added here as they get written :D
};

// Article Modal Logic
function loadArticle(articleId) {
    const modal = document.getElementById('article-modal');
    const contentDiv = document.getElementById('article-content');
    
    // Check comprehensive articles first, then fall back to regular articles
    const article = (window.comprehensiveArticles && window.comprehensiveArticles[articleId]) || articles[articleId];
    
    if (article) {
        contentDiv.innerHTML = `<div class="article-content">${article.content}</div>`;
        contentDiv.className = 'article-content';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Reset scroll position
        contentDiv.scrollTop = 0;
        
        // Initialize scroll progress if it exists
        const scrollProgress = document.getElementById('scrollProgress');
        if (scrollProgress) {
            scrollProgress.style.width = '0%';
        }
    }
}

function closeArticle() {
    const modal = document.getElementById('article-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

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
console.log('Made with 💙 by Sameer');

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