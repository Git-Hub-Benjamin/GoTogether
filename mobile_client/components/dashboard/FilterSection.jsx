import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';

export default function FilterSection({
  filters,
  onFiltersChange,
  onSearch,
  searchLoading,
  schoolColors = {},
}) {
  const [fromDropdownVisible, setFromDropdownVisible] = useState(false);
  const [toDropdownVisible, setToDropdownVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [fromInput, setFromInput] = useState(filters.fromFilter);
  const [toInput, setToInput] = useState(filters.toFilter);

  const handleFromChange = (text) => {
    setFromInput(text);
    filters.setFromFilter(text);
    onFiltersChange?.();
  };

  const handleToChange = (text) => {
    setToInput(text);
    filters.setToFilter(text);
    onFiltersChange?.();
  };

  const handleFromSelect = (city) => {
    handleFromChange(city);
    setFromDropdownVisible(false);
  };

  const handleToSelect = (city) => {
    handleToChange(city);
    setToDropdownVisible(false);
  };

  const fromOptions = filters.getFromOptions(fromInput);
  const toOptions = filters.getToOptions(toInput);

  const formatDateDisplay = () => {
    if (!filters.selectedDate) return "Select Day";
    return filters.selectedDate;
  };

  const handleDateChange = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    filters.setSelectedDate(formattedDate);
    setSelectedDateObj(date);
    setDatePickerVisible(false);
    onFiltersChange?.();
  };

  // Generate years from current year back 5 years and forward 5 years
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  // Generate months 1-12
  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // Generate days based on year and month
  const generateDays = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  return (
    <View style={styles.container}>

      {/* FROM INPUT */}
      <View style={styles.filterGroup}>
        <Text style={styles.label}>From</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setFromDropdownVisible(!fromDropdownVisible)}
        >
          <TextInput
            style={styles.input}
            placeholder="From"
            placeholderTextColor="#ccc"
            value={fromInput}
            onChangeText={handleFromChange}
            onFocus={() => setFromDropdownVisible(true)}
          />
        </TouchableOpacity>

        {fromDropdownVisible && fromOptions.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={fromOptions}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleFromSelect(item)}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* TO INPUT */}
      <View style={styles.filterGroup}>
        <Text style={styles.label}>To</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setToDropdownVisible(!toDropdownVisible)}
        >
          <TextInput
            style={styles.input}
            placeholder="To"
            placeholderTextColor="#ccc"
            value={toInput}
            onChangeText={handleToChange}
            onFocus={() => setToDropdownVisible(true)}
          />
        </TouchableOpacity>

        {toDropdownVisible && toOptions.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={toOptions}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleToSelect(item)}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* DATE/DAY PICKER */}
      <View style={styles.filterGroup}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text style={styles.dateText}>{formatDateDisplay()}</Text>
        </TouchableOpacity>
      </View>

      {/* DATE PICKER MODAL - Custom scrollable date picker */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Text style={styles.datePickerCloseButton}>Done</Text>
              </TouchableOpacity>
            </View>
            
            {/* Year, Month, Day Pickers */}
            <View style={styles.datePickerContent}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <FlatList
                  data={generateYears()}
                  keyExtractor={(item) => item.toString()}
                  scrollEnabled
                  snapToInterval={40}
                  decelerationRate="fast"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        selectedDateObj.getFullYear() === item && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDateObj);
                        newDate.setFullYear(item);
                        setSelectedDateObj(newDate);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDateObj.getFullYear() === item && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <FlatList
                  data={generateMonths()}
                  keyExtractor={(item) => item.toString()}
                  scrollEnabled
                  snapToInterval={40}
                  decelerationRate="fast"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        selectedDateObj.getMonth() === item - 1 && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDateObj);
                        newDate.setMonth(item - 1);
                        setSelectedDateObj(newDate);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDateObj.getMonth() === item - 1 && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <FlatList
                  data={generateDays(selectedDateObj.getFullYear(), selectedDateObj.getMonth())}
                  keyExtractor={(item) => item.toString()}
                  scrollEnabled
                  snapToInterval={40}
                  decelerationRate="fast"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        selectedDateObj.getDate() === item && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDateObj);
                        newDate.setDate(item);
                        handleDateChange(newDate);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDateObj.getDate() === item && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ACTION BUTTONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={() => { filters.clearFilters(); onFiltersChange?.(); }}>
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchButton, searchLoading && styles.searchButtonDisabled, { backgroundColor: schoolColors.button_primary_bg || '#2e7d32' }]}
          onPress={onSearch}
          disabled={searchLoading}
        >
          <Text style={[styles.searchButtonText, { color: schoolColors.button_primary_text || '#fff' }]}>
            {searchLoading ? "Searching..." : "Search"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2e7d32',
  },
  filterGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  dateText: {
    color: '#666',
    fontSize: 14,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '85%',
  },
  datePickerContent: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingHorizontal: 8,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  datePickerHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  datePickerCloseButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  fallbackDateText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d32f2f',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#d32f2f',
    fontWeight: '600',
    fontSize: 14,
  },
  searchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
