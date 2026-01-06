// SWIPE FUNCTIONALITY FOR TALENT POOL
// ================================================

const swipeContainer = document.getElementById('swipeContainer');
const swipeCards = document.querySelectorAll('.swipe-card');
const swipeEmpty = document.getElementById('swipeEmpty');
const likeBtn = document.getElementById('likeBtn');
const passBtn = document.getElementById('passBtn');
const counterText = document.getElementById('counterText');

let currentCardIndex = 0;
let startX = 0;
let currentX = 0;
let isDragging = false;
let initialMouseX = 0;
let initialMouseY = 0;

// Update counter
function updateCounter() {
    const remaining = swipeCards.length - currentCardIndex;
    if (remaining > 0) {
        counterText.textContent = `${remaining} ${remaining === 1 ? 'artist' : 'artists'} remaining`;
    } else {
        counterText.textContent = 'No more artists';
    }
}

// Get current card
function getCurrentCard() {
    return swipeCards[currentCardIndex];
}

// Remove card
function removeCard(direction) {
    const card = getCurrentCard();
    if (!card) return;

    // Add animation class
    card.classList.add(direction === 'right' ? 'swipe-right' : 'swipe-left');

    // Wait for animation to complete
    setTimeout(() => {
        card.style.display = 'none';
        currentCardIndex++;
        updateCounter();

        // Check if no more cards
        if (currentCardIndex >= swipeCards.length) {
            swipeEmpty.classList.add('active');
        }
    }, 400);
}

// Handle like
function handleLike() {
    const card = getCurrentCard();
    if (!card) return;

    // Show like badge
    const likeBadge = card.querySelector('.swipe-card-badge.like');
    likeBadge.style.opacity = '1';

    // Show confirmation toast
    showToast('Artist liked! ❤️', 'success');

    setTimeout(() => {
        removeCard('right');
    }, 200);

    // Track action (could send to analytics)
    console.log('Liked:', card.dataset.id);
}

// Handle pass
function handlePass() {
    const card = getCurrentCard();
    if (!card) return;

    // Show pass badge
    const passBadge = card.querySelector('.swipe-card-badge.pass');
    passBadge.style.opacity = '1';

    setTimeout(() => {
        removeCard('left');
    }, 200);

    // Track action
    console.log('Passed:', card.dataset.id);
}

// Mouse/Touch events
function handleStart(e) {
    const card = getCurrentCard();
    if (!card) return;

    isDragging = true;
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    
    startX = clientX;
    initialMouseX = clientX;
    initialMouseY = clientY;

    card.style.transition = 'none';
}

function handleMove(e) {
    if (!isDragging) return;

    const card = getCurrentCard();
    if (!card) return;

    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    currentX = clientX - startX;

    const rotation = currentX / 20;
    const opacity = Math.abs(currentX) / 100;

    card.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;

    // Show badges based on direction
    const likeBadge = card.querySelector('.swipe-card-badge.like');
    const passBadge = card.querySelector('.swipe-card-badge.pass');

    if (currentX > 50) {
        likeBadge.style.opacity = Math.min(opacity, 1);
        passBadge.style.opacity = 0;
    } else if (currentX < -50) {
        passBadge.style.opacity = Math.min(opacity, 1);
        likeBadge.style.opacity = 0;
    } else {
        likeBadge.style.opacity = 0;
        passBadge.style.opacity = 0;
    }
}

function handleEnd(e) {
    if (!isDragging) return;

    isDragging = false;
    const card = getCurrentCard();
    if (!card) return;

    card.style.transition = 'transform 0.3s ease';

    // Determine swipe direction
    if (currentX > 100) {
        handleLike();
    } else if (currentX < -100) {
        handlePass();
    } else {
        // Reset position
        card.style.transform = '';
        const likeBadge = card.querySelector('.swipe-card-badge.like');
        const passBadge = card.querySelector('.swipe-card-badge.pass');
        likeBadge.style.opacity = 0;
        passBadge.style.opacity = 0;
    }

    currentX = 0;
}

// Button events
if (likeBtn) {
    likeBtn.addEventListener('click', handleLike);
}

if (passBtn) {
    passBtn.addEventListener('click', handlePass);
}

// Attach events to each card
swipeCards.forEach(card => {
    // Mouse events
    card.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Touch events
    card.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'x' || e.key === 'X') {
        handlePass();
    } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        handleLike();
    }
});

// Initialize counter
updateCounter();

// Toast notification system
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('🎵 Radar Swipe System Loaded');
