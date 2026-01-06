// NEXUS - JavaScript Interactions
// ================================================

// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScrollY = window.scrollY;
});

// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('.navbar-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Active nav link on scroll
const sections = document.querySelectorAll('.section, .hero');
const navLinks = document.querySelectorAll('.navbar-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ================================================
// HYBRID AUDIO PLAYER (Local MP3 + YouTube Embed)
// ================================================

const audioPlayer = document.getElementById('audio-player');
const player = document.getElementById('player');
const playBtn = player.querySelector('.player-btn-play');
const progressBar = player.querySelector('.player-progress-bar');
const progressContainer = player.querySelector('.player-progress');
const currentTimeEl = player.querySelector('.player-time:first-of-type');
const durationEl = player.querySelector('.player-time:last-of-type');
const prevBtn = player.querySelectorAll('.player-btn')[0];
const nextBtn = player.querySelectorAll('.player-btn')[2];
const volumeBtn = player.querySelector('.player-volume .player-btn');

let currentPlaylist = [];
let currentTrackIndex = 0;
let isPlayerReady = false;
let youtubePlayer = null;
let currentPlayerType = null; // 'local' or 'youtube'
let progressUpdateInterval = null;
let currentVolume = 0.7;

// Initialize YouTube API
window.onYouTubeIframeAPIReady = function() {
    youtubePlayer = new YT.Player('youtube-embed-player', {
        height: '80',
        width: '80',
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'modestbranding': 1,
            'playsinline': 1,
            'rel': 0
        },
        events: {
            'onReady': onYouTubeReady,
            'onStateChange': onYouTubeStateChange
        }
    });
};

function onYouTubeReady(event) {
    isPlayerReady = true;
    youtubePlayer.setVolume(currentVolume * 100);
    console.log('✅ YouTube Player Ready');
    
    // Initialize release cards
    if (typeof initializeReleaseCards === 'function') {
        initializeReleaseCards();
    }
}

function onYouTubeStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        updatePlayButton(true);
        startProgressUpdate();
        // Update duration when video starts playing
        try {
            const duration = youtubePlayer.getDuration();
            if (duration > 0) {
                durationEl.textContent = formatTime(duration);
            }
        } catch (e) {
            console.log('Duration update error:', e);
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        updatePlayButton(false);
        stopProgressUpdate();
    } else if (event.data === YT.PlayerState.ENDED) {
        stopProgressUpdate();
        playNextTrack();
    } else if (event.data === YT.PlayerState.CUED) {
        // Video is loaded and ready
        try {
            const duration = youtubePlayer.getDuration();
            if (duration > 0) {
                durationEl.textContent = formatTime(duration);
                currentTimeEl.textContent = '0:00';
                progressBar.style.width = '0%';
            }
        } catch (e) {
            console.log('Duration update error:', e);
        }
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updatePlayButton(playing) {
    if (playing) {
        playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        playBtn.setAttribute('aria-label', 'Pause');
    } else {
        playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        playBtn.setAttribute('aria-label', 'Play');
    }
}

function startProgressUpdate() {
    stopProgressUpdate();
    progressUpdateInterval = setInterval(() => {
        if (currentPlayerType === 'youtube' && youtubePlayer) {
            try {
                const currentTime = youtubePlayer.getCurrentTime();
                const duration = youtubePlayer.getDuration();
                
                if (duration > 0) {
                    const percent = (currentTime / duration) * 100;
                    progressBar.style.width = percent + '%';
                    currentTimeEl.textContent = formatTime(currentTime);
                    durationEl.textContent = formatTime(duration);
                }
            } catch (e) {
                // Player not ready
            }
        }
    }, 500);
}

function stopProgressUpdate() {
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
        progressUpdateInterval = null;
    }
}

// Local Audio Player Events
audioPlayer.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audioPlayer.duration);
    console.log('✅ Audio loaded:', formatTime(audioPlayer.duration));
});

audioPlayer.addEventListener('timeupdate', () => {
    if (currentPlayerType === 'local' && audioPlayer.duration > 0) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = percent + '%';
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        durationEl.textContent = formatTime(audioPlayer.duration);
    }
});

audioPlayer.addEventListener('play', () => {
    updatePlayButton(true);
});

audioPlayer.addEventListener('pause', () => {
    updatePlayButton(false);
});

audioPlayer.addEventListener('ended', () => {
    playNextTrack();
});

audioPlayer.addEventListener('error', (e) => {
    console.error('❌ Audio error, switching to YouTube');
    // Try YouTube as fallback
    const currentTrack = currentPlaylist[currentTrackIndex];
    if (currentTrack && currentTrack.videoId) {
        playFromYouTube(currentTrack.videoId, currentTrack);
    }
});

// Volume Control
audioPlayer.volume = currentVolume;

