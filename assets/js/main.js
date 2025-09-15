// Multi-page navigation system
let currentPage = 'home';
const pages = ['home', 'about', 'menu', 'gallery', 'contact', 'reservations', 'chef', 'events'];

// Helpers
function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function applyMotionPreferences() {
    if (isMobile()) {
        document.body.classList.add('mobile-no-anim');
    } else {
        document.body.classList.remove('mobile-no-anim');
    }
}

// Routing helpers for clean URLs
function pathForPage(pageName) {
    const page = (pageName || 'home').toLowerCase();
    return `/${page}`;
}

// Generic tilt on mouse move for interactive elements
function initializeTiltSystem() {
    if (isMobile()) return; // disable tilt on mobile
    const tiltSelectors = '.menu-card-3d, .food-item-3d, .btn-3d, .card-3d, .nav-item-3d';
    const tiltMax = 12; // degrees
    const damping = 0.12; // approach speed

    document.querySelectorAll(tiltSelectors).forEach(el => {
        let raf = null;
        let targetRX = 0, targetRY = 0; // target rotation
        let currentRX = 0, currentRY = 0; // animated rotation
        let baseTransform = '';
        let hovering = false;

        const apply = () => {
            // lerp for smoothness
            currentRX += (targetRX - currentRX) * damping;
            currentRY += (targetRY - currentRY) * damping;
            el.style.transform = `${baseTransform} rotateX(${currentRX.toFixed(2)}deg) rotateY(${currentRY.toFixed(2)}deg)`;
            if (Math.abs(currentRX - targetRX) > 0.1 || Math.abs(currentRY - targetRY) > 0.1) {
                raf = requestAnimationFrame(apply);
            } else {
                raf = null;
            }
        };

        const onEnter = () => {
            if (el.classList.contains('dragging')) return;
            hovering = true;
            const computed = getComputedStyle(el);
            baseTransform = computed.transform && computed.transform !== 'none' ? computed.transform : '';
            // Pause CSS animations for floating items while interacting
            if (el.classList.contains('menu-card-3d') || el.classList.contains('food-item-3d')) {
                el.style.animationPlayState = 'paused';
            }
            // Make transforms smooth
            el.style.willChange = 'transform';
        };

        const onMove = (e) => {
            if (!hovering || el.classList.contains('dragging')) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
            const clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
            const dx = (clientX - cx) / (rect.width / 2); // -1..1
            const dy = (clientY - cy) / (rect.height / 2); // -1..1
            // Clamp
            const clampedDX = Math.max(-1, Math.min(1, dx));
            const clampedDY = Math.max(-1, Math.min(1, dy));
            // Right move => positive rotateY so right side tilts away
            targetRY = clampedDX * tiltMax;
            // Down move => negative rotateX (tilt forward)
            targetRX = -clampedDY * tiltMax;
            if (!raf) raf = requestAnimationFrame(apply);
        };

        const onLeave = () => {
            hovering = false;
            targetRX = 0; targetRY = 0;
            if (!raf) raf = requestAnimationFrame(apply);
            // Resume animations after a short delay
            setTimeout(() => {
                if (!hovering && !el.classList.contains('dragging')) {
                    if (el.classList.contains('menu-card-3d') || el.classList.contains('food-item-3d')) {
                        el.style.animationPlayState = '';
                    }
                    // Clear transform to restore CSS transforms
                    el.style.transform = '';
                    el.style.willChange = '';
                }
            }, 180);
        };

        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        // Touch support
        el.addEventListener('touchstart', onEnter, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: true });
        el.addEventListener('touchend', onLeave, { passive: true });
    });
}

