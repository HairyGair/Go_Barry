// components/messaging/AdvancedSearch.jsx
// Advanced cross-system search for Message Distribution Centre Phase 7
// Search across messages, templates, audit logs with advanced filters

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

const AdvancedSearch = ({ visible, onClose }) => {
  const { supervisor } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    includeMessages: true,
    includeTemplates: true,
    includeAuditLogs: true,
    includeDrafts: true,
    dateRange: '30d', // 7d, 30d, 90d, all
    priority: 'all', // all, urgent, normal, low
    category: 'all', // all, roadworks, incidents, service, general
    status: 'all', // all, sent, draft, scheduled
    supervisor: 'all' // all, or specific supervisor
  });
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [searchMode, setSearchMode] = useState('simple'); // simple, advanced, boolean
  const [booleanQuery, setBooleanQuery] = useState('');

  // Load saved searches when component opens
  useEffect(() => {
    if (visible) {
      loadSavedSearches();
    }
  }, [visible]);

  // Perform search when query or filters change
  useEffect(() => {
    if (searchQuery.trim() || searchMode === 'advanced') {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 500); // Debounce search
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchFilters, booleanQuery]);

  // Load saved searches
  const loadSavedSearches = async () => {
    try {
      const response = await fetch('/api/search/saved', {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSavedSearches(data.savedSearches || []);
      } else {
        setSavedSearches([]);
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
      setSavedSearches([]);
    }
  };


  // Perform search
  const performSearch = async () => {
    if (!searchQuery.trim() && searchMode === 'simple') return;
    
    setLoading(true);
    try {
      const requestBody = {
        query: searchMode === 'boolean' ? booleanQuery : searchQuery,
        filters: searchFilters,
        mode: searchMode
      };

      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
      } else {
        // No search results
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };


  // Save current search
  const saveCurrentSearch = async () => {
    if (!saveSearchName.trim()) return;
    
    try {
      const newSearch = {
        name: saveSearchName,
        query: searchMode === 'boolean' ? booleanQuery : searchQuery,
        filters: searchFilters,
        mode: searchMode
      };

      const response = await fetch('/api/search/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        },
        body: JSON.stringify(newSearch)
      });

      if (response.ok) {
        await loadSavedSearches();
        setShowSaveModal(false);
        setSaveSearchName('');
      }
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  // Load saved search
  const loadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.mode === 'boolean' ? '' : savedSearch.query);
    setBooleanQuery(savedSearch.mode === 'boolean' ? savedSearch.query : '');
    setSearchFilters(savedSearch.filters);
    setSearchMode(savedSearch.mode || 'simple');
  };

  // Get result type info
  const getResultTypeInfo = (type) => {
    const typeMap = {
      message: { icon: 'mail', color: '#2563EB', label: 'Message' },
      template: { icon: 'document-text', color: '#10B981', label: 'Template' },
      audit_log: { icon: 'shield-checkmark', color: '#F59E0B', label: 'Audit Log' }
    };
    return typeMap[type] || typeMap.message;
  };

  // Render search modes
  const renderSearchModes = () => (
    <View style={styles.searchModes}>
      {['simple', 'advanced', 'boolean'].map(mode => (
        <TouchableOpacity
          key={mode}
          style={[styles.searchModeButton, searchMode === mode && styles.searchModeButtonActive]}
          onPress={() => setSearchMode(mode)}
        >
          <Text style={[
            styles.searchModeText,
            searchMode === mode && styles.searchModeTextActive
          ]}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render search input
  const renderSearchInput = () => (
    <View style={styles.searchInputContainer}>
      <Ionicons name="search" size={20} color="#9CA3AF" />
      {searchMode === 'boolean' ? (
        <TextInput
          style={styles.searchInput}
          value={booleanQuery}
          onChangeText={setBooleanQuery}
          placeholder="e.g., (urgent OR critical) AND route:21 NOT category:test"
          placeholderTextColor="#9CA3AF"
          multiline={true}
        />
      ) : (
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search messages, templates, and audit logs..."
          placeholderTextColor="#9CA3AF"
        />
      )}
      
      {(searchQuery || booleanQuery) && (
        <TouchableOpacity
          style={styles.saveSearchButton}
          onPress={() => setShowSaveModal(true)}
        >
          <Ionicons name="bookmark" size={20} color="#2563EB" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render filters
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Search Filters</Text>
      
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Include:</Text>
        <View style={styles.filterOptions}>
          <View style={styles.filterOption}>
            <Switch
              value={searchFilters.includeMessages}
              onValueChange={(value) => setSearchFilters(prev => ({ ...prev, includeMessages: value }))}
              thumbColor={searchFilters.includeMessages ? '#2563EB' : '#F3F4F6'}
              trackColor={{ false: '#D1D5DB', true: '#DBEAFE' }}
            />
            <Text style={styles.filterOptionText}>Messages</Text>
          </View>
          
          <View style={styles.filterOption}>
            <Switch
              value={searchFilters.includeTemplates}
              onValueChange={(value) => setSearchFilters(prev => ({ ...prev, includeTemplates: value }))}
              thumbColor={searchFilters.includeTemplates ? '#2563EB' : '#F3F4F6'}
              trackColor={{ false: '#D1D5DB', true: '#DBEAFE' }}
            />
            <Text style={styles.filterOptionText}>Templates</Text>
          </View>
          
          <View style={styles.filterOption}>
            <Switch
              value={searchFilters.includeAuditLogs}
              onValueChange={(value) => setSearchFilters(prev => ({ ...prev, includeAuditLogs: value }))}
              thumbColor={searchFilters.includeAuditLogs ? '#2563EB' : '#F3F4F6'}
              trackColor={{ false: '#D1D5DB', true: '#DBEAFE' }}
            />
            <Text style={styles.filterOptionText}>Audit Logs</Text>
          </View>
        </View>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        <View style={styles.filterButtons}>
          {/* Priority Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Priority:</Text>
            {['all', 'urgent', 'normal', 'low'].map(priority => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.filterButton,
                  searchFilters.priority === priority && styles.filterButtonActive
                ]}
                onPress={() => setSearchFilters(prev => ({ ...prev, priority }))}
              >
                <Text style={[
                  styles.filterButtonText,
                  searchFilters.priority === priority && styles.filterButtonTextActive
                ]}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Date Range Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Date:</Text>
            {['7d', '30d', '90d', 'all'].map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.filterButton,
                  searchFilters.dateRange === range && styles.filterButtonActive
                ]}
                onPress={() => setSearchFilters(prev => ({ ...prev, dateRange: range }))}
              >
                <Text style={[
                  styles.filterButtonText,
                  searchFilters.dateRange === range && styles.filterButtonTextActive
                ]}>
                  {range === 'all' ? 'All Time' : range.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // Render saved searches
  const renderSavedSearches = () => (
    <View style={styles.savedSearchesContainer}>
      <Text style={styles.savedSearchesTitle}>Saved Searches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.savedSearchesList}>
          {savedSearches.map(search => (
            <TouchableOpacity
              key={search.id}
              style={styles.savedSearchItem}
              onPress={() => loadSavedSearch(search)}
            >
              <Text style={styles.savedSearchName}>{search.name}</Text>
              <Text style={styles.savedSearchQuery} numberOfLines={1}>
                {search.query}
              </Text>
              <Text style={styles.savedSearchMeta}>
                Used {search.useCount} times
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // Render search results
  const renderSearchResults = () => (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          Search Results ({searchResults.length})
        </Text>
        {searchResults.length > 0 && (
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="download" size={16} color="#2563EB" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {searchResults.map(result => {
        const typeInfo = getResultTypeInfo(result.type);
        
        return (
          <View key={result.id} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTypeInfo}>
                <View style={[styles.resultTypeIcon, { backgroundColor: typeInfo.color + '20' }]}>
                  <Ionicons name={typeInfo.icon} size={16} color={typeInfo.color} />
                </View>
                <Text style={[styles.resultTypeLabel, { color: typeInfo.color }]}>
                  {typeInfo.label}
                </Text>
              </View>
              
              <View style={styles.resultRelevance}>
                <Text style={styles.relevanceText}>
                  {Math.round(result.relevance * 100)}% match
                </Text>
              </View>
            </View>
            
            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultContent} numberOfLines={2}>
              {result.content}
            </Text>
            
            <View style={styles.resultMeta}>
              <Text style={styles.resultMetaText}>
                {new Date(result.createdAt).toLocaleDateString('en-GB')} by {result.createdBy}
              </Text>
              
              {result.highlights && (
                <View style={styles.highlights}>
                  {result.highlights.slice(0, 3).map((highlight, index) => (
                    <View key={index} style={styles.highlight}>
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
      
      {searchResults.length === 0 && !loading && (searchQuery || booleanQuery) && (
        <View style={styles.noResults}>
          <Ionicons name="search" size={48} color="#9CA3AF" />
          <Text style={styles.noResultsText}>No results found</Text>
          <Text style={styles.noResultsSubtext}>
            Try adjusting your search query or filters
          </Text>
        </View>
      )}
    </View>
  );

  // Render save search modal
  const renderSaveSearchModal = () => (
    <Modal
      visible={showSaveModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSaveModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Save Search</Text>
            <TouchableOpacity onPress={() => setShowSaveModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Search Name:</Text>
            <TextInput
              style={styles.modalInput}
              value={saveSearchName}
              onChangeText={setSaveSearchName}
              placeholder="Enter a name for this search..."
              placeholderTextColor="#9CA3AF"
            />
            
            <Text style={styles.modalLabel}>Query:</Text>
            <Text style={styles.modalQuery}>
              {searchMode === 'boolean' ? booleanQuery : searchQuery}
            </Text>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSaveModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={saveCurrentSearch}
            >
              <Text style={styles.modalButtonTextPrimary}>Save Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Advanced Search</Text>
            <Text style={styles.headerSubtitle}>
              Search across messages, templates, and audit logs
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderSearchModes()}
          {renderSearchInput()}
          {renderFilters()}
          {renderSavedSearches()}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            renderSearchResults()
          )}
        </ScrollView>

        {renderSaveSearchModal()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  searchModes: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  searchModeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  searchModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  searchModeTextActive: {
    color: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 20,
  },
  saveSearchButton: {
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 20,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  filterScrollView: {
    marginHorizontal: -20,
  },
  filterButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  savedSearchesContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  savedSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  savedSearchesList: {
    flexDirection: 'row',
    gap: 12,
  },
  savedSearchItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    maxWidth: 200,
  },
  savedSearchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  savedSearchQuery: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  savedSearchMeta: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  resultsContainer: {
    padding: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultRelevance: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  relevanceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  resultContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  resultMeta: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  resultMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  highlight: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highlightText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  modalQuery: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonPrimary: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default AdvancedSearch;