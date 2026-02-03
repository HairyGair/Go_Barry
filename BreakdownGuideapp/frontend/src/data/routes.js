// the operator GTFS Routes Data
// Processed from GTFS routes.txt file for enhanced route information and lookups
// Last updated: 2025-09-25

// Parse and enhance GTFS routes data
const parseRoutes = () => {
  const routesData = `route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color
ANUM:ANEO306:306,ANUM,306,,,3,,FFFFFF,000000
ANUM:ANEO308:308,ANUM,308,,,3,,FFFFFF,000000
GNE:GOAO002:2,GNE,2,,,3,,FFFFFF,000000
GNE:GOAO004:4,GNE,4,,,3,,FFFFFF,000000
GNE:GOAO006:6,GNE,6,,,3,,FFFFFF,000000
GNE:GOAO008:8,GNE,8,,,3,,FFFFFF,000000
GNE:GOAO008A:8A,GNE,8A,,,3,,FFFFFF,000000
GNE:GOAO009:9,GNE,9,,,3,,FFFFFF,000000
GNE:GOAO010:10,GNE,10,,,3,,FFFFFF,000000
GNE:GOAO010A:10A,GNE,10A,,,3,,FFFFFF,000000
GNE:GOAO010B:10B,GNE,10B,,,3,,FFFFFF,000000
GNE:GOAO012:12,GNE,12,,,3,,FFFFFF,000000
GNE:GOAO016:16,GNE,16,,,3,,FFFFFF,000000
GNE:GOAO016A:16A,GNE,16A,,,3,,FFFFFF,000000
GNE:GOAO016B:16B,GNE,16B,,,3,,FFFFFF,000000
GNE:GOAO020:20,GNE,20,,,3,,FFFFFF,000000
GNE:GOAO020A:20A,GNE,20A,,,3,,FFFFFF,000000
GNE:GOAO021:21,GNE,21,,,3,,FFFFFF,000000
GNE:GOAO022:22,GNE,22,,,3,,FFFFFF,000000
GNE:GOAO024:24,GNE,24,,,3,,FFFFFF,000000
GNE:GOSO025:25,GNE,25,,,3,,FFFFFF,000000
GNE:GOAO025A:25A,GNE,25A,,,3,,FFFFFF,000000
GNE:GOAO026:26,GNE,26,,,3,,FFFFFF,000000
GNE:GOAO027:27,GNE,27,,,3,,FFFFFF,000000
GNE:GOAO028:28,GNE,28,,,3,,FFFFFF,000000
GNE:GOAO028B:28B,GNE,28B,,,3,,FFFFFF,000000
GNE:GOAO029:29,GNE,29,,,3,,FFFFFF,000000
GNE:GOAO032:32,GNE,32,,,3,,FFFFFF,000000
GNE:GOAO033:33,GNE,33,,,3,,FFFFFF,000000
GNE:GOAO034:34,GNE,34,,,3,,FFFFFF,000000
GNE:GOAO035:35,GNE,35,,,3,,FFFFFF,000000
GNE:GOAO036:36,GNE,36,,,3,,FFFFFF,000000
GNE:GOAO047:47,GNE,47,,,3,,FFFFFF,000000
GNE:GOAO049:49,GNE,49,,,3,,FFFFFF,000000
GNE:GOAO049A:49A,GNE,49A,,,3,,FFFFFF,000000
GNE:GOAO050:50,GNE,50,,,3,,FFFFFF,000000
GNE:GOAO050S:50S,GNE,50S,,,3,,FFFFFF,000000
GNE:GOAO051:51,GNE,51,,,3,,FFFFFF,000000
GNE:GOAO052:52,GNE,52,,,3,,FFFFFF,000000
GNE:GOAO053:53,GNE,53,,,3,,FFFFFF,000000
GNE:GOAO054:54,GNE,54,,,3,,FFFFFF,000000
GNE:GONO054:54N,GNE,54N,,,3,,FFFFFF,000000
GNE:GOAO056:56,GNE,56,,,3,,FFFFFF,000000
GNE:GOAO057:57,GNE,57,,,3,,FFFFFF,000000
GNE:GOAO058:58,GNE,58,,,3,,FFFFFF,000000
GNE:GOAO060:60,GNE,60,,,3,,FFFFFF,000000
GNE:GOAO061:61,GNE,61,,,3,,FFFFFF,000000
GNE:GOAO062:62,GNE,62,,,3,,FFFFFF,000000
GNE:GOAO062A:62A,GNE,62A,,,3,,FFFFFF,000000
GNE:GOAO063:63,GNE,63,,,3,,FFFFFF,000000
GNE:GOAO065:65,GNE,65,,,3,,FFFFFF,000000
GNE:GOAO067:67,GNE,67,,,3,,FFFFFF,000000
GNE:GOAO069:69,GNE,69,,,3,,FFFFFF,000000
GNE:GOAO074:74,GNE,74,,,3,,FFFFFF,000000
GNE:GOAO078:78,GNE,78,,,3,,FFFFFF,000000
GNE:GOAO081:81,GNE,81,,,3,,FFFFFF,000000
GNE:GOAO084:84,GNE,84,,,3,,FFFFFF,000000
GNE:GOAO085:85,GNE,85,,,3,,FFFFFF,000000
GNE:GOAO085A:85A,GNE,85A,,,3,,FFFFFF,000000
GNE:GOAO091:91,GNE,91,,,3,,FFFFFF,000000
GNE:GOAO093:93,GNE,93,,,3,,FFFFFF,000000
GNE:GOAO094:94,GNE,94,,,3,,FFFFFF,000000
GNE:GOAO096:96,GNE,96,,,3,,FFFFFF,000000
GNE:GONO099:99,GNE,99,,,3,,FFFFFF,000000
GNE:GONO103:103,GNE,103,,,3,,FFFFFF,000000
GNE:GONO104:104,GNE,104,,,3,,FFFFFF,000000
GNE:GONO116:116,GNE,116,,,3,,FFFFFF,000000
GNE:GONO135:135,GNE,135,,,3,,FFFFFF,000000
GNE:GONO137:137,GNE,137,,,3,,FFFFFF,000000
GNE:GONO139:139,GNE,139,,,3,,FFFFFF,000000
GNE:GONO140:140,GNE,140,,,3,,FFFFFF,000000
GNE:GONO143:143,GNE,143,,,3,,FFFFFF,000000
GNE:GONO145:145,GNE,145,,,3,,FFFFFF,000000
GNE:GONO154:154,GNE,154,,,3,,FFFFFF,000000
GNE:GONO155:155,GNE,155,,,3,,FFFFFF,000000
GNE:GOAO201:201,GNE,201,,,3,,FFFFFF,000000
GNE:GOAO202:202,GNE,202,,,3,,FFFFFF,000000
GNE:GOAO206:206,GNE,206,,,3,,FFFFFF,000000
GNE:GOAO208:208,GNE,208,,,3,,FFFFFF,000000
GNE:GOAO209:209,GNE,209,,,3,,FFFFFF,000000
GNE:GOAO210:210,GNE,210,,,3,,FFFFFF,000000
GNE:GOAO301:301,GNE,301,,,3,,FFFFFF,000000
GNE:GOAO301A:301A,GNE,301A,,,3,,FFFFFF,000000
GNE:GOAO307:307,GNE,307,,,3,,FFFFFF,000000
GNE:GOAO309:309,GNE,309,,,3,,FFFFFF,000000
GNE:GOAO317:317,GNE,317,,,3,,FFFFFF,000000
GNE:GOAO327:327,GNE,327,,,3,,FFFFFF,000000
GNE:GOAO340:340,GNE,340,,,3,,FFFFFF,000000
GNE:GOAO341:341,GNE,341,,,3,,FFFFFF,000000
GNE:GOAO342:342,GNE,342,,,3,,FFFFFF,000000
GNE:GOAO352:352,GNE,352,,,3,,FFFFFF,000000
GNE:GOAO353:353,GNE,353,,,3,,FFFFFF,000000
GNE:GOAO354:354,GNE,354,,,3,,FFFFFF,000000
GNE:GOAO355:355,GNE,355,,,3,,FFFFFF,000000
GNE:GOAO356:356,GNE,356,,,3,,FFFFFF,000000
GNE:GONO442:442,GNE,442,,,3,,FFFFFF,000000
GNE:GONO444:444,GNE,444,,,3,,FFFFFF,000000
GNE:GONO449:449,GNE,449,,,3,,FFFFFF,000000
GNE:GONO454:454,GNE,454,,,3,,FFFFFF,000000
GNE:GONO457:457,GNE,457,,,3,,FFFFFF,000000
GNE:GONO458:458,GNE,458,,,3,,FFFFFF,000000
GNE:GONO462:462,GNE,462,,,3,,FFFFFF,000000
GNE:GOAO643:643,GNE,643,,,3,,FFFFFF,000000
GNE:GOAO644:644,GNE,644,,,3,,FFFFFF,000000
GNE:GONO673:673,GNE,673,,,3,,FFFFFF,000000
GNE:GONO675:675,GNE,675,,,3,,FFFFFF,000000
GNE:GONO676:676,GNE,676,,,3,,FFFFFF,000000
GNE:GOAO680:680,GNE,680,,,3,,FFFFFF,000000
GNE:GONO680:680N,GNE,680N,,,3,,FFFFFF,000000
GNE:GOAO681:681,GNE,681,,,3,,FFFFFF,000000
GNE:GOAO682:682,GNE,682,,,3,,FFFFFF,000000
GNE:GOAO683:683,GNE,683,,,3,,FFFFFF,000000
GNE:GOAO684:684,GNE,684,,,3,,FFFFFF,000000
GNE:GOAO686:686,GNE,686,,,3,,FFFFFF,000000
GNE:GOAO687:687,GNE,687,,,3,,FFFFFF,000000
GNE:GOAO688:688,GNE,688,,,3,,FFFFFF,000000
GNE:GOAO689:689,GNE,689,,,3,,FFFFFF,000000
GNE:GONO695:695,GNE,695,,,3,,FFFFFF,000000
GNE:GODO700:700,GNE,700,,,3,,FFFFFF,000000
GNE:GODO701:701,GNE,701,,,3,,FFFFFF,000000
GNE:GODO702:702,GNE,702,,,3,,FFFFFF,000000
GNE:GODO703:703,GNE,703,,,3,,FFFFFF,000000
GNE:GODO807:807,GNE,807,,,3,,FFFFFF,000000
GNE:GODO808:808,GNE,808,,,3,,FFFFFF,000000
GNE:GONO819:819,GNE,819,,,3,,FFFFFF,000000
GNE:GONO821:821,GNE,821,,,3,,FFFFFF,000000
GNE:GONO824:824,GNE,824,,,3,,FFFFFF,000000
GNE:GONO830:830,GNE,830,,,3,,FFFFFF,000000
GNE:GONO832:832,GNE,832,,,3,,FFFFFF,000000
GNE:GONO833:833,GNE,833,,,3,,FFFFFF,000000
GNE:GONO838:838,GNE,838,,,3,,FFFFFF,000000
GNE:GONO840:840,GNE,840,,,3,,FFFFFF,000000
GNE:GONO841:841,GNE,841,,,3,,FFFFFF,000000
GNE:GONO842:842,GNE,842,,,3,,FFFFFF,000000
GNE:GONO843:843,GNE,843,,,3,,FFFFFF,000000
GNE:GONO844:844,GNE,844,,,3,,FFFFFF,000000
GNE:GONO845:845,GNE,845,,,3,,FFFFFF,000000
GNE:GONO846:846,GNE,846,,,3,,FFFFFF,000000
GNE:GONO850:850,GNE,850,,,3,,FFFFFF,000000
GNE:GONO854:854,GNE,854,,,3,,FFFFFF,000000
GNE:GONO856:856,GNE,856,,,3,,FFFFFF,000000
GNE:GONO859:859,GNE,859,,,3,,FFFFFF,000000
GNE:GOAO861:861,GNE,861,,,3,,FFFFFF,000000
GNE:GONO861:861N,GNE,861N,,,3,,FFFFFF,000000
GNE:GONO863:863,GNE,863,,,3,,FFFFFF,000000
GNE:GONO864:864,GNE,864,,,3,,FFFFFF,000000
GNE:GONO865:865,GNE,865,,,3,,FFFFFF,000000
GNE:GONO866:866,GNE,866,,,3,,FFFFFF,000000
GNE:GOAO871:871,GNE,871,,,3,,FFFFFF,000000
GNE:GONO873:873,GNE,873,,,3,,FFFFFF,000000
GNE:GONO874:874,GNE,874,,,3,,FFFFFF,000000
GNE:GODO875:875,GNE,875,,,3,,FFFFFF,000000
GNE:GODO876:876,GNE,876,,,3,,FFFFFF,000000
GNE:GONO876:876N,GNE,876N,,,3,,FFFFFF,000000
GNE:GODO877:877,GNE,877,,,3,,FFFFFF,000000
GNE:GONO878:878,GNE,878,,,3,,FFFFFF,000000
GNE:GONO880:880,GNE,880,,,3,,FFFFFF,000000
GNE:GONO881:881,GNE,881,,,3,,FFFFFF,000000
GNE:GONO882:882,GNE,882,,,3,,FFFFFF,000000
GNE:GONO884:884,GNE,884,,,3,,FFFFFF,000000
GNE:GOAO885:885,GNE,885,,,3,,FFFFFF,000000
GNE:GOAO886:886,GNE,886,,,3,,FFFFFF,000000
GNE:GOAO887:887,GNE,887,,,3,,FFFFFF,000000
GNE:GOAO888:888,GNE,888,,,3,,FFFFFF,000000
GNE:GONO889:889,GNE,889,,,3,,FFFFFF,000000
GNE:GONO891:891,GNE,891,,,3,,FFFFFF,000000
GNE:GONO896:896,GNE,896,,,3,,FFFFFF,000000
GNE:GONO898:898,GNE,898,,,3,,FFFFFF,000000
GNE:GONO899:899,GNE,899,,,3,,FFFFFF,000000
GNE:GOAO935:935,GNE,935,,,3,,FFFFFF,000000
GNE:GOAO937:937,GNE,937,,,3,,FFFFFF,000000
GNE:GOAAD122:AD12,GNE,AD12,,,3,,FFFFFF,000000
GNE:GOAH000:H,GNE,H,,,3,,FFFFFF,000000
GNE:GOAN021:N21,GNE,N21,,,3,,FFFFFF,000000
GNE:GOAQ003:Q3,GNE,Q3,,,3,,FFFFFF,000000
GNE:GOAQ003X:Q3X,GNE,Q3X,,,3,,FFFFFF,000000
GNE:GOAR002:R2,GNE,R2,,,3,,FFFFFF,000000
GNE:GOAS002:S2,GNE,S2,,,3,,FFFFFF,000000
GNE:GOASB01:SB1,GNE,SB1,,,3,,FFFFFF,000000
GNE:GOASB02:SB2,GNE,SB2,,,3,,FFFFFF,000000
GNE:GOASB03:SB3,GNE,SB3,,,3,,FFFFFF,000000
GNE:GOASB04:SB4,GNE,SB4,,,3,,FFFFFF,000000
GNE:GOASB05:SB5,GNE,SB5,,,3,,FFFFFF,000000
GNE:GOASB06:SB6,GNE,SB6,,,3,,FFFFFF,000000
GNE:GOASB07:SB7,GNE,SB7,,,3,,FFFFFF,000000
GNE:GOASB08:SB8,GNE,SB8,,,3,,FFFFFF,000000
GNE:GOASB09:SB9,GNE,SB9,,,3,,FFFFFF,000000
GNE:GOASB10:SB10,GNE,SB10,,,3,,FFFFFF,000000
GNE:GOATOON:TOON,GNE,TOON,,,3,,FFFFFF,000000
GNE:GOAV001:V1,GNE,V1,,,3,,FFFFFF,000000
GNE:GOAV002:V2,GNE,V2,,,3,,FFFFFF,000000
GNE:GOAV005:V5,GNE,V5,,,3,,FFFFFF,000000
GNE:GOAX001:X1,GNE,X1,,,3,,FFFFFF,000000
GNE:GOAX001A:X1A,GNE,X1A,,,3,,FFFFFF,000000
GNE:GOAX005:X5,GNE,X5,,,3,,FFFFFF,000000
GNE:GOAX006:X6,GNE,X6,,,3,,FFFFFF,000000
GNE:GOAX010:X10,GNE,X10,,,3,,FFFFFF,000000
GNE:GOAX015:X15,GNE,X15,,,3,,FFFFFF,000000
GNE:GOAX020:X20,GNE,X20,,,3,,FFFFFF,000000
GNE:GOAX021:X21,GNE,X21,,,3,,FFFFFF,000000
GNE:GOAX030:X30,GNE,X30,,,3,,FFFFFF,000000
GNE:GOAX031:X31,GNE,X31,,,3,,FFFFFF,000000
GNE:GOAX032:X32,GNE,X32,,,3,,FFFFFF,000000
GNE:GOAX039:X39,GNE,X39,,,3,,FFFFFF,000000
GNE:GOAX045:X45,GNE,X45,,,3,,FFFFFF,000000
GNE:GOAX050:X50,GNE,X50,,,3,,FFFFFF,000000
GNE:GOAX058:X58,GNE,X58,,,3,,FFFFFF,000000
GNE:GOAX062:X62,GNE,X62,,,3,,FFFFFF,000000
GNE:GOAX066:X66,GNE,X66,,,3,,FFFFFF,000000
GNE:GOAX070:X70,GNE,X70,,,3,,FFFFFF,000000
GNE:GOAX071:X71,GNE,X71,,,3,,FFFFFF,000000
GNE:GOAX071A:X71A,GNE,X71A,,,3,,FFFFFF,000000
GNE:GOAX072:X72,GNE,X72,,,3,,FFFFFF,000000
GNE:GOAX073:X73,GNE,X73,,,3,,FFFFFF,000000
GNE:GOAX085:X85,GNE,X85,,,3,,FFFFFF,000000`;

  const lines = routesData.trim().split('\n');
  const headers = lines[0].split(',');
  const routes = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= headers.length) {
      const route = {
        routeId: values[0],
        agencyId: values[1],
        routeShortName: values[2],
        routeLongName: values[3] || '',
        routeDesc: values[4] || '',
        routeType: parseInt(values[5]) || 3,
        routeUrl: values[6] || '',
        routeColor: values[7] || 'FFFFFF',
        routeTextColor: values[8] || '000000'
      };

      // Add enhanced data
      route.displayName = route.routeShortName;
      route.agency = route.agencyId === 'Go BARRY' ? 'the operator' : 'Arriva Northumbria';
      route.isGNE = route.agencyId === 'Go BARRY';
      route.isArriva = route.agencyId === 'ANUM';

      // Categorize routes
      route.category = categorizeRoute(route.routeShortName);
      route.isExpress = route.routeShortName.startsWith('X');
      route.isLocal = !route.isExpress && !isSpecialRoute(route.routeShortName);
      route.isSpecial = isSpecialRoute(route.routeShortName);

      // Add depot information based on route patterns
      route.depot = getRouteDepot(route.routeId);

      routes.push(route);
    }
  }

  return routes;
};

