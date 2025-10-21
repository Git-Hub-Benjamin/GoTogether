import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import CreateRideModal from '../components/CreateRideModal';
import MyRidesSection from '../components/dashboard/MyRidesSection';
import FindRidesSection from '../components/dashboard/FindRidesSection';
import { ENDPOINTS } from '../utils/api.js';

const API_URL = ENDPOINTS.RIDES;

export default function DashboardScreen() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('myRides');
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myCreatedRides, setMyCreatedRides] = useState([]);
  const [myJoinedRides, setMyJoinedRides] = useState([]);
  const [myRequestedRides, setMyRequestedRides] = useState([]);

  const fetchMyRides = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/mine`, {
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

  useEffect(() => {
    fetchMyRides();
  }, [fetchMyRides]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GoTogether</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.createButtonText}>Create Ride</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myRides' && styles.activeTab]}
          onPress={() => setActiveTab('myRides')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'myRides' && styles.activeTabText
          ]}>My Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'findRides' && styles.activeTab]}
          onPress={() => setActiveTab('findRides')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'findRides' && styles.activeTabText
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
          <FindRidesSection active={activeTab === 'findRides'} />
        )}
      </ScrollView>

      <CreateRideModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreateSuccess={() => {
          setModalVisible(false);
          fetchMyRides();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  createButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    borderBottomColor: '#2e7d32',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});