// Make almost every element draggable by click-and-drag
function initializeGlobalDragEverything() {
    const forbiddenTags = new Set(['HTML','HEAD','BODY','SCRIPT','STYLE','LINK','META','TITLE','NOSCRIPT']);
    // Allow dragging ONLY for HERO section elements
    const allowedDragSelectors = '#home .menu-card-3d, #home .food-item-3d, #home .table-3d, #home .chair-3d, #home .hero-content, #home .ambient-light';
    let anyDragging = false;
    let startX = 0, startY = 0;
    let startRect = null;
    let targetEl = null;
    let suppressNextClick = false;
    let offsetX = 0, offsetY = 0; // pointer offset inside element at drag start
    let parentEl = null, parentRect = null, placeholder = null, parentAddedRel = false;
    let startLeftRel = 0, startTopRel = 0;

    // Choose a sensible draggable root so it moves from its own position
    function findRoot(el) {
        let node = el;
        while (node && node.nodeType === 1 && !forbiddenTags.has(node.tagName)) {
            if (node.matches(allowedDragSelectors)) return node;
            node = node.parentElement;
        }
        return null;
    }

    function pointerXY(ev) {
        if (ev.touches && ev.touches[0]) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
        return { x: ev.clientX, y: ev.clientY };
    }

    function onDown(ev) {
        if (ev.button !== undefined && ev.button !== 0) return; // only left click
        const el = findRoot(ev.target);
        if (!el) return;
        targetEl = el;
        startRect = el.getBoundingClientRect();
        const p = pointerXY(ev);
        startX = p.x; startY = p.y;
        offsetX = p.x - startRect.left;
        offsetY = p.y - startRect.top;
        anyDragging = false;
        suppressNextClick = false;

        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mouseup', onUp, true);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp, true);
    }

    function ensureAbsoluteInParent(el) {
        const cs = getComputedStyle(el);
        // Store original inline style once to be able to reset perfectly
        if (!el.dataset.origStyle) {
            el.dataset.origStyle = el.getAttribute('style') || '';
        }
        parentEl = el.parentElement;
        parentRect = parentEl.getBoundingClientRect();
        // Ensure parent creates positioning context
        const parentPos = getComputedStyle(parentEl).position;
        if (parentPos === 'static') {
            parentEl.classList.add('drag-parent-rel');
            parentAddedRel = true;
        } else {
            parentAddedRel = false;
        }
        // Insert placeholder to keep layout where element was
        placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
        placeholder.style.width = startRect.width + 'px';
        placeholder.style.height = startRect.height + 'px';
        placeholder.style.display = 'inline-block';
        parentEl.insertBefore(placeholder, el);

        // Convert element to absolute inside parent, starting at current visual spot
        startLeftRel = startRect.left - parentRect.left;
        startTopRel = startRect.top - parentRect.top;
        el.style.position = 'absolute';
        el.style.left = Math.round(startLeftRel) + 'px';
        el.style.top = Math.round(startTopRel) + 'px';
        el.style.width = startRect.width + 'px';
        el.style.height = startRect.height + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.margin = '0';
        el.style.zIndex = String(Math.max(5, parseInt(cs.zIndex) || 0));
        el.classList.add('dragging');
        el.dataset.dragged = 'true';
        el.style.willChange = 'left, top, transform';
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    }

    function onMove(ev) {
        if (!targetEl) return;
        const p = pointerXY(ev);
        const dx = p.x - startX;
        const dy = p.y - startY;
        const threshold = 5;
        if (!anyDragging && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
            anyDragging = true;
            ensureAbsoluteInParent(targetEl);
        }
        if (!anyDragging) return;
        suppressNextClick = true;
        ev.preventDefault();

        // Constrain inside parent bounds
        const maxX = parentRect.width - startRect.width;
        const maxY = parentRect.height - startRect.height;
        // Keep pointer at the same relative position on the element
        let nx = startLeftRel + (p.x - startX);
        let ny = startTopRel + (p.y - startY);
        nx = Math.max(0, Math.min(nx, maxX));
        ny = Math.max(0, Math.min(ny, maxY));
        targetEl.style.left = Math.round(nx) + 'px';
        targetEl.style.top = Math.round(ny) + 'px';

        // Add slight 3D tilt during drag (desktop only)
        if (!isMobile()) {
            const tiltX = dy / 10;
            const tiltY = dx / 10;
            targetEl.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        }
    }

    function onUp(ev) {
        if (!targetEl) return;
        document.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('mouseup', onUp, true);
        document.removeEventListener('touchmove', onMove, { passive: false });
        document.removeEventListener('touchend', onUp, true);

        // Smoothly reset rotation, keep position where dropped
        targetEl.style.transition = 'transform 0.25s ease';
        targetEl.style.transform = '';
        setTimeout(() => {
            if (targetEl) targetEl.style.transition = '';
        }, 250);

        targetEl.classList.remove('dragging');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        // Remove placeholder but keep element absolute where dropped
        if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
        placeholder = null;
        // Remove parent relative class if we added it
        if (parentAddedRel && parentEl) parentEl.classList.remove('drag-parent-rel');
        parentEl = null;
        parentRect = null;
        targetEl = null;
        startRect = null;
        anyDragging = false;
    }

    // Cancel click navigation only if a drag actually happened
    document.addEventListener('click', function(ev) {
        if (suppressNextClick) {
            ev.preventDefault();
            ev.stopPropagation();
            suppressNextClick = false;
        }
    }, true);

    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('touchstart', onDown, { passive: true, capture: true });

    // Enable global grab cursor feedback
    document.body.classList.add('draggable-enabled');
    // Mark draggables to show grab cursor only on them
    document.querySelectorAll('.is-draggable').forEach(el => el.classList.remove('is-draggable'));
    document.querySelectorAll(allowedDragSelectors).forEach(el => el.classList.add('is-draggable'));

    // Double-click anywhere to reset all moved elements back to original place
    function resetAllDraggables() {
        document.querySelectorAll('[data-dragged="true"]').forEach(el => {
            const prev = el.dataset.origStyle || '';
            if (prev) {
                el.setAttribute('style', prev);
            } else {
                el.removeAttribute('style');
            }
            el.classList.remove('dragging');
            delete el.dataset.dragged;
            // clean tilt if any pending
            el.style.transform = '';
        });
    }
    document.addEventListener('dblclick', function(e){
        // Ignore if double-click is on an input/textarea to not break typing
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        resetAllDraggables();
    });
}