// Helper functions
const categorizeRoute = (routeName) => {
  if (routeName.startsWith('X')) return 'Express';
  if (routeName.match(/^[0-9]+$/)) return 'Local';
  if (routeName.match(/^[0-9]+[A-Z]$/)) return 'Local Variant';
  if (routeName.match(/^[A-Z][0-9]*$/)) return 'Special';
  if (routeName.match(/^SB[0-9]+$/)) return 'School Bus';
  if (routeName === 'TOON') return 'City Center';
  return 'Other';
};

const isSpecialRoute = (routeName) => {
  return routeName.match(/^(H|N21|Q3|Q3X|R2|S2|SB[0-9]+|TOON|V[0-9]+|AD12)$/);
};

const getRouteDepot = (routeId) => {
  // Extract depot information from route ID patterns
  if (routeId.includes('GOAO')) return 'Saltwell Park'; // Angel of the North routes
  if (routeId.includes('GONO')) return 'Hexham'; // North routes
  if (routeId.includes('GOSO')) return 'Stanley'; // South routes
  if (routeId.includes('GODO')) return 'Durham'; // Durham routes
  if (routeId.includes('ANEO')) return 'Arriva Hexham';
  return 'Unknown';
};

// Process and export routes data
const routesData = parseRoutes();

// Create lookup objects for fast access
const routesByShortName = {};
const routesByRouteId = {};
const routesByAgency = { GNE: [], ANUM: [] };
const routesByCategory = {};
const routesByDepot = {};