if (volumeBtn) {
    volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = volumeBtn.getBoundingClientRect();
        
        // Create volume slider
        const existingSlider = document.querySelector('.volume-slider');
        if (existingSlider) {
            existingSlider.remove();
            return;
        }
        
        const volumeSlider = document.createElement('div');
        volumeSlider.className = 'volume-slider';
        volumeSlider.style.cssText = `
            position: fixed;
            bottom: ${window.innerHeight - rect.top + 10}px;
            left: ${rect.left - 20}px;
            width: 40px;
            height: 120px;
            background: rgba(26, 27, 38, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 10px;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        `;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = currentVolume * 100;
        slider.orient = 'vertical';
        slider.style.cssText = `
            -webkit-appearance: slider-vertical;
            width: 20px;
            height: 100px;
            writing-mode: bt-lr;
        `;
        
        slider.addEventListener('input', (e) => {
            currentVolume = e.target.value / 100;
            audioPlayer.volume = currentVolume;
            if (youtubePlayer && currentPlayerType === 'youtube') {
                youtubePlayer.setVolume(currentVolume * 100);
            }
            updateVolumeIcon();
        });
        
        volumeSlider.appendChild(slider);
        document.body.appendChild(volumeSlider);
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeSlider(e) {
                if (!volumeSlider.contains(e.target) && e.target !== volumeBtn) {
                    volumeSlider.remove();
                    document.removeEventListener('click', closeSlider);
                }
            });
        }, 100);
    });
}

function updateVolumeIcon() {
    if (!volumeBtn) return;
    
    let icon;
    if (currentVolume === 0) {
        icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    } else if (currentVolume < 0.5) {
        icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
    } else {
        icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
    }
    volumeBtn.innerHTML = icon;
}

function playFromLocal(audioPath, trackInfo) {
    stopProgressUpdate();
    
    // Stop YouTube if playing
    if (youtubePlayer && currentPlayerType === 'youtube') {
        try {
            youtubePlayer.pauseVideo();
        } catch (e) {}
    }
    
    currentPlayerType = 'local';
    
    console.log('▶️ Playing from local:', audioPath);
    
    // Update UI
    if (trackInfo) {
        player.querySelector('.player-cover').src = trackInfo.artwork || 'https://via.placeholder.com/200';
        player.querySelector('.player-info h4').textContent = trackInfo.title;
        player.querySelector('.player-info p').textContent = trackInfo.artist;
    }
    
    // Load and play
    audioPlayer.src = audioPath;
    audioPlayer.load();
    
    audioPlayer.play().then(() => {
        console.log('✅ Playing successfully');
        player.classList.add('active');
    }).catch(error => {
        console.error('❌ Playback error:', error);
        // Fallback to YouTube
        if (trackInfo && trackInfo.videoId) {
            playFromYouTube(trackInfo.videoId, trackInfo);
        }
    });
}

function playFromYouTube(videoId, trackInfo) {
    if (!youtubePlayer || !isPlayerReady) {
        console.log('⚠️ YouTube player not ready, waiting...');
        setTimeout(() => playFromYouTube(videoId, trackInfo), 1000);
        return;
    }
    
    stopProgressUpdate();
    
    // Stop local audio if playing
    if (currentPlayerType === 'local') {
        audioPlayer.pause();
    }
    
    currentPlayerType = 'youtube';
    
    console.log('▶️ Playing from YouTube:', videoId);
    
    // Update UI
    if (trackInfo) {
        player.querySelector('.player-info h4').textContent = trackInfo.title;
        player.querySelector('.player-info p').textContent = trackInfo.artist;
    }
    
    // Show YouTube player, hide cover image
    const coverImg = document.getElementById('player-cover-img');
    const youtubeEmbed = document.getElementById('youtube-embed-player');
    if (coverImg) coverImg.style.display = 'none';
    if (youtubeEmbed) youtubeEmbed.style.display = 'block';
    
    try {
        youtubePlayer.loadVideoById(videoId);
        youtubePlayer.setVolume(currentVolume * 100);
        console.log('✅ YouTube video loaded');
        player.classList.add('active');
        
        // Wait a moment and update duration
        setTimeout(() => {
            try {
                const duration = youtubePlayer.getDuration();
                if (duration > 0) {
                    durationEl.textContent = formatTime(duration);
                    currentTimeEl.textContent = '0:00';
                    progressBar.style.width = '0%';
                }
            } catch (e) {
                console.log('Initial duration update error:', e);
            }
        }, 1000);
    } catch (e) {
        console.error('❌ YouTube error:', e);
    }
}

function playTrack(track) {
    if (!track) return;
    
    // Always play directly from YouTube
    if (track.videoId) {
        console.log('▶️ Playing from YouTube:', track.title);
        playFromYouTube(track.videoId, track);
    } else {
        console.error('❌ No YouTube video ID found for track:', track);
    }
}

function playNextTrack() {
    if (currentPlaylist.length > 0) {
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        playTrack(currentPlaylist[currentTrackIndex]);
    }
}

function playPreviousTrack() {
    if (currentPlaylist.length > 0) {
        currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        playTrack(currentPlaylist[currentTrackIndex]);
    }
}

