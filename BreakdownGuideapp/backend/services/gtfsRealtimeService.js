/**
 * GTFS Realtime Service
 * Polls the Bus Open Data Service (BODS) GTFS-RT feed for Go North East
 * vehicle positions and trip updates.
 *
 * BODS converts SIRI-VM data from operators into GTFS-RT format.
 * API docs: https://data.bus-data.dft.gov.uk/guidance/requirements/?section=api
 *
 * Requires BODS_API_KEY in .env (free registration at data.bus-data.dft.gov.uk)
 */

import https from 'https';

const BODS_API_BASE = 'https://data.bus-data.dft.gov.uk/api/v1';
const GO_NORTH_EAST_NOC = 'GNEL'; // National Operator Code for Go North East
const POLL_INTERVAL = 30000; // 30 seconds

class GtfsRealtimeService {
  constructor() {
    this.vehiclePositions = new Map(); // vehicleId -> position data
    this.lastUpdate = null;
    this.polling = false;
    this.pollTimer = null;
    this.apiKey = process.env.BODS_API_KEY || '';
  }

  /**
   * Start polling for vehicle positions
   */
  start() {
    if (!this.apiKey) {
      console.warn('GTFS-RT: No BODS_API_KEY configured — real-time feed disabled');
      return;
    }
    if (this.polling) return;

    console.log('GTFS-RT: Starting vehicle position polling (every 30s)');
    this.polling = true;
    this.poll();
    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL);
  }

  /**
   * Stop polling
   */
  stop() {
    this.polling = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Fetch latest vehicle positions from BODS GTFS-RT feed
   */
  async poll() {
    try {
      // BODS SIRI-VM endpoint returns XML with vehicle positions
      // Filtering by operatorRef for Go North East (GNEL)
      const url = `${BODS_API_BASE}/datafeed/?operatorRef=${GO_NORTH_EAST_NOC}&api_key=${this.apiKey}`;
      const xml = await this.fetchText(url);

      // Parse SIRI-VM XML for VehicleActivity elements
      // Using regex extraction (no XML parser dependency needed on cPanel)
      const vehicleActivities = xml.match(/<VehicleActivity>[\s\S]*?<\/VehicleActivity>/g) || [];
      let updated = 0;

      for (const activity of vehicleActivities) {
        const vehicleId = this.extractXml(activity, 'VehicleRef');
        const lat = parseFloat(this.extractXml(activity, 'Latitude'));
        const lng = parseFloat(this.extractXml(activity, 'Longitude'));

        if (!vehicleId || isNaN(lat) || isNaN(lng)) continue;

        this.vehiclePositions.set(vehicleId, {
          vehicleId,
          tripId: this.extractXml(activity, 'DatedVehicleJourneyRef') || null,
          routeId: this.extractXml(activity, 'LineRef') || null,
          lineName: this.extractXml(activity, 'PublishedLineName') || null,
          origin: this.extractXml(activity, 'OriginName') || null,
          destination: this.extractXml(activity, 'DestinationName') || null,
          latitude: lat,
          longitude: lng,
          bearing: parseFloat(this.extractXml(activity, 'Bearing')) || null,
          timestamp: this.extractXml(activity, 'RecordedAtTime') || new Date().toISOString(),
          operatorRef: this.extractXml(activity, 'OperatorRef') || GO_NORTH_EAST_NOC,
        });
        updated++;
      }

      this.lastUpdate = new Date().toISOString();
      if (updated > 0) {
        console.log(`GTFS-RT: Updated ${updated} vehicle positions from SIRI-VM`);
      }

      // Prune stale positions (older than 5 minutes)
      const cutoff = Date.now() - 300000;
      for (const [id, pos] of this.vehiclePositions) {
        if (new Date(pos.timestamp).getTime() < cutoff) {
          this.vehiclePositions.delete(id);
        }
      }
    } catch (error) {
      console.error('GTFS-RT poll error:', error.message);
    }
  }

  /**
   * Get vehicles near a location (for breakdown impact analysis)
   * @param {number} lat - Breakdown latitude
   * @param {number} lng - Breakdown longitude
   * @param {number} radiusKm - Search radius in km (default 1)
   * @returns {Array} Nearby vehicles with trip info
   */
  getVehiclesNear(lat, lng, radiusKm = 1) {
    const results = [];
    for (const pos of this.vehiclePositions.values()) {
      if (!pos.latitude || !pos.longitude) continue;
      const dist = this.haversine(lat, lng, pos.latitude, pos.longitude);
      if (dist <= radiusKm) {
        results.push({ ...pos, distance_km: Math.round(dist * 100) / 100 });
      }
    }
    return results.sort((a, b) => a.distance_km - b.distance_km);
  }

  /**
   * Get affected trips near a breakdown
   * @param {number} lat - Breakdown latitude
   * @param {number} lng - Breakdown longitude
   * @param {number} radiusKm - Search radius
   * @returns {Object} Summary of affected vehicles/trips
   */
  getAffectedTrips(lat, lng, radiusKm = 1) {
    const nearby = this.getVehiclesNear(lat, lng, radiusKm);
    const lineNames = [...new Set(nearby.map(v => v.lineName).filter(Boolean))];
    const routeIds = [...new Set(nearby.map(v => v.routeId).filter(Boolean))];
    return {
      affected_vehicles: nearby.length,
      affected_routes: lineNames.length || routeIds.length,
      routes: lineNames.length > 0 ? lineNames : routeIds,
      vehicles: nearby,
      last_update: this.lastUpdate,
      is_live: this.polling && this.lastUpdate !== null,
    };
  }

  /**
   * Get service status summary
   */
  getStatus() {
    return {
      active: this.polling,
      api_key_configured: !!this.apiKey,
      total_vehicles: this.vehiclePositions.size,
      last_update: this.lastUpdate,
    };
  }

  /**
   * Haversine distance in km
   */
  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Extract text content from an XML tag (simple regex, no parser needed)
   */
  extractXml(xml, tag) {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
    return match ? match[1].trim() : null;
  }

  /**
   * Fetch text via https (cPanel-compatible, no fetch)
   */
  fetchText(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 15000 }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }
}

const gtfsRealtimeService = new GtfsRealtimeService();
export default gtfsRealtimeService;
