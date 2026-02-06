// ============================================================================
// CONFIGURATION
// ============================================================================
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================================================
// DRESS DATA - Updated to pull from backend
// ============================================================================
let allDresses = [];

async function loadDresses() {
    const cacheKey = 'dressesCache_v1';
    const cacheTTL = 1000 * 60 * 5; // 5 minutes
    try {
        // show spinner if present
        const loader = document.getElementById('gallery-loading');
        if (loader) loader.setAttribute('aria-hidden', 'false');

        // Try cache first
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.ts < cacheTTL) {
                allDresses = parsed.data;
                console.log('Dresses loaded from cache:', allDresses);
                if (loader) loader.setAttribute('aria-hidden', 'true');
                return;
            }
        }

        const response = await fetch(`${API_BASE_URL}/dresses`);
        if (!response.ok) throw new Error('Failed to fetch dresses');
        allDresses = await response.json();
        // cache result
        try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: allDresses })); } catch(e) { /* ignore storage errors */ }
        console.log('Dresses loaded from backend:', allDresses);
    } catch (error) {
        console.error('Error loading dresses:', error);
        // Fallback to client-side data
        allDresses = getDefaultDresses();
    } finally {
        const loader = document.getElementById('gallery-loading');
        if (loader) loader.setAttribute('aria-hidden', 'true');
    }
}

function getDefaultDresses() {
    return [
        {
            id: 1,
            name: "Elegant Wedding Dress",
            price: 299,
            type: "wedding",
            sizes: ["xs", "s", "m", "l", "xl"],
            colour: "white",
            image: "fbdscoleyharrop-209.jpg"
        },
        {
            id: 2,
            name: "Casual Summer Dress",
            price: 149,
            type: "casual",
            sizes: ["s", "m", "l"],
            colour: "blue",
            image: "fbdscoleyharrop-205.jpg"
        },
        {
            id: 3,
            name: "Evening Gown",
            price: 399,
            type: "evening",
            sizes: ["xs", "s", "m", "l"],
            colour: "black",
            image: "fbdscoleyharrop-100.jpg"
        },
        {
            id: 4,
            name: "Cocktail Dress",
            price: 199,
            type: "cocktail",
            sizes: ["xs", "s", "m", "l"],
            colour: "red",
            image: "fbdscoleyharrop-213.jpg"
        },
        {
            id: 5,
            name: "Party Dress",
            price: 179,
            type: "party",
            sizes: ["s", "m", "l", "xl"],
            colour: "gold",
            image: "fbdscoleyharrop-245.jpg"
        },
        {
            id: 6,
            name: "Prom Dress",
            price: 349,
            type: "prom",
            sizes: ["xs", "s", "m"],
            colour: "blue",
            image: "fbdscoleyharrop-253.jpg"
        }
    ];
}

// ============================================================================
// GALLERY FILTERING
// ============================================================================
function initializeGalleryFilters() {
    const typeFilter = document.getElementById("type-filter");
    const sizeFilter = document.getElementById("size-filter");
    const colourFilter = document.getElementById("colour-filter");
    const resetBtn = document.getElementById("reset-filters");

    if (!typeFilter) return; // Not on gallery page

    // Add event listeners
    typeFilter?.addEventListener("change", filterGallery);
    sizeFilter?.addEventListener("change", filterGallery);
    colourFilter?.addEventListener("change", filterGallery);
    resetBtn?.addEventListener("click", resetFilters);

    // Initial display
    displayDresses(allDresses);
}

function filterGallery() {
    const typeFilter = document.getElementById("type-filter")?.value || "";
    const sizeFilter = document.getElementById("size-filter")?.value || "";
    const colourFilter = document.getElementById("colour-filter")?.value || "";

    const filtered = allDresses.filter(dress => {
        const typeMatch = !typeFilter || dress.type === typeFilter;
        const sizeMatch = !sizeFilter || dress.sizes.includes(sizeFilter);
        const colourMatch = !colourFilter || dress.colour === colourFilter;

        return typeMatch && sizeMatch && colourMatch;
    });

    displayDresses(filtered);
}

