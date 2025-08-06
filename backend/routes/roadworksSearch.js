import express from 'express';

const router = express.Router();

/**
 * Server-side search endpoint for roadworks
 * Supports searching by location, routes, contractor, and description
 */
router.get('/search', async (req, res) => {
  try {
    const { 
      q: query = '', 
      limit = 20, 
      page = 1,
      compartment = 'all'
    } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    console.log(`🔍 [Roadworks Search] Query: "${query}", Page: ${page}, Limit: ${limit}`);

    // Import dependencies
    const { supabase } = await import('../services/supabaseHelper.js');
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const searchTerm = query.toLowerCase();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Try Supabase first
    let roadworks = [];
    let totalCount = 0;

    try {
      // Build search query for Supabase
      let searchQuery = supabase
        .from('streetworks')
        .select('*', { count: 'exact' });

      // Search across multiple fields using OR conditions
      searchQuery = searchQuery.or(
        `sm_street_name.ilike.%${searchTerm}%,` +
        `sm_location_description.ilike.%${searchTerm}%,` +
        `sm_town.ilike.%${searchTerm}%,` +
        `sm_promoter_organisation.ilike.%${searchTerm}%,` +
        `sm_works_description.ilike.%${searchTerm}%,` +
        `sm_permit_ref.ilike.%${searchTerm}%`
      );

      // Apply compartment filters
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (compartment) {
        case 'today':
          searchQuery = searchQuery.gte('sm_start_date', today.toISOString());
          searchQuery = searchQuery.lte('sm_start_date', new Date(today.getTime() + 86400000).toISOString());
          break;
        
        case 'week':
          const weekEnd = new Date(today.getTime() + 7 * 86400000);
          searchQuery = searchQuery.gte('sm_start_date', today.toISOString());
          searchQuery = searchQuery.lte('sm_start_date', weekEnd.toISOString());
          break;
        
        case 'major':
          searchQuery = searchQuery.or(
            'sm_works_category.eq.major,' +
            'sm_traffic_management_type.eq.Road closure'
          );
          break;
        
        case 'high-impact':
          // This would need route matching logic
          break;
      }

      // Apply pagination
      searchQuery = searchQuery
        .order('sm_start_date', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      const { data, error, count } = await searchQuery;

      if (error) {
        console.error('Supabase search error:', error);
        throw error;
      }

      roadworks = data || [];
      totalCount = count || 0;

      // Process and enhance results
      roadworks = roadworks.map(item => ({
        ...item,
        id: item.id || item.sm_permit_ref,
        street_name: item.sm_street_name,
        location_description: item.sm_location_description,
        start_date: item.sm_start_date,
        end_date: item.sm_end_date,
        // Calculate match score for relevance ranking
        matchScore: calculateMatchScore(item, searchTerm)
      }));

      // Sort by relevance (match score)
      roadworks.sort((a, b) => b.matchScore - a.matchScore);

    } catch (supabaseError) {
      console.error('Supabase search failed, trying JSON fallback:', supabaseError);

      // Fallback to JSON file search
      try {
        const dataPath = path.join(__dirname, '..', 'data', 'unified_roadworks.json');
        const fileExists = await fs.access(dataPath).then(() => true).catch(() => false);

        if (fileExists) {
          const fileContent = await fs.readFile(dataPath, 'utf8');
          const allRoadworks = JSON.parse(fileContent);

          // Filter by search term
          roadworks = allRoadworks.filter(item => {
            const searchFields = [
              item.sm_street_name,
              item.sm_location_description,
              item.sm_town,
              item.sm_promoter_organisation,
              item.sm_works_description,
              item.sm_permit_ref,
              item.affectedRoutes?.join(' ')
            ].filter(Boolean).join(' ').toLowerCase();

            return searchFields.includes(searchTerm);
          });

          // Apply compartment filters
          roadworks = filterByCompartment(roadworks, compartment);

          totalCount = roadworks.length;

          // Apply pagination
          roadworks = roadworks.slice(offset, offset + parseInt(limit));
        }
      } catch (fileError) {
        console.error('JSON fallback search failed:', fileError);
      }
    }

    // Check for route number searches
    if (roadworks.length === 0 && /^\d+[a-zA-Z]?$/.test(query)) {
      // Looks like a route number, do special route search
      roadworks = await searchByRoute(query, limit, offset);
      totalCount = roadworks.length;
    }

    console.log(`✅ [Roadworks Search] Found ${roadworks.length} results for "${query}"`);

    res.json({
      success: true,
      roadworks,
      totalCount,
      metadata: {
        query,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: totalCount > offset + roadworks.length,
        compartment
      }
    });

  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * Calculate relevance score for search results
 */
function calculateMatchScore(item, searchTerm) {
  let score = 0;
  const term = searchTerm.toLowerCase();

  // Exact matches get highest scores
  if (item.sm_street_name?.toLowerCase() === term) score += 100;
  if (item.sm_permit_ref?.toLowerCase() === term) score += 90;

  // Partial matches in important fields
  if (item.sm_street_name?.toLowerCase().includes(term)) score += 50;
  if (item.sm_location_description?.toLowerCase().includes(term)) score += 40;
  if (item.sm_town?.toLowerCase().includes(term)) score += 30;
  
  // Matches in less important fields
  if (item.sm_promoter_organisation?.toLowerCase().includes(term)) score += 20;
  if (item.sm_works_description?.toLowerCase().includes(term)) score += 15;

  // Boost score for current/upcoming works
  const now = new Date();
  const startDate = new Date(item.sm_start_date);
  const endDate = new Date(item.sm_end_date);
  
  if (startDate <= now && endDate >= now) score += 25; // Currently active
  if (startDate > now && startDate < new Date(now.getTime() + 7 * 86400000)) score += 15; // Starting soon

  // Boost for high-impact works
  if (item.sm_traffic_management_type === 'Road closure') score += 30;
  if (item.sm_works_category === 'major') score += 20;
  if (item.affectedRoutes?.length > 3) score += 15;

  return score;
}

/**
 * Filter roadworks by compartment
 */
function filterByCompartment(roadworks, compartment) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (compartment) {
    case 'today':
      return roadworks.filter(item => {
        const startDate = new Date(item.sm_start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate.getTime() === today.getTime();
      });

    case 'week':
      const weekEnd = new Date(today.getTime() + 7 * 86400000);
      return roadworks.filter(item => {
        const startDate = new Date(item.sm_start_date);
        return startDate >= today && startDate <= weekEnd;
      });

    case 'major':
      return roadworks.filter(item => 
        item.sm_works_category === 'major' || 
        item.sm_traffic_management_type === 'Road closure'
      );

    case 'high-impact':
      return roadworks.filter(item => 
        item.affectedRoutes?.length >= 3
      );

    default:
      return roadworks;
  }
}

/**
 * Special search for route numbers
 */
async function searchByRoute(routeNumber, limit, offset) {
  try {
    const { supabase } = await import('../services/supabaseHelper.js');
    
    // Search for roadworks affecting this route
    const { data, error } = await supabase
      .from('streetworks')
      .select('*')
      .contains('affectedRoutes', [routeNumber])
      .order('sm_start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Route search failed:', error);
    return [];
  }
}

/**
 * Autocomplete endpoint for search suggestions
 */
router.get('/search/autocomplete', async (req, res) => {
  try {
    const { q: query = '' } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const { supabase } = await import('../services/supabaseHelper.js');
    const searchTerm = query.toLowerCase();

    // Get unique street names for autocomplete
    const { data } = await supabase
      .from('streetworks')
      .select('sm_street_name, sm_town')
      .ilike('sm_street_name', `${searchTerm}%`)
      .limit(10);

    const suggestions = [...new Set(data?.map(item => 
      item.sm_town ? `${item.sm_street_name}, ${item.sm_town}` : item.sm_street_name
    ))].filter(Boolean).slice(0, 10);

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Autocomplete error:', error);
    res.json({ success: true, suggestions: [] });
  }
});

export default router;