function getPageFromPath() {
    try {
        const raw = (window.location.pathname || '/').toLowerCase();
        // Trim trailing slashes
        const path = raw.replace(/\/+$/, '') || '/';
        if (path === '/' || path === '') return 'home';
        const parts = path.split('/').filter(Boolean);
        // Prefer last segment
        const last = parts[parts.length - 1];
        if (pages.includes(last)) return last;
        // Fallback to first segment if last isn't a valid page
        const first = parts[0];
        if (pages.includes(first)) return first;
        return 'home';
    } catch (_) {
        return 'home';
    }
}

// Page content data
const pageContent = {
    home: {
        title: 'LUMINA',
        subtitle: 'Experience Dining in a New Dimension',
        showFloatingElements: true
    },
    about: {
        title: 'About Lumina',
        subtitle: 'Where Innovation Meets Culinary Excellence',
        showFloatingElements: false
    },
    menu: {
        title: 'Our Menu',
        subtitle: 'Discover Extraordinary Flavors',
        showFloatingElements: false
    },
    gallery: {
        title: 'Gallery',
        subtitle: 'Visual Journey Through Lumina',
        showFloatingElements: false
    },
    contact: {
        title: 'Contact Us',
        subtitle: 'Connect with the Future of Dining',
        showFloatingElements: false
    },
    reservations: {
        title: 'Reservations',
        subtitle: 'Book Your 3D Dining Experience',
        showFloatingElements: false
    },
    chef: {
        title: 'Our Chefs',
        subtitle: 'Masters of Culinary Innovation',
        showFloatingElements: false
    },
    events: {
        title: 'Events',
        subtitle: 'Special Occasions & Private Dining',
        showFloatingElements: false
    }
};

// Initialize page system
function initializePages() {
    // Determine initial page from the URL path
    const initialPage = getPageFromPath();
    currentPage = initialPage;

    // If at root path '/', normalize to '/home' using replaceState (no extra history entry)
    try {
        const rawPath = window.location.pathname || '/';
        if (rawPath === '/' || rawPath === '') {
            history.replaceState({ page: initialPage }, '', pathForPage(initialPage));
        }
    } catch (_) {
        // ignore
    }

    // Show only the current page section
    pages.forEach(page => {
        const section = document.getElementById(page);
        if (section) {
            section.style.display = (page === initialPage) ? 'block' : 'none';
        }
    });

    // Update content and floating elements based on page
    if (initialPage === 'home') {
        updateHeroContent(pageContent[initialPage]);
        showFloatingElements();
    } else {
        hideFloatingElements();
    }

    // Highlight active nav
    updateActiveNavItem(initialPage);

    // Add click handlers to navigation links
    document.querySelectorAll('.nav-item-3d').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            if (targetPage) {
                navigateToPage(targetPage);
            }
        });
    });

    // Add click handlers to buttons
    document.querySelectorAll('.page-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.getAttribute('data-page');
            if (targetPage) {
                navigateToPage(targetPage);
            }
        });
    });
}

// Navigate to specific page
function navigateToPage(pageName, push = true) {
    if (!pages.includes(pageName)) return;
    
    // Hide current page
    const currentSection = document.getElementById(currentPage);
    if (currentSection) {
        currentSection.style.display = 'none';
    }
    
    // Show target page
    const targetSection = document.getElementById(pageName);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Update hero content if it's the home page
        if (pageName === 'home') {
            updateHeroContent(pageContent[pageName]);
            showFloatingElements();
        } else {
            hideFloatingElements();
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    // Update current page
    currentPage = pageName;
    
    // Update active nav item
    updateActiveNavItem(pageName);

    // Update URL using History API
    if (push) {
        const newPath = pathForPage(pageName);
        if (window.location.pathname !== newPath) {
            history.pushState({ page: pageName }, '', newPath);
        }
    }
}

// Update hero content
function updateHeroContent(content) {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (heroTitle) heroTitle.textContent = content.title;
    if (heroSubtitle) heroSubtitle.textContent = content.subtitle;
}

// Show/hide floating elements
function showFloatingElements() {
    document.querySelectorAll('.menu-card-3d, .food-item-3d').forEach(el => {
        el.style.display = 'block';
    });
}

function hideFloatingElements() {
    document.querySelectorAll('.menu-card-3d, .food-item-3d').forEach(el => {
        el.style.display = 'none';
    });
}

// Update active navigation item
function updateActiveNavItem(pageName) {
    document.querySelectorAll('.nav-item-3d').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });
}

