document.addEventListener('DOMContentLoaded', async () => {
    // --- Get DOM Elements ---
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const filterControls = document.getElementById('filter-controls');
    const characteristicFilterGroup = document.getElementById('characteristic-filter-group');
    const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
    const knotGrid = document.getElementById('knot-grid');
    const noResultsMessage = document.getElementById('no-results-message');
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- Check if elements exist ---
    if (!searchInput || !clearSearchBtn || !filterControls || !characteristicFilterGroup || !clearAllFiltersBtn || !knotGrid || !noResultsMessage || !loadingIndicator) {
        console.error("Initialization failed: One or more essential DOM elements not found.");
        if(knotGrid) knotGrid.innerHTML = '<p style="color: red; text-align: center;">Page setup error. Essential elements are missing.</p>';
        return;
    }

    // --- State Variables ---
    let currentSearchTerm = '';
    let currentUseCaseFilter = 'all';
    let currentCharacteristicFilter = 'all';
    let allKnots = [];

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

    // --- Fetch Knot Data ---
    async function loadKnotData() {
        loadingIndicator.classList.remove('hidden');
        knotGrid.classList.add('hidden'); // Hide grid while loading
        noResultsMessage.classList.add('hidden');

        try {
            const response = await fetch('knots.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allKnots = await response.json();
            console.log(`Loaded ${allKnots.length} knots.`);
            populateCharacteristicFilters();
        } catch (error) {
            console.error("Could not load knot data:", error);
            knotGrid.innerHTML = '<p style="color: red; text-align: center;">Error loading knot data. Please try again later.</p>';
            searchInput.disabled = true;
            filterControls.querySelectorAll('button').forEach(btn => btn.disabled = true);
            clearAllFiltersBtn.disabled = true;
        } finally {
            loadingIndicator.classList.add('hidden');
            if (allKnots.length > 0) { // Only unhide grid if data loaded
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

        // Keep the "Any" button, remove others if they exist from a previous load (e.g. hot reload)
        const existingButtons = characteristicFilterGroup.querySelectorAll('button[data-filter-group="characteristic"]:not([data-filter="all"])');
        existingButtons.forEach(btn => btn.remove());
        
        const anyButton = characteristicFilterGroup.querySelector('button[data-filter="all"]');

        sortedCharacteristics.forEach(char => {
            const button = document.createElement('button');
            button.dataset.filterGroup = 'characteristic';
            button.dataset.filter = char;
            // Capitalize first letter and replace hyphens for display
            button.textContent = char.charAt(0).toUpperCase() + char.slice(1).replace(/-/g, ' ');
            characteristicFilterGroup.insertBefore(button, null); // Appends to the end of fieldset
        });
    }


    // --- Render a Single Knot Card ---
    function renderKnotCard(knot) {
        let visualHtml = '';
        if (knot.visual) {
            const buildVisualItemHtml = (item, isMultiple = false) => {
                let itemHtml = '';
                let itemStyle = '';
                if (item.aspectRatio && (item.type === 'iframe' || item.type === 'image' || item.type === 'video')) { // Added image/video
                    itemStyle = `style="aspect-ratio: ${item.aspectRatio};"`;
                }

                if (item.type === 'iframe') {
                    itemHtml = `<iframe src="${item.src}" title="${item.title || knot.name}" ${itemStyle} frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                } else if (item.type === 'image') {
                    itemHtml = `<img src="${item.src}" alt="${item.alt || knot.name}" ${itemStyle} loading="lazy">`;
                }
                // Add per-item attribution if it exists
                if (item.attribution) {
                    let attributionContent = item.attribution;
                    if (item.attributionLink) {
                         attributionContent = `<a href="${item.attributionLink}" target="_blank" rel="noopener noreferrer">${item.attribution}</a>`;
                    }
                    itemHtml += `<p class="attribution">${attributionContent}</p>`;
                }
                return `<div class="visual-item">${itemHtml}</div>`;
            };

            if (knot.visual.type === 'multiple' && Array.isArray(knot.visual.items)) {
                visualHtml = knot.visual.items.map(item => buildVisualItemHtml(item, true)).join('');
            } else {
                visualHtml = buildVisualItemHtml(knot.visual);
            }
             // Add overall attribution if present and not handled per-item in 'multiple' or if it's a single visual
            if (knot.visual.attribution && knot.visual.type !== 'multiple' && !knot.visual.items) { // Ensure it's not already handled
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
            <div class="knot-card" data-id="${knot.id}" data-usecase="${(knot.usecases || []).join(' ')}" data-characteristics="${(knot.characteristics || []).join(' ')}">
                <h3>${knot.name}</h3>
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

    // --- Display Filtered Knots ---
    function displayKnots(knotsToDisplay) {
        if (knotsToDisplay.length === 0 && allKnots.length > 0) { // Only show no results if knots are loaded
            knotGrid.innerHTML = '';
            noResultsMessage.classList.remove('hidden');
        } else if (knotsToDisplay.length > 0) {
            knotGrid.innerHTML = knotsToDisplay.map(renderKnotCard).join('');
            noResultsMessage.classList.add('hidden');
        } else { // Handles case where allKnots is empty (e.g., initial load before data)
            knotGrid.innerHTML = ''; // Keep it empty, loading indicator might be visible
            noResultsMessage.classList.add('hidden');
        }
    }

    // --- Main Filtering Function ---
    function filterAndSearchKnots() {
        if (!allKnots.length) return; // Don't filter if no data

        const searchTerm = currentSearchTerm.toLowerCase().trim();

        const filteredKnots = allKnots.filter(knot => {
            const searchableText = [
                knot.name,
                knot.description,
                knot.applications,
                ...(knot.pros || []),
                ...(knot.cons || []),
                ...(knot.usecases || []),
                ...(knot.characteristics || [])
            ].join(' ').toLowerCase();
            const searchMatch = searchTerm === '' || searchableText.includes(searchTerm);

            const useCaseMatch = currentUseCaseFilter === 'all' || (knot.usecases || []).includes(currentUseCaseFilter);
            const characteristicMatch = currentCharacteristicFilter === 'all' || (knot.characteristics || []).includes(currentCharacteristicFilter);

            return searchMatch && useCaseMatch && characteristicMatch;
        });
        displayKnots(filteredKnots);
    }

    const debouncedFilter = debounce(filterAndSearchKnots, 300);

    // --- Event Listeners ---
    searchInput.addEventListener('input', (event) => {
        currentSearchTerm = event.target.value;
        debouncedFilter();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        filterAndSearchKnots();
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
        filterAndSearchKnots();
    });

    clearAllFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        currentUseCaseFilter = 'all';
        currentCharacteristicFilter = 'all';

        filterControls.querySelectorAll('.filter-group button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === 'all') {
                btn.classList.add('active');
            }
        });
        filterAndSearchKnots();
    });

    // --- Initial Setup ---
    async function initializeApp() {
        await loadKnotData();
        if (allKnots.length > 0) {
            displayKnots(allKnots);
            // Ensure default 'all' buttons are visually active
            filterControls.querySelector('button[data-filter-group="usecase"][data-filter="all"]').classList.add('active');
            const characteristicAnyButton = characteristicFilterGroup.querySelector('button[data-filter-group="characteristic"][data-filter="all"]');
            if (characteristicAnyButton) characteristicAnyButton.classList.add('active');
        } else if (!loadingIndicator.classList.contains('hidden')) {
            // If loading failed, loadingIndicator might still be visible,
            // and noResultsMessage should not be shown for a loading error.
            // The error message is already in knotGrid.
        } else {
             // If loading finished but allKnots is empty for other reasons (e.g. empty JSON file)
            noResultsMessage.classList.remove('hidden');
            noResultsMessage.textContent = "No knots available at the moment.";
        }
    }

    initializeApp();
});