routesData.forEach(route => {
  // By short name
  if (!routesByShortName[route.routeShortName]) {
    routesByShortName[route.routeShortName] = [];
  }
  routesByShortName[route.routeShortName].push(route);

  // By route ID
  routesByRouteId[route.routeId] = route;

  // By agency
  routesByAgency[route.agencyId].push(route);

  // By category
  if (!routesByCategory[route.category]) {
    routesByCategory[route.category] = [];
  }
  routesByCategory[route.category].push(route);

  // By depot
  if (!routesByDepot[route.depot]) {
    routesByDepot[route.depot] = [];
  }
  routesByDepot[route.depot].push(route);
});

// Statistics
const stats = {
  totalRoutes: routesData.length,
  gneRoutes: routesByAgency.GNE.length,
  arrivaRoutes: routesByAgency.ANUM.length,
  expressRoutes: routesData.filter(r => r.isExpress).length,
  localRoutes: routesData.filter(r => r.isLocal).length,
  specialRoutes: routesData.filter(r => r.isSpecial).length,
  categories: Object.keys(routesByCategory).map(category => ({
    category,
    count: routesByCategory[category].length
  })),
  depots: Object.keys(routesByDepot).map(depot => ({
    depot,
    count: routesByDepot[depot].length
  }))
};

