import Store from 'electron-store';

const electronStore = new Store();

const persistStorage = {
    getItem: (name) => {
        const value = electronStore.get(name);
        return value !== undefined ? JSON.stringify(value) : null;
    },
    setItem: (name, value) => {
        electronStore.set(name, JSON.parse(value));
    },
    removeItem: (name) => {
        electronStore.delete(name);
    },
};

export default persistStorage;