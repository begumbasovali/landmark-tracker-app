// Initialize map - this will now be done lazily using a function
let map = null;
let selectedLocation = null;
let markers = [];
let currentLandmark = null;
let locationMarker = null;
let mapInitialized = false;

// Initialize Bootstrap components
const landmarkModal = new bootstrap.Modal(
  document.getElementById("landmarkModal")
);
const visitModal = new bootstrap.Modal(document.getElementById("visitModal"));
const visitDetailsModal = new bootstrap.Modal(
  document.getElementById("visitDetailsModal")
);
const planModal = new bootstrap.Modal(document.getElementById("planModal"));
const planDetailsModal = new bootstrap.Modal(
  document.getElementById("planDetailsModal")
);
const successToast = new bootstrap.Toast(
  document.getElementById("successToast")
);

// Function to initialize map (called only once)
function initMap() {
  if (mapInitialized) return;

  console.log("Initializing map...");
  map = L.map("map").setView([39, 35], 6); // Centered on Turkey

  // Use a faster tile server and preload nearby tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    keepBuffer: 4, // Keep more tiles in memory
    updateWhenIdle: true, // Update tiles only when user stops moving
  }).addTo(map);

  // Map click handler to select location
  map.on("click", function (e) {
    selectedLocation = e.latlng;

    // Remove previous location marker if exists
    if (locationMarker) {
      map.removeLayer(locationMarker);
    }

    // Add new location marker
    locationMarker = L.marker(e.latlng, {
      icon: L.divIcon({
        className: "location-marker",
        html: '<div class="location-marker-inner"></div>',
        iconSize: [20, 20],
      }),
    }).addTo(map);

    document.getElementById("selectedLocation").style.display = "block";
    document.getElementById(
      "locationDetails"
    ).textContent = `Latitude: ${e.latlng.lat.toFixed(
      6
    )}, Longitude: ${e.latlng.lng.toFixed(6)}`;
  });

  mapInitialized = true;
}

// Check login status when page loads
document.addEventListener("DOMContentLoaded", async function () {
  // Initialize Bootstrap components
  initBootstrapComponents();

  // Check if user is logged in
  checkAuthStatus();

  // Setup auth form event listeners
  setupAuthForms();
});

// Initialize Bootstrap components
function initBootstrapComponents() {
  // Initialize star rating when the page loads
  initializeStarRating();
}

// Check authentication status
async function checkAuthStatus() {
  if (AuthService.isAuthenticated()) {
    try {
      // Get user info
      const user = await ApiService.getUserInfo();
      showApp(user);
    } catch (error) {
      console.error("Authentication validation failed:", error);
      showAuth();
    }
  } else {
    showAuth();
  }
}

// Setup auth form event listeners
function setupAuthForms() {
  // Login form
  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!username || !password) {
        showLoginError("Please fill in all fields");
        return;
      }

      try {
        // Try to login
        await ApiService.login({
          username,
          password,
        });

        // Get user info
        const user = await ApiService.getUserInfo();
        showApp(user);
      } catch (error) {
        console.error("Login error:", error);
        showLoginError(
          error.message || "Login failed. Please check your credentials."
        );
      }
    });

  // Register form
  document
    .getElementById("registerForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const username = document.getElementById("registerUsername").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;

      if (!username || !email || !password) {
        showRegisterError("Please fill in all fields");
        return;
      }

      if (password.length < 6) {
        showRegisterError("Password must be at least 6 characters long");
        return;
      }

      try {
        // Try to register
        await ApiService.register({
          username,
          email,
          password,
        });

        // Get user info
        const user = await ApiService.getUserInfo();
        showApp(user);
      } catch (error) {
        console.error("Registration error:", error);
        showRegisterError(
          error.message || "Registration failed. Please try again."
        );
      }
    });

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", function () {
    ApiService.logout();
    showAuth();
  });
}

