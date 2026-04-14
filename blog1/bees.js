// Glowing Bees Animation for Dark Mode Only
(function() {
    const NUM_BEES = 4;
    let bees = [];
    let beeContainer = null;
    let animationFrameId = null;

    function createBeeElement() {
        const bee = document.createElement('div');
        bee.className = 'glowing-bee';
        bee.style.position = 'fixed';
        bee.style.width = (6 + Math.random() * 4) + 'px';
        bee.style.height = bee.style.width;
        bee.style.borderRadius = '50%';
        bee.style.boxShadow = '0 0 6px 2px #ffe066, 0 0 12px 4px #fcd34d';
        bee.style.background = 'radial-gradient(circle, #fffbe6 60%, #ffe066 100%)';
        bee.style.opacity = '0.75';
        bee.style.pointerEvents = 'none';
        bee.style.zIndex = '10000';
        return bee;
    }

    function randomBeeState() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight * 0.6 + 30,
            angle: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.8,
            radius: 30 + Math.random() * 70,
            t: Math.random() * 1000
        };
    }

    function animateBees() {
        bees.forEach((bee, i) => {
            const state = bee._beeState;
            state.t += 0.012 + 0.003 * i;
            // Bees move in a wavy/spiral pattern
            state.x += Math.cos(state.angle + state.t) * state.speed;
            state.y += Math.sin(state.angle + state.t * 0.8) * state.speed;
            // Bounce off edges
            if (state.x < 0 || state.x > window.innerWidth - 18) state.angle = Math.PI - state.angle;
            if (state.y < 0 || state.y > window.innerHeight - 18) state.angle = -state.angle;
            bee.style.left = state.x + 'px';
            bee.style.top = state.y + 'px';
        });
        animationFrameId = requestAnimationFrame(animateBees);
    }

    function showBees() {
        if (beeContainer) return;
        beeContainer = document.createElement('div');
        beeContainer.id = 'bee-bg-container';
        beeContainer.style.position = 'fixed';
        beeContainer.style.top = '0';
        beeContainer.style.left = '0';
        beeContainer.style.width = '100vw';
        beeContainer.style.height = '100vh';
        beeContainer.style.pointerEvents = 'none';
        beeContainer.style.zIndex = '1000';
        document.body.appendChild(beeContainer);
        bees = [];
        for (let i = 0; i < NUM_BEES; i++) {
            const bee = createBeeElement();
            bee._beeState = randomBeeState();
            bees.push(bee);
            beeContainer.appendChild(bee);
        }
        animateBees();
    }

    function hideBees() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (beeContainer) {
            beeContainer.remove();
            beeContainer = null;
        }
        bees = [];
    }

    function checkThemeAndToggleBees() {
        if (document.body.classList.contains('dark-mode')) {
            showBees();
        } else {
            hideBees();
        }
    }

    // Initial check
    document.addEventListener('DOMContentLoaded', checkThemeAndToggleBees);
    // Listen for theme changes
    const themeToggle = document.getElementById('checkbox');
    if (themeToggle) {
        themeToggle.addEventListener('change', checkThemeAndToggleBees);
    }
    // On page show (back/forward cache)
    window.addEventListener('pageshow', checkThemeAndToggleBees);
    // On resize
    window.addEventListener('resize', () => {
        bees.forEach(bee => {
            bee._beeState.x = Math.min(bee._beeState.x, window.innerWidth - 18);
            bee._beeState.y = Math.min(bee._beeState.y, window.innerHeight - 18);
        });
    });
})();
