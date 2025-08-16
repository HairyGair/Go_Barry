// backend/services/roadworksService.js
// Service for fetching and managing roadworks data

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

class RoadworksService {
  async getActiveRoadworks() {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase not configured, returning empty roadworks');
        return [];
      }

      // Fetch active roadworks from Supabase
      const { data, error } = await supabase
        .from('streetworks')
        .select('*')
        .or('actual_end_date_time.is.null,actual_end_date_time.gt.now()')
        .order('severity', { ascending: false })
        .order('actual_start_date_time', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Supabase roadworks error:', error);
        return [];
      }

      // Transform to consistent format
      return data.map(rw => ({
        id: rw.id,
        permitReferenceNumber: rw.permit_reference_number,
        streetName: rw.street_name,
        town: rw.town,
        location: rw.area_name || rw.street_name,
        workDescription: rw.work_description,
        description: rw.description,
        severity: this.calculateSeverity(rw),
        coordinates: rw.coordinates ? {
          lat: rw.coordinates.latitude || rw.coordinates.lat,
          lng: rw.coordinates.longitude || rw.coordinates.lng
        } : null,
        actualStartDateTime: rw.actual_start_date_time,
        actualEndDateTime: rw.actual_end_date_time,
        proposedStartDateTime: rw.proposed_start_date_time,
        proposedEndDateTime: rw.proposed_end_date_time,
        trafficManagementType: rw.traffic_management_type,
        affectedRoutes: rw.affected_routes || [],
        source: 'street_manager'
      }));

    } catch (error) {
      console.error('❌ Roadworks service error:', error);
      return [];
    }
  }

  calculateSeverity(roadwork) {
    // Determine severity based on traffic management type and other factors
    const highSeverityTypes = [
      'road_closure',
      'contraflow',
      'lane_closure',
      'multi_way_signals'
    ];
    
    const mediumSeverityTypes = [
      'two_way_signals',
      'priority_working',
      'give_and_take'
    ];

    const tmType = roadwork.traffic_management_type?.toLowerCase();
    
    if (highSeverityTypes.some(type => tmType?.includes(type))) {
      return 'high';
    }
    
    if (mediumSeverityTypes.some(type => tmType?.includes(type))) {
      return 'medium';
    }
    
    return 'low';
  }
}

export default new RoadworksService();
export { RoadworksService };
