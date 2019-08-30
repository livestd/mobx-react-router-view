import { action, observable, computed } from 'mobx';
import { History, Location, LocationDescriptorObject } from 'history';
import {RouteParams, RouteState, RouteStateItem, HookParams, TransitionHook} from './state'
export interface RouterStoreOptions {
    notFoundRoute: RouteParams;
    initialRoute: RouteParams;
    beforeEach?: TransitionHook;
}

export default class RouterStore {
    @observable
    public actualRoute: RouteState;
    public defaultRoute: RouteState;
    public history: History | null = null;
    public routes: RouteState[];
    public matchedRoutes: RouteState[] = [];
    private beforeEach: TransitionHook | undefined;

    constructor(routeMap: RouteParams[], options: RouterStoreOptions) {
        this.routes = routeMap.map(r => new RouteStateItem(r))
        this.defaultRoute = new RouteStateItem(options.notFoundRoute)
        this.actualRoute = new RouteStateItem(options.initialRoute || options.notFoundRoute)
        this.beforeEach = options.beforeEach
    }
    public getRouteByName = (name: string): RouteState | undefined => {
        return this.routes.map((r) => r.searchByName(name)).find(f => f !== undefined)
    }
    public getRouteByPath = (path: string): RouteState | undefined => {
        return this.routes.map((r) => r.searchByPath(path)).find(f => f !== undefined)
    }
    protected getMatchedRoutes = async (path: string) => {
        const initial: RouteState[] = []
        this.matchedRoutes = this.routes.reduce((matched, current) => (current.getMatched(path, matched)), initial)
        return await new Promise((r) => {r()});
    }
    public get lastMatchedRoute(): RouteState | undefined {
        const matched = this.matchedRoutes.filter((r) => (r.match && r.match.isExact))
        return matched.pop()
    }
    public isMatched = (name: string): boolean => {
        return !!this.matchedRoutes.find(r => r.params.name === name)
    }
    @action
    public async _updateLocation(newState: Location) {
        const lastRoute = this.actualRoute
        await this.getMatchedRoutes(newState.pathname)
        console.log("new matched",this.matchedRoutes)
        const nextRoute = this.lastMatchedRoute || this.defaultRoute
        nextRoute.location = newState

        // emit hooks
        const hookParams: HookParams = [lastRoute, nextRoute, this]
        if (this.beforeEach) {
            await this.beforeEach(...hookParams)
        }
        if (lastRoute) {
            await lastRoute.beforeExit(...hookParams)
        }
        await nextRoute.beforeEnter(...hookParams)

        // change state
        this.actualRoute = nextRoute;
        if (lastRoute) {
            lastRoute.onExit(...hookParams)
        }
        nextRoute.onEnter(...hookParams)
    }
    public setHistory(history: History) {
        this.history = history;
    }
    /*
    * History methods
    */
    private historyCall(method: string, ...args: any[]) {
        const historyObj = this.history as {[key: string]: any}
        if (this.history && historyObj.hasOwnProperty(method) && typeof historyObj[method] === 'function') {
            historyObj[method].apply(this.history, args)
        }
    }
    public push = (...args: [LocationDescriptorObject] | [string, any?]) => {
        this.historyCall('push', ...args);
    }
    public replace = (...args: [LocationDescriptorObject] | [string, any?]) => {
        this.historyCall('replace', ...args);
    }
    public go = (n: number) => {
        this.historyCall('go', n);
    }
    public goBack = () => {
        this.historyCall('goBack');
    }
    public goForward = () => {
        this.historyCall('goForward');
    }
    public goTo = (name: string, state?: any, search?: string, hash?: string) => {
        const route = this.getRouteByName(name)
        if (route) {
            this.push({
                pathname: route.params.path,
                state: state,
                search: search || '',
                hash: hash || ''
            } as Location)
        }
    }
}