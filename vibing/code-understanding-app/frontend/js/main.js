// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DEBUG: DOMContentLoaded fired');
    console.log('DEBUG: Current URL:', window.location.href);
    console.log('DEBUG: Document readyState:', document.readyState);

    try {
        console.log('DEBUG: Starting application initialization');
        // Set up navigation
        setupNavigation();

        // Initial page load
        handleRoute();

        // Listen for URL changes
        window.addEventListener('popstate', handleRoute);

        console.log('DEBUG: Application initialization completed successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        console.error('DEBUG: Error stack:', error.stack);
        // Fallback: show basic error message
        document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Application Error</h1><p>Please refresh the page to try again.</p><p>Check browser console for details.</p></div>';
    }
});

// Handle route changes
function handleRoute() {
    try {
        const path = window.location.pathname;
        const search = window.location.search;
        const hash = window.location.hash;

        console.log('DEBUG: handleRoute called with:', { path, search, hash });

        // Only log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Route changed:', { path, search, hash });
        }

        // Handle different routes
        if (path === '/' || path === '/index.html') {
            console.log('DEBUG: Loading home page');
            loadPage('home');
        } else if (path.startsWith('/lesson-viewer')) {
            const params = new URLSearchParams(search);
            const id = params.get('id');
            console.log('DEBUG: Lesson viewer route, id:', id);
            if (id) {
                localStorage.setItem('lesson', id);
                loadLesson(id);
            } else {
                console.log('DEBUG: No lesson ID provided, redirecting to home');
                // Redirect to home if no lesson ID is provided
                navigateTo('/');
            }
        } else {
            // Handle other routes
            const route = path.replace(/^\//, '').replace(/\.html$/, '');
            console.log('DEBUG: Other route detected:', route);
            if (route) {
                loadPage(route);
            } else {
                console.log('DEBUG: No route, loading home');
                loadPage('home');
            }
        }
    } catch (error) {
        console.error('Error handling route:', error);
        console.error('DEBUG: Route error stack:', error.stack);
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
        console.log('DEBUG: loadPage called with:', page);
        // Only log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Loading page:', page);
        }
        // Your page loading logic here
        document.body.setAttribute('data-page', page);
        console.log('DEBUG: Page attribute set to:', page);
    } catch (error) {
        console.error('Error loading page:', error);
        console.error('DEBUG: loadPage error stack:', error.stack);
    }
}

// Load a specific lesson
function loadLesson(id) {
    try {
        console.log('DEBUG: loadLesson called with:', id);
        // Only log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Loading lesson:', id);
        }
        // Your lesson loading logic here
        document.body.setAttribute('data-lesson', id);
        console.log('DEBUG: Lesson attribute set to:', id);
    } catch (error) {
        console.error('Error loading lesson:', error);
        console.error('DEBUG: loadLesson error stack:', error.stack);
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