// Form handlers
function handleReservation(event) {
    event.preventDefault();
    
    // Show success message
    const form = event.target;
    const formData = new FormData(form);
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white p-8 rounded-lg shadow-2xl z-[9999] text-center';
    successDiv.innerHTML = `
        <div class="text-4xl mb-4">✅</div>
        <h3 class="text-xl font-bold mb-2">Reservation Submitted!</h3>
        <p class="mb-4">Thank you for choosing Lumina. We'll confirm your 3D dining experience within 24 hours.</p>
        <button onclick="this.parentElement.remove()" class="btn-3d">Close</button>
    `;
    
    document.body.appendChild(successDiv);
    
    // Reset form
    form.reset();
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 5000);
}

function handleContactForm(event) {
    event.preventDefault();
    
    // Show success message
    const form = event.target;
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white p-8 rounded-lg shadow-2xl z-[9999] text-center';
    successDiv.innerHTML = `
        <div class="text-4xl mb-4">📧</div>
        <h3 class="text-xl font-bold mb-2">Message Sent!</h3>
        <p class="mb-4">Thank you for contacting Lumina. We'll respond to your inquiry within 24 hours.</p>
        <button onclick="this.parentElement.remove()" class="btn-3d">Close</button>
    `;
    
    document.body.appendChild(successDiv);
    
    // Reset form
    form.reset();
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 5000);
}

// Interactive drag functionality for floating elements
let isDragging = false;
let currentElement = null;
let startX, startY, initialX, initialY;

function initializeDragSystem() {
    // Get all draggable elements
    const draggableElements = document.querySelectorAll('.menu-card-3d, .food-item-3d');

    draggableElements.forEach(element => {
        // Mouse events
        element.addEventListener('mousedown', startDrag);
        
        // Touch events for mobile
        element.addEventListener('touchstart', startDrag, { passive: false });
    });

    // Global event listeners
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', endDrag);
}

function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    currentElement = e.target.closest('.menu-card-3d, .food-item-3d');
    
    if (!currentElement) return;
    
    currentElement.classList.add('dragging');
    
    // Get initial positions
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    
    const rect = currentElement.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
}

function drag(e) {
    if (!isDragging || !currentElement) return;
    
    e.preventDefault();
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    
    const newX = initialX + deltaX;
    const newY = initialY + deltaY;
    
    // Constrain to viewport
    const maxX = window.innerWidth - currentElement.offsetWidth;
    const maxY = window.innerHeight - currentElement.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));
    
    // Use fixed positioning in pixels for viewport-relative positioning
    currentElement.style.left = constrainedX + 'px';
    currentElement.style.top = constrainedY + 'px';
    currentElement.style.right = 'auto';
    currentElement.style.bottom = 'auto';
    
    // Add some 3D rotation based on movement
    const rotateX = (deltaY / 10);
    const rotateY = (deltaX / 10);
    currentElement.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1)`;
}

function endDrag(e) {
    if (!isDragging || !currentElement) return;
    
    isDragging = false;
    currentElement.classList.remove('dragging');
    
    // Reset transform with smooth transition
    currentElement.style.transition = 'transform 0.5s ease';
    currentElement.style.transform = '';
    
    // Reset transition after animation
    setTimeout(() => {
        if (currentElement) {
            currentElement.style.transition = 'all 0.3s ease';
        }
    }, 500);
    
    currentElement = null;
}

// Handle browser navigation (back/forward)
window.addEventListener('popstate', function() {
    const page = getPageFromPath();
    navigateToPage(page, false);
});

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after a short delay
    setTimeout(function() {
        const loadingScreen = document.querySelector('.loading-3d');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            // Remove from DOM after transition completes
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }
    }, 2000); // 2 seconds delay

    initializePages();
    initializeDragSystem();
    initializeTiltSystem();
    initializeGlobalDragEverything();
    applyMotionPreferences();
    window.addEventListener('resize', applyMotionPreferences);
    
    // Prevent context menu on long press for mobile
    document.querySelectorAll('.menu-card-3d, .food-item-3d').forEach(element => {
        element.addEventListener('contextmenu', e => e.preventDefault());
    });

    // Set dynamic year in footer
    try {
        const yearEl = document.querySelector('.js-year');
        if (yearEl) {
            yearEl.textContent = String(new Date().getFullYear());
        }
    } catch (_) {}

    // Smooth Back to top action
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