// Helper functions for route operations
export const routeHelpers = {
  // Find route by short name (e.g., "21", "X10")
  findByShortName: (shortName) => routesByShortName[shortName] || [],

  // Find route by exact route ID
  findByRouteId: (routeId) => routesByRouteId[routeId] || null,

  // Search routes (fuzzy matching)
  search: (query) => {
    const searchTerm = query.toLowerCase().trim();
    return routesData.filter(route =>
      route.routeShortName.toLowerCase().includes(searchTerm) ||
      route.routeLongName.toLowerCase().includes(searchTerm) ||
      route.routeId.toLowerCase().includes(searchTerm)
    );
  },

  // Get routes by category
  getByCategory: (category) => routesByCategory[category] || [],

  // Get routes by depot
  getByDepot: (depot) => routesByDepot[depot] || [],

  // Get routes by agency
  getByAgency: (agency) => routesByAgency[agency] || [],

  // Get popular routes (based on common usage patterns)
  getPopularRoutes: () => {
    const popularRouteNames = ['21', '22', '20', 'X21', 'X1', 'X10', '56', '57', '58', '54'];
    return popularRouteNames.map(name => routesByShortName[name])
      .filter(routes => routes && routes.length > 0)
      .map(routes => routes[0]);
  },

  // Get express routes only
  getExpressRoutes: () => routesData.filter(r => r.isExpress),

  // Get local routes only
  getLocalRoutes: () => routesData.filter(r => r.isLocal),

  // Format route for display
  formatForDisplay: (route) => ({
    id: route.routeId,
    name: route.routeShortName,
    displayName: route.displayName,
    agency: route.agency,
    category: route.category,
    depot: route.depot,
    color: `#${route.routeColor}`,
    textColor: `#${route.routeTextColor}`
  }),

  // Validate route exists
  routeExists: (shortName) => Boolean(routesByShortName[shortName]),

  // Get route display name with fallback
  getDisplayName: (shortName, fallback = 'Unknown Route') => {
    const routes = routesByShortName[shortName];
    return routes && routes.length > 0 ? routes[0].displayName : fallback;
  }
};

// Export all data and helpers
export { routesData, routesByShortName, routesByRouteId, routesByAgency, routesByCategory, routesByDepot, stats };
export default routeHelpers;

// Storage service integration
export const routeStorage = {
  // Save route preferences to localStorage (web only)
  savePreferences: (preferences) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('gne_route_preferences', JSON.stringify(preferences));
    }
  },

  // Load route preferences from localStorage (web only)
  loadPreferences: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('gne_route_preferences');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  },

  // Save recent routes
  saveRecentRoutes: (routes) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const recentRoutes = routes.slice(0, 10); // Keep only last 10
      localStorage.setItem('gne_recent_routes', JSON.stringify(recentRoutes));
    }
  },

  // Load recent routes
  loadRecentRoutes: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('gne_recent_routes');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  },

  // Clear all stored route data
  clearAll: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('gne_route_preferences');
      localStorage.removeItem('gne_recent_routes');
    }
  }
};