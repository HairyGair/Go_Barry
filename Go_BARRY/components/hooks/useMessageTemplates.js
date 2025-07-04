// components/hooks/useMessageTemplates.js
// React hook for message template operations with real-time sync

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Fallback templates when Convex is not available
const FALLBACK_TEMPLATES = [
  {
    templateId: 'TPL_HIGH_LEVEL_FALLBACK',
    name: 'High Level Bridge Closure',
    category: 'closure',
    subject: 'URGENT MESSAGE REGARDING CLOSURE OF HIGH LEVEL BRIDGE IN NEWCASTLE',
    content: `URGENT MESSAGE REGARDING CLOSURE OF HIGH LEVEL BRIDGE IN NEWCASTLE

We have been advised that Northumbria Police are currently dealing with a Serious Incident on the High Level Bridge in Newcastle.

As a result, the bridge is closed to all traffic, including buses, in both directions. This is affecting all our services that use this crossing.

All services that operate over the High Level Bridge - 1, 10, 10A, 10B, 11, 11X, 12, 12A, Q3, 21, 28B, 29, 56, 57, 58, 84, 85, 93 & 94 as well as any others that use the bridge crossing will be affected by the closure.

Services operating to/from Eldon Square Bus Station will start/terminate at Central Station where possible. All connections to Gateshead will be suspended whilst the bridge is closed, any services scheduled to serve Gateshead Interchange after operating to Eldon Square will operate via Pilgrim Street, Market Street, and Clayton Street to Newcastle Central Station instead.

Any customers making journeys that need to use the bridge to cross the Tyne should make alternative arrangements - we'd suggest travelling to Four Lane Ends Metro Interchange to pick up the 1, 309, 310 or 311 to get to Gateshead Interchange.

Please discourage any customers from walking over the bridge during the closure.

We'll update as soon as we have further information.

Thank you.`,
    routes: ['1', '10', '10A', '10B', '11', '11X', '12', '12A', 'Q3', '21', '28B', '29', '56', '57', '58', '84', '85', '93', '94'],
    isUrgent: true,
    createdBy: 'SYSTEM',
    createdByName: 'System',
    createdAt: Date.now(),
    useCount: 0,
    isActive: true
  }
];

// Global storage for templates when Convex is not available
let globalTemplatesStorage = [...FALLBACK_TEMPLATES];
const templateUpdateCallbacks = new Set();
const STORAGE_KEY = '@go_barry_templates';

// Load templates from AsyncStorage on init
const loadStoredTemplates = async () => {
  try {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        globalTemplatesStorage = JSON.parse(stored);
        notifyTemplateUpdate();
      }
    } else {
      // Use AsyncStorage for native
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        globalTemplatesStorage = JSON.parse(stored);
        notifyTemplateUpdate();
      }
    }
  } catch (error) {
    console.error('Failed to load stored templates:', error);
  }
};

// Save templates to AsyncStorage
const saveTemplates = async () => {
  try {
    const dataToStore = JSON.stringify(globalTemplatesStorage);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, dataToStore);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, dataToStore);
    }
  } catch (error) {
    console.error('Failed to save templates:', error);
  }
};

// Load templates on module init
loadStoredTemplates();

// Function to notify all subscribers when templates change
const notifyTemplateUpdate = () => {
  templateUpdateCallbacks.forEach(callback => callback());
  saveTemplates(); // Auto-save when templates change
};

