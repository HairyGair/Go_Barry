// Web fallback for @react-native-async-storage/async-storage
// Uses localStorage for web compatibility

const AsyncStorage = {
  getItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.warn('AsyncStorage getItem error:', error);
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn('AsyncStorage setItem error:', error);
    }
  },

  removeItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('AsyncStorage removeItem error:', error);
    }
  },

  clear: async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (error) {
      console.warn('AsyncStorage clear error:', error);
    }
  },

  getAllKeys: async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return Object.keys(window.localStorage);
      }
      return [];
    } catch (error) {
      console.warn('AsyncStorage getAllKeys error:', error);
      return [];
    }
  },

  multiGet: async (keys) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return keys.map(key => [key, window.localStorage.getItem(key)]);
      }
      return keys.map(key => [key, null]);
    } catch (error) {
      console.warn('AsyncStorage multiGet error:', error);
      return keys.map(key => [key, null]);
    }
  },

  multiSet: async (keyValuePairs) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        keyValuePairs.forEach(([key, value]) => {
          window.localStorage.setItem(key, value);
        });
      }
    } catch (error) {
      console.warn('AsyncStorage multiSet error:', error);
    }
  },

  multiRemove: async (keys) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        keys.forEach(key => {
          window.localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.warn('AsyncStorage multiRemove error:', error);
    }
  }
};

export default AsyncStorage;
