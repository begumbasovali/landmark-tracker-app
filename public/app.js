async function loadVisitedLandmarks() {
  try {
    // Make sure the map is initialized first
    if (!mapInitialized) {
      initMap();
    }

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

    // Update markers on map
    if (markers.length > 0) {
      markers.forEach((marker) => map.removeLayer(marker.marker));
      markers = [];
    }

    // Only add markers for visits with valid landmark references
    validVisits.forEach((visit) => {
      const landmark = visit.landmark_id;
      const marker = L.marker([
        landmark.location.latitude,
        landmark.location.longitude,
      ]).addTo(map);

      // Create a richer popup with more information and better styling
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

      marker.bindPopup(popupContent);

      // Always open popup on hover
      marker.on("mouseover", function () {
        this.openPopup();
      });

      marker.on("mouseout", function () {
        this.closePopup();
      });

      markers.push({ id: landmark._id, marker, name: landmark.name });
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

    const response = await fetchWithAuth(window.appConfig.endpoints.plans);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", response.status, errorText);
      throw new Error(`Failed to load plans: ${response.status} ${errorText}`);
    }

    const plans = await response.json();
    const plansList = document.getElementById("plansList");

    // Clear existing markers before adding plan landmarks to the map
    if (markers.length > 0) {
      markers.forEach((marker) => map.removeLayer(marker.marker));
      markers = [];
    }

    // Add all plan landmarks to the map
    let allPlanLandmarks = [];
    plans.forEach((plan) => {
      // Filter out any landmarks that are null or have missing _id
      const validLandmarks = plan.landmarks.filter(item => 
        item.landmark_id && item.landmark_id._id
      );
      
      // Only process valid landmarks
      validLandmarks.forEach((item) => {
        if (!allPlanLandmarks.some((l) => l._id === item.landmark_id._id)) {
          allPlanLandmarks.push(item.landmark_id);
        }
      });
    });

    // Add markers for plan landmarks
    allPlanLandmarks.forEach((landmark) => {
      // Create marker with plan-specific styling
      const marker = L.marker(
        [landmark.location.latitude, landmark.location.longitude],
        {
          icon: L.divIcon({
            className: "plan-landmark-marker",
            html: '<div class="plan-marker-inner"></div>',
            iconSize: [24, 24],
          }),
        }
      ).addTo(map);

      // Create a rich popup for the plan landmark
      const popupContent = `
        <div class="landmark-popup plan-popup">
          <h4>${landmark.name}</h4>
          <div class="popup-detail">
            <strong>Category:</strong> ${landmark.category}
          </div>
          <div class="popup-detail">
            <strong>In Plans:</strong> ${plans
              .filter((p) =>
                p.landmarks.some((l) => 
                  l.landmark_id && l.landmark_id._id === landmark._id
                )
              )
              .map((p) => p.name)
              .join(", ")}
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
        </div>
      `;

      marker.bindPopup(popupContent);

      // Show popup on hover
      marker.on("mouseover", function () {
        this.openPopup();
      });

      marker.on("mouseout", function () {
        this.closePopup();
      });

      markers.push({ id: landmark._id, marker, name: landmark.name });
    });

    // Now render the plans list with validation for each plan's landmarks
    plansList.innerHTML = plans
      .map((plan) => {
        try {
          // Make sure we validate landmarks in each plan
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