function resetFilters() {
    document.getElementById("type-filter").value = "";
    document.getElementById("size-filter").value = "";
    document.getElementById("colour-filter").value = "";
    displayDresses(allDresses);
}

function displayDresses(dresses) {
    const galleryGrid = document.getElementById("gallery-grid");
    if (!galleryGrid) return;

    // build with a fragment to reduce reflows
    const fragment = document.createDocumentFragment();

    if (dresses.length === 0) {
        galleryGrid.innerHTML = "<p class='no-results'>No dresses match your filters. Try adjusting your selection.</p>";
        return;
    }

    dresses.forEach(dress => {
        const item = document.createElement("div");
        item.className = "gallery-item";

        const img = document.createElement('img');
        img.src = dress.image;
        img.alt = dress.name;
        img.loading = 'lazy';
        img.decoding = 'async';

        const title = document.createElement('p');
        title.textContent = dress.name;

        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = `$${dress.price}`;

        item.appendChild(img);
        item.appendChild(title);
        item.appendChild(price);

        fragment.appendChild(item);
    });

    // replace content in one operation
    galleryGrid.innerHTML = '';
    galleryGrid.appendChild(fragment);
}

// ============================================================================
// BOOKING SYSTEM
// ============================================================================
function initializeBookingSystem() {
    const bookingForm = document.getElementById("booking-form");
    if (!bookingForm) return; // Not on contact page

    const timeSlots = document.querySelectorAll(".time-slot-btn");
    const selectedTimeInput = document.getElementById("selected-time");

    // Handle time slot selection
    timeSlots.forEach(slot => {
        slot.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Remove active class from all slots
            timeSlots.forEach(s => s.classList.remove("active"));
            
            // Add active class to selected slot
            slot.classList.add("active");
            
            // Store selected time
            selectedTimeInput.value = slot.dataset.time;
        });
    });

    // Handle booking form submission
    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!selectedTimeInput.value) {
            alert("Please select a time slot");
            return;
        }

        const bookingData = {
            name: document.getElementById("booking-name").value,
            email: document.getElementById("booking-email").value,
            phone: document.getElementById("booking-phone").value,
            date: document.getElementById("booking-date").value,
            time: selectedTimeInput.value,
            message: document.getElementById("booking-message").value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit booking');
            }

            const result = await response.json();

            // Show confirmation
            alert(`Booking request submitted!\n\nName: ${bookingData.name}\nDate: ${bookingData.date}\nTime: ${bookingData.time}\n\nA confirmation email has been sent to ${bookingData.email}`);
            
            // Reset form
            bookingForm.reset();
            selectedTimeInput.value = "";
            timeSlots.forEach(s => s.classList.remove("active"));

            console.log("Booking submitted successfully:", result);
        } catch (error) {
            console.error('Booking error:', error);
            alert('Error submitting booking. Please try again.');
        }
    });
}

// ============================================================================
// CONTACT FORM
// ============================================================================
function initializeContactForm() {
    const contactForm = document.getElementById("contact-form");
    if (!contactForm) return;

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const contactData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value || "",
            message: document.getElementById("message").value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit contact form');
            }

            const result = await response.json();

            // Show confirmation
            alert(`Thank you for contacting us, ${contactData.name}!\n\nWe've received your message and will get back to you soon.\n\nConfirmation sent to: ${contactData.email}`);

            // Reset form
            contactForm.reset();

            console.log("Contact form submitted successfully:", result);
        } catch (error) {
            console.error('Contact form error:', error);
            alert('Error submitting message. Please try again.');
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
    // Load dresses from backend first
    await loadDresses();
    
    // Initialize all systems
    initializeGalleryFilters();
    initializeBookingSystem();
    initializeContactForm();

    console.log('App initialized successfully');
});
