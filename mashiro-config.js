// Mashiro Theme Configuration for skru.js
var mashiro_global = {};
var mashiro_option = {
    cookie_version_control: '_v1',
    site_name: 'Sameer Shah',
    author_name: 'Sameer Shah',
    cover_api: '',
    google_analytics_id: '',
    baidu_analytics_id: ''
};

var Poi = {
    reply_link_version: 'new',
    api: '/wp-json/',
    nonce: '',
    google_analytics_id: '',
    ajaxurl: '/wp-admin/admin-ajax.php'
};

// Initialize functions that skru.js might need
function lazyload() {
    // Lazy load images
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

function social_share() {
    // Social sharing functionality (can be expanded)
    console.log('Social share initialized');
}

function coverVideoIni() {
    // Cover video initialization (if needed)
    console.log('Cover video initialized');
}

function checkskinSecter() {
    // Skin section checker
    console.log('Skin secter checked');
}

function scrollBar() {
    // Custom scrollbar (already handled in CSS)
    console.log('Scrollbar initialized');
}

function load_bangumi() {
    // Bangumi/anime list loader (if needed)
    console.log('Bangumi loaded');
}

function pjaxInit() {
    // PJAX initialization
    console.log('PJAX initialized');
}

// Initialize when DOM is ready
$(document).ready(function() {
    // Initialize mashiro global if functions exist
    if (typeof mashiro_global.ini !== 'undefined') {
        mashiro_global.ini.normalize();
    }
    
    console.log('%c Mashiro Theme Loaded! 🌸', 'color: #ff69b4; font-weight: bold; font-size: 14px;');
});
