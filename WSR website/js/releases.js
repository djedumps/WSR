// RELEASES PAGE - FILTERING SYSTEM
// ================================================

const searchInput = document.getElementById('searchInput');
const genreCheckboxes = document.querySelectorAll('input[name="genre"]');
const moodCheckboxes = document.querySelectorAll('input[name="mood"]');
const typeRadios = document.querySelectorAll('input[name="type"]');
const yearCheckboxes = document.querySelectorAll('input[name="year"]');
const popularityCheckboxes = document.querySelectorAll('input[name="popularity"]');
const resetBtn = document.getElementById('resetFilters');
const sortSelect = document.getElementById('sortSelect');
const catalogCount = document.querySelector('.catalog-count');
const releaseCards = document.querySelectorAll('.card-release');

// Store original data for filtering
const releasesData = Array.from(releaseCards).map(card => ({
    element: card,
    title: card.querySelector('.card-title')?.textContent.toLowerCase() || '',
    artist: card.querySelector('.card-artist')?.textContent.toLowerCase() || '',
    genre: card.dataset.genre?.toLowerCase() || '',
    mood: card.dataset.mood?.toLowerCase() || '',
    type: card.dataset.type?.toLowerCase() || '',
    year: card.dataset.year || '',
    plays: parseInt(card.dataset.plays || '0'),
    date: card.dataset.date || ''
}));

// Apply filters
function applyFilters() {
    // Get search query
    const searchQuery = searchInput?.value.toLowerCase() || '';
    
    // Get selected genres
    const selectedGenres = Array.from(genreCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value.toLowerCase());
    
    // Get selected moods
    const selectedMoods = Array.from(moodCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value.toLowerCase());
    
    // Get selected type
    const selectedType = Array.from(typeRadios)
        .find(radio => radio.checked)?.value.toLowerCase() || 'all';
    
    // Get selected years
    const selectedYears = Array.from(yearCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    // Get selected popularity
    const selectedPopularity = Array.from(popularityCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value.toLowerCase());
    
    let visibleCount = 0;
    
    // Filter each release
    releasesData.forEach(release => {
        let isVisible = true;
        
        // Search filter (artist name, song name, or genre)
        if (searchQuery) {
            const matchesSearch = 
                release.title.includes(searchQuery) ||
                release.artist.includes(searchQuery) ||
                release.genre.includes(searchQuery);
            
            if (!matchesSearch) {
                isVisible = false;
            }
        }
        
        // Genre filter
        if (selectedGenres.length > 0) {
            if (!selectedGenres.includes(release.genre)) {
                isVisible = false;
            }
        }
        
        // Mood filter
        if (selectedMoods.length > 0) {
            if (!selectedMoods.includes(release.mood)) {
                isVisible = false;
            }
        }
        
        // Type filter
        if (selectedType !== 'all') {
            if (release.type !== selectedType) {
                isVisible = false;
            }
        }
        
        // Year filter
        if (selectedYears.length > 0) {
            if (!selectedYears.includes(release.year)) {
                isVisible = false;
            }
        }
        
        // Popularity filter
        if (selectedPopularity.length > 0) {
            const plays = release.plays;
            let matchesPopularity = false;
            
            selectedPopularity.forEach(pop => {
                if (pop === 'top-hits' && plays >= 1000000) matchesPopularity = true;
                if (pop === 'popular' && plays >= 100000 && plays < 1000000) matchesPopularity = true;
                if (pop === 'rising' && plays < 100000) matchesPopularity = true;
            });
            
            if (!matchesPopularity) {
                isVisible = false;
            }
        }
        
        // Show/hide card
        if (isVisible) {
            release.element.style.display = '';
            visibleCount++;
        } else {
            release.element.style.display = 'none';
        }
    });
    
    // Update count
    if (catalogCount) {
        catalogCount.textContent = `${visibleCount} releases`;
    }
    
    // Apply sorting
    applySorting();
}

// Apply sorting
function applySorting() {
    if (!sortSelect) return;
    
    const sortValue = sortSelect.value;
    const grid = document.querySelector('.releases-grid');
    if (!grid) return;
    
    const visibleReleases = releasesData.filter(r => r.element.style.display !== 'none');
    
    // Sort based on selection
    switch(sortValue) {
        case 'newest':
            visibleReleases.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            visibleReleases.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'popular':
            visibleReleases.sort((a, b) => b.plays - a.plays);
            break;
        case 'title':
            visibleReleases.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'artist':
            visibleReleases.sort((a, b) => a.artist.localeCompare(b.artist));
            break;
    }
    
    // Re-append elements in sorted order
    visibleReleases.forEach(release => {
        grid.appendChild(release.element);
    });
}

// Reset filters
function resetFilters() {
    // Clear search
    if (searchInput) searchInput.value = '';
    
    // Uncheck all checkboxes
    genreCheckboxes.forEach(cb => cb.checked = false);
    moodCheckboxes.forEach(cb => cb.checked = false);
    yearCheckboxes.forEach(cb => cb.checked = false);
    popularityCheckboxes.forEach(cb => cb.checked = false);
    
    // Reset type to all
    const allTypeRadio = document.querySelector('input[name="type"][value="all"]');
    if (allTypeRadio) allTypeRadio.checked = true;
    
    // Reset sort
    if (sortSelect) sortSelect.value = 'newest';
    
    // Apply filters
    applyFilters();
}

// Event listeners
if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
}

genreCheckboxes.forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

moodCheckboxes.forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

typeRadios.forEach(radio => {
    radio.addEventListener('change', applyFilters);
});

yearCheckboxes.forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

popularityCheckboxes.forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
}

if (sortSelect) {
    sortSelect.addEventListener('change', applySorting);
}

// Initialize counts
function initializeCounts() {
    const genreCounts = {};
    const yearCounts = {};
    
    releasesData.forEach(release => {
        // Count genres
        if (release.genre) {
            genreCounts[release.genre] = (genreCounts[release.genre] || 0) + 1;
        }
        
        // Count years
        if (release.year) {
            yearCounts[release.year] = (yearCounts[release.year] || 0) + 1;
        }
    });
    
    // Update genre counts
    genreCheckboxes.forEach(cb => {
        const genre = cb.value.toLowerCase();
        const count = genreCounts[genre] || 0;
        const countSpan = cb.closest('.filter-checkbox')?.querySelector('.filter-count');
        if (countSpan) {
            countSpan.textContent = count;
        }
    });
    
    // Update year counts
    yearCheckboxes.forEach(cb => {
        const year = cb.value;
        const count = yearCounts[year] || 0;
        const countSpan = cb.closest('.filter-checkbox')?.querySelector('.filter-count');
        if (countSpan) {
            countSpan.textContent = count;
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeCounts();
    applyFilters();
});

console.log('🎵 Releases Filter System Loaded');
