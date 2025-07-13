/*
 * Go Barry - Traffic Intelligence Platform
 * Breakdown Guide - SDC Guide to Engineering Issues
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  SafeAreaView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Import the breakdown guide data
const breakdownGuideData = [
  {
    id: 'safety-declaration',
    title: 'Safety Declaration',
    category: 'safety',
    severity: 'critical',
    description: 'Fundamental safety principles and decision-making guidance for all engineering issues.',
    keywords: ['safety', 'non-negotiable', 'prohibition', 'PG9'],
    steps: [
      {
        title: 'Core Safety Principles',
        substeps: [
          {
            action: 'Safety is Non-Negotiable',
            detail: 'The safety of everyone—staff, passengers, and the public—is our highest priority. Any action that compromises this is unacceptable.'
          },
          {
            action: 'PG9 Prohibition Rule',
            detail: 'If a vehicle has a safety-critical defect or risks receiving a PG9 prohibition, it must not remain in service. Once a prohibition is issued, the vehicle cannot be used unless an exemption is granted.'
          },
          {
            action: 'When in Doubt',
            detail: 'Seek advice from a competent engineer. Every situation involving vehicle defects requires careful judgement.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Use DVSA "Categorisation of Defects" as reference',
      'Maintain communication with drivers at all times',
      'Decisions should align with DVSA standards and be reasonable'
    ]
  },
  {
    id: 'abs-light',
    title: 'ABS Light On',
    category: 'electrical',
    severity: 'high',
    description: 'Procedure for when ABS warning lights are illuminated, with different actions for amber and red lights.',
    keywords: ['ABS', 'anti-lock', 'braking', 'amber', 'red', 'warning light'],
    steps: [
      {
        title: 'AMBER ABS Light',
        substeps: [
          {
            action: 'Stop and Reset',
            detail: 'The driver should stop and shut down the vehicle, performing a full reset.'
          },
          {
            condition: 'Amber ABS light is no longer illuminated (once vehicle achieves 10mph)',
            action: 'Continue in Service',
            detail: 'The vehicle may remain in service, but the defect should be logged on GoCheck. If the light reappears seek further advice.'
          },
          {
            condition: 'Amber ABS light remains illuminated (once vehicle achieves 10mph)',
            action: 'Changeover Required',
            detail: 'The vehicle may remain in service, but changeover at the earliest convenience.'
          }
        ]
      },
      {
        title: 'RED ABS Light',
        substeps: [
          {
            action: 'Stop and Reset',
            detail: 'The driver should stop and shut down the vehicle, performing a full reset.'
          },
          {
            condition: 'Red ABS light is no longer illuminated (once vehicle achieves 10mph)',
            action: 'Continue with Changeover',
            detail: 'The vehicle may remain in service, but changeover at the earliest convenience.'
          },
          {
            condition: 'Red ABS light remains illuminated (once vehicle achieves 10mph)',
            action: 'Stop and Wait',
            detail: 'The driver should stop and wait for engineering assistance.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Record any defects immediately on the Go-Check System',
      'Safety is the priority - any ABS fault must be checked over by an engineer',
      'If vehicle can safely continue, ensure changeover is arranged at earliest opportunity'
    ],
    relatedIssues: ['battery-light', 'warning-lights', 'brakes']
  },
  {
    id: 'brakes',
    title: 'Brakes',
    category: 'safety',
    severity: 'critical',
    description: 'Critical brake system issues requiring immediate attention.',
    keywords: ['brakes', 'braking', 'pedal', 'fluid', 'grinding', 'squealing'],
    steps: [
      {
        title: 'Critical Brake Issues - Stop Immediately',
        substeps: [
          {
            condition: 'Brake pedal sinks to the floor with little or no resistance',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          },
          {
            condition: 'Braking response is delayed or ineffective',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          },
          {
            condition: 'Unusual noises (e.g., grinding or squealing) during braking',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          },
          {
            condition: 'Visible leaks in the brake system (e.g., brake fluid)',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          },
          {
            condition: 'Red ABS/EBS light is illuminated',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Record any defects immediately on the Go-Check System when the bus is stationary and in a safe location',
      'Vehicles permitted to continue must have a planned changeover organised at the earliest opportunity'
    ],
    relatedIssues: ['abs-light', 'steering', 'safety-declaration']
  },
  {
    id: 'steering',
    title: 'Steering',
    category: 'safety',
    severity: 'critical',
    description: 'Steering system issues requiring immediate assessment.',
    keywords: ['steering', 'wheel', 'play', 'control', 'power steering', 'leaks'],
    steps: [
      {
        title: 'Critical Steering Issues - Stop Immediately',
        substeps: [
          {
            condition: 'Excessive play in the steering wheel (>75mm at rim for power steering)',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          },
          {
            condition: 'Difficulty steering or maintaining control of the vehicle',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          },
          {
            condition: 'Vehicle pulling to one side during operation',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          },
          {
            condition: 'Any steering-related warning light illuminated',
            action: 'Stop Immediately',
            detail: 'Advise the driver to switch off the vehicle and await engineering attendance.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'DVSA expects no more than 75mm of play at the rim of steering wheel for vehicles with power steering',
      'Record any defects immediately on the Go-Check System when bus is stationary and in safe location'
    ],
    relatedIssues: ['brakes', 'suspension', 'safety-declaration']
  },
  {
    id: 'non-starter',
    title: 'Non Starter',
    category: 'engine',
    severity: 'medium',
    description: 'Troubleshooting steps for vehicles that will not start.',
    keywords: ['starter', 'engine', 'start', 'gear', 'neutral', 'rear start'],
    steps: [
      {
        title: 'Initial Troubleshooting',
        substeps: [
          {
            action: 'Check Gear Position',
            detail: 'Ensure the vehicle is out of gear and in neutral.'
          },
          {
            action: 'Reset System',
            detail: 'Turn off all instruments, including the main switch, to reset the bus.'
          },
          {
            action: 'Check Engine Bay',
            detail: 'Confirm the engine bay door is closed and secure.'
          },
          {
            action: 'Attempt Start',
            detail: 'Turn the vehicle back on and attempt to start the engine.'
          }
        ]
      },
      {
        title: 'Rear Start Attempt',
        substeps: [
          {
            condition: 'Initial troubleshooting fails',
            action: 'Safety Check',
            detail: 'Confirm it is safe to attempt a rear start.'
          },
          {
            action: 'Safety Precautions',
            detail: 'Ensure ties and lanyards are removed or securely placed over shoulder to prevent entanglement in belt.'
          },
          {
            condition: 'Engine starts',
            action: 'Keep Running',
            detail: 'Instruct driver to leave it running until an engineer attends. Arrange changeover if necessary.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Ensure vehicles permitted to continue have planned changeover organised promptly',
      'Escalate persistent, unwarranted non-starter reports to depot management team'
    ],
    relatedIssues: ['battery-light', 'oil-warning']
  },
  {
    id: 'overheating',
    title: 'Overheating',
    category: 'engine',
    severity: 'high',
    description: 'Temperature management and overheating response procedures.',
    keywords: ['overheating', 'temperature', 'water', 'coolant', 'radiator', 'buzzer'],
    steps: [
      {
        title: 'Check Temperature Gauge',
        substeps: [
          {
            condition: '80–100°C',
            action: 'Continue',
            detail: 'Advise the driver they can continue to a convenient changeover point.'
          },
          {
            condition: 'Over 100°C',
            action: 'Further Investigation',
            detail: 'Proceed to check water buzzer and assess cause.'
          }
        ]
      },
      {
        title: 'Heat Dispersion Using Heaters',
        substeps: [
          {
            action: 'Use Heaters',
            detail: 'Instruct the driver to turn on the heaters and demisters to disperse heat in the system.'
          },
          {
            condition: 'Issue resolved',
            action: 'Continue',
            detail: 'Advise the driver to continue to the next convenient changeover point.'
          },
          {
            condition: 'Problem persists',
            action: 'Stop',
            detail: 'Instruct the driver to stop and await engineering assistance.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Never advise drivers to remove the radiator cap',
      'If driver is uncertain about safety of continuing, instruct them to stop',
      'Record defect immediately on Go-Check'
    ],
    relatedIssues: ['low-water', 'excessive-smoke']
  },
  {
    id: 'doors-not-working',
    title: 'Doors Not Working',
    category: 'operation',
    severity: 'medium',
    description: 'Troubleshooting and assessment of door system issues.',
    keywords: ['doors', 'air pressure', 'control buttons', 'obstruction'],
    steps: [
      {
        title: 'Initial Checks',
        substeps: [
          {
            action: 'Check Door Control Buttons',
            detail: 'Ask the driver to check if any door control buttons are stuck (both inside and outside the bus).'
          },
          {
            action: 'Check for Obstructions',
            detail: 'Confirm there are no obstructions behind or under the doors.'
          }
        ]
      },
      {
        title: 'Critical Door Issues - Stop Immediately',
        substeps: [
          {
            condition: 'Doors are jammed closed',
            action: 'Stop and Seek Engineering',
            detail: 'Stop and seek engineering assistance.'
          },
          {
            condition: 'Doors cannot be retained in closed position',
            action: 'Stop and Seek Engineering',
            detail: 'Stop and seek engineering assistance.'
          },
          {
            condition: 'Doors are stiff and cannot fully open or close',
            action: 'Stop and Seek Engineering',
            detail: 'Stop and seek engineering assistance.'
          }
        ]
      }
    ],
    additionalGuidance: [
      'Safety is the priority - if driver has concerns about continuing, escalate to engineering',
      'Record any defects immediately on Go-Check System when bus is stationary and in safe location'
    ],
    relatedIssues: ['ramp-stuck', 'air-pressure-issues']
  }
];

const categories = {
  safety: {
    name: 'Safety & Emergency',
    icon: 'warning',
    color: '#DC2626',
    description: 'Critical safety issues requiring immediate attention'
  },
  engine: {
    name: 'Engine & Mechanical',
    icon: 'cog',
    color: '#F59E0B',
    description: 'Engine, fuel, and mechanical system issues'
  },
  electrical: {
    name: 'Electrical Systems',
    icon: 'flash',
    color: '#8B5CF6',
    description: 'Electrical, lighting, and electronic system issues'
  },
  operation: {
    name: 'Vehicle Operation',
    icon: 'car',
    color: '#059669',
    description: 'Operational systems and driver interface issues'
  },
  maintenance: {
    name: 'Maintenance & Inspection',
    icon: 'construct',
    color: '#6B7280',
    description: 'Maintenance, inspection, and minor repair issues'
  }
};

const BreakdownGuide = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Filter issues based on search and category
  const filteredIssues = useMemo(() => {
    let filtered = breakdownGuideData;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(issue => issue.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [searchQuery, selectedCategory]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#059669';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return 'warning';
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const renderIssueCard = (issue) => (
    <TouchableOpacity
      key={issue.id}
      style={[styles.issueCard, { borderLeftColor: getSeverityColor(issue.severity) }]}
      onPress={() => setSelectedIssue(issue)}
    >
      <View style={styles.issueHeader}>
        <View style={styles.issueTitleRow}>
          <Ionicons 
            name={getSeverityIcon(issue.severity)} 
            size={20} 
            color={getSeverityColor(issue.severity)} 
          />
          <Text style={styles.issueTitle}>{issue.title}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(issue.severity) }]}>
          <Text style={styles.severityText}>{issue.severity.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.issueDescription} numberOfLines={2}>
        {issue.description}
      </Text>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{categories[issue.category]?.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderIssueDetail = (issue) => (
    <ScrollView style={styles.issueDetail}>
      <View style={styles.issueDetailHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setSelectedIssue(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#4B5563" />
          <Text style={styles.backButtonText}>Back to List</Text>
        </TouchableOpacity>
        
        <View style={styles.issueDetailTitle}>
          <Ionicons 
            name={getSeverityIcon(issue.severity)} 
            size={28} 
            color={getSeverityColor(issue.severity)} 
          />
          <Text style={styles.issueDetailTitleText}>{issue.title}</Text>
        </View>
        
        <View style={[styles.severityBadgeLarge, { backgroundColor: getSeverityColor(issue.severity) }]}>
          <Text style={styles.severityTextLarge}>{issue.severity.toUpperCase()}</Text>
        </View>
      </View>

      {/* Safety Warning */}
      {issue.severity === 'critical' && (
        <View style={styles.safetyWarning}>
          <Ionicons name="warning" size={24} color="#DC2626" />
          <View style={styles.safetyWarningText}>
            <Text style={styles.safetyWarningTitle}>SAFETY CRITICAL</Text>
            <Text style={styles.safetyWarningDescription}>
              This issue requires immediate attention and may require stopping the vehicle.
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.issueDetailDescription}>{issue.description}</Text>

      {/* Steps */}
      {issue.steps.map((step, stepIndex) => (
        <View key={stepIndex} style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          {step.substeps.map((substep, substepIndex) => (
            <View key={substepIndex} style={styles.substepContainer}>
              {substep.condition && (
                <View style={styles.conditionContainer}>
                  <Ionicons name="help-circle" size={16} color="#6B7280" />
                  <Text style={styles.conditionText}>{substep.condition}</Text>
                </View>
              )}
              <View style={styles.actionContainer}>
                <Ionicons name="play" size={14} color="#059669" />
                <Text style={styles.actionText}>
                  <Text style={styles.actionLabel}>{substep.action}: </Text>
                  {substep.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Additional Guidance */}
      {issue.additionalGuidance && issue.additionalGuidance.length > 0 && (
        <View style={styles.guidanceContainer}>
          <Text style={styles.guidanceTitle}>Additional Guidance</Text>
          {issue.additionalGuidance.map((guidance, index) => (
            <View key={index} style={styles.guidanceItem}>
              <Ionicons name="checkmark" size={16} color="#059669" />
              <Text style={styles.guidanceText}>{guidance}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Related Issues */}
      {issue.relatedIssues && issue.relatedIssues.length > 0 && (
        <View style={styles.relatedContainer}>
          <Text style={styles.relatedTitle}>Related Issues</Text>
          <View style={styles.relatedList}>
            {issue.relatedIssues.map((relatedId) => {
              const relatedIssue = breakdownGuideData.find(i => i.id === relatedId);
              return relatedIssue ? (
                <TouchableOpacity
                  key={relatedId}
                  style={styles.relatedItem}
                  onPress={() => setSelectedIssue(relatedIssue)}
                >
                  <Text style={styles.relatedItemText}>{relatedIssue.title}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              ) : null;
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );

  if (selectedIssue) {
    return (
      <SafeAreaView style={styles.container}>
        {renderIssueDetail(selectedIssue)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Breakdown Guide</Text>
          
          <TouchableOpacity style={styles.emergencyButton}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search issues, symptoms, or components..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === 'all' && styles.categoryButtonTextActive
            ]}>
              All Issues
            </Text>
          </TouchableOpacity>
          
          {Object.entries(categories).map(([key, category]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryButton,
                selectedCategory === key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(key)}
            >
              <Ionicons 
                name={category.icon} 
                size={16} 
                color={selectedCategory === key ? '#fff' : '#6B7280'} 
              />
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === key && styles.categoryButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Safety Declaration */}
        <View style={styles.safetyDeclaration}>
          <View style={styles.safetyHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#DC2626" />
            <Text style={styles.safetyTitle}>Safety Declaration</Text>
          </View>
          <Text style={styles.safetyText}>
            Safety is Non-Negotiable. The safety of everyone—staff, passengers, and the public—is our 
            highest priority. Any action that compromises this is unacceptable.
          </Text>
        </View>

        {/* Issue Results */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {filteredIssues.length} Issue{filteredIssues.length !== 1 ? 's' : ''} Found
          </Text>
          {searchQuery && (
            <Text style={styles.searchQuery}>Search: "{searchQuery}"</Text>
          )}
        </View>

        <View style={styles.issuesList}>
          {filteredIssues.map(renderIssueCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  
  // Categories Styles
  categoriesContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#059669',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  
  // Content Styles
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Safety Declaration
  safetyDeclaration: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  safetyText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  
  // Results
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchQuery: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Issues List
  issuesList: {
    gap: 12,
  },
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  issueDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Issue Detail Styles
  issueDetail: {
    flex: 1,
    padding: 20,
  },
  issueDetailHeader: {
    marginBottom: 24,
  },
  issueDetailTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  issueDetailTitleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  severityBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  severityTextLarge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Safety Warning
  safetyWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  safetyWarningText: {
    flex: 1,
  },
  safetyWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  safetyWarningDescription: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  
  issueDetailDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 32,
  },
  
  // Steps
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  substepContainer: {
    marginBottom: 16,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  conditionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionLabel: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  // Additional Guidance
  guidanceContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  guidanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 16,
  },
  guidanceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  guidanceText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  
  // Related Issues
  relatedContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  relatedList: {
    gap: 8,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  relatedItemText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
});

export default BreakdownGuide;