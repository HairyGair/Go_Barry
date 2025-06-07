// backend/services/roadworksServices.js
// Roadworks Communication Generation Services
// Handles Blink PDF generation, Ticket Machine messages, and Driver briefing materials

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Communication Templates Directory
const TEMPLATES_DIR = path.join(__dirname, '../data/templates');

// Ensure templates directory exists
async function ensureTemplatesDirectory() {
  try {
    await fs.access(TEMPLATES_DIR);
  } catch {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    console.log('✅ Created templates directory for roadworks communications');
  }
}

// Initialize templates directory
ensureTemplatesDirectory();

/**
 * Generate Blink PDF content for drivers
 * This creates a structured document with Google Maps directions and key information
 */
export async function generateDiversionPDF(diversionPlan, roadwork) {
  try {
    console.log(`📄 Generating Blink PDF for roadwork: ${roadwork.id}`);
    
    // PDF content structure (would be converted to actual PDF in production)
    const pdfContent = {
      header: {
        title: 'GO NORTH EAST - DIVERSION NOTICE',
        routeNumbers: diversionPlan.routeNumbers,
        effectiveDate: new Date().toLocaleDateString('en-GB'),
        diversionId: diversionPlan.id
      },
      
      mapSection: {
        title: 'DIVERSION ROUTE MAP',
        centerCoordinates: roadwork.coordinates,
        waypoints: diversionPlan.waypoints || [],
        zoomLevel: 15,
        mapStyle: 'roads', // Google Maps roads view
        highlightedRoute: true,
        annotations: [
          {
            type: 'roadwork',
            coordinates: roadwork.coordinates,
            label: 'ROADWORKS AREA'
          }
        ]
      },
      
      instructions: {
        title: 'DIVERSION INSTRUCTIONS',
        routes: diversionPlan.routeNumbers.map(routeNumber => ({
          routeNumber,
          originalPath: `Normal ${routeNumber} route`,
          diversionSteps: generateDiversionSteps(diversionPlan, routeNumber),
          estimatedDelay: diversionPlan.estimatedDelay,
          keyStops: getKeyStopsForRoute(routeNumber, diversionPlan.waypoints)
        }))
      },
      
      roadworkDetails: {
        title: 'ROADWORK INFORMATION',
        location: roadwork.location,
        authority: roadwork.authority,
        description: roadwork.description,
        startDate: roadwork.plannedStartDate ? new Date(roadwork.plannedStartDate).toLocaleDateString('en-GB') : 'TBC',
        endDate: roadwork.plannedEndDate ? new Date(roadwork.plannedEndDate).toLocaleDateString('en-GB') : 'TBC',
        duration: roadwork.estimatedDuration,
        contactInfo: {
          person: roadwork.contactPerson,
          phone: roadwork.contactPhone,
          email: roadwork.contactEmail
        }
      },
      
      driverNotes: {
        title: 'IMPORTANT DRIVER NOTES',
        notes: [
          'Follow diversion route exactly as shown',
          'Announce diversion to passengers at key stops',
          'Additional time allowed in schedule',
          'Contact control room if issues arise',
          `Report any problems immediately - Control: ${getControlRoomNumber()}`
        ],
        emergencyContact: getControlRoomNumber(),
        supervisorContact: roadwork.assignedToName || 'Duty Supervisor'
      },
      
      footer: {
        generatedAt: new Date().toISOString(),
        validUntil: roadwork.plannedEndDate,
        reference: `GNE-DIV-${roadwork.id}`,
        version: '1.0'
      }
    };

    // Generate filename
    const routeString = diversionPlan.routeNumbers.join('-');
    const dateString = new Date().toISOString().split('T')[0];
    const fileName = `Diversion_${routeString}_${dateString}_${roadwork.id}.pdf`;

    // Save PDF content (in production, this would generate actual PDF)
    const filePath = path.join(TEMPLATES_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(pdfContent, null, 2));

    console.log(`✅ Generated Blink PDF: ${fileName}`);

    return {
      success: true,
      content: pdfContent,
      fileName,
      filePath,
      type: 'blink_pdf'
    };

  } catch (error) {
    console.error('❌ Failed to generate Blink PDF:', error);
    throw error;
  }
}