// Show login error
function showLoginError(message) {
  const errorElement = document.getElementById("loginError");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Show register error
function showRegisterError(message) {
  const errorElement = document.getElementById("registerError");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Show auth container
function showAuth() {
  document.getElementById("authContainer").style.display = "block";
  document.getElementById("appContainer").style.display = "none";
}

// Show app container
function showApp(user) {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("appContainer").style.display = "block";

  // Display username in the header
  document.getElementById("usernameDisplay").textContent = user.username;

  // Show welcome notification
  showTopWelcomeNotification(user.username);

  // Initialize the app
  initializeApp();
}

// Show welcome notification at the top
function showTopWelcomeNotification(username) {
  const welcomePopup = document.getElementById("welcomePopup");
  const welcomeUsername = document.getElementById("welcomeUsername");

  if (!welcomePopup || !welcomeUsername) {
    console.warn("Welcome notification elements not found");
    return; // Elementler bulunamazsa fonksiyondan çık
  }

  // Set username in welcome message
  welcomeUsername.textContent = username;

  // Show the notification with animation
  welcomePopup.classList.add("show");

  // Notification will auto-hide via CSS animation
}

// Initialize app data
function initializeApp() {
  // Initialize map
  if (!map) {
    initMap();
  }

  // Load data
  loadLandmarks();
  loadVisitedLandmarks();

  // Initialize search and filter functionality
  initSearchAndFilter();
}

// Add auth header to fetch calls
async function fetchWithAuth(url, options = {}) {
  // Get authentication token
  const token = AuthService.getToken();
  
  // Set headers for the request
  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json"
  };
  
  // Only add auth token if it exists
  if (token) {
    headers["x-auth-token"] = token;
    
    // Debug log - only show part of token if it exists
    console.log(`API request: ${url}`, {
      headers: headers,
      token: token.substring(0, 15) + "..." // Only truncate if token exists
    });
  } else {
    console.log(`API request without auth token: ${url}`);
    // If no token, show auth container since user is not logged in
    showAuth();
    throw new Error("Authentication required. Please log in.");
  }

  // Make the API request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, redirect to login
  if (response.status === 401) {
    AuthService.removeToken();
    showAuth();
    throw new Error("Authentication expired. Please log in again.");
  }

  return response;
}

// Initialize search and filter functionality
function initSearchAndFilter() {
  const searchInput = document.getElementById("searchLandmark");
  const searchIcon = document.querySelector(".fa-search");
  const searchButton = document.getElementById("searchButton");
  const categoryFilter = document.getElementById("categoryFilter");

  // Initialize stored landmarks for searching
  let storedLandmarks = [];

  // Initialize current filters
  let currentSearchTerm = "";
  let currentCategory = "all";

  // Function to fetch and store all landmarks
  async function fetchLandmarksForSearch() {
    try {
      const response = await fetchWithAuth(
        window.appConfig.endpoints.landmarks
      );
      if (!response.ok) throw new Error("Failed to load landmarks");
      storedLandmarks = await response.json();
    } catch (error) {
      console.error("Error loading landmarks for search:", error);
    }
  }

  // Initial load of landmarks
  fetchLandmarksForSearch();

  // Filter landmarks based on search term and category
  function filterLandmarks() {
    const searchTerm = currentSearchTerm.toLowerCase();
    const category = currentCategory;

    // First filter the landmarks
    const filteredLandmarks = storedLandmarks.filter((landmark) => {
      // Name and description search
      const nameMatch = landmark.name.toLowerCase().includes(searchTerm);
      const descriptionMatch =
        landmark.description &&
        landmark.description.toLowerCase().includes(searchTerm);

      // Category filter
      let categoryMatch = true; // Varsayılan olarak tümünü göster
      if (category !== "all") {
        // Kategori filtresi varsa kontrol et
        categoryMatch = landmark.category === category;
      }

      // Return true if both search term and category match
      return (nameMatch || descriptionMatch) && categoryMatch;
    });

    // Display the filtered landmarks
    const landmarkList = document.getElementById("landmarkList");
    landmarkList.innerHTML = "";

    if (filteredLandmarks.length === 0) {
      landmarkList.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>Aramanıza uygun landmark bulunamadı.</p>
        </div>
      `;
      return;
    }

    // Add the filtered landmarks to the list
    filteredLandmarks.forEach((landmark) => {
      addLandmarkToList(landmark);
    });

    // Update markers on the map
    updateMapMarkers(filteredLandmarks);
  }

  // Update markers on the map based on filtered landmarks
  function updateMapMarkers(filteredLandmarks) {
    // Remove all existing markers
    markers.forEach((marker) => map.removeLayer(marker.marker));
    markers = [];

    // Add filtered landmarks to the map
    filteredLandmarks.forEach((landmark) => {
      addMarkerToMap(landmark);
    });
  }

  // Event listener for search icon click
  if (searchIcon) {
    searchIcon.addEventListener("click", function () {
      currentSearchTerm = searchInput.value.trim();
      filterLandmarks();
    });
  }

  // Event listener for Enter key in search input
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        currentSearchTerm = this.value.trim();
        filterLandmarks();
        e.preventDefault();
      }
    });

    // Also keep the existing input event for real-time filtering
    searchInput.addEventListener("input", function () {
      currentSearchTerm = this.value.trim();
      filterLandmarks();
    });
  }

  // Keep the existing button click event as fallback
  if (searchButton) {
    searchButton.addEventListener("click", function () {
      currentSearchTerm = searchInput.value.trim();
      filterLandmarks();
    });
  }

  // Event listener for category filter
  if (categoryFilter) {
    categoryFilter.addEventListener("change", function () {
      currentCategory = this.value;
      filterLandmarks();
    });
  }
}

// Helper function to reload all landmarks
async function reloadLandmarks() {
  try {
    const response = await fetchWithAuth(window.appConfig.endpoints.landmarks);
    if (!response.ok) throw new Error("Failed to load landmarks");

    const landmarks = await response.json();

    // Clear existing landmarks
    document.getElementById("landmarkList").innerHTML = "";

    // Remove all existing markers
    markers.forEach((marker) => map.removeLayer(marker.marker));
    markers = [];

    // Add landmarks to list and map
    landmarks.reverse().forEach((landmark) => {
      addMarkerToMap(landmark);
      addLandmarkToList(landmark);
    });
  } catch (error) {
    console.error("Error loading landmarks:", error);
    alert("Failed to load landmarks. Please refresh the page.");
  }
}

// Show add landmark modal
function showAddLandmarkModal() {
  if (!selectedLocation) {
    alert("Please select a location on the map first");
    return;
  }
  document.getElementById("landmarkModalTitle").textContent =
    "Add New Landmark";
  document.getElementById("landmarkId").value = "";
  document.getElementById("landmarkForm").reset();
  document.getElementById(
    "landmarkLocation"
  ).value = `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(
    6
  )}`;
  landmarkModal.show();
}

// Save landmark
document
  .getElementById("saveLandmarkBtn")
  .addEventListener("click", async function () {
    const name = document.getElementById("landmarkName").value.trim();
    let category = document.getElementById("landmarkCategory").value;
    if (category === "other") {
      category = document.getElementById("otherCategoryInput").value.trim();
    }
    const description = document
      .getElementById("landmarkDescription")
      .value.trim();
    const notes = document.getElementById("landmarkNotes").value.trim();
    const landmarkId = document.getElementById("landmarkId").value;

    if (!name) {
      alert("Please enter a landmark name");
      return;
    }

    if (!selectedLocation && !landmarkId) {
      alert("Please select a location on the map");
      return;
    }

    const landmarkData = {
      name: name,
      category: category,
      description: description || "",
      notes: notes ? [{ content: notes }] : [],
    };

    if (selectedLocation) {
      landmarkData.location = {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      };
    }

    try {
      const url = landmarkId
        ? `${window.appConfig.endpoints.landmarks}/${landmarkId}`
        : window.appConfig.endpoints.landmarks;

      const response = await fetchWithAuth(url, {
        method: landmarkId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(landmarkData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save landmark");
      }

      const landmark = await response.json();

      if (!landmarkId) {
        addMarkerToMap(landmark);
        addLandmarkToList(landmark);
        successToast.show();
      } else {
        updateLandmarkInList(landmark);
        updateMarker(landmark);
      }

      landmarkModal.hide();
      document.getElementById("landmarkForm").reset();
      selectedLocation = null;
      document.getElementById("selectedLocation").style.display = "none";
    } catch (error) {
      console.error("Error saving landmark:", error);
      alert(error.message || "Failed to save landmark. Please try again.");
    }
  });

function addMarkerToMap(landmark) {
  // Create a rich popup with more details
  const popupContent = `
    <div class="landmark-popup">
      <h4>${landmark.name}</h4>
      <div class="popup-detail">
        <strong>Category:</strong> ${landmark.category}
      </div>
      ${
        landmark.description
          ? `<div class="popup-detail">
          <strong>Description:</strong> ${landmark.description}
        </div>`
          : ""
      }
      <div class="popup-detail">
        <strong>Location:</strong> ${landmark.location.latitude.toFixed(
          6
        )}, ${landmark.location.longitude.toFixed(6)}
      </div>
      ${
        landmark.notes && landmark.notes.length > 0
          ? `<div class="popup-detail">
          <strong>Notes:</strong> ${landmark.notes[0].content}
        </div>`
          : ""
      }
    </div>
  `;

  const marker = L.marker([
    landmark.location.latitude,
    landmark.location.longitude,
  ])
    .addTo(map)
    .bindPopup(popupContent);

  // Always show popup on hover
  marker.on("mouseover", function () {
    this.openPopup();
  });

  marker.on("mouseout", function () {
    this.closePopup();
  });

  // Store the marker with the landmark name for reference
  markers.push({ id: landmark._id, marker, name: landmark.name });
}

function updateMarker(landmark) {
  const markerObj = markers.find((m) => m.id === landmark._id);
  if (markerObj) {
    markerObj.marker.setPopupContent(`
            <b>${landmark.name}</b><br>
            Category: ${landmark.category}<br>
            ${landmark.description}
        `);
  }
}

function addLandmarkToList(landmark) {
  const list = document.getElementById("landmarkList");
  const item = document.createElement("div");
  item.className = "landmark-card";
  item.id = `landmark-${landmark._id}`;
  item.innerHTML = createLandmarkCardContent(landmark);
  list.insertBefore(item, list.firstChild);
}

function updateLandmarkInList(landmark) {
  const item = document.getElementById(`landmark-${landmark._id}`);
  if (item) {
    item.innerHTML = createLandmarkCardContent(landmark);
  }
}

function createLandmarkCardContent(landmark) {
  // Extract notes or provide default message
  const notes =
    landmark.notes && landmark.notes.length > 0
      ? landmark.notes[0].content
      : "No notes available";

  // Kategori "other" ise custom adını göster
  const displayCategory =
    landmark.category === "other" && landmark.custom_category
      ? landmark.custom_category
      : landmark.category;

  return `
        <div class="landmark-header">
            <h5>${landmark.name}</h5>
            <span class="category-badge">${displayCategory}</span>
        </div>
        <div class="landmark-body">
            <p class="mb-1"><small>Location: ${landmark.location.latitude.toFixed(
              6
            )}, ${landmark.location.longitude.toFixed(6)}</small></p>
            <p class="description">${
              landmark.description || "No description available"
            }</p>
            
            <div class="notes-section">
                <div class="notes-header" onclick="toggleNotes('notes-${
                  landmark._id
                }')">
                    <i class="fas fa-sticky-note"></i>
                    <span>Notes</span>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="notes-content" id="notes-${
                  landmark._id
                }" style="display: none;">
                    ${notes}
                </div>
            </div>
        </div>
        <div class="landmark-actions">
            <button class="btn btn-primary btn-sm" onclick="showRecordVisit('${
              landmark._id
            }')">
                <i class="fas fa-check"></i> Record Visit
            </button>
            <button class="btn btn-info btn-sm" onclick="viewOnMap('${
              landmark._id
            }')">
                <i class="fas fa-map-marker-alt"></i> View
            </button>
            <button class="btn btn-warning btn-sm" onclick="editLandmark('${
              landmark._id
            }')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteLandmark('${
              landmark._id
            }')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
}

