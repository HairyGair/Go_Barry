// components/hooks/useMessageTemplates.js
// React hook for message template operations with real-time sync

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

export const useMessageTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Queries
  const allTemplates = useQuery(api.templates.getTemplates) || [];
  const mostUsedTemplates = useQuery(api.templates.getMostUsedTemplates, { limit: 5 }) || [];
  
  // Mutations
  const createTemplateMutation = useMutation(api.templates.createTemplate);
  const updateTemplateMutation = useMutation(api.templates.updateTemplate);
  const deleteTemplateMutation = useMutation(api.templates.deleteTemplate);
  const recordUsageMutation = useMutation(api.templates.recordTemplateUsage);
  const seedHighLevelBridgeMutation = useMutation(api.templates.seedHighLevelBridgeTemplate);

  // Filter templates by category
  const filteredTemplates = selectedCategory === "all" 
    ? allTemplates 
    : allTemplates.filter(t => t.category === selectedCategory);

  // Create a new template
  const createTemplate = async (templateData) => {
    setIsLoading(true);
    setError(null);
    
    try {
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
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  // Update an existing template
  const updateTemplate = async (templateId, updates) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await updateTemplateMutation({
        templateId,
        ...updates,
      });
      
      setIsLoading(false);
      return result;
    } catch (err) {
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
      const result = await deleteTemplateMutation({
        templateId,
        supervisorBadge,
      });
      
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  // Record template usage
  const useTemplate = async (templateId) => {
    try {
      await recordUsageMutation({ templateId });
    } catch (err) {
      console.error("Failed to record template usage:", err);
    }
  };

  // Initialize High Level Bridge template if needed
  const initializeDefaultTemplates = async (supervisorBadge, supervisorName) => {
    try {
      await seedHighLevelBridgeMutation({ supervisorBadge, supervisorName });
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
    mostUsedTemplates,
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
