// serviceFrequencyAnalyzer.js
// Analyzes GTFS data to determine service frequency for routes

import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ServiceFrequencyAnalyzer {
    constructor() {
        this.routeFrequencies = new Map();
        this.isInitialized = false;
        this.lastAnalysis = null;
    }

    async initialize() {
        if (this.isInitialized && this.lastAnalysis && 
            (Date.now() - this.lastAnalysis < 3600000)) { // Cache for 1 hour
            return;
        }

        console.log('🚌 Initializing Service Frequency Analyzer...');
        
        try {
            // Load required GTFS files
            const [trips, stopTimes, calendar] = await Promise.all([
                this.loadCSV('trips.txt'),
                this.loadCSV('stop_times.txt'),
                this.loadCSV('calendar.txt')
            ]);

            // Analyze frequencies
            await this.analyzeFrequencies(trips, stopTimes, calendar);
            
            this.isInitialized = true;
            this.lastAnalysis = Date.now();
            
            console.log(`✅ Service Frequency Analysis complete: ${this.routeFrequencies.size} routes analyzed`);
        } catch (error) {
            console.error('❌ Error initializing Service Frequency Analyzer:', error);
            throw error;
        }
    }

    async loadCSV(filename) {
        const filePath = path.join(__dirname, '../data', filename);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
        
        return records;
    }

    async analyzeFrequencies(trips, stopTimes, calendar) {
        // Get current day of week
        const today = new Date();
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
        
        // Filter active services for today
        const activeServices = new Set(
            calendar
                .filter(cal => cal[dayName] === '1')
                .map(cal => cal.service_id)
        );

        // Group trips by route and service
        const routeTrips = new Map();
        
        for (const trip of trips) {
            if (!activeServices.has(trip.service_id)) continue;
            
            const routeId = trip.route_id;
            if (!routeTrips.has(routeId)) {
                routeTrips.set(routeId, []);
            }
            routeTrips.get(routeId).push(trip.trip_id);
        }

        // Analyze departure times for each route
        for (const [routeId, tripIds] of routeTrips) {
            const departures = [];
            
            // Get first stop departure time for each trip
            for (const tripId of tripIds) {
                const firstStop = stopTimes.find(st => 
                    st.trip_id === tripId && st.stop_sequence === '1'
                );
                
                if (firstStop && firstStop.departure_time) {
                    departures.push(this.timeToMinutes(firstStop.departure_time));
                }
            }
            
            if (departures.length > 0) {
                departures.sort((a, b) => a - b);
                
                // Calculate frequencies for different time periods
                const frequencies = {
                    peak: this.calculatePeriodFrequency(departures, 7 * 60, 9 * 60), // 7am-9am
                    midday: this.calculatePeriodFrequency(departures, 10 * 60, 14 * 60), // 10am-2pm
                    evening: this.calculatePeriodFrequency(departures, 17 * 60, 19 * 60), // 5pm-7pm
                    overall: this.calculateOverallFrequency(departures),
                    totalTrips: departures.length,
                    firstDeparture: this.minutesToTime(Math.min(...departures)),
                    lastDeparture: this.minutesToTime(Math.max(...departures))
                };
                
                this.routeFrequencies.set(routeId, frequencies);
            }
        }
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    calculatePeriodFrequency(departures, startMinutes, endMinutes) {
        const periodDepartures = departures.filter(d => d >= startMinutes && d <= endMinutes);
        
        if (periodDepartures.length < 2) {
            return null;
        }
        
        // Calculate average headway
        const gaps = [];
        for (let i = 1; i < periodDepartures.length; i++) {
            gaps.push(periodDepartures[i] - periodDepartures[i - 1]);
        }
        
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        
        return {
            avgMinutes: Math.round(avgGap),
            tripsInPeriod: periodDepartures.length,
            category: this.categorizeFrequency(avgGap)
        };
    }

    calculateOverallFrequency(departures) {
        if (departures.length < 2) {
            return { category: 'infrequent', avgMinutes: null };
        }
        
        // Service span in hours
        const serviceSpan = (departures[departures.length - 1] - departures[0]) / 60;
        const tripsPerHour = departures.length / serviceSpan;
        const avgMinutes = 60 / tripsPerHour;
        
        return {
            avgMinutes: Math.round(avgMinutes),
            tripsPerHour: Math.round(tripsPerHour * 10) / 10,
            category: this.categorizeFrequency(avgMinutes)
        };
    }

    categorizeFrequency(minutes) {
        if (minutes <= 10) return 'high-frequency';
        if (minutes <= 20) return 'frequent';
        if (minutes <= 30) return 'moderate';
        if (minutes <= 60) return 'hourly';
        return 'infrequent';
    }

    getRouteFrequency(routeId) {
        if (!this.isInitialized) {
            return null;
        }
        return this.routeFrequencies.get(routeId);
    }

    getMultipleRouteFrequencies(routeIds) {
        const results = {};
        for (const routeId of routeIds) {
            const freq = this.getRouteFrequency(routeId);
            if (freq) {
                results[routeId] = freq;
            }
        }
        return results;
    }

    getFrequencySummary(routeId) {
        const freq = this.getRouteFrequency(routeId);
        if (!freq) return 'Unknown frequency';
        
        const overall = freq.overall;
        if (overall.avgMinutes) {
            if (overall.avgMinutes <= 15) {
                return `every ${overall.avgMinutes} min`;
            } else if (overall.avgMinutes <= 30) {
                return `every ${overall.avgMinutes} min`;
            } else if (overall.avgMinutes <= 60) {
                return `every ${overall.avgMinutes} min`;
            } else {
                return `${overall.tripsPerHour} per hour`;
            }
        }
        
        return `${freq.totalTrips} trips/day`;
    }

    getImpactScore(routeIds) {
        // Calculate impact score based on frequency
        let totalScore = 0;
        let routeCount = 0;
        
        for (const routeId of routeIds) {
            const freq = this.getRouteFrequency(routeId);
            if (freq && freq.overall) {
                const categoryScores = {
                    'high-frequency': 10,
                    'frequent': 7,
                    'moderate': 5,
                    'hourly': 3,
                    'infrequent': 1
                };
                
                totalScore += categoryScores[freq.overall.category] || 1;
                routeCount++;
            }
        }
        
        return {
            score: routeCount > 0 ? Math.round(totalScore / routeCount * 10) / 10 : 0,
            impactLevel: totalScore > 20 ? 'severe' : totalScore > 10 ? 'major' : 'moderate',
            affectedHighFrequency: routeIds.filter(id => {
                const freq = this.getRouteFrequency(id);
                return freq && freq.overall && freq.overall.category === 'high-frequency';
            })
        };
    }
}

// Export singleton instance
export default new ServiceFrequencyAnalyzer();