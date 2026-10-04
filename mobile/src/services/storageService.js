import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@quickbill_token',
  USER: '@quickbill_user',
  TENANT_SLUG: '@quickbill_tenant_slug',
  CUSTOM_API_URL: '@quickbill_custom_api_url',
  CART_DRAFT: '@quickbill_cart_draft',
  THEME_MODE: '@quickbill_theme_mode',
};

export const storageService = {
  async getToken() {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch {
      return null;
    }
  },

  async setToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem(KEYS.TOKEN, token);
      } else {
        await AsyncStorage.removeItem(KEYS.TOKEN);
      }
    } catch (e) {
      console.error('Failed to store auth token', e);
    }
  },

  async getUser() {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(KEYS.USER);
      }
    } catch (e) {
      console.error('Failed to store user', e);
    }
  },

  async getTenantSlug() {
    try {
      return await AsyncStorage.getItem(KEYS.TENANT_SLUG);
    } catch {
      return null;
    }
  },

  async setTenantSlug(slug) {
    try {
      if (slug) {
        await AsyncStorage.setItem(KEYS.TENANT_SLUG, slug.toLowerCase().trim());
      } else {
        await AsyncStorage.removeItem(KEYS.TENANT_SLUG);
      }
    } catch (e) {
      console.error('Failed to store tenant slug', e);
    }
  },

  async getCustomApiUrl() {
    try {
      return await AsyncStorage.getItem(KEYS.CUSTOM_API_URL);
    } catch {
      return null;
    }
  },

  async setCustomApiUrl(url) {
    try {
      if (url) {
        await AsyncStorage.setItem(KEYS.CUSTOM_API_URL, url.trim());
      } else {
        await AsyncStorage.removeItem(KEYS.CUSTOM_API_URL);
      }
    } catch (e) {
      console.error('Failed to store custom API URL', e);
    }
  },

  async getThemeMode() {
    try {
      return await AsyncStorage.getItem(KEYS.THEME_MODE);
    } catch {
      return null;
    }
  },

  async setThemeMode(mode) {
    try {
      await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
    } catch (e) {
      console.error('Failed to save theme mode', e);
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.CART_DRAFT]);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  },
};
