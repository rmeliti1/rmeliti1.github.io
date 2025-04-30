document.addEventListener('DOMContentLoaded', () => {
    // Get references to the filter controls, the grid container, and all knot cards
    const filterControls = document.getElementById('filter-controls');
    const knotGrid = document.getElementById('knot-grid');
    const knotCards = knotGrid.querySelectorAll('.knot-card');
    const filterButtons = filterControls.querySelectorAll('button');

    // Add a single event listener to the filter controls container
    filterControls.addEventListener('click', (event) => {
        // Only proceed if a BUTTON element inside the container was clicked
        if (event.target.tagName !== 'BUTTON') {
            return;
        }

        // Get the filter value from the button's data-filter attribute
        const filterValue = event.target.getAttribute('data-filter');

        // --- Update Active Button Styling ---
        // Remove 'active' class from all buttons
        filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        // Add 'active' class to the clicked button
        event.target.classList.add('active');

        // --- Filter the Knot Cards ---
        knotCards.forEach(card => {
            // Get the use cases associated with this card (split space-separated values into an array)
            const useCases = card.getAttribute('data-usecase').split(' ');

            // Future Extension: Get characteristics if you add that filtering
            // const characteristics = card.getAttribute('data-characteristics').split(' ');

            // Determine if the card should be shown based on the current filter
            let showCard = false;
            if (filterValue === 'all') {
                // If 'Show All' is clicked, always show the card
                showCard = true;
            } else if (useCases.includes(filterValue)) {
                // If the card's use cases include the filter value, show it
                showCard = true;
            }
            // Future Extension: Add logic here to check characteristics if implementing that filter
            // else if (characteristics.includes(filterValue)) {
            //     showCard = true;
            // }


            // Apply or remove the 'hidden' class based on the showCard flag
            if (showCard) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });

    // Optional: Trigger the 'all' filter on page load to ensure proper initial state
    // This is good practice, although the CSS handles initial visibility.
    // It ensures the 'Show All' button starts with the 'active' class visually.
    if (filterButtons.length > 0) {
         filterButtons[0].classList.add('active'); // Make 'Show All' active initially
    }
     // Note: We don't need to simulate a click anymore if the CSS handles initial state correctly.
     // Setting the class directly is sufficient.
});
