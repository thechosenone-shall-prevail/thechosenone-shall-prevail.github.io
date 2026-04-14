// Cute Anime Effects Integration
// Works with skru.js (Mashiro theme)

$(document).ready(function() {
    // Initialize anime effects
    if (!$('body').hasClass('dark-mode')) {
        initSakuraFalling();
    }
    initCursorEffects();
    initScrollAnimations();
    initCuteTooltips();

    // Listen for theme changes to toggle petals
    const themeToggle = document.getElementById('checkbox');
    if (themeToggle) {
        themeToggle.addEventListener('change', function(e) {
            if (e.target.checked) {
                // Dark mode: remove petals and block future petals
                $('.sakura-petal').remove();
                if (window._sakuraInterval) {
                    clearInterval(window._sakuraInterval);
                    window._sakuraInterval = null;
                }
            } else {
                // Light mode: add petals if not present
                if (!$('.sakura-petal').length) {
                    initSakuraFalling();
                }
            }
        });
    }
    console.log('%c✨ Anime Effects Loaded! ✨', 'color: #ff69b4; font-size: 16px; font-weight: bold;');
});

// Patch initSakuraFalling to store interval handle
function initSakuraFalling() {
    const sakuraContainer = document.querySelector('.sakura-falling');
    if (!sakuraContainer) return;
    for (let i = 0; i < 15; i++) {
        createSakuraPetal(sakuraContainer);
    }
    // Periodically add new petals
    if (window._sakuraInterval) clearInterval(window._sakuraInterval);
    window._sakuraInterval = setInterval(() => {
        if ($('body').hasClass('dark-mode')) {
            $('.sakura-petal').remove();
            clearInterval(window._sakuraInterval);
            window._sakuraInterval = null;
            return;
        }
        if (document.querySelectorAll('.sakura-petal').length < 20) {
            createSakuraPetal(sakuraContainer);
        }
    }, 3000);
}



function createSakuraPetal(container) {
    const petal = document.createElement('div');
    petal.className = 'sakura-petal';
    petal.innerHTML = '🌸';
    
    // Random starting position
    petal.style.left = Math.random() * 100 + '%';
    petal.style.animationDuration = (Math.random() * 10 + 15) + 's';
    petal.style.animationDelay = Math.random() * 5 + 's';
    petal.style.fontSize = (Math.random() * 10 + 15) + 'px';
    petal.style.opacity = Math.random() * 0.6 + 0.4;
    
    container.appendChild(petal);
    
    // Remove petal after animation
    setTimeout(() => {
        if (petal && petal.parentNode) {
            petal.parentNode.removeChild(petal);
        }
    }, 25000);
}

// Cursor Trail Effect
function initCursorEffects() {
    const colors = ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1', '#ff69b4'];
    let colorIndex = 0;
    
    $(document).on('mousemove', function(e) {
        // Create sparkle on mouse move
        if (Math.random() > 0.8) {
            createSparkle(e.pageX, e.pageY, colors[colorIndex % colors.length]);
            colorIndex++;
        }
    });
    
    // Click effect
    $(document).on('click', function(e) {
        createClickRipple(e.pageX, e.pageY);
    });
}

function createSparkle(x, y, color) {
    const sparkle = document.createElement('div');
    sparkle.className = 'cursor-sparkle';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.background = color;
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
        if (sparkle && sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
        }
    }, 1000);
}

function createClickRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = (x - 25) + 'px';
    ripple.style.top = (y - 25) + 'px';
    document.body.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple && ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// Scroll Animations
function initScrollAnimations() {
    // Add bounce animation to cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe all article cards
    document.querySelectorAll('.article-card, .featured-article').forEach(card => {
        observer.observe(card);
    });
}

// Cute Tooltips
function initCuteTooltips() {
    // Add kawaii reactions to buttons
    $('.nav-btn, .article-card, .featured-article').hover(
        function() {
            $(this).addClass('kawaii-hover');
        },
        function() {
            $(this).removeClass('kawaii-hover');
        }
    );
}


// Easter egg: Konami code
let konamiCode = [];
const konamiPattern = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

$(document).on('keydown', function(e) {
    konamiCode.push(e.keyCode);
    if (konamiCode.length > 10) konamiCode.shift();
    
    if (konamiCode.toString() === konamiPattern.toString()) {
        activateKawaiiMode();
        konamiCode = [];
    }
});

function activateKawaiiMode() {
    // Extra kawaii mode with more effects!
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            createFloatingHeart();
            const container = document.querySelector('.sakura-falling');
            if (container) {
                for (let j = 0; j < 5; j++) {
                    createSakuraPetal(container);
                }
            }
        }, i * 100);
    }
    
    // Show kawaii message
    showKawaiiMessage();
}

function showKawaiiMessage() {
    const message = document.createElement('div');
    message.className = 'kawaii-message';
    message.innerHTML = `
        <div style="text-align: center; font-size: 2rem;">
            <div>✨ KAWAII MODE ACTIVATED! ✨</div>
            <div style="font-size: 4rem; margin: 1rem 0;">( ´ ▽ \` )ﾉ</div>
            <div style="font-size: 1.2rem;">You found the secret! 💖</div>
        </div>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => {
            if (message && message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 500);
    }, 3000);
}

// Smooth page transitions
window.addEventListener('beforeunload', function() {
    document.body.style.opacity = '0';
});

// Add cute loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '1';
    
    // Welcome message
    setTimeout(() => {
        console.log('%c ╔════════════════════════════════════╗', 'color: #ff69b4');
        console.log('%c ║   Welcome to the Cyber Garden! 🌸  ║', 'color: #ff69b4; font-weight: bold');
        console.log('%c ╚════════════════════════════════════╝', 'color: #ff69b4');
        console.log('%c Made with 💗 by Sameer Shah', 'color: #666; font-style: italic');
    }, 500);
});