// Toggle notes visibility
function toggleNotes(notesId) {
  const notesElement = document.getElementById(notesId);
  const isVisible = notesElement.style.display !== "none";

  // Toggle display
  notesElement.style.display = isVisible ? "none" : "block";

  // Find and rotate the toggle icon
  const toggleIcon = notesElement.parentElement.querySelector(".toggle-icon");
  if (toggleIcon) {
    toggleIcon.style.transform = isVisible ? "" : "rotate(180deg)";
  }
}

// Show landmark details in a modal
async function showLandmarkDetails(landmarkId) {
  try {
    const response = await fetchWithAuth(
      `${window.appConfig.endpoints.landmarks}/${landmarkId}`
    );
    if (!response.ok) throw new Error("Failed to fetch landmark details");

    const landmark = await response.json();

    // Check if there's already a landmark details modal
    let detailsModal = document.getElementById("landmarkDetailsModal");

    if (!detailsModal) {
      // Create modal if it doesn't exist
      const modalHtml = `
                <div class="modal fade" id="landmarkDetailsModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Landmark Details</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body" id="landmarkDetailsContent">
                                <!-- Landmark details will be dynamically added here -->
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="editLandmark('${landmarkId}')">Edit</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Add modal to document
      document.body.insertAdjacentHTML("beforeend", modalHtml);
      detailsModal = document.getElementById("landmarkDetailsModal");
    }

    // Update modal content
    const content = document.getElementById("landmarkDetailsContent");

    // Format notes
    const notes =
      landmark.notes && landmark.notes.length > 0
        ? landmark.notes[0].content
        : "No notes available";

    content.innerHTML = `
            <div class="landmark-details">
                <h4 class="mb-3">${landmark.name}</h4>
                
                <div class="mb-3">
                    <span class="category-badge mb-2">${
                      landmark.category
                    }</span>
                </div>
                
                <div class="mb-3">
                    <h6>Location</h6>
                    <p class="mb-0">
                        Latitude: ${landmark.location.latitude.toFixed(6)}<br>
                        Longitude: ${landmark.location.longitude.toFixed(6)}
                    </p>
                </div>
                
                <div class="mb-3">
                    <h6>Description</h6>
                    <p>${landmark.description || "No description available"}</p>
                </div>
                
                <div class="mb-3">
                    <h6>Notes</h6>
                    <div class="notes-content p-3 rounded">
                        ${notes}
                    </div>
                </div>
                
                <button class="btn btn-info" onclick="viewOnMap('${
                  landmark._id
                }')">
                    <i class="fas fa-map-marker-alt"></i> View on Map
                </button>
            </div>
        `;

    // Initialize and show the modal
    const bsModal = new bootstrap.Modal(detailsModal);
    bsModal.show();
  } catch (error) {
    console.error("Error loading landmark details:", error);
    alert("Failed to load landmark details");
  }
}

async function editLandmark(id) {
  try {
    const response = await fetchWithAuth(
      `${window.appConfig.endpoints.landmarks}/${id}`
    );
    if (!response.ok) throw new Error("Failed to fetch landmark");

    const landmark = await response.json();
    currentLandmark = landmark;

    document.getElementById("landmarkModalTitle").textContent = "Edit Landmark";
    document.getElementById("landmarkId").value = landmark._id;
    document.getElementById("landmarkName").value = landmark.name;
    document.getElementById(
      "landmarkLocation"
    ).value = `${landmark.location.latitude.toFixed(
      6
    )}, ${landmark.location.longitude.toFixed(6)}`;
    document.getElementById("landmarkCategory").value = landmark.category;
    document.getElementById("landmarkDescription").value = landmark.description;
    document.getElementById("landmarkNotes").value =
      landmark.notes.length > 0 ? landmark.notes[0].content : "";

    landmarkModal.show();
  } catch (error) {
    console.error("Error fetching landmark:", error);
    alert("Failed to load landmark details");
  }
}

async function deleteLandmark(id) {
  if (!confirm("Are you sure you want to delete this landmark?")) return;

  try {
    const response = await fetchWithAuth(
      `${window.appConfig.endpoints.landmarks}/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Failed to delete landmark");

    // Remove from map
    const markerObj = markers.find((m) => m.id === id);
    if (markerObj) {
      map.removeLayer(markerObj.marker);
      markers = markers.filter((m) => m.id !== id);
    }

    // Remove from list
    const item = document.getElementById(`landmark-${id}`);
    if (item) item.remove();

    alert("Landmark deleted successfully");
  } catch (error) {
    console.error("Error deleting landmark:", error);
    alert("Failed to delete landmark");
  }
}

