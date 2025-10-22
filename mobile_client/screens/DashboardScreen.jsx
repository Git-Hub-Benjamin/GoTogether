import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useRideFilters } from '../hooks/useRideFilters';
import FilterSection from '../components/dashboard/FilterSection';
import MyRidesSection from '../components/dashboard/MyRidesSection';
import FindRidesSection from '../components/dashboard/FindRidesSection';
import { ENDPOINTS } from '../utils/api.js';
import universityColors from '../assets/university_colors.json';

// Get school colors or default colors
const getSchoolColors = (schoolName) => {
  const school = universityColors.find(s => s.university.toLowerCase() === schoolName.toLowerCase());
  return school ? school.colors : {
    bg_primary: '#2e7d32',
    button_primary_bg: '#2e7d32',
    button_primary_text: '#ffffff',
    button_primary_hover: '#1b5e20',
    text_primary: '#0F172A',
    text_secondary: '#475569',
    accent_primary: '#1E3A8A',
    accent_secondary: '#2563EB',
  };
};

export default function DashboardScreen() {
  const router = useRouter();
  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('myRides');
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [myCreatedRides, setMyCreatedRides] = useState([]);
  const [myJoinedRides, setMyJoinedRides] = useState([]);
  const [myRequestedRides, setMyRequestedRides] = useState([]);
  const [schoolColors, setSchoolColors] = useState(() => 
    getSchoolColors(user?.school || '')
  );
  const filtersRef = useRef(null);
  const fetchMyRidesRef = useRef(null);
  const panResponder = useRef(null);

  // Keep refs up to date
  filtersRef.current = filters;
  fetchMyRidesRef.current = fetchMyRides;

  // Setup pan responder for swipe gestures
  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        // Swipe right (logout)
        if (dx > 50) {
          handleLogout();
        }
        // Swipe left (settings)
        if (dx < -50) {
          router.push('/settings');
        }
      },
    });
  }, []);

  // Update school colors when user changes
  useEffect(() => {
    setSchoolColors(getSchoolColors(user?.school || ''));
  }, [user?.school]);

  const filters = useRideFilters(user?.school || '', user?.state || '', token, setSearchResults);

  const fetchMyRides = React.useCallback(async () => {
    try {
      const response = await fetch(`${ENDPOINTS.RIDES}/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMyCreatedRides(data.created || []);
      setMyJoinedRides(data.joined || []);
      setMyRequestedRides(data.requested || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    }
  }, [token]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMyRides().finally(() => setRefreshing(false));
  }, [fetchMyRides]);

  // Auto-fetch My Rides on initial load
  useEffect(() => {
    console.log('📱 DashboardScreen mounted');
    fetchMyRides();
    
    // Diagnostic: Check server connectivity
    const checkServer = async () => {
      try {
        console.log(`🔍 Testing server at: ${ENDPOINTS.SERVER}`);
        const res = await fetch(`${ENDPOINTS.SERVER}`, { timeout: 5000 });
        const text = await res.text();
        console.log(`✅ Server is reachable (${res.status}):`, text.substring(0, 100));
      } catch (err) {
        console.error(`❌ Cannot reach server at ${ENDPOINTS.SERVER}:`, err.message);
      }
    };
    
    checkServer();
  }, [fetchMyRides]);

  // Auto-search Find Rides tab after 0.5s delay (only on tab switch)
  useEffect(() => {
    if (activeTab === 'findRides') {
      // Auto-search after 0.5s on Find Rides tab
      const searchTimer = setTimeout(async () => {
        if (filtersRef.current?.handleSearch) {
          setSearchLoading(true);
          try {
            await filtersRef.current.handleSearch();
          } catch (error) {
            console.error('Search error:', error);
          } finally {
            setSearchLoading(false);
          }
        }
      }, 500);
      return () => clearTimeout(searchTimer);
    }
  }, [activeTab]);

  // Auto-refresh My Rides tab after 0.5s delay and every 10s
  useEffect(() => {
    if (activeTab === 'myRides') {
      // Initial fetch after 0.5s on My Rides tab
      const initialTimer = setTimeout(() => {
        if (fetchMyRidesRef.current) {
          fetchMyRidesRef.current();
        }
      }, 500);

      // Then set up 10s refresh interval
      const refreshInterval = setInterval(() => {
        if (fetchMyRidesRef.current) {
          fetchMyRidesRef.current();
        }
      }, 10000);

      return () => {
        clearTimeout(initialTimer);
        clearInterval(refreshInterval);
      };
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await logout?.();
    router.replace('/');
  };

  return (
    <View style={styles.container} {...panResponder.current?.panHandlers}>
      {/* TOP BAR WITH NAVIGATION ARROWS */}
      <View style={[styles.topBar, { backgroundColor: schoolColors.bg_primary }]}>
        <TouchableOpacity
          style={styles.navArrow}
          onPress={handleLogout}
        >
          <Text style={styles.arrowText}>← Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.topBarTitle}>Dashboard</Text>
        
        <TouchableOpacity
          style={styles.navArrow}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.arrowText}>Settings →</Text>
        </TouchableOpacity>
      </View>

      {/* SCHOOL INFO HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.schoolName, { color: schoolColors.text_primary }]}>{user?.school || 'No School'}</Text>
          <Text style={styles.schoolEmail}>{user?.email || 'Not logged in'}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myRides' && { ...styles.activeTab, borderBottomColor: schoolColors.accent_primary }]}
          onPress={() => setActiveTab('myRides')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'myRides' && { ...styles.activeTabText, color: schoolColors.accent_primary }
          ]}>My Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'findRides' && { ...styles.activeTab, borderBottomColor: schoolColors.accent_primary }]}
          onPress={() => setActiveTab('findRides')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'findRides' && { ...styles.activeTabText, color: schoolColors.accent_primary }
          ]}>Find Rides</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.content}
      >
        {activeTab === 'myRides' ? (
          <MyRidesSection
            active={activeTab === 'myRides'}
            myCreatedRides={myCreatedRides}
            myJoinedRides={myJoinedRides}
            myRequestedRides={myRequestedRides}
            onFetchRides={fetchMyRides}
          />
        ) : (
          <>
            <FilterSection
              filters={filters}
              onFiltersChange={() => {}}
              onSearch={async () => {
                setSearchLoading(true);
                await filters.handleSearch();
                setSearchLoading(false);
              }}
              searchLoading={searchLoading}
              schoolColors={schoolColors}
            />
            <FindRidesSection active={activeTab === 'findRides'} rides={searchResults} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 52,
    paddingHorizontal: 16,
    position: 'relative',
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  navArrow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  arrowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.85,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '700',
  },
  schoolEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});