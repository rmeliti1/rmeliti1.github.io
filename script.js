document.addEventListener('DOMContentLoaded', async () => {
    // --- Get DOM Elements ---
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const sortSelect = document.getElementById('sort-select');
    const filterControls = document.getElementById('filter-controls');
    const characteristicFilterGroup = document.getElementById('characteristic-filter-group');
    const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
    const knotGrid = document.getElementById('knot-grid');
    const noResultsMessage = document.getElementById('no-results-message');
    const loadingIndicator = document.getElementById('loading-indicator');
    const backToTopButton = document.getElementById('back-to-top');

    // --- Check if elements exist ---
    if (!searchInput || !clearSearchBtn || !sortSelect || !filterControls || !characteristicFilterGroup || !clearAllFiltersBtn || !knotGrid || !noResultsMessage || !loadingIndicator || !backToTopButton) {
        console.error("Initialization failed: One or more essential DOM elements not found.");
        if(knotGrid) knotGrid.innerHTML = '<p style="color: red; text-align: center;">Page setup error. Essential elements are missing.</p>';
        return;
    }

    // --- State Variables ---
    let currentSearchTerm = '';
    let currentUseCaseFilter = 'all';
    let currentCharacteristicFilter = 'all';
    let currentSortOption = 'relevance';
    let allKnots = [];
    let initialKnotsOrder = []; // To preserve original order for 'relevance' sort

    // --- LocalStorage Keys ---
    const LS_SEARCH_TERM = 'knot_searchTerm';
    const LS_USECASE_FILTER = 'knot_useCaseFilter';
    const LS_CHAR_FILTER = 'knot_characteristicFilter';
    const LS_SORT_OPTION = 'knot_sortOption';

    // --- Debounce Utility ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- Load State from LocalStorage ---
    function loadState() {
        currentSearchTerm = localStorage.getItem(LS_SEARCH_TERM) || '';
        currentUseCaseFilter = localStorage.getItem(LS_USECASE_FILTER) || 'all';
        currentCharacteristicFilter = localStorage.getItem(LS_CHAR_FILTER) || 'all';
        currentSortOption = localStorage.getItem(LS_SORT_OPTION) || 'relevance';

        searchInput.value = currentSearchTerm;
        sortSelect.value = currentSortOption;

        // Set active filter buttons
        filterControls.querySelectorAll('.filter-group button').forEach(btn => {
            btn.classList.remove('active');
            const group = btn.dataset.filterGroup;
            const filterVal = btn.dataset.filter;
            if ((group === 'usecase' && filterVal === currentUseCaseFilter) ||
                (group === 'characteristic' && filterVal === currentCharacteristicFilter)) {
                btn.classList.add('active');
            }
        });
    }

    // --- Save State to LocalStorage ---
    function saveState() {
        localStorage.setItem(LS_SEARCH_TERM, currentSearchTerm);
        localStorage.setItem(LS_USECASE_FILTER, currentUseCaseFilter);
        localStorage.setItem(LS_CHAR_FILTER, currentCharacteristicFilter);
        localStorage.setItem(LS_SORT_OPTION, currentSortOption);
    }

    // --- Fetch Knot Data ---
    async function loadKnotData() {
        loadingIndicator.classList.remove('hidden');
        knotGrid.classList.add('hidden');
        noResultsMessage.classList.add('hidden');

        try {
            const response = await fetch('knots.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allKnots = await response.json();
            initialKnotsOrder = [...allKnots]; // Store original order
            console.log(`Loaded ${allKnots.length} knots.`);
            populateCharacteristicFilters(); // Populate filters before applying saved state
            loadState(); // Load state after dynamic filters are populated
        } catch (error) {
            console.error("Could not load knot data:", error);
            knotGrid.innerHTML = '<p style="color: red; text-align: center;">Error loading knot data. Please try again later.</p>';
            searchInput.disabled = true;
            sortSelect.disabled = true;
            filterControls.querySelectorAll('button').forEach(btn => btn.disabled = true);
            clearAllFiltersBtn.disabled = true;
        } finally {
            loadingIndicator.classList.add('hidden');
            if (allKnots.length > 0) {
                knotGrid.classList.remove('hidden');
            }
        }
    }

    // --- Populate Characteristic Filters Dynamically ---
    function populateCharacteristicFilters() {
        if (!allKnots.length) return;
        const characteristics = new Set();
        allKnots.forEach(knot => {
            (knot.characteristics || []).forEach(char => characteristics.add(char));
        });
        const sortedCharacteristics = Array.from(characteristics).sort();
        const anyButton = characteristicFilterGroup.querySelector('button[data-filter="all"]');
        // Clear previously generated buttons except "Any"
        characteristicFilterGroup.innerHTML = '';
        characteristicFilterGroup.appendChild(anyButton); // Re-add "Any" button first

        sortedCharacteristics.forEach(char => {
            const button = document.createElement('button');
            button.dataset.filterGroup = 'characteristic';
            button.dataset.filter = char;
            button.textContent = char.charAt(0).toUpperCase() + char.slice(1).replace(/-/g, ' ');
            characteristicFilterGroup.appendChild(button);
        });
    }

    // --- Render a Single Knot Card ---
    function renderKnotCard(knot) {
        let visualHtml = '';
        if (knot.visual) {
            const buildVisualItemHtml = (item) => {
                let itemHtml = '';
                let itemStyle = '';
                if (item.aspectRatio && (item.type === 'iframe' || item.type === 'image' || item.type === 'video')) {
                    itemStyle = `style="aspect-ratio: ${item.aspectRatio};"`;
                }
                if (item.type === 'iframe') {
                    itemHtml = `<iframe src="${item.src}" title="${item.title || knot.name}" ${itemStyle} frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                } else if (item.type === 'image') {
                    itemHtml = `<img src="${item.src}" alt="${item.alt || knot.name}" ${itemStyle} loading="lazy">`;
                }
                if(item.attribution) {
                    let attributionContent = item.attribution;
                    if (item.attributionLink) {
                         attributionContent = `<a href="${item.attributionLink}" target="_blank" rel="noopener noreferrer">${item.attribution}</a>`;
                    }
                    itemHtml += `<p class="attribution">${attributionContent}</p>`;
                }
                return `<div class="visual-item">${itemHtml}</div>`;
            };
            if (knot.visual.type === 'multiple' && Array.isArray(knot.visual.items)) {
                visualHtml = knot.visual.items.map(item => buildVisualItemHtml(item)).join('');
            } else {
                visualHtml = buildVisualItemHtml(knot.visual);
            }
            if (knot.visual.attribution && knot.visual.type !== 'multiple' && !knot.visual.items) {
                let attributionContent = knot.visual.attribution;
                 if (knot.visual.attributionLink) {
                    attributionContent = `<a href="${knot.visual.attributionLink}" target="_blank" rel="noopener noreferrer">${knot.visual.attribution}</a>`;
                 }
                visualHtml += `<p class="attribution">${attributionContent}</p>`;
            }
        }

        let detailsHtml = '';
        if (knot.details) {
            detailsHtml = Object.entries(knot.details).map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return `<dt>${formattedKey}:</dt><dd>${value || 'N/A'}</dd>`;
            }).join('');
        }

        return `
            <div class="knot-card" id="knot-${knot.id}" data-id="${knot.id}" data-usecase="${(knot.usecases || []).join(' ')}" data-characteristics="${(knot.characteristics || []).join(' ')}">
                <div class="knot-card-header">
                    <h3>${knot.name}</h3>
                    <button class="permalink-btn" title="Copy link to this knot" data-knot-id="${knot.id}">🔗</button>
                </div>
                <div class="knot-visual">
                    ${visualHtml || '<p>No visual available.</p>'}
                </div>
                <div class="knot-info">
                    <h4>Description:</h4>
                    <p>${knot.description || 'No description available.'}</p>
                    ${detailsHtml ? `<dl class="knot-details">${detailsHtml}</dl>` : ''}
                    ${knot.pros && knot.pros.length > 0 ? `<h4>Pros:</h4><ul>${knot.pros.map(pro => `<li>${pro}</li>`).join('')}</ul>` : ''}
                    ${knot.cons && knot.cons.length > 0 ? `<h4>Cons:</h4><ul>${knot.cons.map(con => `<li>${con}</li>`).join('')}</ul>` : ''}
                    ${knot.applications ? `<h4>Typical Applications:</h4><p>${knot.applications}</p>` : ''}
                </div>
            </div>
        `;
    }

    // --- Display Filtered and Sorted Knots ---
    function displayKnots(knotsToDisplay) {
        if (knotsToDisplay.length === 0 && allKnots.length > 0) {
            knotGrid.innerHTML = '';
            noResultsMessage.classList.remove('hidden');
        } else if (knotsToDisplay.length > 0) {
            knotGrid.innerHTML = knotsToDisplay.map(renderKnotCard).join('');
            noResultsMessage.classList.add('hidden');
            addPermalinkListeners(); // Add listeners after cards are rendered
            handleDirectLink(); // Attempt to scroll to a linked knot
        } else {
            knotGrid.innerHTML = '';
            noResultsMessage.classList.add('hidden');
        }
    }

    // --- Main Filtering and Sorting Function ---
    function filterSortAndSearchKnots() {
        if (!allKnots.length) return;

        const searchTerm = currentSearchTerm.toLowerCase().trim();
        let RfilteredKnots = allKnots.filter(knot => {
            const searchableText = [
                knot.name,
                knot.description,
                knot.applications,
                ...(knot.pros || []),
                ...(knot.cons || []),
                ...(knot.usecases || []),
                ...(knot.characteristics || []),
                ...(knot.alternativeNames || []) // Added alternative names
            ].join(' ').toLowerCase();
            const searchMatch = searchTerm === '' || searchableText.includes(searchTerm);
            const useCaseMatch = currentUseCaseFilter === 'all' || (knot.usecases || []).includes(currentUseCaseFilter);
            const characteristicMatch = currentCharacteristicFilter === 'all' || (knot.characteristics || []).includes(currentCharacteristicFilter);
            return searchMatch && useCaseMatch && characteristicMatch;
        });

        // Apply Sorting
        if (currentSortOption === 'name-asc') {
            RfilteredKnots.sort((a, b) => a.name.localeCompare(b.name));
        } else if (currentSortOption === 'name-desc') {
            RfilteredKnots.sort((a, b) => b.name.localeCompare(a.name));
        } else if (currentSortOption === 'relevance') {
            // Sort based on original order in allKnots (which itself comes from initialKnotsOrder)
            // This requires finding the original index.
             RfilteredKnots.sort((a, b) => initialKnotsOrder.findIndex(k => k.id === a.id) - initialKnotsOrder.findIndex(k => k.id === b.id));
        }
        // Add more sort options here if needed

        displayKnots(RfilteredKnots);
        saveState();
    }

    const debouncedFilterSort = debounce(filterSortAndSearchKnots, 300);

    // --- Permalink and Direct Linking ---
    function addPermalinkListeners() {
        document.querySelectorAll('.permalink-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent card click if any
                const knotId = button.dataset.knotId;
                const url = `${window.location.origin}${window.location.pathname}#${knotId}`;
                try {
                    await navigator.clipboard.writeText(url);
                    // Update URL hash without page jump (if supported)
                    if (history.pushState) {
                        history.pushState(null, null, `#${knotId}`);
                    } else {
                        window.location.hash = knotId; // Fallback
                    }
                    // Simple feedback
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    setTimeout(() => { button.textContent = originalText; }, 1500);
                } catch (err) {
                    console.error('Failed to copy link: ', err);
                    alert('Failed to copy link. You can manually copy from the address bar after the page reloads.');
                    window.location.hash = knotId; // Fallback will cause reload and jump
                }
            });
        });
    }

    function handleDirectLink() {
        const hash = window.location.hash.substring(1); // Remove #
        if (hash) {
            const targetKnotElement = document.getElementById(`knot-${hash}`);
            if (targetKnotElement) {
                targetKnotElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                targetKnotElement.classList.add('highlighted-knot');
                setTimeout(() => {
                    targetKnotElement.classList.remove('highlighted-knot');
                }, 2500); // Remove highlight after a bit
            }
        }
    }


    // --- Event Listeners ---
    searchInput.addEventListener('input', (event) => {
        currentSearchTerm = event.target.value;
        debouncedFilterSort();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        filterSortAndSearchKnots();
    });

    sortSelect.addEventListener('change', (event) => {
        currentSortOption = event.target.value;
        filterSortAndSearchKnots();
    });

    filterControls.addEventListener('click', (event) => {
        const button = event.target.closest('.filter-group button');
        if (!button || button.disabled) return;

        const filterGroup = button.getAttribute('data-filter-group');
        const filterValue = button.getAttribute('data-filter');

        if (filterGroup === 'usecase') {
            currentUseCaseFilter = filterValue;
        } else if (filterGroup === 'characteristic') {
            currentCharacteristicFilter = filterValue;
        } else {
            return;
        }

        const groupButtons = button.closest('.filter-group').querySelectorAll('button');
        groupButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        filterSortAndSearchKnots();
    });

    clearAllFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        currentUseCaseFilter = 'all';
        currentCharacteristicFilter = 'all';
        currentSortOption = 'relevance'; // Reset sort to default
        sortSelect.value = currentSortOption;

        filterControls.querySelectorAll('.filter-group button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === 'all') {
                btn.classList.add('active');
            }
        });
        filterSortAndSearchKnots(); // This will also save the cleared state
    });

    // Back to Top Button Logic
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) { // Show button after scrolling 300px
            backToTopButton.classList.remove('hidden');
        } else {
            backToTopButton.classList.add('hidden');
        }
    });
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // --- Initial Setup ---
    async function initializeApp() {
        await loadKnotData(); // Loads data, then populates dynamic filters, then loads state
        if (allKnots.length > 0) {
            filterSortAndSearchKnots(); // Apply loaded/default state and display
            // Initial active states for filters are handled by loadState after dynamic filters are populated
        } else if (!loadingIndicator.classList.contains('hidden')) {
            // Loading error already handled in loadKnotData
        } else {
            noResultsMessage.classList.remove('hidden');
            noResultsMessage.textContent = "No knots available at the moment.";
        }
    }

    initializeApp();
});
