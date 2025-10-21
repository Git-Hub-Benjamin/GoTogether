import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RideCardCompact from './RideCardCompact';

export default function MyRidesSection({ 
  active, 
  myCreatedRides, 
  myJoinedRides, 
  myRequestedRides,
  onFetchRides 
}) {
  if (!active) return null;

  const isEmpty = 
    myCreatedRides.length === 0 && 
    myJoinedRides.length === 0 && 
    myRequestedRides.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          You haven&apos;t created or joined any rides yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {myCreatedRides.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created Rides</Text>
          {myCreatedRides.map((ride) => (
            <RideCardCompact
              key={ride.id}
              ride={ride}
              type="created"
              onFetchRides={onFetchRides}
            />
          ))}
        </View>
      )}

      {myJoinedRides.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joined Rides</Text>
          {myJoinedRides.map((ride) => (
            <RideCardCompact
              key={ride.id}
              ride={ride}
              type="joined"
              onFetchRides={onFetchRides}
            />
          ))}
        </View>
      )}

      {myRequestedRides.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requested Rides</Text>
          {myRequestedRides.map((ride) => (
            <RideCardCompact
              key={ride.id}
              ride={ride}
              type="requested"
              onFetchRides={onFetchRides}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});