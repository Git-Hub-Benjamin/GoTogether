import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../constants/api';
import RideCardCompact from './RideCardCompact';

export default function FindRidesSection({ active }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: '',
  });
  const { token } = useAuth();

  const fetchRides = useCallback(async () => {
    if (!active) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        date: filters.date,
      }).toString();

      const response = await fetch(`${ENDPOINTS.RIDES}/search?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  }, [active, filters, token]);

  useEffect(() => {
    if (active) {
      fetchRides();
    }
  }, [active, fetchRides]);

  if (!active) return null;

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="From"
          value={filters.from}
          onChangeText={(text) => setFilters(prev => ({ ...prev, from: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="To"
          value={filters.to}
          onChangeText={(text) => setFilters(prev => ({ ...prev, to: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Date"
          value={filters.date}
          onChangeText={(text) => setFilters(prev => ({ ...prev, date: text }))}
        />
        <TouchableOpacity style={styles.searchButton} onPress={fetchRides}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results}>
        {loading ? (
          <Text style={styles.loadingText}>Loading rides...</Text>
        ) : rides.length === 0 ? (
          <Text style={styles.emptyText}>No rides found</Text>
        ) : (
          rides.map((ride) => (
            <RideCardCompact
              key={ride.id}
              ride={ride}
              type="search"
              onFetchRides={fetchRides}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filters: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchButton: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 24,
  },
});