// Initialize star rating
function initializeStarRating() {
  const stars = document.querySelectorAll(".star");
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = parseInt(star.dataset.rating);
      document.getElementById("visitRating").value = rating;

      // Update all stars
      stars.forEach((s) => {
        const starRating = parseInt(s.dataset.rating);
        s.classList.toggle("active", starRating <= rating);
      });
    });

    // Remove hover effect after clicking
    star.addEventListener("mouseleave", () => {
      const currentRating = parseInt(
        document.getElementById("visitRating").value
      );
      stars.forEach((s) => {
        const starRating = parseInt(s.dataset.rating);
        s.classList.toggle("active", starRating <= currentRating);
      });
    });
  });
}

// Show record visit modal
function showRecordVisit(landmarkId) {
  const landmark = markers.find((m) => m.id === landmarkId);
  if (landmark) {
    document.getElementById(
      "visitModalTitle"
    ).textContent = `Record Visit - ${landmark.name}`;
  }

  document.getElementById("visitId").value = "";
  document.getElementById("visitLandmarkId").value = landmarkId;
  document.getElementById("visitorName").value = "";
  document.getElementById("visitDate").valueAsDate = new Date();
  document.getElementById("visitNotes").value = "";
  document.getElementById("visitRating").value = "5";

  // Reset star rating
  const stars = document.querySelectorAll(".star");
  stars.forEach((star) => {
    star.classList.toggle("active", parseInt(star.dataset.rating) <= 5);
  });

  visitModal.show();
}

// Save visit
document
  .getElementById("saveVisitBtn")
  .addEventListener("click", async function () {
    const visitId = document.getElementById("visitId").value;
    const landmarkId = document.getElementById("visitLandmarkId").value;
    const visitorName = document.getElementById("visitorName").value.trim();
    const date = document.getElementById("visitDate").value;
    const rating = parseInt(document.getElementById("visitRating").value);
    const notes = document.getElementById("visitNotes").value.trim();

    if (!visitorName) {
      alert("Please enter visitor name");
      return;
    }

    const visitData = {
      landmark_id: landmarkId,
      visited_date: date,
      visitor_name: visitorName,
      rating: rating,
      notes: notes,
    };

    try {
      const url = visitId
        ? `${window.appConfig.endpoints.visited}/${visitId}`
        : window.appConfig.endpoints.visited;

      const response = await fetchWithAuth(url, {
        method: visitId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitData),
      });

      if (!response.ok) throw new Error("Failed to save visit");

      visitModal.hide();
      loadVisitedLandmarks();
      alert(
        visitId ? "Visit updated successfully!" : "Visit recorded successfully!"
      );
    } catch (error) {
      console.error("Error saving visit:", error);
      alert("Failed to save visit");
    }
  });

