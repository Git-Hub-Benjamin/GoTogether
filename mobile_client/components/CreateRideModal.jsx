import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext.jsx';
import { ENDPOINTS } from '../utils/api.js';

export default function CreateRideModal({ visible, onClose, onCreateSuccess }) {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    from: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    seatsAvailable: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.RIDES, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          seatsAvailable: parseInt(formData.seatsAvailable),
          school: user.school,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create ride');
      }

      onCreateSuccess();
      setFormData({
        from: '',
        destination: '',
        departureDate: '',
        departureTime: '',
        seatsAvailable: '',
        notes: '',
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.title}>Create a New Ride</Text>

            <TextInput
              style={styles.input}
              placeholder="From"
              value={formData.from}
              onChangeText={(text) => setFormData(prev => ({ ...prev, from: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="To"
              value={formData.destination}
              onChangeText={(text) => setFormData(prev => ({ ...prev, destination: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={formData.departureDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, departureDate: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM)"
              value={formData.departureTime}
              onChangeText={(text) => setFormData(prev => ({ ...prev, departureTime: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Available Seats"
              value={formData.seatsAvailable}
              keyboardType="numeric"
              onChangeText={(text) => setFormData(prev => ({ ...prev, seatsAvailable: text }))}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              value={formData.notes}
              multiline
              numberOfLines={4}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating...' : 'Create Ride'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 8,
    marginRight: 8,
  },
  createButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
});