/**
 * Generate Ticket Machine Message content
 * This creates detailed text for bus ticket machines to inform passengers
 */
export async function generateTicketMachineMessage(diversionPlan, roadwork) {
  try {
    console.log(`🎫 Generating Ticket Machine message for roadwork: ${roadwork.id}`);

    const routeNumbers = diversionPlan.routeNumbers.join(', ');
    const startDate = roadwork.plannedStartDate ? 
      new Date(roadwork.plannedStartDate).toLocaleDateString('en-GB') : 'Today';
    const endDate = roadwork.plannedEndDate ? 
      new Date(roadwork.plannedEndDate).toLocaleDateString('en-GB') : 'Until further notice';

    // Generate message based on route and severity
    const message = generateTicketMachineText(diversionPlan, roadwork, {
      routeNumbers,
      startDate,
      endDate
    });

    // Save message content
    const fileName = `TicketMessage_${diversionPlan.routeNumbers.join('-')}_${Date.now()}.txt`;
    const filePath = path.join(TEMPLATES_DIR, fileName);
    await fs.writeFile(filePath, message);

    console.log(`✅ Generated Ticket Machine message: ${fileName}`);

    return {
      success: true,
      content: message,
      fileName,
      filePath,
      type: 'ticket_machine',
      characterCount: message.length
    };

  } catch (error) {
    console.error('❌ Failed to generate Ticket Machine message:', error);
    throw error;
  }
}

/**
 * Generate Driver Briefing Sheet
 * Comprehensive information for driver briefings
 */
export async function generateDriverBriefing(diversionPlan, roadwork) {
  try {
    console.log(`👨‍💼 Generating Driver Briefing for roadwork: ${roadwork.id}`);

    const briefingContent = {
      header: {
        title: 'DRIVER BRIEFING - SERVICE DIVERSION',
        briefingId: `DB-${roadwork.id}`,
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        routes: diversionPlan.routeNumbers,
        priority: roadwork.priority.toUpperCase()
      },

      situation: {
        title: 'SITUATION OVERVIEW',
        location: roadwork.location,
        reason: roadwork.description,
        authority: roadwork.authority,
        duration: `${roadwork.plannedStartDate ? new Date(roadwork.plannedStartDate).toLocaleDateString('en-GB') : 'Now'} to ${roadwork.plannedEndDate ? new Date(roadwork.plannedEndDate).toLocaleDateString('en-GB') : 'TBC'}`,
        affectedRoutes: roadwork.affectedRoutes
      },

      diversionDetails: {
        title: 'DIVERSION ROUTE DETAILS',
        routes: diversionPlan.routeNumbers.map(routeNumber => ({
          routeNumber,
          normalRoute: `Standard ${routeNumber} service`,
          diversionRoute: diversionPlan.description,
          keyChanges: generateKeyChanges(routeNumber, diversionPlan),
          estimatedDelay: diversionPlan.estimatedDelay,
          missedStops: getMissedStops(routeNumber, diversionPlan),
          alternativeStops: getAlternativeStops(routeNumber, diversionPlan)
        }))
      },

      passengerCommunication: {
        title: 'PASSENGER COMMUNICATION',
        announcements: generatePassengerAnnouncements(diversionPlan, roadwork),
        frequentQuestions: generateFAQ(diversionPlan, roadwork),
        alternativeServices: getAlternativeServices(roadwork.affectedRoutes)
      },

      operationalNotes: {
        title: 'OPERATIONAL CONSIDERATIONS',
        timingAdjustments: `Allow additional ${diversionPlan.estimatedDelay || '5-10 minutes'} for route`,
        fuelConsiderations: 'Monitor fuel levels - longer route',
        breakTimings: 'Inform control if break timings affected',
        emergencyProcedures: 'Follow normal emergency procedures - inform control of location changes'
      },

      contacts: {
        title: 'KEY CONTACTS',
        controlRoom: getControlRoomNumber(),
        supervisor: roadwork.assignedToName || 'Duty Supervisor',
        roadworkAuthority: roadwork.contactPhone || 'N/A',
        emergencyServices: '999 (if required)'
      }
    };

    // Generate filename and save
    const routeString = diversionPlan.routeNumbers.join('-');
    const fileName = `DriverBriefing_${routeString}_${Date.now()}.json`;
    const filePath = path.join(TEMPLATES_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(briefingContent, null, 2));

    console.log(`✅ Generated Driver Briefing: ${fileName}`);

    return {
      success: true,
      content: briefingContent,
      fileName,
      filePath,
      type: 'driver_briefing'
    };

  } catch (error) {
    console.error('❌ Failed to generate Driver Briefing:', error);
    throw error;
  }
}