// Edit visit
async function editVisit(visitId) {
  try {
    const response = await fetchWithAuth(
      `${window.appConfig.endpoints.visited}/${visitId}`
    );
    if (!response.ok) throw new Error("Failed to fetch visit details");

    const visit = await response.json();

    // Update modal title with landmark name
    document.getElementById(
      "visitModalTitle"
    ).textContent = `Edit Visit - ${visit.landmark_id.name}`;

    // Fill form with visit data
    document.getElementById("visitId").value = visit._id;
    document.getElementById("visitLandmarkId").value = visit.landmark_id._id;
    document.getElementById("visitorName").value = visit.visitor_name;
    document.getElementById("visitDate").value = new Date(visit.visited_date)
      .toISOString()
      .split("T")[0];
    document.getElementById("visitNotes").value = visit.notes || "";
    document.getElementById("visitRating").value = visit.rating;

    // Update star rating display
    const stars = document.querySelectorAll(".star");
    stars.forEach((star) => {
      star.classList.toggle(
        "active",
        parseInt(star.dataset.rating) <= visit.rating
      );
    });

    visitModal.show();
  } catch (error) {
    console.error("Error fetching visit details:", error);
    alert("Failed to load visit details");
  }
}

async function loadLandmarks(clearMarkers = true) {
  try {
    // Make sure the map is initialized first
    if (!mapInitialized) {
      initMap();
    }

    const response = await fetchWithAuth(window.appConfig.endpoints.landmarks);
    if (!response.ok) throw new Error("Failed to load landmarks");

    const landmarks = await response.json();
    document.getElementById("landmarkList").innerHTML = "";

    // Clear existing markers before adding new ones, but only if requested
    if (clearMarkers && markers.length > 0) {
      markers.forEach((marker) => map.removeLayer(marker.marker));
      markers = [];
    }

    // Add landmarks to list and map
    landmarks.reverse().forEach((landmark) => {
      // Marker'ı ekle (eğer zaten yoksa)
      if (!markers.some(m => m.id === landmark._id)) {
        addMarkerToMap(landmark);
      }
      
      // Listeleri güncelle
      addLandmarkToList(landmark);
    });
    
    return landmarks;
  } catch (error) {
    console.error("Error loading landmarks:", error);
    alert("Failed to load landmarks. Please refresh the page.");
    return [];
  }
}

