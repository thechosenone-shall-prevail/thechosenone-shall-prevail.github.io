// Sameer Shah — the reader, and nothing louder.

document.addEventListener('DOMContentLoaded', () => {
    const reader = document.getElementById('reader');
    const body = document.getElementById('reader-body');
    const closeBtn = document.getElementById('reader-close');
    if (!reader || !body) return;

    window.openDossier = function (id) {
        const article = window.technicalArticles && window.technicalArticles[id];
        if (!article) return;
        body.innerHTML = article.content;
        reader.classList.add('active');
        reader.setAttribute('aria-hidden', 'false');
        reader.scrollTop = 0;
        document.body.style.overflow = 'hidden';
    };

    window.closeDossier = function () {
        reader.classList.remove('active');
        reader.setAttribute('aria-hidden', 'true');
        body.innerHTML = '';
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', window.closeDossier);

    reader.addEventListener('click', (e) => {
        if (e.target === reader) window.closeDossier();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && reader.classList.contains('active')) window.closeDossier();
    });
});
