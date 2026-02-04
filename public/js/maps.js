// Google Maps Utilities for Music ConnectZ
// Handles address autocomplete, reverse geocoding, and collaboration map

class MapsManager {
  constructor() {
    this.map = null;
    this.markers = [];
    this.markerCluster = null;
    this.geocoder = null;
    this.autocompleteService = null;
    this.currentLocationMarker = null;
  }

  /**
   * Initialize Google Maps
   */
  async initMap(elementId, options = {}) {
    const defaultOptions = {
      center: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
      zoom: 10,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true
    };

    const mapOptions = { ...defaultOptions, ...options };

    try {
      this.map = new google.maps.Map(document.getElementById(elementId), mapOptions);
      this.geocoder = new google.maps.Geocoder();
      this.autocompleteService = new google.maps.places.AutocompleteService();
      
      console.log('Google Maps initialized successfully');
      return this.map;
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      throw error;
    }
  }

  /**
   * Get user's current location
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Center map on user's current location
   */
  async centerOnCurrentLocation() {
    try {
      const location = await this.getCurrentLocation();
      if (this.map) {
        this.map.setCenter(location);
        this.map.setZoom(12);
        
        // Add marker for current location
        if (this.currentLocationMarker) {
          this.currentLocationMarker.setMap(null);
        }
        
        this.currentLocationMarker = new google.maps.Marker({
          position: location,
          map: this.map,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
      }
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw error;
    }
  }

  /**
   * Initialize address autocomplete on input field
   */
  initAutocomplete(inputId, options = {}) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.error(`Input element #${inputId} not found`);
      return;
    }

    const autocompleteOptions = {
      types: ['(cities)'],
      ...options
    };

    const autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions);

    // Set fields to return
    autocomplete.setFields(['address_components', 'geometry', 'formatted_address', 'place_id']);

    // Listen for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry) {
        console.error('No geometry found for place');
        return;
      }

      const addressData = this.parseAddressComponents(place.address_components);
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };

      // Trigger custom event with place data
      const event = new CustomEvent('placeSelected', {
        detail: {
          place: place,
          address: addressData,
          location: location,
          formattedAddress: place.formatted_address
        }
      });
      input.dispatchEvent(event);

      // Center map on selected place if map exists
      if (this.map) {
        this.map.setCenter(location);
        this.map.setZoom(12);
      }
    });

    return autocomplete;
  }

  /**
   * Parse address components from Google Places result
   */
  parseAddressComponents(components) {
    const address = {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      county: ''
    };

    if (!components) return address;

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        address.street = component.long_name + ' ';
      }
      if (types.includes('route')) {
        address.street += component.long_name;
      }
      if (types.includes('locality')) {
        address.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        address.state = component.short_name;
      }
      if (types.includes('country')) {
        address.country = component.long_name;
      }
      if (types.includes('postal_code')) {
        address.postalCode = component.long_name;
      }
      if (types.includes('administrative_area_level_2')) {
        address.county = component.long_name;
      }
    });

    return address;
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch('/api/locations/reverse-geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Add marker to map
   */
  addMarker(location, options = {}) {
    const markerOptions = {
      position: location,
      map: this.map,
      ...options
    };

    const marker = new google.maps.Marker(markerOptions);
    this.markers.push(marker);

    // Add info window if content provided
    if (options.infoWindowContent) {
      const infoWindow = new google.maps.InfoWindow({
        content: options.infoWindowContent
      });

      marker.addListener('click', () => {
        // Close all other info windows
        this.closeAllInfoWindows();
        infoWindow.open(this.map, marker);
      });

      marker.infoWindow = infoWindow;
    }

    return marker;
  }

  /**
   * Close all info windows
   */
  closeAllInfoWindows() {
    this.markers.forEach(marker => {
      if (marker.infoWindow) {
        marker.infoWindow.close();
      }
    });
  }

  /**
   * Clear all markers from map
   */
  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  /**
   * Add collaboration markers to map
   */
  addCollaborationMarkers(collaborations) {
    this.clearMarkers();

    collaborations.forEach(collab => {
      if (collab.location && collab.location.latitude && collab.location.longitude) {
        const position = {
          lat: parseFloat(collab.location.latitude),
          lng: parseFloat(collab.location.longitude)
        };

        const infoWindowContent = `
          <div class="map-info-window">
            <h3>${collab.title}</h3>
            <p>${collab.description}</p>
            <p><strong>Budget:</strong> $${collab.budget}</p>
            <p><strong>Location:</strong> ${collab.location.city}, ${collab.location.state}</p>
            <p><strong>Skills:</strong> ${collab.skills.join(', ')}</p>
            <button onclick="viewCollaboration('${collab.id}')">View Details</button>
          </div>
        `;

        this.addMarker(position, {
          title: collab.title,
          infoWindowContent: infoWindowContent,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });
      }
    });

    // Fit map to show all markers
    if (this.markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      this.markers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      this.map.fitBounds(bounds);
    }
  }

  /**
   * Filter collaborations by proximity radius
   */
  async filterByProximity(centerLat, centerLng, radiusKm) {
    try {
      const response = await fetch(
        `/api/collaborations/nearby?latitude=${centerLat}&longitude=${centerLng}&radius=${radiusKm}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby collaborations');
      }

      const data = await response.json();
      return data.collaborations;
    } catch (error) {
      console.error('Error filtering by proximity:', error);
      throw error;
    }
  }

  /**
   * Draw radius circle on map
   */
  drawRadiusCircle(center, radiusKm, options = {}) {
    const circleOptions = {
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.15,
      map: this.map,
      center: center,
      radius: radiusKm * 1000, // Convert to meters
      ...options
    };

    return new google.maps.Circle(circleOptions);
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // Distance in km
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

// Export for use in main app
if (typeof window !== 'undefined') {
  window.MapsManager = MapsManager;
}
