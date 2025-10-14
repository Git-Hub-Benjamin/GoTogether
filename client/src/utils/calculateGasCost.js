const AVERAGE_GAS_PRICE = 3.50; // Average US gas price per gallon as of 2025
const AVERAGE_MPG = 25; // Average car fuel efficiency in miles per gallon

export const calculateEstimatedGasCost = (distance, passengers) => {
  if (!distance || distance <= 0 || !passengers || passengers <= 0) return 0;
  
  const totalGallons = distance / AVERAGE_MPG;
  const totalCost = totalGallons * AVERAGE_GAS_PRICE;
  const costPerPerson = totalCost / (passengers + 1); // +1 includes the driver
  
  // Round to 2 decimal places
  return Math.round(costPerPerson * 100) / 100;
};