async function loadVisitedLandmarks() {
  try {
    // Make sure the map is initialized first
    if (!mapInitialized) {
      initMap();
    }

    // Önce tüm landmarkları yükle (veya yüklenmiş durumda tut)
    await loadLandmarks(false); // false parametresi markers'ı temizlememesi için

    const response = await fetchWithAuth(window.appConfig.endpoints.visited);
    if (!response.ok) throw new Error("Failed to load visited landmarks");

    const visited = await response.json();
    const visitedList = document.getElementById("visitedList");
    
    // Filter out any visits with missing landmark references
    const validVisits = visited.filter(visit => visit.landmark_id && visit.landmark_id.name);
    
    visitedList.innerHTML = validVisits
      .map(
        (visit) => `
            <div class="visited-record">
                <h5>
                    ${visit.landmark_id.name}
                    <span class="visitor-name"><i class="fas fa-user"></i> ${
                      visit.visitor_name
                    }</span>
                </h5>
                
                <div class="visit-info d-flex justify-content-between align-items-center">
                    <div class="rating-display">
                        <span class="rating-label">Rating:</span>
                        ${"★".repeat(visit.rating)}${"☆".repeat(
          5 - visit.rating
        )}
                    </div>
                    <span class="visit-date">
                        <i class="fas fa-calendar-alt"></i> ${new Date(
                          visit.visited_date
                        ).toLocaleDateString()}
                    </span>
                </div>
                
                <div class="visit-details">
                    <p class="mb-1"><i class="fas fa-map-marker-alt"></i> Location: ${visit.landmark_id.location.latitude.toFixed(
                      6
                    )}, ${visit.landmark_id.location.longitude.toFixed(6)}</p>
                    <p class="mb-1"><i class="fas fa-tag"></i> Category: ${
                      visit.landmark_id.category
                    }</p>
                </div>
                
                ${
                  visit.notes
                    ? `
                <div class="visit-notes">
                    <i class="fas fa-sticky-note"></i> ${visit.notes}
                </div>
                `
                    : ""
                }
                
                <div class="landmark-actions">
                    <button class="btn btn-info btn-sm" onclick="viewOnMap('${
                      visit.landmark_id._id
                    }')">
                        <i class="fas fa-map-marker-alt"></i> View
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editVisit('${
                      visit._id
                    }')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVisit('${
                      visit._id
                    }')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    // Visited olarak işaretlenmiş landmarkların popuplarını güncelle
    validVisits.forEach((visit) => {
      const landmark = visit.landmark_id;
      const existingMarker = markers.find(m => m.id === landmark._id);
      
      if (existingMarker) {
        // Marker zaten varsa, popup içeriğini ziyaret bilgileriyle güncelle
        const popupContent = `
          <div class="landmark-popup">
            <h4>${landmark.name}</h4>
            <div class="popup-detail">
              <strong>Category:</strong> ${landmark.category}
            </div>
            <div class="popup-detail">
              <strong>Rating:</strong> ${"★".repeat(visit.rating)}${"☆".repeat(
          5 - visit.rating
        )}
            </div>
            <div class="popup-detail">
              <strong>Visited:</strong> ${new Date(
                visit.visited_date
              ).toLocaleDateString()}
            </div>
            <div class="popup-detail">
              <strong>Visitor:</strong> ${visit.visitor_name}
            </div>
            ${
              visit.notes
                ? `<div class="popup-detail"><strong>Notes:</strong> ${visit.notes}</div>`
                : ""
            }
          </div>
        `;
        
        existingMarker.marker.setPopupContent(popupContent);
        
        // Özelliklerini güncelle
        existingMarker.isVisited = true;
        existingMarker.visitInfo = visit;
      }
    });
    
    // Display a notice if there were invalid visits
    if (visited.length > validVisits.length) {
      console.warn(`${visited.length - validVisits.length} visits were skipped due to missing landmark references.`);
      
      // Add a notice to the top of the list if there were invalid visits
      if (visitedList.innerHTML) {
        visitedList.innerHTML = `
          <div class="alert alert-warning">
            Some visits couldn't be displayed because they reference deleted landmarks.
          </div>
        ` + visitedList.innerHTML;
      }
    }
    
  } catch (error) {
    console.error("Error loading visited landmarks:", error);
    alert("Failed to load visited landmarks.");
  }
}

async function loadPlans() {
  try {
    // Make sure the map is initialized first
    if (!mapInitialized) {
      initMap();
    }
    
    // Önce tüm landmarkları yükle (veya yüklenmiş durumda tut)
    await loadLandmarks(false); // false parametresi markers'ı temizlememesi için

    const response = await fetchWithAuth(window.appConfig.endpoints.plans);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", response.status, errorText);
      throw new Error(`Failed to load plans: ${response.status} ${errorText}`);
    }

    const plans = await response.json();
    const plansList = document.getElementById("plansList");

    // Plan landmarkların stillerini ve popup içeriklerini güncelle
    let processedPlanLandmarks = [];
    
    plans.forEach((plan) => {
      plan.landmarks.forEach((item) => {
        if (
          item.landmark_id && 
          !processedPlanLandmarks.some((l) => l === item.landmark_id._id)
        ) {
          processedPlanLandmarks.push(item.landmark_id._id);
          
          // Varolan bir landmark markeri bul
          const existingMarker = markers.find(m => m.id === item.landmark_id._id);
          
          if (existingMarker) {
            // Markerı plan stiline güncelle
            existingMarker.marker.setIcon(L.divIcon({
              className: "plan-landmark-marker",
              html: '<div class="plan-marker-inner"></div>',
              iconSize: [24, 24],
            }));
            
            // Plan popup içeriğini güncelle
            const popupContent = `
              <div class="landmark-popup plan-popup">
                <h4>${item.landmark_id.name}</h4>
                <div class="popup-detail">
                  <strong>Category:</strong> ${item.landmark_id.category}
                </div>
                <div class="popup-detail">
                  <strong>In Plans:</strong> ${plans
                    .filter((p) =>
                      p.landmarks.some((l) => l.landmark_id && l.landmark_id._id === item.landmark_id._id)
                    )
                    .map((p) => p.name)
                    .join(", ")}
                </div>
                ${
                  item.landmark_id.description
                    ? `<div class="popup-detail">
                    <strong>Description:</strong> ${item.landmark_id.description}
                  </div>`
                    : ""
                }
                <div class="popup-detail">
                  <strong>Location:</strong> ${item.landmark_id.location.latitude.toFixed(
                    6
                  )}, ${item.landmark_id.location.longitude.toFixed(6)}
                </div>
                ${
                  item.notes
                    ? `<div class="popup-detail">
                    <strong>Plan Notes:</strong> ${item.notes}
                  </div>`
                    : ""
                }
              </div>
            `;
            
            existingMarker.marker.setPopupContent(popupContent);
            existingMarker.isInPlan = true;
          }
        }
      });
    });

    // Now render the plans list
    plansList.innerHTML = plans
      .map((plan) => {
        try {
          // Filter out any invalid landmark references
          const validLandmarks = plan.landmarks.filter(item => 
            item.landmark_id && item.landmark_id._id && item.landmark_id.name
          );
          
          // Count any missing landmarks
          const missingLandmarksCount = plan.landmarks.length - validLandmarks.length;
          
          const startDateStr = plan.planned_date
            ? plan.planned_date.split("T")[0]
            : null;
          const endDateStr = plan.end_date ? plan.end_date.split("T")[0] : null;

          if (!startDateStr) {
            throw new Error("Start date is missing");
          }

          const [startYear, startMonth, startDay] = startDateStr
            .split("-")
            .map(Number);
          const startDate = new Date(startYear, startMonth - 1, startDay);

          let endDate = null;
          let diffDays = 1;

          if (endDateStr) {
            const [endYear, endMonth, endDay] = endDateStr
              .split("-")
              .map(Number);
            endDate = new Date(endYear, endMonth - 1, endDay);

            if (!isNaN(endDate.getTime())) {
              const diffTime = Math.abs(
                endDate.getTime() - startDate.getTime()
              );
              diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }
          }

          return `
                    <div class="plan-card" id="plan-${plan._id}">
                        <h5>${plan.name}</h5>
                        <div class="date-range">
                            <i class="fas fa-calendar-alt"></i>
                            ${startDate.toLocaleDateString("tr-TR")} - 
                            ${
                              endDate
                                ? endDate.toLocaleDateString("tr-TR")
                                : "Belirtilmemiş"
                            }
                            <span class="badge ms-2">${diffDays} gün</span>
                        </div>
                        
                        <div class="landmarks-list">
                            <strong><i class="fas fa-map-marker-alt"></i> Landmarks:</strong> 
                            ${validLandmarks
                              .map((item) => item.landmark_id.name)
                              .join(", ")}
                              ${missingLandmarksCount > 0 ? 
                              `<div class="text-warning">(${missingLandmarksCount} deleted landmark${missingLandmarksCount > 1 ? 's' : ''})</div>` : 
                              ''}
                        </div>
                        
                        ${
                          plan.notes
                            ? `
                        <div class="plan-notes">
                            <strong><i class="fas fa-sticky-note"></i> Plan Notes:</strong> 
                            <p class="mt-1 mb-0">${plan.notes}</p>
                        </div>
                        `
                            : ""
                        }
                        
                        <div class="landmark-actions">
                            <button class="btn btn-info btn-sm" onclick="showPlanDetails('${
                              plan._id
                            }')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                            <button class="btn btn-warning btn-sm" onclick="editPlan('${
                              plan._id
                            }')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deletePlan('${
                              plan._id
                            }')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
        } catch (error) {
          return `
                    <div class="plan-card" id="plan-${plan._id}">
                        <h5>${plan.name}</h5>
                        <div class="alert alert-danger">
                            Error loading plan details: ${error.message}
                            <br>
                            <small>Start Date: ${
                              plan.planned_date || "Not set"
                            }</small>
                            <br>
                            <small>End Date: ${
                              plan.end_date || "Not set"
                            }</small>
                        </div>
                    </div>
                `;
        }
      })
      .join("");
  } catch (error) {
    console.error("Error in loadPlans:", error);
    const plansList = document.getElementById("plansList");
    plansList.innerHTML = `
            <div class="alert alert-danger">
                Failed to load plans. Please try again later.
                <br>
                Error: ${error.message}
            </div>
        `;
  }
}

