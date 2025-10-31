// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Set up navigation
        setupNavigation();

        // Initial page load
        handleRoute();

        // Listen for URL changes
        window.addEventListener('popstate', handleRoute);
    } catch (error) {
        console.error('Error initializing application:', error);
        // Fallback: show basic error message
        document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Application Error</h1><p>Please refresh the page to try again.</p></div>';
    }
});

// Handle route changes
function handleRoute() {
    try {
        const path = window.location.pathname;
        const search = window.location.search;
        const hash = window.location.hash;

        // Only log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Route changed:', { path, search, hash });
        }

        // Handle different routes
        if (path === '/' || path === '/index.html') {
            loadPage('home');
        } else if (path.startsWith('/lesson-viewer')) {
            const params = new URLSearchParams(search);
            const id = params.get('id');
            if (id) {
                localStorage.setItem('lesson', id);
                loadLesson(id);
            } else {
                // Redirect to home if no lesson ID is provided
                navigateTo('/');
            }
        } else {
            // Handle other routes
            const route = path.replace(/^\//, '').replace(/\.html$/, '');
            if (route) {
                loadPage(route);
            } else {
                loadPage('home');
            }
        }
    } catch (error) {
        console.error('Error handling route:', error);
        // Fallback to home page
        loadPage('home');
    }
}

// Navigate to a new route
function navigateTo(path) {
    window.history.pushState({}, '', path);
    handleRoute();
}

// Handle lesson viewing
function view(id) {
    navigateTo(`/lesson-viewer?id=${id}`);
}

// Set up navigation
function setupNavigation() {
    // Handle all internal navigation
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="/"]');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href.startsWith('http')) {
                window.location.href = href; // External link
            } else {
                navigateTo(href);
            }
        }
    });
}

// Load a specific page
function loadPage(page) {
    try {
        // Only log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Loading page:', page);
        }
        // Your page loading logic here
        document.body.setAttribute('data-page', page);
    } catch (error) {
        console.error('Error loading page:', error);
    }
}

// Load a specific lesson
function loadLesson(id) {
    try {
        // Only log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Loading lesson:', id);
        }
        // Your lesson loading logic here
        document.body.setAttribute('data-lesson', id);
    } catch (error) {
        console.error('Error loading lesson:', error);
    }
}

// Load page content (renamed to avoid conflict)
function loadPageContent(page) {
    try {
        fetch('/' + page)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const content = document.getElementById('content');
                if (content) {
                    content.innerHTML = html;
                }
            })
            .catch(error => {
                console.error('Error loading page:', error);
                // Show user-friendly error message
                const content = document.getElementById('content');
                if (content) {
                    content.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>Page Load Error</h2><p>Sorry, we couldn\'t load this page. Please try again later.</p></div>';
                }
            });
    } catch (error) {
        console.error('Error in loadPageContent:', error);
    }
}
