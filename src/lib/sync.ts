import {observe} from 'mobx'
import {History, Location} from "history";
import RouterStore from './store'

type HisotryListener = (location: Location | {}, action: string) => void

export const syncHistoryWithStore = (history: History, store: RouterStore) => {
    // Initialise store
    store.setHistory(history);

    // Handle update from history object
    const handleLocationChange = (location: Location) => {
        store._updateLocation(location);
    };

    const unsubscribeFromHistory = history.listen(handleLocationChange);
    handleLocationChange(history.location);

    const subscribe = (listener: HisotryListener) => {
        const onStoreChange = () => {
            const rawLocation = { ...store.actualRoute.location };
            listener(rawLocation, history.action);
        };

        // Listen for changes to location state in store
        const unsubscribeFromStore = observe(store, 'actualRoute', onStoreChange);

        listener(store.actualRoute.location, history.action);

        return unsubscribeFromStore;
    };

    Object.defineProperty(history, 'subscribe', {
        get: () => {
            return subscribe
        }
    })
    Object.defineProperty(history, 'unsubscribe', {
        get: () => {
            return unsubscribeFromHistory
        }
    })

    return history;
};