export const useMessageTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localTemplates, setLocalTemplates] = useState(globalTemplatesStorage);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Subscribe to template updates
  useEffect(() => {
    const handleUpdate = () => {
      setLocalTemplates([...globalTemplatesStorage]);
      setUpdateTrigger(prev => prev + 1);
    };
    
    templateUpdateCallbacks.add(handleUpdate);
    
    return () => {
      templateUpdateCallbacks.delete(handleUpdate);
    };
  }, []);
  const [queryError, setQueryError] = useState(null);
  const [mutationError, setMutationError] = useState(null);

  // Safely check if templates functions are actually deployed
  const templatesDeployed = api?.templates?.getTemplates && typeof api.templates.getTemplates === 'function';
  
  // Create safe function references or null
  const safeGetTemplates = templatesDeployed ? api.templates.getTemplates : undefined;
  const safeGetMostUsed = templatesDeployed ? api.templates.getMostUsedTemplates : undefined;
  const safeCreateTemplate = templatesDeployed ? api.templates.createTemplate : undefined;
  const safeUpdateTemplate = templatesDeployed ? api.templates.updateTemplate : undefined;
  const safeDeleteTemplate = templatesDeployed ? api.templates.deleteTemplate : undefined;
  const safeRecordUsage = templatesDeployed ? api.templates.recordTemplateUsage : undefined;
  const safeSeedTemplate = templatesDeployed ? api.templates.seedHighLevelBridgeTemplate : undefined;
  
  // Always call hooks with safe references - use dummy query when not available
  const convexTemplates = useQuery(safeGetTemplates || api.sync?.getSyncState);
  const convexMostUsed = useQuery(safeGetMostUsed || api.sync?.getSyncState, safeGetMostUsed ? { limit: 5 } : {});
  
  const createTemplateMutation = useMutation(safeCreateTemplate || api.sync?.updateSyncState);
  const updateTemplateMutation = useMutation(safeUpdateTemplate || api.sync?.updateSyncState);
  const deleteTemplateMutation = useMutation(safeDeleteTemplate || api.sync?.updateSyncState);
  const recordUsageMutation = useMutation(safeRecordUsage || api.sync?.updateSyncState);
  const seedHighLevelBridgeMutation = useMutation(safeSeedTemplate || api.sync?.updateSyncState);
  
  // Only use results when templates are actually deployed
  const actualTemplates = templatesDeployed ? convexTemplates : null;
  const actualMostUsed = templatesDeployed ? convexMostUsed : null;
  
  // Handle errors by detecting if queries failed
  useEffect(() => {
    if (convexTemplates !== undefined && templatesDeployed) {
      console.log('📋 Templates functions deployed and ready!');
    } else if (!templatesDeployed) {
      console.log('📋 Using local templates - run "npx convex deploy" to enable Convex templates');
    }
  }, [convexTemplates, templatesDeployed]);
  
  // Set templates with fallback - make it reactive to localTemplates changes
  const allTemplates = actualTemplates || localTemplates;
  const mostUsedTemplates = actualMostUsed || [];
  
  // Add effect to log when templates change
  useEffect(() => {
    console.log('📦 Templates updated:', allTemplates.length, 'templates');
  }, [allTemplates]);

  // Filter templates by category
  const filteredTemplates = selectedCategory === "all" 
    ? allTemplates 
    : allTemplates.filter(t => t.category === selectedCategory);

  // Create a new template
  const createTemplate = async (templateData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (createTemplateMutation && templatesDeployed) {
        const result = await createTemplateMutation({
          name: templateData.name,
          category: templateData.category,
          subject: templateData.subject,
          content: templateData.content,
          routes: templateData.routes || [],
          isUrgent: templateData.isUrgent || false,
          supervisorBadge: templateData.supervisorBadge,
          supervisorName: templateData.supervisorName,
        });
        
        setIsLoading(false);
        return result;
      } else {
        // Fallback: Create template locally
        const newTemplate = {
          templateId: `TPL_LOCAL_${Date.now()}`,
          ...templateData,
          createdAt: Date.now(),
          useCount: 0,
          isActive: true
        };
        globalTemplatesStorage.push(newTemplate);
        notifyTemplateUpdate();
        setIsLoading(false);
        return { success: true, templateId: newTemplate.templateId };
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  // Update an existing template
  const updateTemplate = async (templateId, updates) => {
    console.log('🔄 useMessageTemplates.updateTemplate called');
    console.log('Template ID:', templateId);
    console.log('Updates:', updates);
    console.log('Templates deployed?', templatesDeployed);
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (updateTemplateMutation && templatesDeployed) {
        console.log('🌐 Using Convex mutation');
        // For Convex, we need supervisorName as well
        // Extract supervisorBadge and add supervisorName as empty if not provided
        const convexUpdates = {
          templateId,
          name: updates.name,
          category: updates.category,
          subject: updates.subject,
          content: updates.content,
          routes: updates.routes,
          isUrgent: updates.isUrgent,
          supervisorBadge: updates.supervisorBadge || 'UNKNOWN',
          supervisorName: updates.supervisorName || 'Unknown Supervisor',
        };
        
        // Remove undefined values
        Object.keys(convexUpdates).forEach(key => {
          if (convexUpdates[key] === undefined) {
            delete convexUpdates[key];
          }
        });
        
        console.log('Convex updates:', convexUpdates);
        const result = await updateTemplateMutation(convexUpdates);
        console.log('Convex result:', result);
        
        setIsLoading(false);
        return result;
      } else {
        console.log('💾 Using local storage fallback');
        console.log('Current templates:', localTemplates);
        
        // Fallback: Update template locally in global storage
        const templateIndex = globalTemplatesStorage.findIndex(t => t.templateId === templateId);
        if (templateIndex !== -1) {
          globalTemplatesStorage[templateIndex] = {
            ...globalTemplatesStorage[templateIndex],
            name: updates.name !== undefined ? updates.name : globalTemplatesStorage[templateIndex].name,
            category: updates.category !== undefined ? updates.category : globalTemplatesStorage[templateIndex].category,
            subject: updates.subject !== undefined ? updates.subject : globalTemplatesStorage[templateIndex].subject,
            content: updates.content !== undefined ? updates.content : globalTemplatesStorage[templateIndex].content,
            routes: updates.routes !== undefined ? updates.routes : globalTemplatesStorage[templateIndex].routes,
            isUrgent: updates.isUrgent !== undefined ? updates.isUrgent : globalTemplatesStorage[templateIndex].isUrgent,
            lastModifiedBy: updates.supervisorBadge || globalTemplatesStorage[templateIndex].lastModifiedBy,
            lastModifiedAt: Date.now()
          };
          console.log('Updated template in global storage:', globalTemplatesStorage[templateIndex]);
        }
        
        // Notify all subscribers
        notifyTemplateUpdate();
        
        setIsLoading(false);
        return { success: true };
      }
    } catch (err) {
      console.error('❌ Update error in hook:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  // Delete a template
  const deleteTemplate = async (templateId, supervisorBadge) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (deleteTemplateMutation && templatesDeployed) {
        const result = await deleteTemplateMutation({
          templateId,
          supervisorBadge,
        });
        
        setIsLoading(false);
        return result;
      } else {
        // Fallback: Delete template locally
        globalTemplatesStorage = globalTemplatesStorage.filter(t => t.templateId !== templateId);
        notifyTemplateUpdate();
        setIsLoading(false);
        return { success: true };
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  // Record template usage
  const useTemplate = async (templateId) => {
    try {
      if (recordUsageMutation && templatesDeployed) {
        await recordUsageMutation({ templateId });
      } else {
        // Fallback: Update usage count locally
        const templateIndex = globalTemplatesStorage.findIndex(t => t.templateId === templateId);
        if (templateIndex !== -1) {
          globalTemplatesStorage[templateIndex] = {
            ...globalTemplatesStorage[templateIndex],
            useCount: (globalTemplatesStorage[templateIndex].useCount || 0) + 1,
            lastUsed: Date.now()
          };
          notifyTemplateUpdate();
        }
      }
    } catch (err) {
      console.error("Failed to record template usage:", err);
    }
  };

  // Initialize High Level Bridge template if needed
  const initializeDefaultTemplates = async (supervisorBadge, supervisorName) => {
    try {
      if (seedHighLevelBridgeMutation && templatesDeployed) {
        await seedHighLevelBridgeMutation({ supervisorBadge, supervisorName });
      }
      // Fallback templates are already initialized
    } catch (err) {
      console.error("Failed to seed default templates:", err);
    }
  };

  // Get template by ID
  const getTemplateById = (templateId) => {
    return allTemplates.find(t => t.templateId === templateId);
  };

  // Get templates by urgency
  const urgentTemplates = allTemplates.filter(t => t.isUrgent);
  
  // Calculate most used if no Convex data
  const finalMostUsedTemplates = mostUsedTemplates.length > 0 
    ? mostUsedTemplates 
    : [...allTemplates]
        .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
        .slice(0, 5);

  // Categories
  const categories = [
    { value: "all", label: "All Templates" },
    { value: "diversion", label: "Diversions" },
    { value: "closure", label: "Closures" },
    { value: "incident", label: "Incidents" },
    { value: "custom", label: "Custom" },
  ];

  return {
    // Data
    templates: filteredTemplates,
    allTemplates,
    mostUsedTemplates: finalMostUsedTemplates,
    urgentTemplates,
    categories,
    selectedCategory,
    
    // State
    isLoading,
    error,
    
    // Actions
    setSelectedCategory,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    getTemplateById,
    initializeDefaultTemplates,
  };
};
