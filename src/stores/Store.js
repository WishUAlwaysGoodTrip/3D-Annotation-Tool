//Store.js
import debounce from 'lodash/debounce';
import Store from 'electron-store';

const electronStore = new Store();

const persistStorage = {
    getItem: (name) => {
        const value = electronStore.get(name);
        return value !== undefined ? JSON.stringify(value) : null;
    },
    setItem: debounce((name, value) => {
        electronStore.set(name, JSON.parse(value));
    }, 300), // 设置一个300ms的延迟
    removeItem: debounce((name) => {
        electronStore.delete(name);
    }, 300),
};

export default persistStorage;