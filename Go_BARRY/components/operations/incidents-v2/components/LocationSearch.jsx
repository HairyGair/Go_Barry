/*
 * Go Barry - Location Search Component
 * Autocomplete location search using Mapbox
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../styles/incidents.styles';
import { searchLocations } from '../services/geocodingService';

const LocationSearch = ({ 
  value, 
  onLocationSelect, 
  placeholder = "Search for a location...",
  baseUrl,
  style
}) => {
  const [query, setQuery] = useState(value || '');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeout = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleSearch = async (searchQuery) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearching(true);
    try {
      const results = await searchLocations(searchQuery, { limit: 3 }); // Reduced from 5 to 3
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (text) => {
    setQuery(text);
    
    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Don't search for very short queries
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Set new timeout for search with longer delay
    searchTimeout.current = setTimeout(() => {
      handleSearch(text);
    }, 500); // Increased from 300ms to 500ms
  };

  const handleSelectLocation = (location) => {
    setQuery(location.display_name);
    setShowSuggestions(false);
    
    if (onLocationSelect) {
      onLocationSelect({
        description: location.display_name,
        coordinates: location.coordinates,
        confidence: location.relevance * 100,
        source: 'mapbox'
      });
    }
  };

  const handleKeyPress = (e) => {
    if (Platform.OS !== 'web') return;
    
    switch (e.nativeEvent.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectLocation(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const locationStyles = {
    container: {
      position: 'relative',
      ...style
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md
    },
    input: {
      flex: 1,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.text,
      ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
    },
    icon: {
      marginRight: spacing.sm
    },
    loadingIcon: {
      marginLeft: spacing.sm
    },
    suggestionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 4,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 200,
      zIndex: 1000,
      ...(Platform.OS === 'web' ? {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5
      })
    },
    suggestion: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    suggestionSelected: {
      backgroundColor: colors.primaryBg
    },
    suggestionText: {
      fontSize: 14,
      color: colors.text
    },
    suggestionType: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2
    },
    noResults: {
      padding: spacing.md,
      alignItems: 'center'
    },
    noResultsText: {
      fontSize: 14,
      color: colors.textMuted
    }
  };

  return (
    <View style={locationStyles.container}>
      <View style={locationStyles.inputContainer}>
        <Ionicons 
          name="location" 
          size={20} 
          color={colors.textMuted} 
          style={locationStyles.icon}
        />
        <TextInput
          ref={inputRef}
          style={locationStyles.input}
          value={query}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyPress={handleKeyPress}
        />
        {searching && (
          <ActivityIndicator 
            size="small" 
            color={colors.primary} 
            style={locationStyles.loadingIcon}
          />
        )}
        {query.length > 0 && !searching && (
          <Pressable onPress={() => handleInputChange('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {showSuggestions && (
        <ScrollView 
          style={locationStyles.suggestionsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.length > 0 ? (
            suggestions.map((location, index) => (
              <Pressable
                key={location.id}
                style={[
                  locationStyles.suggestion,
                  index === selectedIndex && locationStyles.suggestionSelected
                ]}
                onPress={() => handleSelectLocation(location)}
              >
                <Text style={locationStyles.suggestionText}>
                  {location.name}
                </Text>
                <Text style={locationStyles.suggestionType}>
                  {location.display_name}
                </Text>
              </Pressable>
            ))
          ) : (
            <View style={locationStyles.noResults}>
              <Text style={locationStyles.noResultsText}>
                No locations found
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default LocationSearch;
