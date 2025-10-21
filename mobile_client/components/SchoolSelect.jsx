import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const API_URL = "http://localhost:5000/api/schools";

const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  // ... add all states
];

const SchoolSelect = ({
  selectedState,
  setSelectedState,
  selectedSchool, 
  setSelectedSchool,
  disabled = false
}) => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedState || disabled) {
      setSchools([]);
      setSelectedSchool(null);
      return;
    }

    const fetchSchools = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(selectedState)}`
        );
        const data = await res.json();
        if (res.ok) {
          setSchools(data);
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [selectedState, disabled]);

  return (
    <View style={{ gap: 10 }}>
      <Picker
        selectedValue={selectedState}
        onValueChange={setSelectedState}
        enabled={!disabled}
      >
        <Picker.Item label="Select State" value="" />
        {STATES.map(state => (
          <Picker.Item key={state} label={state} value={state} />
        ))}
      </Picker>

      <Picker
        selectedValue={selectedSchool}
        onValueChange={setSelectedSchool}
        enabled={!disabled && !!selectedState}
      >
        <Picker.Item label="Select School" value="" />
        {schools.map(school => (
          <Picker.Item 
            key={school.name} 
            label={school.name} 
            value={school} 
          />
        ))}
      </Picker>

      {loading && <ActivityIndicator />}
    </View>
  );
};

export default SchoolSelect;