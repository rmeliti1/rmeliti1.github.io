// Wait until the HTML document is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {

    // Get references to the button and the message area
    const button = document.getElementById('myButton');
    const messageArea = document.getElementById('messageArea');
    const dateSpan = document.getElementById('creationDate');

    // Check if the button exists on the page
    if (button) {
        // Add an event listener to the button
        button.addEventListener('click', function() {
            // Change the text content of the message area when the button is clicked
            if (messageArea) {
                messageArea.textContent = 'Yay! The button was clicked and the JavaScript is working!';
            } else {
                console.error('Message area element not found!');
            }
        });
    } else {
        console.error('Button element not found!');
    }

    // Display the current date in the footer
    if (dateSpan) {
        const today = new Date();
        // Format date as Month Day, Year (e.g., April 30, 2025)
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateSpan.textContent = today.toLocaleDateString('en-US', options);
    } else {
         console.error('Creation date span not found!');
    }

});