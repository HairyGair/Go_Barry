// Go_BARRY/app/display-simple.jsx
// Simplified Display Screen that actually works
// Removes complex dependencies that might be causing issues

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SimpleDisplayScreen = () => {
  const [currentAlerts, setCurrentAlerts] = useState([]);
  const [alertIndex, setAlertIndex] = useState(0);
  const [lastDataUpdate, setLastDataUpdate] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [dataSource, setDataSource] = useState('');

  // Determine API URL
  const API_BASE_URL = Platform.OS === 'web' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'https://go-barry.onrender.com';

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-cycle through alerts every 15 seconds
  useEffect(() => {
    if (currentAlerts.length <= 1) return;
    
    const cycleTimer = setInterval(() => {
      setAlertIndex(prev => (prev + 1) % currentAlerts.length);
    }, 15000);
    
    return () => clearInterval(cycleTimer);
  }, [currentAlerts.length]);

  // Simplified alert fetching with multiple fallbacks
  const fetchAlerts = async () => {
    const requestId = Date.now();
    console.log(`🔄 [${requestId}] Simple Display: Fetching alerts...`);
    
    try {
      setConnectionError(false);
      
      // Try multiple endpoints in order of preference
      const endpoints = [
        `${API_BASE_URL}/api/alerts-enhanced`,
        `${API_BASE_URL}/api/alerts`,
        `${API_BASE_URL}/api/emergency-alerts`
      ];
      
      let data = null;
      let usedEndpoint = '';
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 [${requestId}] Trying: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'User-Agent': 'BARRY-Simple-Display'
            },
            timeout: 10000
          });
          
          if (!response.ok) {
            console.log(`❌ [${requestId}] ${endpoint} returned ${response.status}`);
            continue;
          }
          
          data = await response.json();
          usedEndpoint = endpoint;
          console.log(`✅ [${requestId}] Success with: ${endpoint}`);
          break;
          
        } catch (endpointError) {
          console.log(`❌ [${requestId}] ${endpoint} failed:`, endpointError.message);
          continue;
        }
      }
      
      if (!data) {
        throw new Error('All API endpoints failed');
      }
      
      // Process the response
      if (data.success && data.alerts) {
        // Filter out test/sample data
        const filteredAlerts = data.alerts.filter(alert => 
          alert && 
          alert.title &&
          !alert.id?.includes('test') &&
          !alert.id?.includes('sample') &&
          alert.source !== 'test_system'
        );
        
        setCurrentAlerts(filteredAlerts);
        setLastDataUpdate(new Date());
        setDataSource(usedEndpoint.split('/').pop());
        setIsLoading(false);
        
        console.log(`✅ [${requestId}] Loaded ${filteredAlerts.length} alerts from ${usedEndpoint}`);
        
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error(`❌ [${requestId}] Display Screen Error:`, error);
      setConnectionError(true);
      setIsLoading(false);
      
      // Show demo data if no real data available
      if (currentAlerts.length === 0) {
        const demoAlerts = [
          {
            id: 'demo