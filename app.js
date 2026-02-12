document.addEventListener('DOMContentLoaded', () => {
    const envelopeWrapper = document.getElementById('envelopeWrapper');
    const envelope = document.getElementById('envelope');
    const headerText = document.getElementById('headerText');
    const letter = document.getElementById('letter');
    const scatterItems = document.querySelectorAll('.scatter-item');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const closeBtn = document.getElementById('closeBtn');
    const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');
    const videoPlayer = document.getElementById('videoPlayer');
    const scatterItemsContainer = document.getElementById('scatterItems');

    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxOverlay = document.getElementById('lightboxOverlay');

    // Pagination State
    let isOpen = false;
    let currentPage = 1;
    const pages = document.querySelectorAll('.page');
    const totalPages = pages.length;

    function buildMobileGallery() {
        const isMobile = window.innerWidth <= 768;
        const content = page1.querySelector('.content');
        if (!isMobile || !content) return;

        if (content.querySelector('.mobile-gallery')) return;

        const gallery = document.createElement('div');
        gallery.className = 'mobile-gallery';
        gallery.setAttribute('role', 'list');

        content.insertBefore(gallery, content.firstChild);

        document.querySelectorAll('.scatter-item').forEach((item) => {
            const srcEl = item.querySelector('img');
            const captionEl = item.querySelector('.scatter-caption');
            if (!srcEl) return;

            const fig = document.createElement('figure');
            fig.setAttribute('role', 'listitem');

            const img = new Image();
            img.src = srcEl.getAttribute('src');
            img.alt = srcEl.getAttribute('alt') || 'Photo';
            img.loading = 'lazy';
            img.decoding = 'async';

            const cap = document.createElement('figcaption');
            cap.textContent = captionEl ? captionEl.textContent : img.alt;

            fig.appendChild(img);
            fig.appendChild(cap);
            gallery.appendChild(fig);
        });

        if (scatterItemsContainer) {
            scatterItemsContainer.style.display = 'none';
        }
    }

    function teardownMobileGallery() {
        const content = page1.querySelector('.content');
        const gallery = content && content.querySelector('.mobile-gallery');
        if (gallery) {
            gallery.remove();
        }
        if (scatterItemsContainer) {
            scatterItemsContainer.style.display = '';
        }
    }

    function handleResponsiveGalleryToggle() {
        if (window.innerWidth <= 768) {
            buildMobileGallery();
        } else {
            teardownMobileGallery();
        }
    }

    /**
     * Paging Logic (Frontend "Backend")
     * Handles accurate record (page) slicing and state synchronization.
     */
    function updatePaginationUI(targetPage) {
        // Defensive checks: prevent out-of-range requests
        if (targetPage < 1 || targetPage > totalPages) {
            console.error(`Page ${targetPage} is out of bounds (1-${totalPages})`);
            return false;
        }

        // State synchronization: hide all pages
        pages.forEach(p => {
            p.classList.remove('active');
            p.scrollTop = 0; // Reset scroll position for "fresh" page view
        });

        // "Record slicing": select and show the correct page
        const activePage = document.querySelector(`.page-${targetPage}`);
        if (activePage) {
            activePage.classList.add('active');
            currentPage = targetPage;

            // Page-specific side effects (e.g., video handling)
            if (targetPage === 2) {
                videoPlayer.play().catch(err => console.log("Autoplay prevented:", err));
                videoPlayer.focus(); // Focus management for accessibility
            } else {
                videoPlayer.pause();
                if (targetPage === 1 && isOpen) {
                    nextBtn.focus(); // Return focus to next button
                }
            }
            return true;
        }
        return false;
    }

    // Open Envelope Action
    envelopeWrapper.addEventListener('click', () => {
        if (!isOpen) {
            openEnvelope();
        }
    });

    function openEnvelope() {
        isOpen = true;
        currentPage = 1; // Reset to first page on open
        updatePaginationUI(1);
        
        envelope.classList.add('open');
        headerText.classList.add('hidden');
        envelopeWrapper.classList.add('active');
        document.body.classList.add('envelope-is-open');

        handleResponsiveGalleryToggle();

        // Randomize scatter items with sophisticated algorithm
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isMobile = vw <= 768;
        const polaroidWidth = isMobile ? (vw <= 400 ? 110 : 140) : (vw > 1024 ? 250 : 200);
        const polaroidHeight = polaroidWidth * 1.2;
        
        // Critical areas to avoid (centered letter)
        const letterWidth = isMobile ? vw * 0.95 : Math.min(vw * 0.9, 700);
        const letterHeight = isMobile ? vh * 0.9 : Math.min(vh * 0.85, 650);
        const safeZone = {
            left: (vw - letterWidth) / 2 - 50,
            right: (vw + letterWidth) / 2 + 50,
            top: (vh - letterHeight) / 2 - 50,
            bottom: (vh + letterHeight) / 2 + 50
        };

        const placedPolaroids = [];

        scatterItems.forEach((item, index) => {
            let x, y, rotate;
            let attempts = 0;
            const maxAttempts = 50;
            let isValid = false;

            while (!isValid && attempts < maxAttempts) {
                attempts++;
                
                // Randomly pick an edge (0: top, 1: right, 2: bottom, 3: left)
                const edge = Math.floor(Math.random() * 4);
                const margin = 100;

                if (edge === 0) { // Top
                    x = Math.random() * vw;
                    y = Math.random() * (vh * 0.25);
                } else if (edge === 1) { // Right
                    x = vw - Math.random() * (vw * 0.25);
                    y = Math.random() * vh;
                } else if (edge === 2) { // Bottom
                    x = Math.random() * vw;
                    y = vh - Math.random() * (vh * 0.25);
                } else { // Left
                    x = Math.random() * (vw * 0.25);
                    y = Math.random() * vh;
                }

                // Keep away from viewport edges
                x = Math.max(polaroidWidth/2 + 20, Math.min(vw - polaroidWidth/2 - 20, x));
                y = Math.max(polaroidHeight/2 + 20, Math.min(vh - polaroidHeight/2 - 20, y));

                // Collision Detection: Avoid Letter Safe Zone
                const inSafeZone = x > safeZone.left && x < safeZone.right && 
                                  y > safeZone.top && y < safeZone.bottom;
                
                // Collision Detection: Avoid other polaroids
                const tooClose = placedPolaroids.some(p => {
                    const dx = p.x - x;
                    const dy = p.y - y;
                    return Math.sqrt(dx*dx + dy*dy) < polaroidWidth * 0.8;
                });

                if (!inSafeZone && !tooClose) {
                    isValid = true;
                }
            }

            // Fallback positioning if no valid spot found
            if (!isValid) {
                const angle = (index / scatterItems.length) * Math.PI * 2;
                const dist = Math.min(vw, vh) * 0.4;
                x = vw/2 + Math.cos(angle) * dist;
                y = vh/2 + Math.sin(angle) * dist;
            }

            rotate = Math.random() * 30 - 15; // -15 to +15 degrees
            placedPolaroids.push({x, y});

            item.style.left = `${x}px`;
            item.style.top = `${y}px`;
            item.style.opacity = '1'; // Explicitly set opacity to 1 on open
            item.style.transform = `translate(-50%, -50%) rotate(${rotate}deg) scale(1)`;
            item.style.transitionDelay = `${0.3 + index * 0.2}s`;
        });

    // Sequence: Flap opens (0s) -> Letter slides out (0.2s) -> Letter expands (0.8s)
    setTimeout(() => {
        envelope.classList.add('full-view');
        // Force reflow/re-render of images when opening
        scatterItems.forEach(item => {
            const img = item.querySelector('img');
            if (img) {
                const currentSrc = img.src;
                img.src = currentSrc;
            }
        });
    }, 800);
}

    window.addEventListener('resize', handleResponsiveGalleryToggle, { passive: true });
    window.addEventListener('orientationchange', handleResponsiveGalleryToggle);

    // Navigation Events
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        updatePaginationUI(currentPage + 1);
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updatePaginationUI(currentPage - 1);
    });

    // Close Action
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeEnvelope();
    });

    function closeEnvelope() {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;

        envelope.classList.remove('full-view');

        setTimeout(() => {
            envelope.classList.remove('open');
            headerText.classList.remove('hidden');
            envelopeWrapper.classList.remove('active');
            document.body.classList.remove('envelope-is-open');
            isOpen = false;
            
            // Reset pagination state for next open
            updatePaginationUI(1);

            scatterItems.forEach(item => {
                item.style.transform = 'translate(-50%, -50%) scale(0.3) rotate(0deg)';
                item.style.opacity = ''; // Remove inline style to allow CSS classes to take over
                item.style.transitionDelay = '0s';
            });

        }, 800);
    }

    // Lightbox Functionality
    function openLightboxModal(src) {
        // Ensure the image is fully loaded before showing lightbox if possible
        const tempImg = new Image();
        tempImg.onload = () => {
            lightboxImg.src = src;
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Ensure no scroll
        };
        tempImg.src = src;
        
        // Add caption if needed
        const currentItem = Array.from(scatterItems).find(item => item.querySelector('img').src.includes(src.split('/').pop()));
        if (currentItem) {
            const caption = currentItem.querySelector('.scatter-caption').textContent;
            lightboxImg.alt = caption;
        }
    }

    function closeLightboxModal() {
        lightbox.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            lightboxImg.src = '';
        }, 300);
    }

    // Scatter Item Click
    scatterItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling
            const img = item.querySelector('img');
            if (img) {
                openLightboxModal(img.src);
            }
        });
    });

    // Lightbox Controls
    lightboxClose.addEventListener('click', closeLightboxModal);
    lightboxOverlay.addEventListener('click', closeLightboxModal);

    // Escape Key Support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox.getAttribute('aria-hidden') === 'false') {
                closeLightboxModal();
            }
        }
    });

    // Prevent clicks inside the letter from bubbling
    letter.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});
