/* ----
# Pio Plugin
# By: Dreamer-Paul
# Modify: journey-ad
# Last Update: 2021.5.4

A plugin supports switching Live2D models.

@author: https://paugram.com
---- */

var Paul_Pio = function (prop) {
    var that = this;

    var current = {
        idol: 0,
        menu: document.querySelector(".pio-container .pio-action"),
        canvas: document.getElementById("pio"),
        body: document.querySelector(".pio-container"),
        root: document.location.protocol + '//' + document.location.hostname + '/'
    };

    /* - Methods */
    var modules = {
        // Switch model
        idol: function () {
            current.idol < (prop.model.length - 1) ? current.idol++ : current.idol = 0;
            return current.idol;
        },
        // Create content
        create: function (tag, prop) {
            var e = document.createElement(tag);
            if (prop.class) e.className = prop.class;
            return e;
        },
        // Random content
        rand: function (arr) {
            return arr[Math.floor(Math.random() * arr.length + 1) - 1];
        },
        // Method to create message box
        render: function (text) {
            if (text.constructor === Array) {
                dialog.innerHTML = modules.rand(text);
            }
            else if (text.constructor === String) {
                dialog.innerHTML = text;
            }
            else {
                dialog.innerHTML = "X_X Wrong input.";
            }

            dialog.classList.add("active");

            clearTimeout(this.t);
            this.t = setTimeout(function () {
                dialog.classList.remove("active");
            }, 3000);
        },
        // Remove method
        destroy: function () {
            that.initHidden();
            localStorage.setItem("posterGirl", 0);
        },
        // Check if device is mobile
        isMobile: function () {
            var ua = window.navigator.userAgent.toLowerCase();
            return (ua.indexOf("mobile") !== -1 || ua.indexOf("android") !== -1 || ua.indexOf("ios") !== -1);
        }
    };
    this.modules = modules;
    this.destroy = modules.destroy;

    // Prevent the Live2D character from showing on mobile
    if (modules.isMobile()) {
        console.log('Mobile detected. Live2D will not be displayed.');
        return; // Stop execution and prevent any further initialization
    }

    var elements = {
        home: modules.create("span", { class: "pio-home" }),
        skin: modules.create("span", { class: "pio-skin" }),
        info: modules.create("span", { class: "pio-info" }),
        night: modules.create("span", { class: "pio-night" }),
        close: modules.create("span", { class: "pio-close" }),

        show: modules.create("div", { class: "pio-show" })
    };

    var dialog = modules.create("div", { class: "pio-dialog" });
    current.body.appendChild(dialog);
    current.body.appendChild(elements.show);

    /* - Message Tips */
    var action = {
        // Welcome msg
        welcome: function () {
            if (prop.tips) {
                var text, hour = new Date().getHours();

                if (hour > 22 || hour <= 5) {
                    text = "Heyo, night owl!";
                }
                else if (hour > 5 && hour <= 8) {
                    text = "Good morning~";
                }
                else if (hour > 8 && hour <= 11) {
                    text = "Get up to work!";
                }
                else if (hour > 11 && hour <= 14) {
                    text = "Lunch time (*´﹃`)";
                }
                else if (hour > 14 && hour <= 17) {
                    text = "Sleepy afternoon zzZ...";
                }
                else if (hour > 17 && hour <= 19) {
                    text = "Evening! Beautiful sunset outside!";
                }
                else if (hour > 19 && hour <= 21) {
                    text = "Good evening! How's your day?";
                }
                else if (hour > 21 && hour <= 23) {
                    text = "Time for bed. Good night~";
                }
                else {
                    text = "Fun fact: This message should never appear, haha!";
                }

                modules.render(text);
            }
            else {
                modules.render(prop.content.welcome || "Welcome to Axura's Blog!");
            }
        },
        // Touch Interaction with tap counter
        touch: function () {
            console.log("[Diana Debug] touch() function called");
            console.log("[Diana Debug] current.canvas:", current.canvas);
            
            let tapCount = 0;
            let tapResetTimeout;
            
            // Safety check - make sure canvas exists
            if (!current.canvas) {
                console.error("[Diana] Canvas not found, retrying in 500ms...");
                setTimeout(() => {
                    action.touch();
                }, 500);
                return;
            }
            
            console.log("[Diana Debug] Canvas found! Setting up click handler...");
            console.log("[Diana Debug] Custom messages available:", prop.content.touch);
            
            current.canvas.onclick = function () {
                tapCount++;
                console.log(`[Diana Debug] TAP! Count: ${tapCount}`);
                
                // Clear any existing reset timeout
                if (tapResetTimeout) {
                    clearTimeout(tapResetTimeout);
                }
                
                // Check if we've reached 2 taps
                const requiredTaps = 2;
                console.log(`[Diana Debug] Required taps: ${requiredTaps}`);
                
                if (tapCount >= requiredTaps) {
                    console.log("[Diana Debug] Threshold reached! Showing message...");
                    modules.render(prop.content.touch || ["Oops... was that just an accidental touch? (,,>﹏<,,)", "Touch me again and I'm calling the cops! ≧﹏≦", "HENTAI!", "Police officer? Help! There's a creep here who keeps touching me! (ᗒᗣᗕ)՞ "]);
                    tapCount = 0; // Reset counter after showing message
                    console.log("[Diana Debug] Message shown, tap count reset");
                } else {
                    console.log(`[Diana Debug] Not enough taps yet (${tapCount}/${requiredTaps})`);
                    // Reset tap count after 2 seconds of no tapping
                    tapResetTimeout = setTimeout(() => {
                        tapCount = 0;
                        console.log('[Diana Debug] Tap count reset due to timeout');
                    }, 2000);
                }
            };
            console.log("[Diana Debug] ✅ Touch handler installed successfully!");
        },
        // Right-side menu buttons - DISABLED
        buttons: function () {
            // All buttons disabled - Diana is just for tapping!
            console.log("[Diana Debug] Buttons disabled - Diana is tap-only mode!");
        }
    };

    /* - Run Mode */
    var begin = {
        static: function () {
            current.body.classList.add("static");
        },
        fixed: function () {
            action.touch();
            action.buttons();
        },
        draggable: function () {
            action.touch();
            action.buttons();
        }
    };

    // Initialization
    this.init = function (onlyText) {
        if (!(prop.hidden && modules.isMobile())) {
            if (!onlyText) {
                action.welcome();
                that.model = loadlive2d("pio", prop.model[0], model => {
                    prop.onModelLoad && prop.onModelLoad(model)
                });
            }
            
            // Initialize the mode (fixed or draggable) to set up touch handlers
            // Do this after a short delay to ensure everything is loaded
            setTimeout(function() {
                console.log("[Diana Debug] Initializing mode:", prop.mode);
                console.log("[Diana Debug] action object:", action);
                console.log("[Diana Debug] action properties:", Object.keys(action));
                console.log("[Diana Debug] action.fixed type:", typeof action.fixed);
                console.log("[Diana Debug] action.touch type:", typeof action.touch);
                
                // Call touch directly since fixed/draggable might not be working
                console.log("[Diana Debug] Calling action.touch() directly...");
                action.touch();
                action.buttons();
            }, 100);
        }
    };

    // Hidden State
    this.initHidden = function () {
        current.body.classList.add("hidden");
        dialog.classList.remove("active");
    };

    localStorage.getItem("posterGirl") == 0 ? this.initHidden() : this.init();	
};
