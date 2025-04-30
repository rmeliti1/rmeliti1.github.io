document.addEventListener('DOMContentLoaded', async () => {
    // --- Get DOM Elements ---
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const filterControls = document.getElementById('filter-controls');
    const knotGrid = document.getElementById('knot-grid');
    const noResultsMessage = document.getElementById('no-results-message');

    // --- Check if elements exist ---
    if (!searchInput || !clearSearchBtn || !filterControls || !knotGrid || !noResultsMessage) {
        console.error("Initialization failed: One or more essential DOM elements not found.");
        return; // Stop script execution if critical elements are missing
    }

    // --- State Variables ---
    let currentSearchTerm = '';
    let currentUseCaseFilter = 'all';
    let currentCharacteristicFilter = 'all';
    let allKnots = []; // To store the fetched knot data

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
        try {
            const response = await fetch('knots.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allKnots = await response.json();
            console.log(`Loaded ${allKnots.length} knots.`);
        } catch (error) {
            console.error("Could not load knot data:", error);
            knotGrid.innerHTML = '<p style="color: red; text-align: center;">Error loading knot data. Please try again later.</p>';
            // Disable controls if data loading fails
            searchInput.disabled = true;
            filterControls.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }
    }

    // --- Render a Single Knot Card ---
    function renderKnotCard(knot) {
        // Handle visual content (iframe, image, multiple)
        let visualHtml = '';
        if (knot.visual) {
            if (knot.visual.type === 'iframe') {
                visualHtml = `<iframe src="${knot.visual.src}" title="${knot.visual.title || knot.name}" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
            } else if (knot.visual.type === 'image') {
                visualHtml = `<img src="${knot.visual.src}" alt="${knot.visual.alt || knot.name}" loading="lazy">`;
            } else if (knot.visual.type === 'multiple' && Array.isArray(knot.visual.items)) {
                 visualHtml = knot.visual.items.map(item => {
                    let itemHtml = '';
                    if (item.type === 'iframe') {
                         itemHtml = `<iframe src="${item.src}" title="${item.title || knot.name}" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                    } else if (item.type === 'image') {
                        itemHtml = `<img src="${item.src}" alt="${item.alt || knot.name}" loading="lazy">`;
                    }
                    if(item.attribution) {
                        itemHtml += `<p class="attribution">${item.attribution}</p>`;
                    }
                    return itemHtml;
                 }).join('');
            }
             // Add overall attribution if present and not handled per-item in 'multiple'
            if (knot.visual.attribution && knot.visual.type !== 'multiple') {
                let attributionContent = knot.visual.attribution;
                 if (knot.visual.attributionLink) {
                    attributionContent = `<a href="${knot.visual.attributionLink}" target="_blank" rel="noopener noreferrer">${knot.visual.attribution}</a>`;
                 }
                visualHtml += `<p class="attribution">${attributionContent}</p>`;
            }
        }


        // Handle details - build dl list
        let detailsHtml = '';
        if (knot.details) {
            detailsHtml = Object.entries(knot.details).map(([key, value]) => {
                // Simple way to format key to Title Case
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return `<dt>${formattedKey}:</dt><dd>${value || 'N/A'}</dd>`;
            }).join('');
        }

        return `
            <div class="knot-card" data-id="${knot.id}" data-usecase="${knot.usecases.join(' ')}" data-characteristics="${knot.characteristics.join(' ')}">
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
        if (knotsToDisplay.length === 0) {
            knotGrid.innerHTML = ''; // Clear grid
            noResultsMessage.classList.remove('hidden');
        } else {
            // Build HTML string for all cards at once for better performance
            knotGrid.innerHTML = knotsToDisplay.map(renderKnotCard).join('');
            noResultsMessage.classList.add('hidden');
        }
    }

    // --- Main Filtering Function ---
    function filterAndSearchKnots() {
        const searchTerm = currentSearchTerm.toLowerCase().trim();

        const filteredKnots = allKnots.filter(knot => {
            // --- Check Criteria ---
            // 1. Search Match (Name, Description, Pros, Cons, Applications, Characteristics, Usecases)
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

            // 2. Use Case Match
            const useCaseMatch = currentUseCaseFilter === 'all' || knot.usecases.includes(currentUseCaseFilter);

            // 3. Characteristic Match
            const characteristicMatch = currentCharacteristicFilter === 'all' || knot.characteristics.includes(currentCharacteristicFilter);

            // --- Determine Visibility ---
            return searchMatch && useCaseMatch && characteristicMatch;
        });

        displayKnots(filteredKnots);
    }

    // Debounced version of the filter function for search input
    const debouncedFilter = debounce(filterAndSearchKnots, 300);

    // --- Event Listener for Search Input ---
    searchInput.addEventListener('input', (event) => {
        currentSearchTerm = event.target.value;
        debouncedFilter(); // Use the debounced version
    });

    // --- Event Listener for Clear Search Button ---
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        filterAndSearchKnots(); // Filter immediately
    });

    // --- Event Listener for Filter Buttons ---
    filterControls.addEventListener('click', (event) => {
        // Only run if a BUTTON within a .filter-group was clicked
        const button = event.target.closest('.filter-group button');
        if (!button) {
            return;
        }

        const filterGroup = button.getAttribute('data-filter-group');
        const filterValue = button.getAttribute('data-filter');

        // --- Update State Variables ---
        if (filterGroup === 'usecase') {
            currentUseCaseFilter = filterValue;
        } else if (filterGroup === 'characteristic') {
            currentCharacteristicFilter = filterValue;
        } else {
            return; // Should not happen
        }

        // --- Update Active Button Styling within the clicked group ---
        const groupButtons = button.closest('.filter-group').querySelectorAll('button');
        groupButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // --- Trigger Filtering ---
        filterAndSearchKnots();
    });

    // --- Initial Setup ---
    await loadKnotData(); // Load data first
    if (allKnots.length > 0) {
        displayKnots(allKnots); // Display all knots initially if data loaded
        // Ensure default 'all' buttons are visually active (redundant if class is set in HTML, but safe)
        filterControls.querySelector('button[data-filter-group="usecase"][data-filter="all"]').classList.add('active');
        filterControls.querySelector('button[data-filter-group="characteristic"][data-filter="all"]').classList.add('active');
    }
});