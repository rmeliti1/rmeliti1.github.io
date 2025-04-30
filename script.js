document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const searchInput = document.getElementById('search-input');
    const filterControls = document.getElementById('filter-controls');
    const knotGrid = document.getElementById('knot-grid');
    const knotCards = knotGrid.querySelectorAll('.knot-card');
    const filterButtons = filterControls.querySelectorAll('button');

    // --- State Variables ---
    let currentSearchTerm = '';
    let currentUseCaseFilter = 'all';
    let currentCharacteristicFilter = 'all';

    // --- Main Filtering Function ---
    function filterAndSearchKnots() {
        // Normalize search term
        const searchTerm = currentSearchTerm.toLowerCase().trim();

        knotCards.forEach(card => {
            // --- Get Card Data ---
            const knotName = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const knotInfoText = card.querySelector('.knot-info')?.textContent.toLowerCase() || '';
            const useCases = card.getAttribute('data-usecase').split(' ');
            const characteristics = card.getAttribute('data-characteristics').split(' ');

            // --- Check Criteria ---
            // 1. Search Match (Name or Info Text)
            const searchMatch = searchTerm === '' || knotName.includes(searchTerm) || knotInfoText.includes(searchTerm);

            // 2. Use Case Match
            const useCaseMatch = currentUseCaseFilter === 'all' || useCases.includes(currentUseCaseFilter);

            // 3. Characteristic Match
            const characteristicMatch = currentCharacteristicFilter === 'all' || characteristics.includes(currentCharacteristicFilter);

            // --- Determine Visibility ---
            // Card should be visible if it matches ALL active filters/search
            const showCard = searchMatch && useCaseMatch && characteristicMatch;

            // --- Apply/Remove 'hidden' Class ---
            if (showCard) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    // --- Event Listener for Search Input ---
    searchInput.addEventListener('input', (event) => {
        currentSearchTerm = event.target.value;
        filterAndSearchKnots(); // Re-filter on every input change
    });

    // --- Event Listener for Filter Buttons ---
    filterControls.addEventListener('click', (event) => {
        // Only run if a BUTTON was clicked
        if (event.target.tagName !== 'BUTTON') {
            return;
        }

        const button = event.target;
        const filterGroup = button.getAttribute('data-filter-group');
        const filterValue = button.getAttribute('data-filter');

        // --- Update State Variables ---
        if (filterGroup === 'usecase') {
            currentUseCaseFilter = filterValue;
        } else if (filterGroup === 'characteristic') {
            currentCharacteristicFilter = filterValue;
        } else {
            return; // Should not happen if HTML is correct
        }

        // --- Update Active Button Styling within the clicked group ---
        // Find all buttons within the same group
        const groupButtons = filterControls.querySelectorAll(`button[data-filter-group="${filterGroup}"]`);
        groupButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active'); // Activate the clicked button

        // --- Trigger Filtering ---
        filterAndSearchKnots();
    });

    // --- Initial Setup ---
    // Ensure 'all' / 'any' filters are active visually on load (JS confirms state)
    filterControls.querySelector('button[data-filter-group="usecase"][data-filter="all"]').classList.add('active');
    filterControls.querySelector('button[data-filter-group="characteristic"][data-filter="all"]').classList.add('active');

    // Optional: Run filter once on load in case of initial search values etc.
    // filterAndSearchKnots(); // Usually not needed if starting clean
});
