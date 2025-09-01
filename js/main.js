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

    // Add a login button for Netlify Identity
    const header = document.querySelector('header');
    if (header) {
        const loginBtn = document.createElement('button');
        loginBtn.id = 'login-button';
        loginBtn.textContent = 'Login';
        header.appendChild(loginBtn);

        // Dynamically load the Netlify Identity widget
        const identityScript = document.createElement('script');
        identityScript.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
        document.head.appendChild(identityScript);

        identityScript.onload = () => {
            const identity = window.netlifyIdentity;
            if (!identity) return;

            loginBtn.addEventListener('click', () => {
                identity.open();
            });

            identity.on('login', () => {
                document.location.href = '/admin/';
            });

            identity.on('logout', () => {
                document.location.href = '/';
            });
        };
    }
});
