document.addEventListener('DOMContentLoaded', function() {
    // Select all category toggles
    const toggles = document.querySelectorAll('.category-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            // Toggle the 'open' class on the clicked toggle itself (for the arrow)
            toggle.classList.toggle('open');

            // Find the next sibling element, which is the submenu
            const submenu = toggle.nextElementSibling;

            // Check if the next sibling is a submenu and toggle its 'open' class
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('open');
            }
        });
    });
});