// Play/Pause toggle
playBtn.addEventListener('click', () => {
    if (currentPlayerType === 'local') {
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    } else if (currentPlayerType === 'youtube' && youtubePlayer) {
        try {
            const state = youtubePlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                youtubePlayer.pauseVideo();
            } else {
                youtubePlayer.playVideo();
            }
        } catch (e) {
            console.log('Player error:', e);
        }
    }
});

// Previous/Next buttons
if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        playPreviousTrack();
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        playNextTrack();
    });
}

// Progress bar interaction
progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width);
    
    if (currentPlayerType === 'local') {
        audioPlayer.currentTime = audioPlayer.duration * percent;
    } else if (currentPlayerType === 'youtube' && youtubePlayer) {
        try {
            const duration = youtubePlayer.getDuration();
            youtubePlayer.seekTo(duration * percent, true);
        } catch (e) {
            console.log('Seek error:', e);
        }
    }
});

// Release card play buttons
function initializeReleaseCards() {
    document.querySelectorAll('.card-release').forEach((card, index) => {
        const playButton = card.querySelector('.card-release-play');
        if (playButton && window.fullCatalog && window.fullCatalog[index]) {
            const track = window.fullCatalog[index];
            
            card.setAttribute('data-track-index', index);
            
            playButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                currentPlaylist = window.fullCatalog.filter(t => t.audioFile || t.videoId);
                currentTrackIndex = currentPlaylist.findIndex(t => 
                    (t.audioFile && t.audioFile === track.audioFile) || 
                    (t.videoId && t.videoId === track.videoId)
                );
                
                console.log('🎵 Playing:', track.title, 'by', track.artist);
                playTrack(track);
            });
        }
    });
    
    console.log('✅ Initialized', document.querySelectorAll('.card-release').length, 'release cards');
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof initializeReleaseCards === 'function') {
            setTimeout(initializeReleaseCards, 1000);
        }
    });
} else {
    setTimeout(initializeReleaseCards, 1000);
}

// Playlist play buttons
document.querySelectorAll('.card-playlist .btn-primary').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.card-playlist');
        const title = card.querySelector('.card-title').textContent;
        const cover = card.querySelector('.card-playlist-cover').src;
        
        // Update player
        player.querySelector('.player-cover').src = cover;
        player.querySelector('.player-info h4').textContent = title;
        player.querySelector('.player-info p').textContent = 'Playlist';
        
        // Auto play
        isPlaying = true;
        playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        
        // Show player
        player.classList.add('active');
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space = Play/Pause
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        playBtn.click();
    }
});

// Lazy load images
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
        }
    });
}, {
    rootMargin: '50px'
});

document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

// Scroll reveal animation
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '-50px'
});

document.querySelectorAll('.card, .section-header').forEach(el => {
    revealObserver.observe(el);
});

// Console message
console.log('%c◬ WORLD STUDIO RECORDS', 'font-size: 32px; font-weight: 900; color: #00E5FF; text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);');
console.log('%cNext-Generation Music Label', 'font-size: 16px; color: #A259FF;');
console.log('%cThe Future of Electronic Music', 'font-size: 14px; color: #C7C7D1;');

// ================================================
// AUTH MODAL
// ================================================

const authModal = document.getElementById('authModal');
const profileBtn = document.getElementById('profileBtn');
const authModalClose = document.getElementById('authModalClose');
const authModalOverlay = document.getElementById('authModalOverlay');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Open modal
if (profileBtn) {
    profileBtn.addEventListener('click', () => {
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

// Close modal
function closeAuthModal() {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
}

if (authModalClose) {
    authModalClose.addEventListener('click', closeAuthModal);
}

if (authModalOverlay) {
    authModalOverlay.addEventListener('click', closeAuthModal);
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal.classList.contains('active')) {
        closeAuthModal();
    }
});

// Switch between login and signup
if (loginTab) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });
}

if (signupTab) {
    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });
}

// Handle form submissions (demo - would connect to backend)
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');

if (loginFormElement) {
    loginFormElement.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        console.log('Login attempt:', email);
        showAuthToast('Welcome back! 🎵', 'success');
        closeAuthModal();
    });
}

if (signupFormElement) {
    signupFormElement.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        if (password !== confirmPassword) {
            showAuthToast('Passwords do not match', 'error');
            return;
        }
        
        console.log('Signup attempt:', { name, email });
        showAuthToast('Account created successfully! 🎉', 'success');
        closeAuthModal();
    });
}

// Toast function for auth
function showAuthToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================================================
// CATALOG MODAL
// ================================================

const catalogModal = document.getElementById('catalogModal');
const viewCatalogBtn = document.getElementById('viewCatalogBtn');
const catalogModalClose = document.getElementById('catalogModalClose');
const catalogModalOverlay = document.getElementById('catalogModalOverlay');
const catalogSearchInput = document.getElementById('catalogSearchInput');
const catalogTracksGrid = document.getElementById('catalogTracksGrid');
const artistFilterSelect = document.getElementById('artistFilterSelect');
const genreFilterSelect = document.getElementById('genreFilterSelect');
const resetCatalogFilters = document.getElementById('resetCatalogFilters');
const displayedTracksCount = document.getElementById('displayedTracksCount');

