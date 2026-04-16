// src/utils/logger.js

export const logInfo = (...args) => {
  console.log("[INFO]", ...args);
};

export const logError = (...args) => {
  console.error("[ERROR]", ...args);
};