/**
 * Generate Customer Notice
 * Public-facing communication about service changes
 */
export async function generateCustomerNotice(diversionPlan, roadwork) {
  try {
    console.log(`📢 Generating Customer Notice for roadwork: ${roadwork.id}`);

    const noticeContent = {
      header: {
        title: 'SERVICE CHANGE NOTICE',
        operator: 'Go North East',
        routes: diversionPlan.routeNumbers,
        effectiveDate: roadwork.plannedStartDate ? 
          new Date(roadwork.plannedStartDate).toLocaleDateString('en-GB') : 'Immediately'
      },

      serviceChanges: {
        title: `Routes ${diversionPlan.routeNumbers.join(', ')} - Temporary Diversion`,
        reason: `Due to ${roadwork.description.toLowerCase()} at ${roadwork.location}`,
        duration: roadwork.estimatedDuration || 'Until further notice',
        affectedStops: getMissedStops('all', diversionPlan),
        alternativeArrangements: getCustomerAlternatives(diversionPlan, roadwork)
      },

      customerAdvice: {
        title: 'What You Need to Know',
        advice: [
          'Allow extra time for your journey',
          'Check alternative stops listed below',
          'Follow @gonortheast for live updates',
          'Visit gonortheast.co.uk for route maps',
          'Contact customer services for help planning your journey'
        ]
      },

      alternativeServices: {
        title: 'Alternative Travel Options',
        options: getAlternativeServices(roadwork.affectedRoutes)
      },

      contact: {
        title: 'Customer Information',
        phone: '0191 420 5050',
        website: 'gonortheast.co.uk',
        social: '@gonortheast',
        email: 'customerservices@gonortheast.co.uk'
      }
    };

    // Generate filename and save
    const routeString = diversionPlan.routeNumbers.join('-');
    const fileName = `CustomerNotice_${routeString}_${Date.now()}.json`;
    const filePath = path.join(TEMPLATES_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(noticeContent, null, 2));

    console.log(`✅ Generated Customer Notice: ${fileName}`);

    return {
      success: true,
      content: noticeContent,
      fileName,
      filePath,
      type: 'customer_notice'
    };

  } catch (error) {
    console.error('❌ Failed to generate Customer Notice:', error);
    throw error;
  }
}

// Helper Functions

function generateDiversionSteps(diversionPlan, routeNumber) {
  // This would be enhanced with actual route data
  return [
    'Follow normal route until diversion point',
    'Turn onto diversion route as signed',
    diversionPlan.description || 'Follow temporary route',
    'Rejoin normal route after roadworks',
    'Resume normal service'
  ];
}

