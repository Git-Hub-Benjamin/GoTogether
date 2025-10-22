import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import RideCardCompact from './RideCardCompact';

export default function FindRidesSection({ active, rides = [] }) {
  if (!active) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.results}>
        {rides && rides.length === 0 ? (
          <Text style={styles.emptyText}>No rides found. Try searching!</Text>
        ) : (
          rides.map((ride) => (
            <RideCardCompact
              key={ride.id}
              ride={ride}
              type="search"
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
    paddingVertical: 16,
  },
  results: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 24,
    fontSize: 14,
  },
});