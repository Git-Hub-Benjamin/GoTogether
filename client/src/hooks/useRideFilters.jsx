import { useState, useMemo } from "react";
import usCities from "../assets/us_cities.json";

const API_URL = "http://localhost:5000/api/rides";

export const useRideFilters = (schoolName, state, token, onSearch) => {
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [distance, setDistance] = useState(100);
  const [selectedDate, setSelectedDate] = useState("");

  const cityList = useMemo(
    () => usCities.map((c) => `${c.city}, ${c.state_name}`),
    []
  );

  const stateCityList = useMemo(
    () =>
      usCities
        .filter((c) => c.state_name.toLowerCase() === state.toLowerCase())
        .map((c) => `${c.city}, ${c.state_name}`),
    [state]
  );

  const locationFiltersActive =
    fromFilter.trim().length > 0 || toFilter.trim().length > 0;
  const radiusActive = distance !== 100;

  const filterCities = (input) => {
    if (!input) return stateCityList.slice(0, 10);
    const lower = input.toLowerCase();
    return cityList
      .filter((item) => item.toLowerCase().includes(lower))
      .slice(0, 10);
  };

  const getFromOptions = (input) => {
    let options = filterCities(input);
    const campusOption = `${schoolName} (Campus)`;

    if (!input && !toFilter) options = [campusOption, ...options].slice(0, 11);
    else if (toFilter === campusOption)
      options = options.filter((item) => item !== campusOption);
    else if (toFilter && toFilter !== campusOption) options = [campusOption];
    else {
      if (!options.includes(campusOption)) options.unshift(campusOption);
      options = options.slice(0, 11);
    }
    return options;
  };

  const getToOptions = (input) => {
    let options = filterCities(input);
    const campusOption = `${schoolName} (Campus)`;

    if (!input && !fromFilter)
      options = [campusOption, ...options].slice(0, 11);
    else if (fromFilter === campusOption)
      options = options.filter((item) => item !== campusOption);
    else if (fromFilter && fromFilter !== campusOption)
      options = [campusOption];
    else {
      if (!options.includes(campusOption)) options.unshift(campusOption);
      options = options.slice(0, 11);
    }
    return options;
  };

  const normalize = (loc) => {
    if (!loc) return "";
    const trimmed = loc.trim();
    return trimmed.endsWith("(Campus)") ? schoolName : trimmed;
  };

  const handleSearch = async () => {
    try {
      const res = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: normalize(fromFilter),
          to: normalize(toFilter),
          radius: distance,
          school: schoolName,
          date: selectedDate,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch rides");
      const data = await res.json();
      onSearch(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching rides:", err);
      onSearch([]);
    }
  };

  const clearFilters = () => {
    setFromFilter("");
    setToFilter("");
    setDistance(100);
    setSelectedDate("");
  };

  const handleDistanceChange = (e) => {
    const val = Number(e.target.value);
    if (val !== 100 && (fromFilter || toFilter)) {
      setFromFilter("");
      setToFilter("");
    }
    setDistance(val);
  };

  return {
    fromFilter,
    setFromFilter,
    toFilter,
    setToFilter,
    distance,
    selectedDate,
    setSelectedDate,
    locationFiltersActive,
    radiusActive,
    getFromOptions,
    getToOptions,
    handleSearch,
    clearFilters,
    handleDistanceChange,
  };
};