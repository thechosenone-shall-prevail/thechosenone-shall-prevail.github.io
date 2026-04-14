// Live2D Diana Character with Custom Hacking Messages
// Using Sakura theme's Diana model (Cubism 4)

(function () {
    'use strict';

    console.log('%c 🎀 Loading Diana Live2D Model... ', 'color: #ff69b4; font-weight: bold;');

    // Custom friendly messages
    const customMessages = [
        "Happy Hacking! ",
        "pwn the system! ",
        "Meoww~~ ",
        "Stop poking me, it tickles! >///<",
        "Let's hack the planet! ",
        "root@diana:~# ",
        "sudo make me a sandwich ",
        "chmod 777 cuteness ",
        "Kernel panic! Just kidding~ ",
        "rm -rf boredom ",
        "Exploit found: You! >///<",
        "/dev/null is lonely... ",
        "Segmentation fault (cuteness dumped) ",
        "Buffer overflow of love! 💗"
    ];

    let messageTimeout;
    let tapCount = 0;
    let tapResetTimeout;

    // Load Cubism 4 Core
    const cubismScript = document.createElement('script');
    cubismScript.src = 'https://4xura.com/wp-content/themes/sakura/live2d/cubism4.min.js';
    cubismScript.async = false;

    cubismScript.onload = function () {
        console.log('%c ✅ Cubism 4 Core Loaded! ', 'color: #00ff00; font-weight: bold;');
        loadDianaModel();
    };

    cubismScript.onerror = function () {
        console.log('%c ⚠️ Cubism CDN failed, using fallback... ', 'color: #ff9800; font-weight: bold;');
        // Fallback to alternative Live2D
        loadFallbackModel();
    };

    document.head.appendChild(cubismScript);

    function loadDianaModel() {
        const container = document.createElement('div');
        container.id = 'live2d-container';
        container.innerHTML = `
            <canvas id="live2d-canvas" width="280" height="350"></canvas>
            <div id="live2d-message" class="live2d-message"></div>
        `;
        document.body.appendChild(container);
        // Attach click/tap to canvas for normal mode
        setTimeout(() => {
            const canvas = document.getElementById('live2d-canvas');
            if (canvas) {
                canvas.addEventListener('click', handleTap);
                canvas.addEventListener('touchstart', handleTap);
                canvas.style.cursor = 'pointer';
            }
        }, 500);
        // Try to load Diana model
        if (window.PIXI && window.PIXI.live2d) {
            loadPixiDiana();
        } else {
            // Use alternative if PIXI not available
            loadFallbackModel();
        }
    }

    function loadPixiDiana() {
        const app = new PIXI.Application({
            view: document.getElementById('live2d-canvas'),
            transparent: true,
            width: 280,
            height: 350
        });

        PIXI.live2d.Live2DModel.from('https://4xura.com/wp-content/themes/sakura/live2d/Diana/Diana.model3.json')
            .then(model => {
                app.stage.addChild(model);
                model.scale.set(0.15);
                model.x = 140;
                model.y = 350;

                // Add tap interaction
                model.on('hit', (hitAreas) => {
                    handleTap();
                });

                console.log('%c 💖 Diana Loaded! Click her for messages! ', 'color: #ff1493; font-weight: bold;');
            })
            .catch(err => {
                console.log('Diana model failed, using fallback:', err);
                loadFallbackModel();
            });
    }

    function loadFallbackModel() {
        console.log('%c 🔄 Loading fallback Live2D model... ', 'color: #00bcd4; font-weight: bold;');

        // Load L2Dwidget as fallback
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js';

        fallbackScript.onload = function () {
            setTimeout(() => {
                if (window.L2Dwidget) {
                    L2Dwidget.init({
                        "model": {
                            jsonPath: "https://unpkg.com/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json",
                            "scale": 1
                        },
                        "display": {
                            "position": "left",
                            "width": 150,
                            "height": 300,
                            "hOffset": 10,
                            "vOffset": -20
                        },
                        "mobile": {
                            "show": true,
                            "scale": 0.6
                        },
                        "react": {
                            "opacityDefault": 0.85,
                            "opacityOnHover": 1
                        },
                        "dialog": {
                            "enable": false
                        }
                    });

                    console.log('%c 💖 Fallback model loaded! ', 'color: #ff1493; font-weight: bold;');

                    // Add custom message display
                    setupMessageDisplay();
                }
            }, 500);
        };

        document.head.appendChild(fallbackScript);
    }

    function setupMessageDisplay() {
        // Remove any existing message bubble
        const oldBubble = document.getElementById('live2d-message');
        if (oldBubble) oldBubble.remove();
        // Create message bubble
        const messageBubble = document.createElement('div');
        messageBubble.id = 'live2d-message';
        messageBubble.className = 'live2d-message';
        messageBubble.style.zIndex = '10001'; // ensure visible
        document.body.appendChild(messageBubble);
        // Ensure fallback widget is visible and interactive
        setTimeout(() => {
            const widget = document.getElementById('live2d-widget');
            const canvas = document.getElementById('live2dcanvas');
            if (widget) {
                widget.style.pointerEvents = 'auto';
                widget.style.zIndex = '10000';
            }
            if (canvas) {
                canvas.style.pointerEvents = 'auto';
                canvas.style.zIndex = '10001';
            }
        }, 2000);
        // Add click listener to canvas area
        setTimeout(() => {
            // Try canvas first
            let widgetArea = document.querySelector('#live2dcanvas, #live2d-canvas');
            if (widgetArea) {
                widgetArea.addEventListener('click', handleTap);
                widgetArea.addEventListener('touchstart', handleTap);
                widgetArea.style.cursor = 'pointer';
            } else {
                // Only attach to the widget directly if present
                setTimeout(() => {
                    const widget = document.getElementById('live2d-widget');
                    if (widget) {
                        widget.style.pointerEvents = 'auto';
                        widget.style.zIndex = '10000';
                        widget.addEventListener('click', handleTap);
                        widget.addEventListener('touchstart', handleTap);
                        widget.style.cursor = 'pointer';
                    }
                }, 500);
            }
        }, 1200);
    }

    function handleTap() {
        tapCount++;
        console.log(`Tap count: ${tapCount}`);

        // Clear any existing reset timeout
        if (tapResetTimeout) {
            clearTimeout(tapResetTimeout);
        }

        // Check if we've reached 3-4 taps (randomly choose between 3 and 4)
        const requiredTaps = Math.random() < 0.5 ? 3 : 4;

        if (tapCount >= requiredTaps) {
            showRandomMessage();
            tapCount = 0; // Reset counter after showing message
        } else {
            // Reset tap count after 2 seconds of no tapping
            tapResetTimeout = setTimeout(() => {
                tapCount = 0;
                console.log('Tap count reset');
            }, 2000);
        }
    }

    function showRandomMessage() {
        const messageEl = document.getElementById('live2d-message');
        if (!messageEl) {
            const newMessageEl = document.createElement('div');
            newMessageEl.id = 'live2d-message';
            newMessageEl.className = 'live2d-message';
            document.body.appendChild(newMessageEl);
        }

        const message = customMessages[Math.floor(Math.random() * customMessages.length)];
        const msgEl = document.getElementById('live2d-message');

        msgEl.textContent = message;
        msgEl.classList.add('show');

        // Clear previous timeout
        if (messageTimeout) clearTimeout(messageTimeout);

        // Hide after 3 seconds
        messageTimeout = setTimeout(() => {
            msgEl.classList.remove('show');
        }, 3000);
    }

    // Expose for external use
    window.showDianaMessage = showRandomMessage;
})();
