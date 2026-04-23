/* Complete Frontend with Backend Integration */
(function () {
  'use strict';

  const API_BASE = 'http://localhost:5000';

  const App = {
    state: {
      panelOpen: false,
      contacts: [],
      preferred: 'bus',
      currentRoutes: [],
      trackingInterval: null,
      selectedBusId: null,
      map: null,
      busMarkers: {},
      routePolylines: [],
      routeMarkers: [],
      routingControl: null,
      userLocationMarker: null,
      nearestStopMarker: null,
      currentPosition: null,
      nearestStop: null,
      trackingRoute: null,
      mockProgress: 0,
      notificationsMuted: false,
      voiceMuted: false,
      currentMeta: {}
    },

    els: {},

    init() {
      // Map common elements
      this.els = {
        splash: document.getElementById('splash'),
        loginModal: document.getElementById('loginModal'),
        hamburger: document.getElementById('hamburger'),
        panel: document.getElementById('panel'),
        panelClose: document.getElementById('panelClose'),
        womenSafetyBtn: document.getElementById('womenSafetyBtn'),
        womenSafetyPanel: document.getElementById('womenSafetyPanel'),
        addContactBtn: document.getElementById('addContactBtn'),
        contactInput: document.getElementById('contactInput'),
        contactsList: document.getElementById('contactsList'),
        themeBtn: document.getElementById('themeBtn'),
        changeCityBtn: document.getElementById('changeCityBtn'),
        continueBtn: document.getElementById('continueBtn'),
        skipLoginBtn: document.getElementById('skipLoginBtn'),
        findBtn: document.getElementById('findBtn'),
        startInput: document.getElementById('start'),
        destInput: document.getElementById('dest'),
        mapFrame: document.getElementById('mapFrame'),
        mapContainer: document.getElementById('mapContainer'),
        resultsContainer: document.getElementById('results'),
        detailsModal: document.getElementById('detailsModal'),
        detailsContent: document.getElementById('detailsContent'),
        appsList: document.getElementById('appsList'),
        closeDetails: document.getElementById('closeDetails'),
        enableLoc: document.getElementById('enableLoc'),
        micBtn: document.getElementById('micBtn'),
        voiceStatus: document.getElementById('voiceStatus'),
        langQuick: document.getElementById('langQuick'),
        langDropdown: document.getElementById('langDropdown'),
        langLabel: document.getElementById('langLabel'),
        langFlag: document.getElementById('langFlag'),
        prefDisplay: document.getElementById('prefDisplay'),
        preferredModeSelect: document.getElementById('preferredMode'),
        modeSelect: document.getElementById('modeSelect'),
        fallbackContainer: document.getElementById('fallbackContainer'),
        aiRecommendation: document.getElementById('aiRecommendation'),
        sosModal: document.getElementById('sosModal'),
        lastMileInfo: document.getElementById('lastMileInfo'),
        aiNotification: document.getElementById('aiNotification'),
        notificationBody: document.getElementById('notificationBody'),
        closeNotification: document.getElementById('closeNotification'),
        acceptNotification: document.getElementById('acceptNotification')
      };

      // Splash + login handling
      window.addEventListener('load', () => {
        setTimeout(() => {
          if (this.els.splash) {
            this.els.splash.style.opacity = '0';
            setTimeout(() => {
              this.els.splash.style.display = 'none';
              if (this.els.loginModal) this.els.loginModal.style.display = 'flex';
            }, 500);
          }
        }, 2200);

        // restore preferred mode
        const p = localStorage.getItem('preferredMode') || 'bus';
        this.state.preferred = p;
        if (this.els.prefDisplay) this.els.prefDisplay.textContent = p.charAt(0).toUpperCase() + p.slice(1);
        if (this.els.preferredModeSelect) this.els.preferredModeSelect.value = p;
        if (this.els.modeSelect) this.els.modeSelect.value = p;
      });

      // Panel toggles
      this.els.hamburger?.addEventListener('click', () => this.openPanel());
      this.els.panelClose?.addEventListener('click', () => this.closePanel());

      // Women safety panel & SOS quick
      this.els.womenSafetyBtn?.addEventListener('click', () => this.showWomenSafety());
      document.getElementById('sosQuick')?.addEventListener('click', () => {
        this.openSOSModal();
      });

      // Contacts handling
      this.els.addContactBtn?.addEventListener('click', () => {
        const v = (this.els.contactInput?.value || '').trim();
        if (!v) return;
        this.state.contacts.push(v);
        this.els.contactInput.value = '';
        this.renderContacts();
      });

      // Theme toggle
      this.els.themeBtn?.addEventListener('click', () => {
        document.body.style.filter = document.body.style.filter === 'invert(1)' ? 'invert(0)' : 'invert(1)';
      });

      // Menu options - Edit Profile
      document.getElementById('editProfile')?.addEventListener('click', () => {
        alert('Edit Profile feature coming soon!\n\nYou can update your name, email, and preferences here.');
      });

      // Change city
      this.els.changeCityBtn?.addEventListener('click', () => {
        const city = prompt('Enter city name (e.g. Bangalore, Mumbai, Delhi)') || 'Bangalore';
        const cityNameEl = document.getElementById('cityName');
        const cityImgEl = document.getElementById('cityImg');
        if (cityNameEl) cityNameEl.textContent = city;
        if (cityImgEl) cityImgEl.src = `https://source.unsplash.com/400x300/?${encodeURIComponent(city + ' city')}`;
        alert(`City changed to ${city}! Routes will now show options for ${city}.`);
      });

      // Feedback
      document.getElementById('feedbackBtn')?.addEventListener('click', () => {
        const feedback = prompt('Share your feedback or suggestions:');
        if (feedback && feedback.trim()) {
          alert('Thank you for your feedback! We\'ll review it soon.');
          console.log('User feedback:', feedback);
        }
      });

      // Logout
      document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
          alert('Logged out successfully!');
          // Could redirect to login or clear session here
        }
      });

      // Login skip
      this.els.continueBtn?.addEventListener('click', () => { if (this.els.loginModal) this.els.loginModal.style.display = 'none'; });
      this.els.skipLoginBtn?.addEventListener('click', () => { if (this.els.loginModal) this.els.loginModal.style.display = 'none'; });

      // Find routes - CONNECT TO BACKEND
      this.els.findBtn?.addEventListener('click', () => {
        const start = (this.els.startInput?.value || '').trim();
        const dest = (this.els.destInput?.value || '').trim();
        
        if (!start || !dest) {
          alert('Please enter both start and destination');
          return;
        }
        
        this.findRoutes(start, dest);
        localStorage.setItem('preferredMode', (this.els.modeSelect?.value) || this.state.preferred);
      });

      // Details modal close
      this.els.closeDetails?.addEventListener('click', () => this.closeDetails());

      // Geolocation
      this.els.enableLoc?.addEventListener('click', () => {
        this.detectUserLocation(true);
      });

      // Voice recognition
      this.setupVoice();

      // Language quick switch
      this.els.langQuick?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.els.langDropdown) return;
        this.els.langDropdown.style.display = this.els.langDropdown.style.display === 'block' ? 'none' : 'block';
      });
      document.querySelectorAll('.lang-item').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          const code = btn.dataset.lang;
          this.setLanguage(code);
          if (this.els.langDropdown) this.els.langDropdown.style.display = 'none';
        });
      });
      window.addEventListener('click', (e) => {
        if (!this.els.langDropdown) return;
        if (!this.els.langDropdown.contains(e.target) && !this.els.langQuick.contains(e.target)) {
          this.els.langDropdown.style.display = 'none';
        }
      });

      // Language flag/label mapping initially
      this.setLanguage('en');

      // Render any initial contacts
      this.renderContacts();

      // Initialize Leaflet map if available
      this.initMap();

      // Initialize notification handlers
      this.setupNotificationHandlers();

      // Auto-detect location & nearest bus stop for smarter defaults
      this.detectUserLocation();
    },

    // ==================== API CALLS ====================

    async findRoutes(start, destination) {
      try {
        this.showLoading('Finding routes...');
        
        // Call /route endpoint
        const response = await fetch(`${API_BASE}/route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start, end: destination })
        });

        if (!response.ok) throw new Error('Failed to fetch routes');

        const data = await response.json();
        this.state.currentRoutes = data.routes || [];
        
        // Update display headers
        const startDisplay = document.getElementById('startDisplay');
        const destDisplay = document.getElementById('destDisplay');
        if (startDisplay) startDisplay.textContent = start;
        if (destDisplay) destDisplay.textContent = destination;

        // Render routes
        this.renderRoutes(data.routes || []);
        
        // Show metadata and update badge
        if (data.meta) {
          this.showMetaInfo(data.meta);
          this.updateTimeBadge(data.meta, data.routes || []);
        }

        // Show charts
        this.updateCharts(data.routes || []);

        // Store routes for notifications
        this.state.currentRoutes = data.routes || [];

        // Update map with backend routes and AI-assisted Gemini routing
        this.updateMapWithRoutesNew(data.routes || [], start, destination);
        this.updateGeminiRoute(start, destination);

        // Get fallback options
        this.getFallbackOptions(start, destination, 0);

        // Get last-mile info
        this.getLastMileInfo();

        // Get AI recommendations
        this.getAIRecommendations(start, destination, 0);

        // Show real-time bus notifications
        this.showBusNotifications(data.routes || []);

      } catch (error) {
        console.error('Error finding routes:', error);
        alert('Error finding routes. Make sure backend is running on port 5000.');
      } finally {
        this.hideLoading();
      }
    },

    async getFallbackOptions(start, destination, delayMinutes = 0) {
      try {
        const response = await fetch(`${API_BASE}/fallback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start, destination, busDelayMinutes: delayMinutes })
        });

        if (!response.ok) throw new Error('Failed to fetch fallback options');

        const data = await response.json();
        this.renderFallbackOptions(data);
      } catch (error) {
        console.error('Error fetching fallback options:', error);
      }
    },

    async getLastMileInfo() {
      try {
        const response = await fetch(`${API_BASE}/lastmile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });

        if (!response.ok) throw new Error('Failed to fetch last-mile info');

        const data = await response.json();
        this.renderLastMileInfo(data);
      } catch (error) {
        console.error('Error fetching last-mile info:', error);
      }
    },

    async getAIRecommendations(start, destination, delayMinutes = 0) {
      try {
        const response = await fetch(`${API_BASE}/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start, destination, delayMinutes })
        });

        if (!response.ok) throw new Error('Failed to fetch AI recommendations');

        const data = await response.json();
        this.renderAIRecommendation(data.reply);
        
        // Show popup notification with practical 1-line suggestion
        setTimeout(() => {
          this.showAINotification(data.reply, start, destination);
        }, 1000);
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
      }
    },

    async trackBus(busId) {
      const route = this.state.currentRoutes.find(r => r.id === busId);
      if (!route) {
        console.warn('Route not found for bus', busId);
        return null;
      }

      this.state.trackingRoute = route;
      this.updateMockBusMarker(true);
      return { position: null };
    },

    async getSOSInfo() {
      try {
        const response = await fetch(`${API_BASE}/sos`);
        if (!response.ok) throw new Error('Failed to fetch SOS info');

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching SOS info:', error);
        return null;
      }
    },

    // ==================== RENDERING ====================

    renderRoutes(routes) {
      const out = this.els.resultsContainer;
      if (!out) return;

      if (routes.length === 0) {
        out.innerHTML = '<div class="no-routes">No routes found. Try different locations.</div>';
        return;
      }

      const badges = ['⚡ Recommended', '💰 Budget', '🕐 Alternative'];

      out.innerHTML = routes.map((r, idx) => {
        const crowdScore = (r.crowdScore || 0) * 100;
        const crowdLevel = crowdScore < 40 ? 'Low' : crowdScore < 70 ? 'Medium' : 'High';
        const onTimeProb = (parseFloat(r.probabilityOnTime || 0) * 100).toFixed(0);

        const pickupTime = new Date(r.pickupETA);
        const dropTime = new Date(r.dropETA);
        const durationMinutes = Math.max(1, Math.round((dropTime - pickupTime) / 60000));
        const crowdIndicator = this.getCrowdIndicator(r.crowdScore);

        return `
          <div class="route route-compact" data-id="${r.id}" data-bus-number="${this.escapeHtml(r.busNumber)}">
            <div class="route-compact-row">
              <div class="route-chip">Bus ${this.escapeHtml(r.busNumber)}</div>
              <div class="route-badge">${badges[idx] || '🚌 Option'}</div>
            </div>

            <div class="route-compact-row route-compact-path">
              <div class="route-path-main">
                <span>${this.escapeHtml(r.pickupStop)}</span>
                <span>→</span>
                <span>${this.escapeHtml(r.dropStop)}</span>
              </div>
              <div class="route-eta">${this.formatTime(r.pickupETA)} • ${durationMinutes} min</div>
            </div>

            <div class="route-compact-metrics">
              <div class="route-compact-metric">
                <span>Fare</span>
                <strong>₹${r.fare}</strong>
              </div>
              <div class="route-compact-metric">
                <span>Crowd</span>
                <strong>${crowdLevel}</strong>
              </div>
              <div class="route-compact-metric">
                <span>On-time</span>
                <strong>${onTimeProb}%</strong>
              </div>
              <div class="route-compact-metric">
                <span>Speed</span>
                <strong>${r.speedKmph} km/h</strong>
              </div>
            </div>
            <div class="crowd-indicator">
              <span class="crowd-dot ${crowdIndicator.color}"></span>
              <span>${crowdIndicator.label}</span>
            </div>

            <div class="route-actions inline">
              <button class="btn-track" data-bus-id="${r.id}">🛰 Track</button>
              <button class="btn-details" data-action="open-details" data-id="${r.id}">📋 Details</button>
            </div>
          </div>
        `;
      }).join('');

      // Attach event listeners
      out.querySelectorAll('[data-action="open-details"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.dataset.id;
          const route = routes.find(r => r.id === id);
          if (route) this.openDetails(route);
        });
      });

      out.querySelectorAll('.btn-track').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const busId = btn.dataset.busId;
          this.startTracking(busId);
        });
      });
    },

    getCrowdIndicator(score = 0) {
      const pct = Math.round((score || 0) * 100);
      if (pct < 40) {
        return { label: 'Less crowd • plenty of seats', color: 'green', desc: 'Comfortable ride expected.' };
      }
      if (pct < 70) {
        return { label: 'Moderate crowd • standing space', color: 'orange', desc: 'Some standing, manageable load.' };
      }
      return { label: 'Heavy crowd • limited space', color: 'red', desc: 'Bus is packed, expect delays.' };
    },

    renderFallbackOptions(data) {
      const container = this.els.fallbackContainer;
      if (!container) return;

      if (!data.alternatives || data.alternatives.length === 0) {
        container.innerHTML = '';
        return;
      }

      // Define official app URLs
      const appUrls = {
        'Rapido': 'https://rapido.bike',
        'Ola Auto': 'https://www.olacabs.com/auto',
        'Ola': 'https://www.olacabs.com',
        'Uber Go': 'https://www.uber.com/in/en/ride/uber-go/',
        'Uber': 'https://www.uber.com/in/en/',
        'UberX': 'https://www.uber.com/in/en/ride/uberx/',
        'Uber Moto': 'https://www.uber.com/in/en/ride/moto/',
        'Uber Auto': 'https://www.uber.com/in/en/ride/auto/'
      };

      container.innerHTML = `
        <h5>Alternative Options</h5>
        <div class="fallback-list">
          ${data.alternatives.map(alt => {
            // Determine URL based on provider name
            let appUrl = '#';
            const providerName = alt.provider || '';
            
            for (const [key, url] of Object.entries(appUrls)) {
              if (providerName.includes(key) || providerName.toLowerCase().includes(key.toLowerCase())) {
                appUrl = url;
                break;
              }
            }
            
            // Fallback URL matching
            if (appUrl === '#') {
              if (providerName.toLowerCase().includes('rapido')) appUrl = appUrls['Rapido'];
              else if (providerName.toLowerCase().includes('ola')) appUrl = appUrls['Ola'];
              else if (providerName.toLowerCase().includes('uber')) appUrl = appUrls['Uber'];
            }

            // Get logo URL based on provider
            const logoUrls = {
              'Rapido': 'https://rapido.bike/images/rapido-logo.svg',
              'Ola': 'https://www.olacabs.com/webstatic/img/ola-logo.svg',
              'Ola Auto': 'https://www.olacabs.com/webstatic/img/ola-logo.svg',
              'Uber': 'https://d1a3f4spazzrp4.cloudfront.net/uber-com/1.3.8/d1a3f4spazzrp4.cloudfront.net/images/uber-logo-default.svg',
              'Uber Go': 'https://d1a3f4spazzrp4.cloudfront.net/uber-com/1.3.8/d1a3f4spazzrp4.cloudfront.net/images/uber-logo-default.svg'
            };

            let logoUrl = '';
            for (const [key, url] of Object.entries(logoUrls)) {
              if (providerName.toLowerCase().includes(key.toLowerCase())) {
                logoUrl = url;
                break;
              }
            }

            // Fallback to emoji if logo fails
            const fallbackIcon = alt.type === 'Moto' ? '🏍️' : alt.type === 'Auto' ? '🛺' : '🚕';
            
            return `
              <a href="${appUrl}" target="_blank" class="fallback-item-link" rel="noopener noreferrer">
                <div class="fallback-item">
                  ${logoUrl ? 
                    `<img src="${logoUrl}" alt="${this.escapeHtml(alt.provider)}" class="app-logo-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : 
                    ''
                  }
                  <div class="fallback-icon" style="${logoUrl ? 'display:none' : 'display:flex'}">${fallbackIcon}</div>
                  <div class="fallback-info">
                    <div class="fallback-provider">${this.escapeHtml(alt.provider)}</div>
                    <div class="fallback-meta">ETA: ${alt.pickupETA} min • Travel: ${alt.travelTime} min</div>
                  </div>
                  <div class="fallback-price">₹${alt.price}</div>
                  <div class="fallback-arrow">→</div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      `;
    },

    renderLastMileInfo(data) {
      const container = this.els.lastMileInfo;
      if (!container) return;

      container.innerHTML = `
        <h5>Last-Mile Options</h5>
        <div class="lastmile-list">
          <div class="lastmile-item">
            <span>🚶 Walking:</span> <span>${data.walking || 'N/A'}</span>
          </div>
          <div class="lastmile-item">
            <span>🛺 Auto:</span> <span>${data.auto || 'N/A'}</span>
          </div>
          <div class="lastmile-item">
            <span>🚲 Bike Share:</span> <span>${data.bikeShare || 'N/A'}</span>
          </div>
        </div>
      `;
    },

    renderAIRecommendation(text) {
      const container = this.els.aiRecommendation;
      if (!container) return;

      const summary = this.buildNextBusSummary();
      const mainLine = summary ? summary.line : 'Next bus info will appear after you search for routes.';
      const fallbackLine = summary?.fallback || '';

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h5 style="margin:0">🤖 AI Recommendations</h5>
          <button id="aiVoiceMuteBtn" class="voice-mute-btn" title="Mute voice">🔕</button>
          <button id="aiVoiceBtn" class="voice-btn speaking" title="Reading aloud">🔊</button>
        </div>
        <div class="ai-content" id="aiContent">
          <div class="ai-point">${this.escapeHtml(mainLine)}</div>
          ${fallbackLine ? `<div class="ai-point">${this.escapeHtml(fallbackLine)}</div>` : ''}
        </div>
      `;

      // Auto-start voice after a short delay (if not muted)
      if (!this.state.voiceMuted) {
        setTimeout(() => {
          this.speakAIRecommendation(`${mainLine}${fallbackLine ? '. ' + fallbackLine : ''}`);
        }, 500);
      }

      // Add voice button event listener for replay
      const voiceBtn = document.getElementById('aiVoiceBtn');
      if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
          if (!this.state.voiceMuted) {
            this.speakAIRecommendation(`${mainLine}${fallbackLine ? '. ' + fallbackLine : ''}`);
          }
        });
      }

      // Add mute button for voice
      const muteBtn = document.getElementById('aiVoiceMuteBtn');
      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          this.state.voiceMuted = !this.state.voiceMuted;
          muteBtn.textContent = this.state.voiceMuted ? '🔔' : '🔕';
          muteBtn.title = this.state.voiceMuted ? 'Unmute voice' : 'Mute voice';
          
          if (this.state.voiceMuted) {
            window.speechSynthesis.cancel();
          }
        });
      }
    },

    buildNextBusSummary() {
      const routes = this.state.currentRoutes || [];
      if (!routes.length) return null;

      const nextBus = routes[0];
      const pickupTime = new Date(nextBus.pickupETA);
      const minutesAway = Math.max(0, Math.round((pickupTime - Date.now()) / 60000));
      const onTimeProb = parseFloat(nextBus.probabilityOnTime || 0.75);
      const delayed = minutesAway > 7 || onTimeProb < 0.6;

      const line = `Next bus ${nextBus.busNumber} arrives in ${minutesAway} min • Fare ₹${nextBus.fare}.`;
      const fallback = delayed ? 'Bus running late — consider alternatives (auto, cab, metro).' : '';

      return { line, fallback };
    },

    formatAIRecommendation(text) {
      // Clean and format text to 1-2 lines max
      let clean = text
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/•/g, '')
        .replace(/\n\n/g, '. ')
        .replace(/\n/g, '. ')
        .trim();

      // Take first 1-2 sentences (max 2 lines)
      const sentences = clean.split(/[.!?]/).filter(s => s.trim().length > 10);
      const keySentences = sentences.slice(0, 2);
      
      return keySentences.map((sent, idx) => {
        const trimmed = sent.trim();
        const shortened = trimmed.length > 100 ? trimmed.substring(0, 100) + '...' : trimmed;
        return `<div class="ai-point">${this.escapeHtml(shortened)}</div>`;
      }).join('');
    },

    speakAIRecommendation(text) {
      // Don't speak if voice is muted
      if (this.state.voiceMuted) return;
      
      // Clean text for speech (remove markdown-like formatting)
      const cleanText = text
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/- /g, '')
        .replace(/•/g, '')
        .replace(/\n/g, '. ')
        .replace(/\.{2,}/g, '.')
        .trim();

      if (cleanText) {
        const voiceBtn = document.getElementById('aiVoiceBtn');
        if (voiceBtn) {
          voiceBtn.classList.add('speaking');
        }
        
        this.speak(cleanText);
        
        // Remove speaking class after speech completes (estimate duration)
        const duration = Math.max(cleanText.length * 50, 3000); // ~50ms per character, min 3s
        setTimeout(() => {
          if (voiceBtn) {
            voiceBtn.classList.remove('speaking');
          }
        }, duration + 500);
      }
    },

    showMetaInfo(meta) {
      // You can display this in a banner or info card
      console.log('Meta info:', meta);
    },

    // ==================== BUS TRACKING ====================

    startTracking(busId) {
      const route = this.state.currentRoutes.find(r => r.id === busId);
      if (!route) {
        alert('Route details unavailable for tracking.');
        return;
      }

      this.state.selectedBusId = busId;
      this.state.trackingRoute = route;
      this.state.mockProgress = 0.08; // close to pickup

      if (this.state.trackingInterval) {
        clearInterval(this.state.trackingInterval);
      }

      this.updateMockBusMarker(true);
      this.state.trackingInterval = setInterval(() => {
        this.updateMockBusMarker();
      }, 4000);

      alert(`Tracking Bus ${route.busNumber}. Mock position updates every few seconds.`);
    },

    stopTracking() {
      if (this.state.trackingInterval) {
        clearInterval(this.state.trackingInterval);
        this.state.trackingInterval = null;
      }
      this.state.selectedBusId = null;
      this.state.trackingRoute = null;
      this.state.mockProgress = 0;
    },

    updateBusMarker(busId, position) {
      if (!this.map) return;

      // Remove existing marker
      if (this.state.busMarkers[busId]) {
        this.map.removeLayer(this.state.busMarkers[busId]);
      }

      // Create new marker
      const marker = L.marker([position.lat, position.lng], {
        icon: L.divIcon({
          className: 'bus-marker',
          html: '🚌',
          iconSize: [32, 32]
        })
      }).addTo(this.map);

      const etaLine = position.etaMinutes !== undefined ? `ETA: ${position.etaMinutes} min<br>` : '';
      const msgLine = position.message ? `${this.escapeHtml(position.message)}<br>` : '';
      const speedLine = position.speedKmph !== undefined ? `Speed: ${position.speedKmph} km/h<br>` : '';
      const timeLine = position.timestamp ? `Updated: ${new Date(position.timestamp).toLocaleTimeString()}` : '';

      marker.bindPopup(`${msgLine}${etaLine}${speedLine}${timeLine}`);

      this.state.busMarkers[busId] = marker;
      if (position.panMap !== false) {
        this.map.setView([position.lat, position.lng], 13);
      }
    },

    updateMockBusMarker(initial = false) {
      const route = this.state.trackingRoute;
      if (!this.map || !route || !route.polyline || route.polyline.length < 2) return;

      const latlngs = route.polyline
        .map(coord => [parseFloat(coord[0]), parseFloat(coord[1])])
        .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

      if (latlngs.length < 2) return;

      if (initial || !this.state.mockProgress) {
        this.state.mockProgress = 0.08;
      } else {
        this.state.mockProgress = Math.min(0.35, this.state.mockProgress + 0.02);
      }

      const point = this.interpolateAlongPolyline(latlngs, this.state.mockProgress);
      if (!point) return;

      this.updateBusMarker(route.id, {
        lat: point.lat,
        lng: point.lng,
        etaMinutes: 2,
        speedKmph: 20,
        message: `Bus ${route.busNumber} is ~2 minutes from ${route.pickupStop}`,
        timestamp: Date.now()
      });
    },

    interpolateAlongPolyline(latlngs, progress) {
      if (latlngs.length < 2) return null;
      const totalSegments = latlngs.length - 1;
      const scaled = progress * totalSegments;
      const index = Math.min(totalSegments - 1, Math.floor(scaled));
      const local = scaled - index;
      const start = latlngs[index];
      const end = latlngs[index + 1];

      return {
        lat: start[0] + (end[0] - start[0]) * local,
        lng: start[1] + (end[1] - start[1]) * local
      };
    },

    showBusFeedback(busId, feedback) {
      console.log(`Bus ${busId} feedback:`, feedback);
      // You can show this in a notification or info panel
    },

    // ==================== MAP ====================

    detectUserLocation(forceFeedback = false) {
      if (!('geolocation' in navigator)) {
        if (forceFeedback) alert('Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.state.currentPosition = coords;
          this.addOrUpdateUserMarker(coords);
          this.locateNearestBusStop(coords);
          if (forceFeedback) alert('Location enabled');
          if (this.els.startInput) {
            const currentValue = (this.els.startInput.value || '').trim().toLowerCase();
            if (!currentValue || currentValue === 'current location') {
              this.els.startInput.value = 'Current Location';
            }
          }
        },
        (error) => {
          console.warn('Geolocation error', error);
          if (forceFeedback) {
            alert('Unable to fetch location: ' + (error.message || error.code));
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    },

    addOrUpdateUserMarker(coords) {
      if (!this.map || typeof L === 'undefined') return;
      if (this.state.userLocationMarker) {
        this.state.userLocationMarker.setLatLng([coords.lat, coords.lng]);
        return;
      }

      this.state.userLocationMarker = L.marker([coords.lat, coords.lng], {
        icon: L.divIcon({
          className: 'gemini-waypoint',
          html: '<div class="gemini-waypoint-pin">📍</div>',
          iconSize: [28, 28]
        })
      }).addTo(this.map).bindPopup('You are here');
    },

    async locateNearestBusStop(coords) {
      try {
        const query = `[out:json][timeout:10];node(around:600,${coords.lat},${coords.lng})["highway"="bus_stop"];out 1;`;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (!data?.elements?.length) return;

        const stop = data.elements[0];
        const name = stop.tags?.name || 'Nearest Bus Stop';
        this.state.nearestStop = {
          name,
          lat: stop.lat,
          lng: stop.lon
        };

        if (this.els.voiceStatus) {
          this.els.voiceStatus.textContent = `Nearest bus stop: ${name}`;
        }

        const startValue = (this.els.startInput?.value || '').trim().toLowerCase();
        if (this.els.startInput && (!startValue || startValue === 'current location')) {
          this.els.startInput.value = name;
        }

        if (this.map && typeof L !== 'undefined') {
          if (this.state.nearestStopMarker) {
            this.map.removeLayer(this.state.nearestStopMarker);
          }
          this.state.nearestStopMarker = L.marker([stop.lat, stop.lon], {
            icon: L.divIcon({
              className: 'gemini-waypoint',
              html: '<div class="gemini-waypoint-pin">🚌</div>',
              iconSize: [28, 28]
            })
          }).addTo(this.map).bindPopup(`Nearest bus stop:<br><strong>${this.escapeHtml(name)}</strong>`);
        }
      } catch (error) {
        console.warn('Nearest bus stop lookup failed', error);
      }
    },

    async geocodePlace(query) {
      if (!query) return null;
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query + ', Bangalore')}`);
        const data = await resp.json();
        if (Array.isArray(data) && data[0]) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
        }
      } catch (error) {
        console.warn('Geocoding failed', error);
      }
      return null;
    },

    async resolveCoordinates(label) {
      const value = (label || '').trim();
      if (!value && this.state.nearestStop) {
        return { lat: this.state.nearestStop.lat, lng: this.state.nearestStop.lng };
      }

      if (value.toLowerCase() === 'current location' && this.state.currentPosition) {
        return this.state.currentPosition;
      }

      if (this.state.nearestStop && value === this.state.nearestStop.name) {
        return { lat: this.state.nearestStop.lat, lng: this.state.nearestStop.lng };
      }

      return this.geocodePlace(value);
    },

    clearRoutingControl() {
      if (this.state.routingControl && this.map) {
        try {
          this.map.removeControl(this.state.routingControl);
        } catch (error) {
          console.warn('Failed to remove routing control', error);
        }
      }
      this.state.routingControl = null;
    },

    async updateGeminiRoute(start, destination) {
      if (!this.map || typeof L === 'undefined' || !L.Routing) return;

      try {
        const [fromCoords, toCoords] = await Promise.all([
          this.resolveCoordinates(start),
          this.resolveCoordinates(destination)
        ]);

        if (!fromCoords || !toCoords) return;

        this.clearRoutingControl();

        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(fromCoords.lat, fromCoords.lng),
            L.latLng(toCoords.lat, toCoords.lng)
          ],
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          }),
          showAlternatives: false,
          routeWhileDragging: false,
          addWaypoints: false,
          collapsible: true,
          lineOptions: {
            styles: [{ color: '#1a73e8', weight: 7, opacity: 0.9 }]
          },
          geocoder: L.Control.Geocoder ? L.Control.Geocoder.nominatim() : undefined,
          createMarker: (i, waypoint) => {
            const label = i === 0 ? 'Start' : 'Destination';
            const value = i === 0 ? (start || 'Start') : (destination || 'Destination');
            return L.marker(waypoint.latLng, {
              draggable: false,
              icon: L.divIcon({
                className: 'gemini-waypoint',
                html: `<div class="gemini-waypoint-pin">${i === 0 ? 'S' : 'D'}</div>`
              })
            }).bindPopup(`${label}: ${this.escapeHtml(value)}`);
          }
        }).addTo(this.map);

        routingControl.on('routesfound', (event) => {
          if (!event.routes?.length) return;
          const best = event.routes[0];
          const minutes = Math.round(best.summary.totalTime / 60);
          if (this.els.voiceStatus && minutes) {
            this.els.voiceStatus.textContent = `Gemini route: ${minutes} min • ${(best.summary.totalDistance / 1000).toFixed(1)} km`;
          }
        });

        this.state.routingControl = routingControl;

        const bounds = L.latLngBounds([
          [fromCoords.lat, fromCoords.lng],
          [toCoords.lat, toCoords.lng]
        ]);
        this.map.fitBounds(bounds.pad(0.25));
      } catch (error) {
        console.warn('Gemini routing failed', error);
      }
    },

    initMap() {
      // Check if map container exists
      if (!this.els.mapContainer) {
        console.error('Map container not found');
        return;
      }

      // Wait for Leaflet to load
      if (typeof L === 'undefined') {
        console.warn('Leaflet not loaded, using iframe fallback');
        if (this.els.mapFrame) {
          this.els.mapFrame.style.display = 'block';
          this.els.mapContainer.style.display = 'none';
        }
        return;
      }

      try {
        // Hide iframe, show Leaflet map
        if (this.els.mapFrame) {
          this.els.mapFrame.style.display = 'none';
        }
        this.els.mapContainer.style.display = 'block';

        // Destroy existing map if any
        if (this.map) {
          this.map.remove();
          this.map = null;
        }

        // Initialize map centered on Bangalore
        this.map = L.map('mapContainer', {
          zoomControl: false,
          attributionControl: true,
          center: [12.9716, 77.5946],
          zoom: 13,
          minZoom: 10,
          maxZoom: 19
        });

        const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        });
        const detailLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap, HOT',
          maxZoom: 20
        });
        const nightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CartoDB',
          maxZoom: 19
        });

        standardLayer.addTo(this.map);

        const baseLayers = {
          'Standard': standardLayer,
          'City Detail': detailLayer,
          'Night Rider': nightLayer
        };

        L.control.layers(baseLayers, {}, { position: 'topright', collapsed: true }).addTo(this.map);
        L.control.zoom({ position: 'topright' }).addTo(this.map);

        // Add scale control
        L.control.scale({ metric: true, imperial: false }).addTo(this.map);

        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
        // Fallback to iframe
        if (this.els.mapFrame) {
          this.els.mapFrame.style.display = 'block';
          this.els.mapContainer.style.display = 'none';
        }
      }
    },

    updateMapWithRoutes(routes, start, destination) {
      if (!this.map) {
        // Fallback to iframe
        if (this.els.mapFrame) {
          this.els.mapFrame.style.display = 'block';
          this.els.mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(start + ' to ' + destination)}&output=embed`;
        }
        return;
      }

      // Clear existing route polylines and markers
      this.clearMapRoutes();

      if (!routes || routes.length === 0) {
        this.map.setView([12.9716, 77.5946], 13);
        return;
      }

      // Colors for different routes
      const routeColors = ['#007AFF', '#FF6B35', '#00BCD4', '#4CAF50', '#9C27B0'];
      const bounds = [];

      // Draw each route
      routes.forEach((route, index) => {
        if (!route.polyline || route.polyline.length === 0) return;

        const color = routeColors[index % routeColors.length];

        // Convert polyline coordinates [lat, lng] to Leaflet format [lat, lng]
        let latlngs = route.polyline.map(coord => [coord[0], coord[1]]);

        // Interpolate points for smoother routes (add intermediate points)
        latlngs = this.interpolateRoutePoints(latlngs);

        // Add to bounds
        latlngs.forEach(coord => bounds.push(coord));

        // Simulate traffic levels for each segment (Google Maps style)
        const trafficLevel = this.getTrafficLevel(route, index);
        const trafficColor = this.getTrafficColor(trafficLevel);

        // Create polyline with smooth curve and traffic visualization
        const polyline = L.polyline(latlngs, {
          color: trafficColor,
          weight: 6,
          opacity: 0.85,
          smoothFactor: 2,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(this.map);

        // Add traffic indicator to popup
        const trafficIcon = this.getTrafficIcon(trafficLevel);

        // Add route info popup with traffic info
        polyline.bindPopup(`
          <div style="font-weight:700;margin-bottom:4px">Bus ${route.busNumber}</div>
          <div style="font-size:12px">${this.escapeHtml(route.pickupStop)} → ${this.escapeHtml(route.dropStop)}</div>
          <div style="font-size:11px;color:#666;margin-top:4px">
            Fare: ₹${route.fare} | Traffic: ${trafficIcon} ${trafficLevel}
          </div>
        `);

        // Add start marker
        if (latlngs.length > 0) {
          const startMarker = L.marker(latlngs[0], {
            icon: L.divIcon({
              className: 'route-start-marker',
              html: `<div style="background:${color};color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${route.busNumber}</div>`,
              iconSize: [24, 24]
            })
          }).addTo(this.map);

          startMarker.bindPopup(`<strong>Start:</strong> ${this.escapeHtml(route.pickupStop)}<br>Bus ${route.busNumber}`);
          this.state.routeMarkers.push(startMarker);
        }

        // Add end marker
        if (latlngs.length > 1) {
          const endMarker = L.marker(latlngs[latlngs.length - 1], {
            icon: L.divIcon({
              className: 'route-end-marker',
              html: `<div style="background:${color};color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">✓</div>`,
              iconSize: [24, 24]
            })
          }).addTo(this.map);

          endMarker.bindPopup(`<strong>Destination:</strong> ${this.escapeHtml(route.dropStop)}<br>Bus ${route.busNumber}`);
          this.state.routeMarkers.push(endMarker);
        }

        this.state.routePolylines.push(polyline);
      });

      // Fit map to show all routes
      if (bounds.length > 0) {
        this.map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        this.map.setView([12.9716, 77.5946], 13);
      }
    },

    interpolateRoutePoints(latlngs) {
      // Add intermediate points between each pair for smoother, more accurate routes
      const interpolated = [];
      
      // Ensure coordinates are valid
      const validPoints = latlngs.filter(coord => 
        coord && coord.length === 2 && 
        !isNaN(coord[0]) && !isNaN(coord[1]) &&
        coord[0] > 0 && coord[1] > 0
      );
      
      if (validPoints.length < 2) return validPoints;
      
      for (let i = 0; i < validPoints.length - 1; i++) {
        interpolated.push(validPoints[i]);
        
        const lat1 = validPoints[i][0];
        const lng1 = validPoints[i][1];
        const lat2 = validPoints[i + 1][0];
        const lng2 = validPoints[i + 1][1];
        
        // Calculate distance to determine interpolation points
        const dist = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
        
        // Add more points for longer segments to create smoother curves
        const numPoints = Math.max(3, Math.ceil(dist * 1000)); // At least 3 points, more for longer segments
        
        // Use Bezier-like curve for more natural route appearance
        for (let j = 1; j < numPoints; j++) {
          const t = j / numPoints;
          // Apply slight curve using quadratic interpolation
          const curve = t * t * (3 - 2 * t); // Smoothstep function
          
          interpolated.push([
            lat1 + (lat2 - lat1) * curve,
            lng1 + (lng2 - lng1) * curve
          ]);
        }
      }
      interpolated.push(validPoints[validPoints.length - 1]);
      return interpolated;
    },

    getTrafficLevel(route, index) {
      // Simulate traffic based on route properties and time
      const hour = new Date().getHours();
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      const crowdScore = route?.crowdScore ?? 0.5;
      
      // Combine factors to determine traffic
      let trafficScore = crowdScore;
      if (isRushHour) trafficScore += 0.3;
      if ((route?.speedKmph || 30) < 25) trafficScore += 0.2;
      trafficScore += (index % 3) * 0.05; // vary between segments
      
      if (trafficScore > 0.7) return 'Heavy';
      if (trafficScore > 0.4) return 'Moderate';
      return 'Light';
    },

    getTrafficColor(level) {
      const colors = {
        'Light': '#4CAF50',    // Green
        'Moderate': '#FFC107',  // Yellow/Orange
        'Heavy': '#F44336'      // Red
      };
      return colors[level] || colors['Moderate'];
    },

    getTrafficIcon(level) {
      const icons = {
        'Light': '🟢',
        'Moderate': '🟡',
        'Heavy': '🔴'
      };
      return icons[level] || '🟡';
    },

    updateMapWithRoutesNew(routes, start, destination) {
      if (!this.map) {
        // Fallback to iframe
        if (this.els.mapFrame) {
          this.els.mapFrame.style.display = 'block';
          this.els.mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(start + ' to ' + destination)}&output=embed`;
          this.els.mapContainer.style.display = 'none';
        }
        return;
      }

      // Clear existing routes
      this.clearMapRoutes();

      if (!routes || routes.length === 0) {
        this.map.setView([12.9716, 77.5946], 13);
        return;
      }

      const primaryRoute = routes[0];
      if (!primaryRoute?.polyline || primaryRoute.polyline.length < 2) {
        this.map.setView([12.9716, 77.5946], 13);
        return;
      }

      let latlngs = primaryRoute.polyline.map(coord => [parseFloat(coord[0]), parseFloat(coord[1])]);
      latlngs = latlngs.filter(coord => 
        !isNaN(coord[0]) && !isNaN(coord[1]) &&
        coord[0] >= 12.8 && coord[0] <= 13.1 &&
        coord[1] >= 77.4 && coord[1] <= 77.8
      );

      if (latlngs.length < 2) {
        this.map.setView([12.9716, 77.5946], 13);
        return;
      }

      latlngs = this.interpolateRoutePoints(latlngs);
      const bounds = [...latlngs];

      const trafficSegments = this.buildTrafficSegments(latlngs, primaryRoute);
      trafficSegments.forEach((segment, idx) => {
        const polyline = L.polyline(segment.coords, {
          color: segment.color,
          weight: idx === 0 ? 8 : 7,
          opacity: 0.95,
          smoothFactor: 1,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(this.map);

        polyline.bindPopup(`
          <div style="font-size:12px">
            <strong>Segment Traffic:</strong> ${segment.icon} ${segment.level}<br>
            <span>${this.escapeHtml(primaryRoute.pickupStop)} → ${this.escapeHtml(primaryRoute.dropStop)}</span>
          </div>
        `);

        this.state.routePolylines.push(polyline);
      });

      const startMarker = L.marker(latlngs[0], {
        icon: L.divIcon({
          className: 'route-start-marker',
          html: `<div style="background:#1a73e8;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${primaryRoute.busNumber}</div>`,
          iconSize: [32, 32]
        })
      }).addTo(this.map);

      const endMarker = L.marker(latlngs[latlngs.length - 1], {
        icon: L.divIcon({
          className: 'route-end-marker',
          html: `<div style="background:#10B981;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">✓</div>`,
          iconSize: [32, 32]
        })
      }).addTo(this.map);

      startMarker.bindPopup(`<strong>📍 Start:</strong> ${this.escapeHtml(primaryRoute.pickupStop)}<br><strong>Bus:</strong> ${primaryRoute.busNumber}`);
      endMarker.bindPopup(`<strong>🎯 Destination:</strong> ${this.escapeHtml(primaryRoute.dropStop)}<br><strong>Bus:</strong> ${primaryRoute.busNumber}`);
      this.state.routeMarkers.push(startMarker, endMarker);

      if (this.state.userLocationMarker && this.state.currentPosition) {
        bounds.push([this.state.currentPosition.lat, this.state.currentPosition.lng]);
      }

      const boundsGroup = L.latLngBounds(bounds);
      this.map.fitBounds(boundsGroup, { 
        padding: [80, 80],
        maxZoom: 16
      });

      console.log('Map updated with single highlighted route');
    },

    buildTrafficSegments(latlngs, route) {
      if (latlngs.length < 2) return [];
      const segments = [];
      const totalSegments = Math.max(3, Math.floor(latlngs.length / 20));
      const chunkSize = Math.max(2, Math.floor(latlngs.length / totalSegments));

      for (let i = 0; i < latlngs.length - 1; i += chunkSize) {
        const slice = latlngs.slice(i, Math.min(latlngs.length, i + chunkSize + 1));
        const level = this.getTrafficLevel(route, Math.floor(i / chunkSize));
        segments.push({
          coords: slice,
          level,
          icon: this.getTrafficIcon(level),
          color: this.getTrafficColor(level)
        });
      }

      return segments;
    },

    clearMapRoutes() {
      // Remove all route polylines
      this.state.routePolylines.forEach(polyline => {
        if (this.map && this.map.hasLayer(polyline)) {
          this.map.removeLayer(polyline);
        }
      });
      this.state.routePolylines = [];

      // Remove all route markers
      this.state.routeMarkers.forEach(marker => {
        if (this.map && this.map.hasLayer(marker)) {
          this.map.removeLayer(marker);
        }
      });
      this.state.routeMarkers = [];

      this.clearRoutingControl();
    },

    // ==================== SOS ====================

    async openSOSModal() {
      const sosData = await this.getSOSInfo();
      if (!sosData) {
        alert('Emergency: Call 100, 112, or 1091');
        return;
      }

      const modal = document.getElementById('sosModal');
      if (!modal) {
        // Create SOS modal dynamically
        const sosModal = document.createElement('div');
        sosModal.id = 'sosModal';
        sosModal.className = 'modal active';
        sosModal.innerHTML = `
          <div class="modal-card">
            <div class="modal-header">
              <h3>🚨 Emergency Contacts</h3>
              <button class="close-sos">✕</button>
            </div>
            <div class="sos-content">
              <div class="sos-numbers">
                ${sosData.emergencyNumbers.map(num => `
                  <a href="tel:${num}" class="sos-number-btn">${num}</a>
                `).join('')}
              </div>
              <div class="sos-info">
                <p><strong>Nearby Police:</strong> ${sosData.nearbyPolice}</p>
                <p><strong>Safe Spots:</strong></p>
                <ul>
                  ${sosData.safeSpots.map(spot => `<li>${this.escapeHtml(spot)}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(sosModal);

        sosModal.querySelector('.close-sos').addEventListener('click', () => {
          sosModal.remove();
        });
      } else {
        modal.classList.add('active');
      }
    },

    // ==================== UTILITIES ====================

    openPanel() {
      this.state.panelOpen = true;
      this.els.panel?.classList.add('open');
      this.els.hamburger?.setAttribute('aria-expanded', 'true');
      if (this.els.womenSafetyPanel) this.els.womenSafetyPanel.style.display = 'none';
    },

    closePanel() {
      this.state.panelOpen = false;
      this.els.panel?.classList.remove('open');
      this.els.hamburger?.setAttribute('aria-expanded', 'false');
    },

    showWomenSafety() {
      if (this.els.panel) this.els.panel.classList.add('open');
      if (this.els.womenSafetyPanel) this.els.womenSafetyPanel.style.display = 'block';
    },

    renderContacts() {
      const el = this.els.contactsList;
      if (!el) return;
      el.innerHTML = this.state.contacts.map(c => {
        const safe = String(c).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0">
                  <span>${safe}</span>
                  <button data-contact="${safe}" class="remove-contact-btn">Remove</button>
                </div>`;
      }).join('');
      
      el.querySelectorAll('.remove-contact-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const c = btn.getAttribute('data-contact');
          this.removeContact(c);
        });
      });
    },

    removeContact(c) {
      this.state.contacts = this.state.contacts.filter(x => x !== c);
      this.renderContacts();
    },

    openDetails(route) {
      if (this.els.detailsContent) {
        const crowdIndicator = this.getCrowdIndicator(route.crowdScore);
        this.els.detailsContent.innerHTML = `
          <div class="route-details-full">
            <h4>Bus ${route.busNumber}</h4>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Pickup:</span>
                <span class="detail-value">${this.escapeHtml(route.pickupStop)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Drop:</span>
                <span class="detail-value">${this.escapeHtml(route.dropStop)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Fare:</span>
                <span class="detail-value">₹${route.fare}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Speed:</span>
                <span class="detail-value">${route.speedKmph} km/h</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">On-time Probability:</span>
                <span class="detail-value">${(parseFloat(route.probabilityOnTime || 0) * 100).toFixed(0)}%</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Crowd Score:</span>
                <span class="detail-value">${((route.crowdScore || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div class="crowd-pill">
              <span class="crowd-dot ${crowdIndicator.color}"></span>
              <div>
                <div class="crowd-severity-label">${crowdIndicator.label}</div>
                <div class="stop-time">${crowdIndicator.desc}</div>
              </div>
            </div>
            <div class="crowd-legend">
              <div class="crowd-legend-item"><span class="crowd-dot green"></span><span>Less crowd</span></div>
              <div class="crowd-legend-item"><span class="crowd-dot orange"></span><span>Moderate crowd</span></div>
              <div class="crowd-legend-item"><span class="crowd-dot red"></span><span>Heavy crowd</span></div>
            </div>
            <div style="margin-top:16px">
              <h5>Pickup ETA: ${this.formatTime(route.pickupETA)}</h5>
              <h5>Drop ETA: ${this.formatTime(route.dropETA)}</h5>
            </div>
          </div>
        `;
      }

      if (this.els.detailsModal) {
        this.els.detailsModal.classList.add('active');
        this.els.detailsModal.setAttribute('aria-hidden', 'false');
      }
    },

    closeDetails() {
      if (this.els.detailsModal) this.els.detailsModal.classList.remove('active');
    },

    setupVoice() {
      const micBtn = this.els.micBtn;
      const voiceStatus = this.els.voiceStatus;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition || !micBtn) {
        if (micBtn) micBtn.style.display = 'none';
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        micBtn.classList.add('listening');
        if (voiceStatus) voiceStatus.textContent = "Listening... Say 'From X to Y'";
      };
      recognition.onend = () => {
        micBtn.classList.remove('listening');
        if (voiceStatus) voiceStatus.textContent = "";
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (voiceStatus) voiceStatus.textContent = `Heard: "${transcript}"`;
        this.parseVoice(transcript);
      };

      micBtn.addEventListener('click', () => {
        if (micBtn.classList.contains('listening')) recognition.stop();
        else recognition.start();
      });

      this.recognition = recognition;
    },

    parseVoice(text) {
      if (!text) return;
      const lower = text.toLowerCase();
      if (lower.includes(' to ')) {
        const parts = text.split(/ to /i);
        if (parts.length >= 2) {
          if (this.els.startInput) this.els.startInput.value = this.capitalize(parts[0].trim());
          if (this.els.destInput) this.els.destInput.value = this.capitalize(parts[1].trim());
          if (this.els.findBtn) this.els.findBtn.click();
        }
      } else {
        if (this.els.startInput) this.els.startInput.value = text;
        if (this.els.voiceStatus) this.els.voiceStatus.textContent = "Could not find 'to'. Try 'Majestic to Whitefield'";
      }
    },

    speak(text) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    },

    setLanguage(code) {
      const flagMap = {
        en: 'https://flagcdn.com/w20/gb.png',
        hi: 'https://flagcdn.com/w20/in.png',
        kn: 'https://flagcdn.com/w20/in.png'
      };
      if (this.els.langLabel) this.els.langLabel.textContent = (code || 'en').toUpperCase();
      if (this.els.langFlag) this.els.langFlag.src = flagMap[code] || 'https://flagcdn.com/w20/in.png';
    },

    formatTime(isoString) {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    },

    showLoading(message) {
      // Simple loading indicator
      if (this.els.resultsContainer) {
        this.els.resultsContainer.innerHTML = `<div class="loading">${message}</div>`;
      }
    },

    hideLoading() {
      // Loading will be replaced by results
    },

    capitalize(s) {
      if (!s) return s;
      return s.charAt(0).toUpperCase() + s.slice(1);
    },

    escapeHtml(str) {
      if (typeof str !== 'string') return str;
      return str.replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
      });
    },

    // ==================== NOTIFICATIONS ====================

    setupNotificationHandlers() {
      // Close notification
      this.els.closeNotification?.addEventListener('click', () => {
        this.hideAINotification();
      });

      // Accept notification
      this.els.acceptNotification?.addEventListener('click', () => {
        this.hideAINotification();
      });

      // Mute button
      const muteBtn = document.getElementById('muteNotification');
      if (muteBtn) {
        muteBtn.addEventListener('click', () => {
          this.state.notificationsMuted = !this.state.notificationsMuted;
          muteBtn.textContent = this.state.notificationsMuted ? '🔔' : '🔕';
          muteBtn.title = this.state.notificationsMuted ? 'Unmute notifications' : 'Mute notifications';
          
          // Show feedback
          if (this.state.notificationsMuted) {
            this.showAINotification('Notifications muted', '', '');
            setTimeout(() => this.hideAINotification(), 2000);
          }
        });
      }
    },

    showAINotification(aiText, start, destination) {
      // Don't show if muted
      if (this.state.notificationsMuted) return;
      if (!this.els.aiNotification || !this.els.notificationBody) return;

      // Get practical 1-line suggestion based on routes
      const routes = this.state.currentRoutes || [];
      let practicalMessage = '';

      if (routes && routes.length > 0) {
        const bestRoute = routes[0];
        const pickupTime = new Date(bestRoute.pickupETA);
        const now = new Date();
        const minutesUntilBus = Math.max(0, Math.round((pickupTime - now) / 60000));

        if (minutesUntilBus <= 1) {
          practicalMessage = `🚌 Bus ${bestRoute.busNumber} arriving in less than a minute!`;
        } else if (minutesUntilBus <= 3) {
          practicalMessage = `🚌 Bus ${bestRoute.busNumber} on the way - ${minutesUntilBus} min away`;
        } else if (minutesUntilBus <= 5) {
          practicalMessage = `🚌 Bus ${bestRoute.busNumber} arriving in ${minutesUntilBus} minutes`;
        } else {
          practicalMessage = `✅ Best route found! Bus ${bestRoute.busNumber} arriving in ${minutesUntilBus} min`;
        }
      } else {
        // Fallback to AI text if no routes
        const firstLine = aiText.split(/[.\n]/)[0].trim().substring(0, 80);
        practicalMessage = firstLine + (aiText.length > 80 ? '...' : '');
      }

      // Format notification content - 1 line only
      this.els.notificationBody.innerHTML = `
        <div class="notification-text">${this.escapeHtml(practicalMessage)}</div>
      `;

      // Show notification with animation
      this.els.aiNotification.classList.add('show');
      
      // Auto-hide after 6 seconds
      setTimeout(() => {
        this.hideAINotification();
      }, 6000);
    },

    showBusNotifications(routes) {
      if (this.state.notificationsMuted || !routes || routes.length === 0) return;
      
      // Find the best/fastest route
      const bestRoute = routes[0]; // First route is usually recommended
      
      if (!bestRoute) return;

      // Calculate ETA in minutes
      const pickupTime = new Date(bestRoute.pickupETA);
      const now = new Date();
      const minutesUntilBus = Math.max(1, Math.round((pickupTime - now) / 60000));

      let message = '';
      if (minutesUntilBus <= 1) {
        message = `🚌 Bus ${bestRoute.busNumber} arriving in less than a minute!`;
      } else if (minutesUntilBus <= 3) {
        message = `🚌 Bus ${bestRoute.busNumber} on the way - arriving in ${minutesUntilBus} minutes`;
      } else if (minutesUntilBus <= 5) {
        message = `🚌 Bus ${bestRoute.busNumber} arriving in ${minutesUntilBus} minutes`;
      } else {
        message = `🚌 Bus ${bestRoute.busNumber} arriving in ${minutesUntilBus} minutes - Fastest route available`;
      }

      if (!this.els.aiNotification || !this.els.notificationBody) return;

      this.els.notificationBody.innerHTML = `
        <div class="notification-text">${message}</div>
        <div class="notification-hint">📍 ${this.escapeHtml(bestRoute.pickupStop)} → ${this.escapeHtml(bestRoute.dropStop)}</div>
      `;

      this.els.aiNotification.classList.add('show');
      
      // Auto-hide after 6 seconds
      setTimeout(() => {
        this.hideAINotification();
      }, 6000);
    },

    hideAINotification() {
      if (this.els.aiNotification) {
        this.els.aiNotification.classList.remove('show');
      }
    },

    // ==================== TIME BADGE ====================

    updateTimeBadge(meta, routes) {
      const badge = document.getElementById('timeBadge');
      const bestTimeEl = document.getElementById('bestTime');
      const onTimeProbEl = document.getElementById('onTimeProb');

      if (!badge || !bestTimeEl || !onTimeProbEl) return;

      // Calculate best time to leave
      const bestTimeMinutes = meta.bestTimeToLeaveMinutes || 10;
      const now = new Date();
      const leaveTime = new Date(now.getTime() + bestTimeMinutes * 60000);
      
      const timeStr = leaveTime.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      // Calculate overall on-time probability from routes
      let totalProb = 0;
      if (routes && routes.length > 0) {
        routes.forEach(r => {
          totalProb += parseFloat(r.probabilityOnTime || 0.75);
        });
        totalProb = Math.round((totalProb / routes.length) * 100);
      } else {
        totalProb = Math.round(parseFloat(meta.safetyIndex || 0.75) * 100);
      }

      bestTimeEl.textContent = timeStr;
      onTimeProbEl.textContent = `${totalProb}%`;

      badge.style.display = 'flex';
    },

    // ==================== CHARTS ====================

    updateCharts(routes) {
      if (!routes || routes.length === 0) return;

      const statsPanel = document.getElementById('statsPanel');
      if (!statsPanel) return;

      statsPanel.style.display = 'block';

      // Traffic Density Chart
      this.drawTrafficChart(routes);
      
      // Probability Chart
      this.drawProbabilityChart(routes);
    },

    drawTrafficChart(routes) {
      const canvas = document.getElementById('trafficChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;

      // Calculate traffic distribution
      let light = 0, moderate = 0, heavy = 0;
      routes.forEach(route => {
        const level = this.getTrafficLevel(route, 0);
        if (level === 'Light') light++;
        else if (level === 'Moderate') moderate++;
        else heavy++;
      });

      const total = routes.length;
      const lightPercent = (light / total) * 100;
      const moderatePercent = (moderate / total) * 100;
      const heavyPercent = (heavy / total) * 100;

      // Draw pie chart
      let currentAngle = -Math.PI / 2;
      
      // Light (Green)
      if (lightPercent > 0) {
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + (lightPercent / 100) * 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        currentAngle += (lightPercent / 100) * 2 * Math.PI;
      }

      // Moderate (Yellow)
      if (moderatePercent > 0) {
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + (moderatePercent / 100) * 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        currentAngle += (moderatePercent / 100) * 2 * Math.PI;
      }

      // Heavy (Red)
      if (heavyPercent > 0) {
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + (heavyPercent / 100) * 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }

      // Add legend
      ctx.font = '10px Arial';
      ctx.fillStyle = '#333';
      ctx.fillText(`Light: ${Math.round(lightPercent)}%`, 10, canvas.height - 40);
      ctx.fillText(`Moderate: ${Math.round(moderatePercent)}%`, 10, canvas.height - 25);
      ctx.fillText(`Heavy: ${Math.round(heavyPercent)}%`, 10, canvas.height - 10);
    },

    drawProbabilityChart(routes) {
      const canvas = document.getElementById('probabilityChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;

      // Calculate average probability
      let totalProb = 0;
      routes.forEach(r => {
        totalProb += parseFloat(r.probabilityOnTime || 0.75);
      });
      const avgProb = totalProb / routes.length;
      const probPercent = Math.round(avgProb * 100);

      // Draw circle background
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 7, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw probability arc
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (avgProb * 2 * Math.PI);
      
      ctx.strokeStyle = avgProb > 0.7 ? '#4CAF50' : avgProb > 0.5 ? '#FFC107' : '#F44336';
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 7, startAngle, endAngle);
      ctx.stroke();

      // Add percentage text
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${probPercent}%`, centerX, centerY + 8);

      ctx.font = '11px Arial';
      ctx.fillText('On-Time', centerX, centerY + 25);
    }
  };

  // Expose for debug
  window.App = App;

  // Bootstrap
  document.addEventListener('DOMContentLoaded', () => App.init());
})();