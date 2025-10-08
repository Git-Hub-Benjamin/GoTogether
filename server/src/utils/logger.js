const isDebug = true;

function logDebug(...args) {
  if (isDebug) {
    console.log("[DEBUG]", ...args);
  }
}

export { logDebug };