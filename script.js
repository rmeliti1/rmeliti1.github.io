document.addEventListener('DOMContentLoaded', () => {
    const filterControls = document.getElementById('filter-controls');
    const knotGrid = document.getElementById('knot-grid');
    const knotCards = knotGrid.querySelectorAll('.knot-card');
    const filterButtons = filterControls.querySelectorAll('button');

    filterControls.addEventListener('click', (event) => {
        // Only run if a button was clicked
        if (event.target.tagName !== 'BUTTON') {
            return;
        }

        const filterValue = event.target.getAttribute('data-filter');

        // Update active button style
        filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        event.target.classList.add('active');

        // Filter the knot cards
        knotCards.forEach(card => {
            const useCases = card.getAttribute('data-usecase').split(' '); // Get use cases as an array
            // const characteristics = card.getAttribute('data-characteristics').split(' '); // Future use

            // Check if the card should be shown
            let showCard = false;
            if (filterValue === 'all') {
                showCard = true;
            } else if (useCases.includes(filterValue)) {
                // Simple check if the filter matches any use case
                showCard = true;
            }
            // Add more complex filtering here if needed (e.g., for characteristics)
            // else if (characteristics.includes(filterValue)) {
            //     showCard = true;
            // }


            // Show or hide the card
            if (showCard) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });

    // Optional: Trigger the 'all' filter on page load to ensure proper initial state
    // (Though CSS handles initial visibility, this ensures consistency if JS loads late)
    // filterButtons[0].click(); // Simulate a click on the "Show All" button
});