// Full catalog data (30 tracks) - Expose globally for YouTube player
window.fullCatalog = [
    {
        "number": 1,
        "title": "CAHAYA [WSR Release]",
        "artist": "MIRZUL",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "2",
        "duration": "Brevemente",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/UFynmEtoUVI/maxresdefault.jpg",
        "videoId": "UFynmEtoUVI",
        "youtubeUrl": "https://www.youtube.com/watch?v=UFynmEtoUVI",
        "audioFile": "music/001_CAHAYA_[WSR_Release].mp3"
    },
    {
        "number": 2,
        "title": "Never Be The Same (Don't Forget Me, Pt. III) [WSR x NCR Release]",
        "artist": "YTM x edumps",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "391",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/kEFhQEQm2ZM/maxresdefault.jpg",
        "videoId": "kEFhQEQm2ZM",
        "youtubeUrl": "https://www.youtube.com/watch?v=kEFhQEQm2ZM",
        "audioFile": "music/002_Never_Be_The_Same_(Don't_Forget_Me,_Pt._III)_[WSR_.mp3"
    },
    {
        "number": 3,
        "title": "Beautiful Moon (Tibo Walker) [WSR X NCR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "29.0M",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/8Rab-4lgOCM/maxresdefault.jpg",
        "videoId": "8Rab-4lgOCM",
        "youtubeUrl": "https://www.youtube.com/watch?v=8Rab-4lgOCM",
        "audioFile": "music/003_Beautiful_Moon_(Tibo_Walker)_[WSR_X_NCR_Release].mp3"
    },
    {
        "number": 4,
        "title": "i miss you [WSR Release]",
        "artist": "YTM",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "187",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/bn779nghq2Q/maxresdefault.jpg",
        "videoId": "bn779nghq2Q",
        "youtubeUrl": "https://www.youtube.com/watch?v=bn779nghq2Q",
        "audioFile": "music/004_i_miss_you_[WSR_Release].mp3"
    },
    {
        "number": 5,
        "title": "Fearless [WSR Release]",
        "artist": "J.H.L",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "377",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/-nCqg5BsGQY/maxresdefault.jpg",
        "videoId": "-nCqg5BsGQY",
        "youtubeUrl": "https://www.youtube.com/watch?v=-nCqg5BsGQY",
        "audioFile": "music/005_Fearless_[WSR_Release].mp3"
    },
    {
        "number": 6,
        "title": "Half [WSR Release]",
        "artist": "J.H.L",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "12.0M",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/Zsa2O7cMq6Q/maxresdefault.jpg",
        "videoId": "Zsa2O7cMq6Q",
        "youtubeUrl": "https://www.youtube.com/watch?v=Zsa2O7cMq6Q",
        "audioFile": "music/006_Half_[WSR_Release].mp3"
    },
    {
        "number": 7,
        "title": "The Space Arcade -OceanWave [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "229",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/CfI55SE-MJo/maxresdefault.jpg",
        "videoId": "CfI55SE-MJo",
        "youtubeUrl": "https://www.youtube.com/watch?v=CfI55SE-MJo",
        "audioFile": "music/007_The_Space_Arcade_-OceanWave_[WSR_Release].mp3"
    },
    {
        "number": 8,
        "title": "Dangerous Desire [WSR Release]",
        "artist": "SUNDMAN",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "634",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/nNoB1PNwWgA/maxresdefault.jpg",
        "videoId": "nNoB1PNwWgA",
        "youtubeUrl": "https://www.youtube.com/watch?v=nNoB1PNwWgA",
        "audioFile": "music/008_Dangerous_Desire_[WSR_Release].mp3"
    },
    {
        "number": 9,
        "title": "I`m Not Ok [WSR Release]",
        "artist": "Lovely Falcon",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "52",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/lbjht9ZXvLY/maxresdefault.jpg",
        "videoId": "lbjht9ZXvLY",
        "youtubeUrl": "https://www.youtube.com/watch?v=lbjht9ZXvLY",
        "audioFile": "music/009_I`m_Not_Ok_[WSR_Release].mp3"
    },
    {
        "number": 10,
        "title": "Another Night (edumps Cover) [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "494",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/OUWRAN7jRXc/maxresdefault.jpg",
        "videoId": "OUWRAN7jRXc",
        "youtubeUrl": "https://www.youtube.com/watch?v=OUWRAN7jRXc",
        "audioFile": "music/010_Another_Night_(edumps_Cover)_[WSR_Release].mp3"
    },
    {
        "number": 11,
        "title": "Fade (YTM Old Style Cover) [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "897",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/KWycVQL5pS0/maxresdefault.jpg",
        "videoId": "KWycVQL5pS0",
        "youtubeUrl": "https://www.youtube.com/watch?v=KWycVQL5pS0",
        "audioFile": "music/011_Fade_(YTM_Old_Style_Cover)_[WSR_Release].mp3"
    },
    {
        "number": 12,
        "title": "Unsure (Amir Zul Cover) [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "16.0M",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/QlK9Sd6IbBU/maxresdefault.jpg",
        "videoId": "QlK9Sd6IbBU",
        "youtubeUrl": "https://www.youtube.com/watch?v=QlK9Sd6IbBU",
        "audioFile": "music/012_Unsure_(Amir_Zul_Cover)_[WSR_Release].mp3"
    },
    {
        "number": 13,
        "title": "CIFU & AVVI- Another Night feat. Betsy Erickson [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "192",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/49Kuz3rIlSY/maxresdefault.jpg",
        "videoId": "49Kuz3rIlSY",
        "youtubeUrl": "https://www.youtube.com/watch?v=49Kuz3rIlSY",
        "audioFile": "music/013_CIFU_&_AVVI-_Another_Night_feat._Betsy_Erickson_[W.mp3"
    },
    {
        "number": 14,
        "title": "Orbital [WSR Release]",
        "artist": "Lindsay Lund",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "127",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/gu_iSXXKavk/maxresdefault.jpg",
        "videoId": "gu_iSXXKavk",
        "youtubeUrl": "https://www.youtube.com/watch?v=gu_iSXXKavk",
        "audioFile": "music/014_Orbital_[WSR_Release].mp3"
    },
    {
        "number": 15,
        "title": "What Was I Made For (Awaken Soul Cover) [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "202",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/wdieag2o1sg/maxresdefault.jpg",
        "videoId": "wdieag2o1sg",
        "youtubeUrl": "https://www.youtube.com/watch?v=wdieag2o1sg",
        "audioFile": "music/015_What_Was_I_Made_For_(Awaken_Soul_Cover)_[WSR_Relea.mp3"
    },
    {
        "number": 16,
        "title": "Are You With Me? (CIFU Cover) [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "470",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/_iSJcDekxyc/maxresdefault.jpg",
        "videoId": "_iSJcDekxyc",
        "youtubeUrl": "https://www.youtube.com/watch?v=_iSJcDekxyc",
        "audioFile": "music/016_Are_You_With_Me_(CIFU_Cover)_[WSR_Release].mp3"
    },
    {
        "number": 17,
        "title": "Fou [WSR Release]",
        "artist": "M.T",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "83",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/oqLeeNKXz5Y/maxresdefault.jpg",
        "videoId": "oqLeeNKXz5Y",
        "youtubeUrl": "https://www.youtube.com/watch?v=oqLeeNKXz5Y",
        "audioFile": "music/017_Fou_[WSR_Release].mp3"
    },
    {
        "number": 18,
        "title": "Danger! [WSR Release]",
        "artist": "TANN3R",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "90",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/_0RyUjQn7oU/maxresdefault.jpg",
        "videoId": "_0RyUjQn7oU",
        "youtubeUrl": "https://www.youtube.com/watch?v=_0RyUjQn7oU",
        "audioFile": "music/018_Danger!_[WSR_Release].mp3"
    },
    {
        "number": 19,
        "title": "Death Rave [WSR Release]",
        "artist": "M4R1US BP",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "362",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/qdHO5R2w6Q0/maxresdefault.jpg",
        "videoId": "qdHO5R2w6Q0",
        "youtubeUrl": "https://www.youtube.com/watch?v=qdHO5R2w6Q0",
        "audioFile": "music/019_Death_Rave_[WSR_Release].mp3"
    },
    {
        "number": 20,
        "title": "Fire [WSR Release]",
        "artist": "HankX ft. Iva Rii",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "60",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/qDC7bO25kEQ/maxresdefault.jpg",
        "videoId": "qDC7bO25kEQ",
        "youtubeUrl": "https://www.youtube.com/watch?v=qDC7bO25kEQ",
        "audioFile": "music/020_Fire_[WSR_Release].mp3"
    },
    {
        "number": 21,
        "title": "She's The Only One For Me  [WSR Release]",
        "artist": "Paul Archer",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "155",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/vLm4YJJH778/maxresdefault.jpg",
        "videoId": "vLm4YJJH778",
        "youtubeUrl": "https://www.youtube.com/watch?v=vLm4YJJH778",
        "audioFile": "music/021_She's_The_Only_One_For_Me_[WSR_Release].mp3"
    },
    {
        "number": 22,
        "title": "Sapruca [WSR Release]",
        "artist": "el yobis yt",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "512",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/sgzljoYpitA/maxresdefault.jpg",
        "videoId": "sgzljoYpitA",
        "youtubeUrl": "https://www.youtube.com/watch?v=sgzljoYpitA",
        "audioFile": "music/022_Sapruca_[WSR_Release].mp3"
    },
    {
        "number": 23,
        "title": "Greedy (edumps Cover) [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "391",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/Q7ljk06hgVA/maxresdefault.jpg",
        "videoId": "Q7ljk06hgVA",
        "youtubeUrl": "https://www.youtube.com/watch?v=Q7ljk06hgVA",
        "audioFile": "music/023_Greedy_(edumps_Cover)_[WSR_Release].mp3"
    },
    {
        "number": 24,
        "title": "Trinity [WSR Release]",
        "artist": "The Space Arcade",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "345",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/Du4_wl5tFm0/maxresdefault.jpg",
        "videoId": "Du4_wl5tFm0",
        "youtubeUrl": "https://www.youtube.com/watch?v=Du4_wl5tFm0",
        "audioFile": "music/024_Trinity_[WSR_Release].mp3"
    },
    {
        "number": 25,
        "title": "Spirits Vip (feat.M4R1US BP) [WSR RELEASE]",
        "artist": "edumps",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "503",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/fBmLJHpSIQU/maxresdefault.jpg",
        "videoId": "fBmLJHpSIQU",
        "youtubeUrl": "https://www.youtube.com/watch?v=fBmLJHpSIQU",
        "audioFile": "music/025_Spirits_Vip_(feat.M4R1US_BP)_[WSR_RELEASE].mp3"
    },
    {
        "number": 26,
        "title": "Uh Na Na Na (edumps Cover) [WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "210",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/2ofe9EF96SA/maxresdefault.jpg",
        "videoId": "2ofe9EF96SA",
        "youtubeUrl": "https://www.youtube.com/watch?v=2ofe9EF96SA",
        "audioFile": "music/026_Uh_Na_Na_Na_(edumps_Cover)_[WSR_Release].mp3"
    },
    {
        "number": 27,
        "title": "UH NA NA NA [WSR Release]",
        "artist": "LionJhon",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "146",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/_cA3P2xMWuA/maxresdefault.jpg",
        "videoId": "_cA3P2xMWuA",
        "youtubeUrl": "https://www.youtube.com/watch?v=_cA3P2xMWuA",
        "audioFile": "music/027_UH_NA_NA_NA_[WSR_Release].mp3"
    },
    {
        "number": 28,
        "title": "Summer Time (Praveen Stakez Cover) [WSR x NCR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "151",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/VsYGYIg9ihE/maxresdefault.jpg",
        "videoId": "VsYGYIg9ihE",
        "youtubeUrl": "https://www.youtube.com/watch?v=VsYGYIg9ihE",
        "audioFile": "music/028_Summer_Time_(Praveen_Stakez_Cover)_[WSR_x_NCR_Rele.mp3"
    },
    {
        "number": 29,
        "title": "Lost (DJ E.J Cover)[WSR Release]",
        "artist": "World Studio Records",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "436",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/IcDfqcGsQG8/maxresdefault.jpg",
        "videoId": "IcDfqcGsQG8",
        "youtubeUrl": "https://www.youtube.com/watch?v=IcDfqcGsQG8",
        "audioFile": "music/029_Lost_(DJ_E.J_Cover)[WSR_Release].mp3"
    },
    {
        "number": 30,
        "title": "Lights Above You [WSR Release]",
        "artist": "Roadtownboy",
        "genre": "Electronic",
        "date": "2026-01-05",
        "plays": "792",
        "duration": "3:45",
        "bpm": 128,
        "artwork": "https://i.ytimg.com/vi/F8r22WDoBaY/maxresdefault.jpg",
        "videoId": "F8r22WDoBaY",
        "youtubeUrl": "https://www.youtube.com/watch?v=F8r22WDoBaY",
        "audioFile": "music/030_Lights_Above_You_[WSR_Release].mp3"
    }
];

