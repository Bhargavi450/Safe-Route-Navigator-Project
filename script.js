// SafeRoute Navigator - Enhanced JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // --- STATE & DATA ---
    let map;
    let activeRouteLayers = [];
    let startCoords, endCoords;
    let routeData = [];
    let userLocationMarker = null;
    let isNavigating = false;
    let navAnimationId = null;
    let toastTimeout;
    let sirenAudio;
    let locationWatchId = null;
    let currentLocation = null;
    
    // DOM Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-button');
    const closeMobileMenuBtn = document.getElementById('close-mobile-menu-button');
    
    // Sample data
    let sampleReports = [
        { 
            id: 1, 
            type: "Streetlight Outage", 
            notes: "The main streetlight at Shivaji chowk has been out for 3 days.", 
            lat: 16.7050, 
            lng: 74.5822, 
            anonymous: true, 
            createdAt: "2025-08-29T19:30:00Z",
            severity: "medium"
        },
        { 
            id: 2, 
            type: "Suspicious Activity", 
            notes: "Group loitering near the bus stand late at night.", 
            lat: 16.7025, 
            lng: 74.5790, 
            anonymous: false, 
            createdAt: "2025-08-28T22:15:00Z",
            severity: "high"
        },
        { 
            id: 3, 
            type: "Accident-prone Area", 
            notes: "Very sharp and blind turn near the DKTE college.", 
            lat: 16.6981, 
            lng: 74.5945, 
            anonymous: true, 
            createdAt: "2025-08-27T12:00:00Z",
            severity: "high"
        },
    ];
    
    let trustedContacts = [
        { name: "Family", phone: "+919876543210", relationship: "Emergency Contact" },
        { name: "Best Friend", phone: "+919123456789", relationship: "Trusted Friend" }
    ];

    // --- UI FUNCTIONS ---
    const showPage = (pageId) => {
        document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById('page-' + pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            if (pageId === 'dashboard' && !map) {
                initMap();
            }
        }
        updateActiveNavLink(pageId);
        window.scrollTo(0, 0);
    };

    const updateActiveNavLink = (pageId) => {
        navLinks.forEach(link => {
            const isCurrent = link.getAttribute('data-page') === pageId;
            link.classList.toggle('active', isCurrent);
        });
    };
    
    const showToast = (message, type = 'info') => {
        const toast = document.getElementById('toast-notification');
        const messageEl = document.getElementById('toast-message');
        
        // Update toast styling based on type
        toast.className = `toast toast-${type}`;
        messageEl.textContent = message;
        
        // Show toast
        toast.classList.add('show');
        
        // Hide toast after 3 seconds
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // Form toggle functions
    const showLoginForm = () => {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('show-login').classList.add('active');
        document.getElementById('show-register').classList.remove('active');
    };

    const showRegisterForm = () => {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('show-login').classList.remove('active');
        document.getElementById('show-register').classList.add('active');
    };

    // --- MOBILE MENU ---
    const toggleMobileMenu = () => {
        mobileMenu.classList.toggle('active');
    };

    // Initialize the application
    const init = () => {
        // Show loading screen initially
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        const loadingStatus = document.querySelector('.loading-status');
        
        // Loading sequence
        const loadingSteps = [
            'Initializing...',
            'Loading maps...',
            'Setting up navigation...',
            'Preparing safety features...',
            'Almost ready...'
        ];
        
        let currentStep = 0;
        
        const updateLoadingStatus = () => {
            if (currentStep < loadingSteps.length) {
                loadingStatus.textContent = loadingSteps[currentStep];
                currentStep++;
            }
        };
        
        // Update status every 800ms
        const statusInterval = setInterval(updateLoadingStatus, 800);
        
        // Simulate loading time and hide loading screen
        setTimeout(() => {
            clearInterval(statusInterval);
            loadingStatus.textContent = 'Ready!';
            
            // Hide loading screen and show app
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                app.classList.remove('hidden');
                
                // Remove loading screen from DOM after transition
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            }, 500);
        }, 3000);
        
        // Initialize theme
        initTheme();
        
        // Initialize navigation
        initNavigation();
        
        // Initialize map
        initMap();
        
        // Initialize other features
        initEmergencyFeatures();
        initProfileFeatures();
        initReportsFeatures();
        
        // Initialize form functionality
        initForms();
        
        // Show home page by default
        showPage('home');
        
        // Set current year in footer
        document.getElementById('current-year').textContent = new Date().getFullYear();
    };

    // Initialize navigation functionality
    const initNavigation = () => {
        // Mobile menu events
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        closeMobileMenuBtn.addEventListener('click', toggleMobileMenu);
        
        // Navigation events
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = e.currentTarget.getAttribute('data-page');
                showPage(pageId);
                mobileMenu.classList.remove('active');
            });
        });
    };

    // Initialize emergency features
    const initEmergencyFeatures = () => {
        // Emergency events
        document.getElementById('emergency-btn').addEventListener('click', () => {
            document.getElementById('emergency-modal').classList.remove('hidden');
        });
        
        document.getElementById('close-emergency-modal').addEventListener('click', () => {
            document.getElementById('emergency-modal').classList.add('hidden');
            if (sirenAudio) {
                sirenAudio.pause();
                sirenAudio.currentTime = 0;
            }
        });
        
        document.getElementById('sos-btn').addEventListener('click', triggerSOS);
        document.getElementById('text-contacts-btn').addEventListener('click', textTrustedContacts);
        
        // Action buttons
        document.getElementById('share-btn').addEventListener('click', shareRoute);
        document.getElementById('report-btn').addEventListener('click', reportIncident);
        document.getElementById('locate-btn').addEventListener('click', locateUser);
        document.getElementById('start-nav-btn').addEventListener('click', startNavigation);
        document.getElementById('stop-nav-btn').addEventListener('click', stopNavigation);
        
        // Route finding
        document.getElementById('find-police-btn').addEventListener('click', () => findNearby('police'));
        document.getElementById('find-hospital-btn').addEventListener('click', () => findNearby('hospital'));
        
        // Route inputs
        ['start-location', 'end-location'].forEach(id => {
            document.getElementById(id).addEventListener('change', findRoute);
        });
        
        // Action hub events
        const actionsHub = document.getElementById('actions-hub');
        actionsHub.addEventListener('mouseenter', () => {
            actionsHub.querySelectorAll('.action-btn').forEach(btn => {
                if (btn.id === 'share-btn') {
                    btn.classList.add('active');
                }
                if (btn.id === 'report-btn') {
                    btn.classList.add('active');
                }
            });
        });
        
        actionsHub.addEventListener('mouseleave', () => {
            actionsHub.querySelectorAll('.action-btn').forEach(btn => {
                if (btn.id !== 'emergency-btn') {
                    btn.classList.remove('active');
                }
            });
        });
    };

    // Initialize profile features
    const initProfileFeatures = () => {
        document.getElementById('save-profile').addEventListener('click', () => {
            showToast('Profile saved successfully!', 'success');
        });
        
        document.getElementById('add-contact').addEventListener('click', addContact);
        document.getElementById('theme-switcher').addEventListener('click', handleThemeSwitch);
        
        // Initialize profile data
        renderContacts();
    };

    // Initialize reports features
    const initReportsFeatures = () => {
        renderReports();
    };

    // Initialize form functionality
    const initForms = () => {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            showToast('Successfully logged in!', 'success');
            setTimeout(() => showPage('dashboard'), 1000);
        });
        
        // Registration form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            
            if (!name || !email || !password || !confirmPassword) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }
            
            showToast('Account created successfully!', 'success');
            setTimeout(() => {
                // Switch back to login form
                showLoginForm();
                // Clear registration form
                document.getElementById('register-form').reset();
            }, 1000);
        });
        
        // Form toggle functionality
        document.getElementById('show-login').addEventListener('click', showLoginForm);
        document.getElementById('show-register').addEventListener('click', showRegisterForm);
        
        // Emergency access bypass
        document.getElementById('emergency-login').addEventListener('click', (e) => {
            e.preventDefault();
            
            // Show confirmation dialog
            if (confirm('⚠️ EMERGENCY ACCESS\n\nThis will bypass login security. Only use in genuine emergencies.\n\nAre you sure you want to continue?')) {
                showToast('Emergency access granted. Bypassing login...', 'warning');
                
                // Simulate emergency access process
                setTimeout(() => {
                    showToast('Emergency access successful!', 'success');
                    showPage('dashboard');
                }, 2000);
            }
        });
    };

    // --- LOCATION & PERMISSIONS ---
    const requestLocationPermission = () => {
        if ('geolocation' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    showToast('Location access granted', 'success');
                    startLocationTracking();
                } else if (result.state === 'prompt') {
                    showToast('Please allow location access for better navigation', 'info');
                } else {
                    showToast('Location access denied. Some features may be limited.', 'warning');
                }
            }).catch(() => {
                // Fallback for browsers that don't support permissions API
                showToast('Please allow location access when prompted', 'info');
            });
        } else {
            showToast('Geolocation not supported by this browser', 'warning');
        }
    };

    const startLocationTracking = () => {
        if (locationWatchId) return;
        
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
        };
        
        locationWatchId = navigator.geolocation.watchPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                    heading: position.coords.heading,
                    speed: position.coords.speed
                };
                
                // Update user location marker if map exists
                if (map && userLocationMarker) {
                    userLocationMarker.setLatLng([currentLocation.lat, currentLocation.lng]);
                }
                
                // Update start location input if it's empty
                const startInput = document.getElementById('start-location');
                if (startInput && startInput.value === '') {
                    startInput.value = 'My Current Location';
                    startCoords = { lat: currentLocation.lat, lon: currentLocation.lng };
                }
                
                // Show location accuracy info
                if (currentLocation.accuracy < 10) {
                    showToast(`High accuracy location: ±${Math.round(currentLocation.accuracy)}m`, 'success');
                } else if (currentLocation.accuracy < 50) {
                    showToast(`Good accuracy location: ±${Math.round(currentLocation.accuracy)}m`, 'info');
                } else {
                    showToast(`Low accuracy location: ±${Math.round(currentLocation.accuracy)}m`, 'warning');
                }
            },
            (error) => {
                console.error('Location error:', error);
                let errorMessage = 'Unable to get current location';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable in browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                    default:
                        errorMessage = 'Location error occurred.';
                }
                
                showToast(errorMessage, 'error');
            },
            options
        );
    };

    const stopLocationTracking = () => {
        if (locationWatchId) {
            navigator.geolocation.clearWatch(locationWatchId);
            locationWatchId = null;
        }
    };

    // --- MAP & LOCATION ---
    // Initialize map functionality
    const initMap = () => {
        if (map) map.remove();
        
        // Set default view to a central location
        const defaultLat = 16.7050;
        const defaultLng = 74.5822;
        
        map = L.map('map', { 
            zoomControl: false,
            attributionControl: false
        }).setView([defaultLat, defaultLng], 14);
        
        // Add tile layer with better styling
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        
        // Add custom zoom control
        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);
        
        // Add sample reports as markers
        sampleReports.forEach(report => {
            const marker = L.marker([report.lat, report.lng])
                .addTo(map)
                .bindPopup(createReportPopup(report));
            
            // Style markers based on severity
            if (report.severity === 'high') {
                marker.setIcon(L.divIcon({
                    className: 'custom-marker high-severity',
                    html: '⚠️',
                    iconSize: [30, 30]
                }));
            }
        });
        
        // Add user location marker if available
        if (userLocationMarker) {
            userLocationMarker.addTo(map);
        }
        
        // Add map click event for route planning
        map.on('click', onMapClick);
        
        // Add location accuracy circle if we have current location
        if (currentLocation) {
            addLocationAccuracyCircle();
        }
        
        // Request location permission on app start
        requestLocationPermission();
    };

    const addLocationAccuracyCircle = () => {
        if (!currentLocation || !map) return;
        
        // Remove existing accuracy circle
        if (window.accuracyCircle) {
            map.removeLayer(window.accuracyCircle);
        }
        
        // Add new accuracy circle
        window.accuracyCircle = L.circle([currentLocation.lat, currentLocation.lng], {
            radius: currentLocation.accuracy,
            color: '#2563eb',
            fillColor: '#2563eb',
            fillOpacity: 0.1,
            weight: 1
        }).addTo(map);
    };

    const createReportPopup = (report) => {
        const severityColors = {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444'
        };
        
        return `
            <div class="report-popup">
                <h3 style="color: ${severityColors[report.severity] || '#6b7280'}">${report.type}</h3>
                <p>${report.notes}</p>
                <div style="font-size: 0.8em; color: #6b7280; margin-top: 8px;">
                    ${report.anonymous ? 'Anonymous' : 'Verified User'} • ${new Date(report.createdAt).toLocaleDateString()}
                </div>
            </div>
        `;
    };

    const onMapClick = (e) => {
        const { lat, lng } = e.latlng;
        
        // If no start location is set, set it to clicked location
        if (!startCoords) {
            startCoords = { lat, lon: lng };
            document.getElementById('start-location').value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            showToast('Start location set to clicked point', 'info');
        }
        // If start location is set but no end location, set end location
        else if (!endCoords) {
            endCoords = { lat, lon: lng };
            document.getElementById('end-location').value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            showToast('Destination set to clicked point', 'info');
            
            // Automatically find route
            setTimeout(() => findRoute(), 500);
        }
    };

    const locateUser = () => {
        if (currentLocation) {
            // Use real location if available
            const latLng = [currentLocation.lat, currentLocation.lng];
            if (userLocationMarker) {
                userLocationMarker.setLatLng(latLng);
            } else {
                userLocationMarker = L.marker(latLng, { 
                    icon: L.divIcon({ 
                        className: 'user-location-marker' 
                    }) 
                }).addTo(map);
            }
            
            map.flyTo(latLng, 16);
            document.getElementById('start-location').value = "My Current Location";
            startCoords = { lat: currentLocation.lat, lon: currentLocation.lng };
            
            // Add or update accuracy circle
            addLocationAccuracyCircle();
            
            showToast(`Location updated: ±${Math.round(currentLocation.accuracy)}m accuracy`, 'success');
            
            if (document.getElementById('end-location').value.length > 2) {
                findRoute();
            }
        } else {
            // Try to get location first
            if ('geolocation' in navigator) {
                showToast('Getting your current location...', 'info');
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        currentLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: position.timestamp
                        };
                        
                        // Now locate user with the new location
                        locateUser();
                    },
                    (error) => {
                        // Fallback to simulated location
                        showToast("Using simulated location at Shivaji Chowk", 'warning');
                        const latLng = [16.7050, 74.5822];
                        if (userLocationMarker) {
                            userLocationMarker.setLatLng(latLng);
                        } else {
                            userLocationMarker = L.marker(latLng, { 
                                icon: L.divIcon({ 
                                    className: 'user-location-marker' 
                                }) 
                            }).addTo(map);
                        }
                        map.flyTo(latLng, 16);
                        document.getElementById('start-location').value = "My Current Location";
                        startCoords = { lat: latLng[0], lon: latLng[1] };
                        
                        if (document.getElementById('end-location').value.length > 2) {
                            findRoute();
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 30000
                    }
                );
            } else {
                // Fallback to simulated location
                showToast("Using simulated location at Shivaji Chowk", 'warning');
                const latLng = [16.7050, 74.5822];
                if (userLocationMarker) {
                    userLocationMarker.setLatLng(latLng);
                } else {
                    userLocationMarker = L.marker(latLng, { 
                        icon: L.divIcon({ 
                            className: 'user-location-marker' 
                        }) 
                    }).addTo(map);
                }
                map.flyTo(latLng, 16);
                document.getElementById('start-location').value = "My Current Location";
                startCoords = { lat: latLng[0], lon: latLng[1] };
                
                if (document.getElementById('end-location').value.length > 2) {
                    findRoute();
                }
            }
        }
    };

    // --- ROUTING & NAVIGATION ---
    const findRoute = async () => {
        stopNavigation();
        
        const startQuery = document.getElementById('start-location').value;
        const endQuery = document.getElementById('end-location').value;
        
        // Clear existing routes
        activeRouteLayers.forEach(layer => map.removeLayer(layer));
        activeRouteLayers = [];
        routeData = [];
        
        document.getElementById('navigation-controls').classList.add('hidden');
        updateSafetyUI('--');
        document.getElementById('route-options-container').innerHTML = '';

        if (startQuery.length < 2 || endQuery.length < 2) return;
        
        updateSafetyUI('...', '#9ca3af', true);
        showToast('Finding route...', 'info');
        
        try {
            // Get coordinates
            if (startQuery === "My Current Location" && startCoords) {
                // Use existing start coordinates
            } else {
                startCoords = await geocode(startQuery);
            }
            
            if (endQuery.startsWith("Nearest") && endCoords) {
                // Use existing end coordinates
            } else {
                endCoords = await geocode(endQuery);
            }

            if (!startCoords || !endCoords) {
                throw new Error("Could not find one or both locations.");
            }
            
            // Create routing control
            const routingControl = L.routing.control({
                waypoints: [
                    L.latLng(startCoords.lat, startCoords.lon),
                    L.latLng(endCoords.lat, endCoords.lon)
                ],
                show: false,
                addWaypoints: false,
                routeWhileDragging: false,
                showAlternatives: true,
                lineOptions: {
                    styles: [
                        { color: '#2563eb', opacity: 0.8, weight: 6 },
                        { color: '#6b7280', opacity: 0.6, weight: 4 }
                    ]
                }
            });
            
            routingControl.on('routesfound', function(e) {
                routeData = e.routes.map((route, index) => {
                    const score = calculateSafetyScore(route.summary.totalDistance / 1000, index);
                    return {
                        route,
                        score,
                        color: getSafetyColor(score),
                        polyline: L.polyline(route.coordinates, {
                            color: index === 0 ? getSafetyColor(score) : '#a1a1aa',
                            weight: index === 0 ? 7 : 5,
                            opacity: index === 0 ? 1 : 0.7
                        })
                    };
                });
                
                // Sort by safety score
                routeData.sort((a, b) => b.score - a.score);
                
                // Add routes to map
                routeData.forEach((data, i) => {
                    data.polyline.addTo(map);
                    activeRouteLayers.push(data.polyline);
                });
                
                // Select safest route by default
                selectRoute(0);
                renderRouteOptions();
                document.getElementById('navigation-controls').classList.remove('hidden');
                
                showToast(`Found ${routeData.length} route(s)`, 'success');
            });
            
            routingControl.on('routingerror', (error) => {
                showToast('Could not find a route. Please check your locations.', 'error');
                updateSafetyUI('--');
            });
            
            routingControl.addTo(map);
            
        } catch (error) {
            showToast(error.message, 'error');
            updateSafetyUI('--');
        }
    };

    const findNearby = async (type) => {
        if (!startCoords) {
            showToast("Please set your start location first using 'Locate Me'.", 'warning');
            return;
        }
        
        try {
            showToast(`Searching for nearest ${type}...`, 'info');
            
            // Use multiple search attempts with decreasing radius to find truly nearby places
            const searchQuery = type === 'police' ? 'police station' : 'hospital';
            const searchRadii = [1000, 2000, 5000, 10000]; // Start with 1km, then 2km, 5km, 10km
            
            let foundPlace = null;
            let searchRadius = 0;
            
            // Try to find places with decreasing radius
            for (const radius of searchRadii) {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&lat=${startCoords.lat}&lon=${startCoords.lon}&radius=${radius}&limit=5&addressdetails=1`
                );
                
                const data = await response.json();
                
                if (data && data.length > 0) {
                    // Filter and sort by distance to find the closest one
                    const placesWithDistance = data.map(place => ({
                        ...place,
                        distance: calculateDistance(startCoords.lat, startCoords.lon, parseFloat(place.lat), parseFloat(place.lon))
                    })).sort((a, b) => a.distance - b.distance);
                    
                    // Get the closest place within reasonable distance
                    const closestPlace = placesWithDistance[0];
                    
                    // Only accept if it's within the current search radius
                    if (closestPlace.distance <= radius / 1000) { // Convert radius to km
                        foundPlace = closestPlace;
                        searchRadius = radius;
                        break;
                    }
                }
            }
            
            if (foundPlace) {
                const placeName = foundPlace.display_name.split(',')[0]; // Get first part of address
                const distance = foundPlace.distance;
                
                document.getElementById('end-location').value = `Nearest ${type === 'police' ? 'Police Station' : 'Hospital'}: ${placeName}`;
                endCoords = { 
                    lat: parseFloat(foundPlace.lat), 
                    lon: parseFloat(foundPlace.lon) 
                };
                
                // Add marker for the nearby place
                const marker = L.marker([endCoords.lat, endCoords.lon])
                    .addTo(map)
                    .bindPopup(`
                        <div class="nearby-place-popup">
                            <h3>${type === 'police' ? '🚔' : '🏥'} ${type === 'police' ? 'Police Station' : 'Hospital'}</h3>
                            <p><strong>${placeName}</strong></p>
                            <p class="address">${foundPlace.display_name.split(',').slice(0, 3).join(', ')}</p>
                            <p class="distance">Distance: ${distance.toFixed(1)} km</p>
                            <p class="search-radius">Found within ${searchRadius / 1000} km radius</p>
                        </div>
                    `)
                    .openPopup();
                
                // Fit map to show both start and end points with appropriate zoom
                const bounds = L.latLngBounds([startCoords.lat, startCoords.lon], [endCoords.lat, endCoords.lon]);
                map.fitBounds(bounds, { padding: [50, 50] });
                
                findRoute();
                showToast(`Found nearest ${type}: ${placeName} (${distance.toFixed(1)} km away)`, 'success');
            } else {
                // If no nearby places found, try a broader search but prioritize closer results
                showToast(`No ${type} found nearby. Searching in broader area...`, 'info');
                
                const fallbackResponse = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=10`
                );
                
                const fallbackData = await fallbackResponse.json();
                
                if (fallbackData && fallbackData.length > 0) {
                    // Calculate distances and find the closest one
                    const placesWithDistance = fallbackData.map(place => ({
                        ...place,
                        distance: calculateDistance(startCoords.lat, startCoords.lon, parseFloat(place.lat), parseFloat(place.lon))
                    })).sort((a, b) => a.distance - b.distance);
                    
                    const closestPlace = placesWithDistance[0];
                    const placeName = closestPlace.display_name.split(',')[0];
                    const distance = closestPlace.distance;
                    
                    // Only show if it's reasonably close (within 50km)
                    if (distance <= 50) {
                        document.getElementById('end-location').value = `Closest ${type === 'police' ? 'Police Station' : 'Hospital'}: ${placeName}`;
                        endCoords = { 
                            lat: parseFloat(closestPlace.lat), 
                            lon: parseFloat(closestPlace.lon) 
                        };
                        
                        // Add marker for the place
                        const marker = L.marker([endCoords.lat, endCoords.lon])
                            .addTo(map)
                            .bindPopup(`
                                <div class="nearby-place-popup">
                                    <h3>${type === 'police' ? '🚔' : '🏥'} ${type === 'police' ? 'Police Station' : 'Hospital'}</h3>
                                    <p><strong>${placeName}</strong></p>
                                    <p class="address">${closestPlace.display_name.split(',').slice(0, 3).join(', ')}</p>
                                    <p class="distance">Distance: ${distance.toFixed(1)} km</p>
                                    <p class="search-radius">Closest available in area</p>
                                </div>
                            `)
                            .openPopup();
                        
                        // Fit map to show both start and end points
                        const bounds = L.latLngBounds([startCoords.lat, startCoords.lon], [endCoords.lat, endCoords.lon]);
                        map.fitBounds(bounds, { padding: [50, 50] });
                        
                        findRoute();
                        showToast(`Found ${type} (closest available): ${placeName} (${distance.toFixed(1)} km away)`, 'warning');
                    } else {
                        showToast(`No ${type} found within reasonable distance. Please try a different location.`, 'error');
                    }
                } else {
                    showToast(`No ${type} found. Please try a different location.`, 'error');
                }
            }
        } catch (error) {
            console.error('Error finding nearby places:', error);
            showToast(`Error finding nearby ${type}. Please try again.`, 'error');
        }
    };

    // Helper function to calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };
    
    const renderRouteOptions = () => {
        const container = document.getElementById('route-options-container');
        container.innerHTML = routeData.map((data, index) => 
            `<button class="route-option ${index === 0 ? 'active' : ''}" data-index="${index}">
                ${index === 0 ? "Safest" : `Alt ${index}`}
            </button>`
        ).join('');
        
        container.querySelectorAll('.route-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                selectRoute(parseInt(e.currentTarget.dataset.index));
            });
        });
    };
    
    const selectRoute = (selectedIndex) => {
        routeData.forEach((data, index) => {
            const isSelected = index === selectedIndex;
            data.polyline.setStyle({
                color: isSelected ? data.color : '#a1a1aa',
                weight: isSelected ? 7 : 5,
                opacity: isSelected ? 1 : 0.7
            });
            if (isSelected) {
                data.polyline.bringToFront();
            }
        });
        
        updateSafetyUI(routeData[selectedIndex].score, routeData[selectedIndex].color);
        document.querySelectorAll('.route-option').forEach((btn, index) => {
            btn.classList.toggle('active', index === selectedIndex);
        });
    };
    
    const startNavigation = () => {
        if (isNavigating) return;
        if (routeData.length === 0) {
            showToast("Please plan a route first.", 'warning');
            return;
        }
        
        isNavigating = true;
        document.getElementById('route-planning-ui').style.display = 'none';
        document.getElementById('safety-score-container').style.display = 'none';
        document.getElementById('navigation-panel').classList.add('active');

        const selectedRouteData = routeData.find((r, i) => 
            document.querySelector(`.route-option.active[data-index="${i}"]`)
        ) || routeData[0];
        
        const route = selectedRouteData.route;
        
        // Update navigation panel
        document.getElementById('nav-summary-time').textContent = route.summary.totalTime ? 
            `${Math.round(route.summary.totalTime / 60)} min` : '';
        document.getElementById('nav-summary-distance').textContent = route.summary.totalDistance ? 
            `${(route.summary.totalDistance / 1000).toFixed(1)} km` : '';

        let segmentIndex = 0;
        if (!userLocationMarker) {
            locateUser();
        }
        
        userLocationMarker.setLatLng(route.coordinates[0]);
        
        const animate = () => {
            if (!isNavigating) return;
            
            const start = route.coordinates[segmentIndex];
            const end = route.coordinates[segmentIndex + 1];
            
            if (!start || !end) {
                stopNavigation();
                showToast("You have arrived at your destination!", 'success');
                return;
            }
            
            const duration = (map.distance(start, end) / 15) * 1000;
            let startTime = Date.now();

            function step() {
                if (!isNavigating) return;
                
                let t = Math.min(1, (Date.now() - startTime) / duration);
                const lat = start.lat + (end.lat - start.lat) * t;
                const lng = start.lng + (end.lng - start.lng) * t;
                
                userLocationMarker.setLatLng([lat, lng]);
                map.panTo([lat, lng]);
                
                // Update navigation instructions
                const instruction = route.instructions.find(instr => instr.index >= segmentIndex);
                if (instruction) {
                    const distToNext = map.distance([lat, lng], route.coordinates[instruction.index]);
                    document.getElementById('nav-instruction').textContent = instruction.text;
                    document.getElementById('nav-icon').innerHTML = getManeuverIcon(instruction.type);
                    document.getElementById('nav-distance').textContent = `In ${Math.round(distToNext)} m`;
                }

                if (t < 1) {
                    navAnimationId = requestAnimationFrame(step);
                } else {
                    segmentIndex++;
                    navAnimationId = requestAnimationFrame(animate);
                }
            }
            
            navAnimationId = requestAnimationFrame(step);
        };
        
        animate();
        showToast('Navigation started!', 'success');
    };

    const stopNavigation = () => {
        if (!isNavigating) return;
        
        isNavigating = false;
        cancelAnimationFrame(navAnimationId);
        navAnimationId = null;
        
        document.getElementById('navigation-panel').classList.remove('active');
        document.getElementById('route-planning-ui').style.display = 'block';
        
        if (routeData.length > 0) {
            document.getElementById('safety-score-container').style.display = 'flex';
        }
        
        showToast('Navigation stopped', 'info');
    };

    // --- UTILITIES & HELPERS ---
    const getManeuverIcon = (type) => {
        const icons = {
            'Left': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16l-4-4 4-4"/><path d="M20 20v-8a4 4 0 0 0-4-4H4"/></svg>',
            'Right': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 16l4-4-4-4"/><path d="M4 20v-8a4 4 0 0 1 4-4h12"/></svg>',
            'Straight': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V2"/><path d="m19 9-7-7-7 7"/></svg>',
            'Destination': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>'
        };
        
        for (const key in icons) {
            if (type.toLowerCase().includes(key.toLowerCase())) {
                return icons[key];
            }
        }
        return icons['Straight'];
    };

    const geocode = async (query) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`
            );
            const data = await response.json();
            
            if (data && data[0]) {
                return { 
                    lat: parseFloat(data[0].lat), 
                    lon: parseFloat(data[0].lon) 
                };
            }
            return null;
        } catch (error) {
            console.error("Geocoding error:", error);
            return null;
        }
    };

    const calculateSafetyScore = (distanceInKm, index) => {
        // Base score calculation with more realistic factors
        let baseScore = 100;
        
        // Distance factor (longer routes get lower scores)
        baseScore -= distanceInKm * 2;
        
        // Alternative route factor (first route gets bonus)
        baseScore -= index * 3;
        
        // Random factor for realistic variation
        baseScore -= Math.random() * 10;
        
        // Ensure score is within bounds
        return Math.round(Math.max(20, Math.min(99, baseScore)));
    };
    
    const getSafetyColor = (score) => {
        if (score >= 70) return '#10b981'; // Green
        if (score >= 40) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };
    
    const updateSafetyUI = (score, color, isLoading = false) => {
        const container = document.getElementById('safety-score-container');
        const scoreEl = document.getElementById('safety-score');
        const indicator = document.getElementById('safety-indicator');
        
        if (score === '--') {
            container.classList.add('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        scoreEl.textContent = isLoading ? '...' : score;
        indicator.style.backgroundColor = color;
    };
    
    // --- ACTION FUNCTIONS ---
    const shareRoute = () => {
        if (startCoords && endCoords) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${startCoords.lat},${startCoords.lon}&destination=${endCoords.lat},${endCoords.lon}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'My SafeRoute',
                    text: 'I\'m sharing my route via SafeRoute Navigator',
                    url: url
                });
            } else {
                // Fallback for browsers without Web Share API
                navigator.clipboard.writeText(url).then(() => {
                    showToast('Route link copied to clipboard!', 'success');
                });
            }
        } else {
            showToast("Please plan a route first to share it.", 'warning');
        }
    };

    const triggerSOS = (e) => {
        e.preventDefault();
        playSirenSound();
        textTrustedContacts(e, true);
        showToast('SOS triggered! Emergency contacts notified.', 'error');
    };

    const playSirenSound = () => {
        if (!sirenAudio) {
            // Create a simple siren sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1);
        }
    };

    const textTrustedContacts = (e, isSOS = false) => {
        e.preventDefault();
        
        if (trustedContacts.length === 0) {
            showToast("No trusted contacts. Add them in your profile.", 'warning');
            return;
        }
        
        if (!startCoords && !currentLocation) {
            showToast("Location not available. Use 'Locate Me'.", 'warning');
            return;
        }
        
        const location = currentLocation || startCoords;
        const numbers = trustedContacts.map(c => c.phone);
        
        if (isSOS) {
            numbers.push('100'); // Add police number for SOS
        }
        
        const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
        const message = isSOS ? 
            `🚨 EMERGENCY SOS! I need help immediately. My current location is: ${mapLink}` :
            `📍 I'm sharing my location via SafeRoute: ${mapLink}`;
        
        // Try to open SMS app
        if ('sms' in navigator) {
            navigator.sms.send(numbers.join(','), message);
        } else {
            // Fallback for browsers without SMS API
            window.open(`sms:${numbers.join(',')}?body=${encodeURIComponent(message)}`);
        }
        
        showToast("Opening messaging app to alert contacts...", 'info');
    };

    const reportIncident = () => {
        if (!startCoords && !currentLocation) {
            showToast("Please set a starting location to report an incident.", 'warning');
            return;
        }
        
        const location = currentLocation || startCoords;
        const newReport = {
            id: Date.now(),
            type: "Suspicious Activity",
            notes: "User reported from dashboard.",
            lat: location.lat,
            lng: location.lng,
            anonymous: true,
            createdAt: new Date().toISOString(),
            severity: "medium"
        };
        
        sampleReports.push(newReport);
        
        // Add marker to map
        const marker = L.marker([newReport.lat, newReport.lng])
            .addTo(map)
            .bindPopup(createReportPopup(newReport))
            .openPopup();
        
        renderReports();
        showToast("Incident reported at your location. Thank you!", 'success');
    };

    // --- PROFILE & REPORTS PAGES ---
    const renderReports = () => {
        const reportsList = document.getElementById('reports-list');
        if (!reportsList) return;
        
        reportsList.innerHTML = sampleReports.map(r => `
            <div class="report-item">
                <div class="report-header">
                    <div class="report-content">
                        <h3>${r.type}</h3>
                        <p>${r.notes}</p>
                        <div class="report-meta">
                            ${r.anonymous ? 'Anonymous' : 'Verified User'} • ${new Date(r.createdAt).toLocaleString()}
                        </div>
                    </div>
                    <a href="#" onclick="showToast('Viewing report on map...', 'info'); return false;" class="report-link">
                        View on Map
                    </a>
                </div>
            </div>
        `).join('');
    };

    const renderContacts = () => {
        const contactsList = document.getElementById('contacts-list');
        if (!contactsList) return;
        
        contactsList.innerHTML = trustedContacts.map((c, i) => `
            <div class="contact-item">
                <input placeholder="Name" value="${c.name}" class="form-input" />
                <input placeholder="Phone" value="${c.phone}" class="form-input" />
                <div class="contact-actions">
                    <button class="btn btn-outline" onclick="showToast('Phone number copied!', 'success')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                    <button data-index="${i}" class="remove-contact-btn btn" style="background-color: #ef4444; color: white;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-contact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                trustedContacts.splice(index, 1);
                renderContacts();
                showToast('Contact removed', 'info');
            });
        });
    };
    
    const addContact = () => {
        trustedContacts.push({ name: '', phone: '', relationship: 'New Contact' });
        renderContacts();
        showToast('New contact field added', 'info');
    };

    // --- THEME SWITCHER ---
    const handleThemeSwitch = (e) => {
        if (e.target.classList.contains('theme-btn')) {
            applyTheme(e.target.getAttribute('data-theme'));
        }
    };
    
    const applyTheme = (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
        updateThemeUI();
        
        // Reinitialize map with new theme
        if (map) {
            initMap();
        }
    };
    
    const updateThemeUI = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const isSelected = btn.getAttribute('data-theme') === savedTheme;
            btn.classList.toggle('active', isSelected);
        });
    };
    
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
    };

    // --- CLEANUP ---
    const cleanup = () => {
        stopLocationTracking();
        if (locationWatchId) {
            navigator.geolocation.clearWatch(locationWatchId);
        }
        if (sirenAudio) {
            sirenAudio.pause();
            sirenAudio = null;
        }
    };

    // Add cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // --- START THE APP ---
    init();
});
