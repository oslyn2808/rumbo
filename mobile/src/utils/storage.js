import * as SecureStore from 'expo-secure-store';

// Pequeno almacenamiento persistente (token de sesion, preferencias).
export const storage = {
  async get(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      /* sin almacenamiento: el valor dura solo mientras la app este abierta */
    }
  },
  async remove(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* nada que borrar */
    }
  },
};