function getKeyStopsForRoute(routeNumber, waypoints) {
  // This would be enhanced with GTFS data
  const commonStops = {
    '21': ['Newcastle Eldon Square', 'Gateshead Interchange', 'Chester-le-Street'],
    'Q3': ['Newcastle Quayside', 'Gateshead', 'MetroCentre'],
    '10': ['Newcastle Haymarket', 'Hexham'],
    '56': ['Newcastle Eldon Square', 'Sunderland Interchange']
  };

  return commonStops[routeNumber] || ['Major stops affected'];
}

function generateTicketMachineText(diversionPlan, roadwork, params) {
  const { routeNumbers, startDate, endDate } = params;

  let message = `SERVICE DIVERSION - Routes ${routeNumbers}\n\n`;
  message += `Due to ${roadwork.description.toLowerCase()} at ${roadwork.location}, `;
  message += `services are diverted from ${startDate} until ${endDate}.\n\n`;
  
  if (diversionPlan.estimatedDelay) {
    message += `Journey time: Allow extra ${diversionPlan.estimatedDelay}\n\n`;
  }

  message += `Some stops may not be served. Alternative stops available nearby.\n\n`;
  message += `For live updates: @gonortheast\n`;
  message += `Journey planning: gonortheast.co.uk\n`;
  message += `Customer services: 0191 420 5050`;

  return message;
}

function generateKeyChanges(routeNumber, diversionPlan) {
  return [
    'Route diverted via alternative roads',
    'Some stops temporarily not served',
    'Journey time may be extended',
    'Alternative stops available nearby'
  ];
}

function getMissedStops(routeNumber, diversionPlan) {
  // This would be enhanced with actual GTFS data
  return [
    'Stops in immediate roadworks area',
    'See alternative arrangements below'
  ];
}

function getAlternativeStops(routeNumber, diversionPlan) {
  return [
    'Use nearest available stops on diversion route',
    'Check gonortheast.co.uk for stop details'
  ];
}

function generatePassengerAnnouncements(diversionPlan, roadwork) {
  const routeNumbers = diversionPlan.routeNumbers.join(' and ');
  
  return {
    boarding: `Good morning/afternoon. Due to roadworks, this ${routeNumbers} service is running via a diversion. Some stops will not be served. Please listen for announcements.`,
    
    approach: `We're now approaching the roadworks area. This service will follow a temporary diversion route. Your stop may be affected - please ask if you're unsure.`,
    
    diversion: `We're now following the diversion route due to roadworks. Some stops are temporarily not served. Alternative stops are available nearby.`,
    
    resume: `We're now back on the normal route. Thank you for your patience during the diversion.`
  };
}

function generateFAQ(diversionPlan, roadwork) {
  return [
    {
      question: 'Why is the bus taking a different route?',
      answer: `Due to ${roadwork.description.toLowerCase()} at ${roadwork.location}, we're following a temporary diversion.`
    },
    {
      question: 'How long will this last?',
      answer: roadwork.estimatedDuration || 'Until the roadworks are completed. Check gonortheast.co.uk for updates.'
    },
    {
      question: 'What about my usual stop?',
      answer: 'Some stops may be temporarily unavailable. Use the nearest alternative stop or check with the driver.'
    },
    {
      question: 'Will this affect my journey time?',
      answer: `Allow extra time - approximately ${diversionPlan.estimatedDelay || '5-10 minutes'} additional.`
    }
  ];
}

function getAlternativeServices(affectedRoutes) {
  return [
    'Check other Go North East routes serving your area',
    'Consider Metro/rail connections where available',
    'Visit gonortheast.co.uk for journey planning',
    'Contact customer services for alternative suggestions'
  ];
}

function getCustomerAlternatives(diversionPlan, roadwork) {
  return [
    'Use alternative stops on diversion route',
    'Consider other Go North East services',
    'Allow extra journey time',
    'Check real-time information before travelling'
  ];
}

function getControlRoomNumber() {
  return '0191 420 5000'; // Go North East control room number
}

export default {
  generateDiversionPDF,
  generateTicketMachineMessage,
  generateDriverBriefing,
  generateCustomerNotice
};