// Initialize
// Don't load data immediately - wait for authentication
//loadLandmarks();
//loadVisitedLandmarks();

// Tab switching handlers
document.querySelectorAll('a[data-bs-toggle="tab"]').forEach((tab) => {
  tab.addEventListener("shown.bs.tab", function (e) {
    if (e.target.id === "visited-tab") {
      loadVisitedLandmarks();
    } else if (e.target.id === "plans-tab") {
      loadPlans();
    }
  });
});

// Update the landmark form to handle "other" category
document
  .getElementById("landmarkCategory")
  .addEventListener("change", function () {
    const otherCategoryInput = document.getElementById("otherCategoryInput");
    if (this.value === "other") {
      if (!otherCategoryInput) {
        const inputGroup = document.createElement("div");
        inputGroup.className = "mb-3";
        inputGroup.id = "otherCategoryGroup";
        inputGroup.innerHTML = `
                <label class="form-label">Custom Category</label>
                <input type="text" class="form-control" id="otherCategoryInput" required>
            `;
        this.parentNode.parentNode.insertBefore(
          inputGroup,
          this.parentNode.nextSibling
        );
      }
    } else {
      const otherCategoryGroup = document.getElementById("otherCategoryGroup");
      if (otherCategoryGroup) {
        otherCategoryGroup.remove();
      }
    }
  });

// Visit management functions
function showVisitDetails(visitId) {
  // Implementation will be added when needed
}

function viewOnMap(landmarkId) {
  const landmark = markers.find((m) => m.id === landmarkId);
  if (landmark) {
    map.setView(
      [landmark.marker.getLatLng().lat, landmark.marker.getLatLng().lng],
      15
    );
    landmark.marker.openPopup();
  }
}