let filteredCatalog = [...window.fullCatalog];

// Initialize release cards after catalog is loaded
if (typeof initializeReleaseCards === 'function') {
    initializeReleaseCards();
}

// Initialize filter dropdowns
function initializeCatalogFilters() {
    if (!artistFilterSelect || !genreFilterSelect) return;
    
    // Get unique artists
    const artists = [...new Set(window.fullCatalog.map(track => track.artist))].sort();
    artistFilterSelect.innerHTML = '<option value="">All Artists</option>' + 
        artists.map(artist => `<option value="${artist}">${artist}</option>`).join('');
    
    // Get unique genres
    const genres = [...new Set(window.fullCatalog.map(track => track.genre))].sort();
    genreFilterSelect.innerHTML = '<option value="">All Genres</option>' + 
        genres.map(genre => `<option value="${genre}">${genre}</option>`).join('');
}

// Render catalog grid
function renderCatalogGrid(tracks = filteredCatalog) {
    if (!catalogTracksGrid) return;
    
    if (tracks.length === 0) {
        catalogTracksGrid.innerHTML = `
            <div class="no-results-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
                <h3>No tracks found</h3>
                <p>Try adjusting your filters or search term</p>
            </div>
        `;
    } else {
        catalogTracksGrid.innerHTML = tracks.map((track, index) => `
            <div class="catalog-track-card" data-video-id="${track.videoId}" data-track-index="${index}">
                <div class="catalog-track-artwork">
                    <img src="${track.artwork}" alt="${track.title}">
                    <div class="catalog-track-play-overlay">
                        <button class="catalog-track-play-btn" aria-label="Play ${track.title}">
                            <svg viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="catalog-track-info">
                    <h3 class="catalog-track-title">${track.title}</h3>
                    <p class="catalog-track-artist">${track.artist}</p>
                    <div class="catalog-track-meta">
                        <span class="catalog-track-genre">${track.genre}</span>
                        <span class="catalog-track-date">${track.date}</span>
                    </div>
                    <div class="catalog-track-stats">
                        <div class="catalog-track-stat">
                            <span class="catalog-track-stat-value">${track.plays}</span>
                            <span class="catalog-track-stat-label">Plays</span>
                        </div>
                        <div class="catalog-track-stat">
                            <span class="catalog-track-stat-value">${track.duration}</span>
                            <span class="catalog-track-stat-label">Duration</span>
                        </div>
                        <div class="catalog-track-stat">
                            <span class="catalog-track-stat-value">${track.bpm}</span>
                            <span class="catalog-track-stat-label">BPM</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers to play buttons
        document.querySelectorAll('.catalog-track-play-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.catalog-track-card');
                const trackIndex = parseInt(card.dataset.trackIndex);
                const track = tracks[trackIndex];
                
                if (track) {
                    currentPlaylist = tracks.filter(t => t.audioFile || t.videoId);
                    currentTrackIndex = currentPlaylist.findIndex(t => 
                        (t.audioFile && t.audioFile === track.audioFile) ||
                        (t.videoId && t.videoId === track.videoId)
                    );
                    
                    playTrack(track);
                    closeCatalogModal();
                }
            });
        });
    }
    
    // Update count
    if (displayedTracksCount) {
        displayedTracksCount.textContent = tracks.length;
    }
}

// Apply all catalog filters
function applyCatalogFilters() {
    const searchTerm = catalogSearchInput ? catalogSearchInput.value.toLowerCase() : '';
    const selectedArtist = artistFilterSelect ? artistFilterSelect.value : '';
    const selectedGenre = genreFilterSelect ? genreFilterSelect.value : '';
    
    filteredCatalog = window.fullCatalog.filter(track => {
        const matchesSearch = searchTerm === '' || 
            track.title.toLowerCase().includes(searchTerm) ||
            track.artist.toLowerCase().includes(searchTerm) ||
            track.genre.toLowerCase().includes(searchTerm);
        
        const matchesArtist = selectedArtist === '' || track.artist === selectedArtist;
        const matchesGenre = selectedGenre === '' || track.genre === selectedGenre;
        
        return matchesSearch && matchesArtist && matchesGenre;
    });
    
    renderCatalogGrid(filteredCatalog);
}

// Reset all catalog filters
function resetAllCatalogFilters() {
    if (catalogSearchInput) catalogSearchInput.value = '';
    if (artistFilterSelect) artistFilterSelect.value = '';
    if (genreFilterSelect) genreFilterSelect.value = '';
    filteredCatalog = [...window.fullCatalog];
    renderCatalogGrid();
}

// Open catalog modal
if (viewCatalogBtn) {
    // Botão agora redireciona para catalog.html, não abre modal
    // viewCatalogBtn.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     catalogModal.classList.add('active');
    //     document.body.style.overflow = 'hidden';
    //     initializeCatalogFilters();
    //     renderCatalogGrid();
    // });
}

// Close catalog modal
function closeCatalogModal() {
    catalogModal.classList.remove('active');
    document.body.style.overflow = '';
    resetAllCatalogFilters();
}

if (catalogModalClose) {
    catalogModalClose.addEventListener('click', closeCatalogModal);
}

if (catalogModalOverlay) {
    catalogModalOverlay.addEventListener('click', closeCatalogModal);
}

// Event listeners for filters
if (catalogSearchInput) {
    catalogSearchInput.addEventListener('input', applyCatalogFilters);
}

if (artistFilterSelect) {
    artistFilterSelect.addEventListener('change', applyCatalogFilters);
}

if (genreFilterSelect) {
    genreFilterSelect.addEventListener('change', applyCatalogFilters);
}

if (resetCatalogFilters) {
    resetCatalogFilters.addEventListener('click', resetAllCatalogFilters);
}

// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (catalogModal && catalogModal.classList.contains('active')) {
            closeCatalogModal();
        }
    }
});

// ================================================
// ARTISTS MODAL
// ================================================

const artistsModal = document.getElementById('artistsModal');
const viewArtistsBtn = document.getElementById('viewArtistsBtn');
const artistsModalClose = document.getElementById('artistsModalClose');
const artistsModalOverlay = document.getElementById('artistsModalOverlay');
const artistsSearchInput = document.getElementById('artistsSearchInput');
const artistsGrid = document.getElementById('artistsGrid');

// Artists data
const artistsData = [
    {
        "name": "MIRZUL",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/UFynmEtoUVI/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/UFynmEtoUVI/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "YTM",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/bn779nghq2Q/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/bn779nghq2Q/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "J.H.L",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 2 releases on the label.",
        "image": "https://i.ytimg.com/vi/-nCqg5BsGQY/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/-nCqg5BsGQY/maxresdefault.jpg",
        "tracks": 2,
        "followers": "1200K",
        "streams": "120M",
        "country": "🌍 Global"
    },
    {
        "name": "SUNDMAN",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/nNoB1PNwWgA/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/nNoB1PNwWgA/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "Lovely Falcon",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/lbjht9ZXvLY/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/lbjht9ZXvLY/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "Lindsay Lund",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/gu_iSXXKavk/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/gu_iSXXKavk/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "M.T",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/oqLeeNKXz5Y/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/oqLeeNKXz5Y/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "TANN3R",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/_0RyUjQn7oU/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/_0RyUjQn7oU/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "M4R1US BP",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/qdHO5R2w6Q0/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/qdHO5R2w6Q0/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "HankX",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/qDC7bO25kEQ/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/qDC7bO25kEQ/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
        {
        "name": "Iva Rii",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/qDC7bO25kEQ/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/qDC7bO25kEQ/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "Paul Archer",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/vLm4YJJH778/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/vLm4YJJH778/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "el yobis yt",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/sgzljoYpitA/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/sgzljoYpitA/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "The Space Arcade",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/Du4_wl5tFm0/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/Du4_wl5tFm0/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "edumps",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/fBmLJHpSIQU/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/fBmLJHpSIQU/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "LionJhon",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/_cA3P2xMWuA/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/_cA3P2xMWuA/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    },
    {
        "name": "Roadtownboy",
        "genres": [
            "Electronic"
        ],
        "bio": "Electronic music producer signed to World Studio Records. 1 releases on the label.",
        "image": "https://i.ytimg.com/vi/F8r22WDoBaY/maxresdefault.jpg",
        "avatar": "https://i.ytimg.com/vi/F8r22WDoBaY/maxresdefault.jpg",
        "tracks": 1,
        "followers": "0K",
        "streams": "0.0M",
        "country": "🌍 Global"
    }
];

let filteredArtists = [...artistsData];

// Render artists grid
function renderArtistsGrid(artists = filteredArtists) {
    if (!artistsGrid) return;
    
    artistsGrid.innerHTML = artists.map(artist => `
        <div class="artist-profile-card">
            <div class="artist-profile-header">
                <img src="${artist.image}" alt="${artist.name}" class="artist-profile-bg">
                <img src="${artist.avatar}" alt="${artist.name}" class="artist-profile-avatar">
            </div>
            <div class="artist-profile-body">
                <h3 class="artist-profile-name">${artist.name}</h3>
                <div class="artist-profile-genres">
                    ${artist.genres.map(genre => `<span class="artist-genre-tag">${genre}</span>`).join('')}
                </div>
                <p class="artist-profile-bio">${artist.bio}</p>
                <div class="artist-profile-stats">
                    <div class="artist-stat">
                        <span class="artist-stat-value">${artist.tracks}</span>
                        <span class="artist-stat-label">Tracks</span>
                    </div>
                    <div class="artist-stat">
                        <span class="artist-stat-value">${artist.followers}</span>
                        <span class="artist-stat-label">Followers</span>
                    </div>
                    <div class="artist-stat">
                        <span class="artist-stat-value">${artist.streams}</span>
                        <span class="artist-stat-label">Streams</span>
                    </div>
                </div>
            </div>
            <div class="artist-profile-footer">
                <a href="#" class="artist-social-link" aria-label="Spotify">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                </a>
                <a href="#" class="artist-social-link" aria-label="SoundCloud">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815z"/>
                    </svg>
                </a>
                <a href="#" class="artist-social-link" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                </a>
            </div>
        </div>
    `).join('');
}

// Filter artists
function filterArtists(query) {
    const searchTerm = query.toLowerCase();
    filteredArtists = artistsData.filter(artist => 
        artist.name.toLowerCase().includes(searchTerm) ||
        artist.genres.some(genre => genre.toLowerCase().includes(searchTerm)) ||
        artist.bio.toLowerCase().includes(searchTerm)
    );
    renderArtistsGrid(filteredArtists);
}

// Open artists modal
if (viewArtistsBtn) {
    // Botão agora redireciona para artists.html, não abre modal
    // viewArtistsBtn.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     artistsModal.classList.add('active');
    //     document.body.style.overflow = 'hidden';
    //     renderArtistsGrid();
    // });
}

// Close artists modal
function closeArtistsModal() {
    artistsModal.classList.remove('active');
    document.body.style.overflow = '';
    if (artistsSearchInput) artistsSearchInput.value = '';
    filteredArtists = [...artistsData];
}

if (artistsModalClose) {
    artistsModalClose.addEventListener('click', closeArtistsModal);
}

if (artistsModalOverlay) {
    artistsModalOverlay.addEventListener('click', closeArtistsModal);
}

// Search functionality
if (artistsSearchInput) {
    artistsSearchInput.addEventListener('input', (e) => {
        filterArtists(e.target.value);
    });
}

// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (artistsModal && artistsModal.classList.contains('active')) {
            closeArtistsModal();
        }
    }
});