async function deleteVisit(visitId) {
  if (!confirm("Are you sure you want to delete this visit record?")) return;

  try {
    const response = await fetchWithAuth(
      `${window.appConfig.endpoints.visited}/${visitId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Failed to delete visit record");

    loadVisitedLandmarks();
    alert("Visit record deleted successfully");
  } catch (error) {
    console.error("Error deleting visit record:", error);
    alert("Failed to delete visit record");
  }
}

// Plans functionality
function showAddPlanModal() {
  document.getElementById("planModalTitle").textContent = "Create New Plan";
  document.getElementById("planId").value = "";
  document.getElementById("planForm").reset();
  document.getElementById("planStartDate").valueAsDate = new Date();

  // Set default end date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("planEndDate").valueAsDate = tomorrow;

  loadLandmarksForPlan();
  planModal.show();
}

async function loadLandmarksForPlan() {
  try {
    const response = await fetchWithAuth(window.appConfig.endpoints.landmarks);
    if (!response.ok) throw new Error("Failed to load landmarks");

    const landmarks = await response.json();
    const container = document.getElementById("landmarkCheckboxes");

    container.innerHTML = "";

    landmarks.forEach((landmark) => {
      // Her landmark için bir kapsayıcı div oluştur
      const landmarkDiv = document.createElement("div");
      landmarkDiv.className = "landmark-selection mb-3 border rounded p-2";

      // Checkbox ve label içeren bir div
      const checkboxDiv = document.createElement("div");
      checkboxDiv.className = "form-check";

      // Checkbox oluştur
      const checkbox = document.createElement("input");
      checkbox.className = "form-check-input landmark-checkbox";
      checkbox.type = "checkbox";
      checkbox.value = landmark._id;
      checkbox.id = `landmark-${landmark._id}`;
      checkbox.name = "selectedLandmarks";
      checkbox.dataset.landmarkName = landmark.name;

      // Label oluştur
      const label = document.createElement("label");
      label.className = "form-check-label";
      label.htmlFor = `landmark-${landmark._id}`;
      label.textContent = landmark.name;

      // Not alanı oluştur (başlangıçta gizli)
      const notesDiv = document.createElement("div");
      notesDiv.className = "landmark-notes-area mt-2";
      notesDiv.id = `notes-area-${landmark._id}`;
      notesDiv.style.display = "none";

      const textarea = document.createElement("textarea");
      textarea.className = "form-control";
      textarea.id = `landmark-notes-${landmark._id}`;
      textarea.rows = 2;
      textarea.placeholder = `Add notes for ${landmark.name}`;

      // Elementleri birleştir
      checkboxDiv.appendChild(checkbox);
      checkboxDiv.appendChild(label);
      notesDiv.appendChild(textarea);

      landmarkDiv.appendChild(checkboxDiv);
      landmarkDiv.appendChild(notesDiv);
      container.appendChild(landmarkDiv);

      // Checkbox'a event listener ekle
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          notesDiv.style.display = "block";
        } else {
          notesDiv.style.display = "none";
        }
      });
    });
  } catch (error) {
    console.error("Error loading landmarks for plan:", error);
    alert("Failed to load landmarks");
  }
}

// Save plan
document
  .getElementById("savePlanBtn")
  .addEventListener("click", async function () {
    try {
      const planId = document.getElementById("planId").value;
      const name = document.getElementById("planName").value.trim();
      const startDate = document.getElementById("planStartDate").value;
      const endDate = document.getElementById("planEndDate").value;
      const planNotes = document.getElementById("planNotes").value;

      if (!name || !startDate) {
        alert("Please fill in all required fields");
        return;
      }

      const selectedLandmarks = [];
      document
        .querySelectorAll('input[name="selectedLandmarks"]:checked')
        .forEach((checkbox) => {
          const landmarkId = checkbox.value;
          const landmarkNotes = document.getElementById(
            `landmark-notes-${landmarkId}`
          ).value;
          selectedLandmarks.push({
            landmark_id: landmarkId,
            notes: landmarkNotes,
          });
        });

      if (selectedLandmarks.length === 0) {
        alert("Please select at least one landmark");
        return;
      }

      const planData = {
        name: name,
        planned_date: startDate,
        end_date: endDate,
        notes: planNotes,
        landmarks: selectedLandmarks,
      };

      const url = planId
        ? `${window.appConfig.endpoints.plans}/${planId}`
        : window.appConfig.endpoints.plans;

      const response = await fetchWithAuth(url, {
        method: planId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.message || "Error creating plan");
      }

      const result = await response.json();

      planModal.hide();
      loadPlans();
      alert(
        planId ? "Plan updated successfully!" : "Plan created successfully!"
      );
    } catch (error) {
      console.error("Error saving plan:", error);
      alert(error.message || "Failed to save plan. Please try again.");
    }
  });

async function showPlanDetails(planId) {
  try {
    const response = await fetchWithAuth(
      `${window.appConfig.endpoints.plans}/${planId}`
    );
    if (!response.ok) throw new Error("Failed to fetch plan details");

    const plan = await response.json();

    // Tarihleri güvenli bir şekilde parse et
    const startDateStr = plan.planned_date
      ? plan.planned_date.split("T")[0]
      : null;
    const endDateStr = plan.end_date ? plan.end_date.split("T")[0] : null;

    if (!startDateStr) {
      throw new Error("Start date is missing");
    }

    const [startYear, startMonth, startDay] = startDateStr
      .split("-")
      .map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);

    let endDate = null;
    let diffDays = 1;

    if (endDateStr) {
      const [endYear, endMonth, endDay] = endDateStr.split("-").map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay);

      if (!isNaN(endDate.getTime())) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    const content = document.getElementById("planDetailsContent");

    content.innerHTML = `
            <h4 class="border-bottom pb-2">${plan.name}</h4>
            <div class="date-range mb-3">
                <i class="fas fa-calendar"></i> 
                ${startDate.toLocaleDateString("tr-TR")} 
                ${endDate ? `- ${endDate.toLocaleDateString("tr-TR")}` : ""}
                <span class="badge bg-info ms-2">${diffDays} gün</span>
            </div>
            <div class="mb-3">
                <h5>Selected Landmarks:</h5>
                ${plan.landmarks
                  .map(
                    (item) => `
                    <div class="landmark-item mb-2 border rounded p-2">
                        <h6>${item.landmark_id.name}</h6>
                        <p class="mb-1"><small>Category: ${
                          item.landmark_id.category
                        }</small></p>
                        <p class="mb-1"><small>Location: ${item.landmark_id.location.latitude.toFixed(
                          6
                        )}, 
                            ${item.landmark_id.location.longitude.toFixed(
                              6
                            )}</small></p>
                        <p class="mb-0"><strong>Notes:</strong> ${
                          item.notes || "No specific notes for this landmark"
                        }</p>
                    </div>
                `
                  )
                  .join("")}
            </div>
            <div class="mb-3">
                <h5>Plan Notes:</h5>
                <p>${plan.notes || "No general notes"}</p>
            </div>
        `;

    planDetailsModal.show();
  } catch (error) {
    console.error("Error fetching plan details:", error);
    alert("Failed to load plan details: " + error.message);
  }
}

async function editPlan(planId) {
  try {
    const response = await fetchWithAuth(
      `${window.appConfig.endpoints.plans}/${planId}`
    );
    if (!response.ok) throw new Error("Failed to fetch plan details");

    const plan = await response.json();

    document.getElementById("planModalTitle").textContent = "Edit Plan";
    document.getElementById("planId").value = plan._id;
    document.getElementById("planName").value = plan.name;
    document.getElementById("planStartDate").value =
      plan.planned_date.split("T")[0];
    document.getElementById("planEndDate").value = plan.end_date
      ? plan.end_date.split("T")[0]
      : "";
    document.getElementById("planNotes").value = plan.notes || "";

    await loadLandmarksForPlan();

    // Set selected landmarks and their notes
    plan.landmarks.forEach((item) => {
      const checkbox = document.getElementById(
        `landmark-${item.landmark_id._id}`
      );
      if (checkbox) {
        checkbox.checked = true;
        const noteField = document.getElementById(
          `landmark-notes-${item.landmark_id._id}`
        );
        if (noteField) noteField.value = item.notes || "";
      }
    });

    planModal.show();
  } catch (error) {
    console.error("Error fetching plan details:", error);
    alert("Failed to load plan details");
  }
}

async function deletePlan(planId) {
  if (!confirm("Are you sure you want to delete this plan?")) return;

  try {
    const response = await fetchWithAuth(
      `${window.appConfig.endpoints.plans}/${planId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Failed to delete plan");

    document.getElementById(`plan-${planId}`).remove();
    alert("Plan deleted successfully");
  } catch (error) {
    console.error("Error deleting plan:", error);
    alert("Failed to delete plan");
  }
}
