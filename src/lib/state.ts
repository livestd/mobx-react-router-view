import {Location} from "history";
import {match, matchPath} from "react-router"
import RouterStore from "./store";

export type HookParams = [RouteState, RouteState, RouterStore]

export type TransitionHook = (
    ...[]: HookParams
) => Promise<void>;

export interface Route {
    name: string; // e.g. 'department'
    path: string; // e.g. '/departments/:id'
    component: any;
    meta?: any;
    beforeExit?: TransitionHook;
    beforeEnter?: TransitionHook;
    onExit?: TransitionHook;
    onEnter?: TransitionHook;
}

export interface RouteWithChild extends Route {
    children?: RouteWithChild[];
}

export type RouteMap = RouteWithChild[];

export interface RouteState {
    params: RouteWithChild;
    location: Location;
    fullPath: string;
    match: match | null;
    childRoutes: RouteState[];
    getMatched: (path: string, matched: RouteState[]) => RouteState[];
    searchByName: (name: string) => RouteState | undefined;
    searchByPath: (name: string) => RouteState | undefined;
    beforeExit: TransitionHook;
    beforeEnter: TransitionHook;
    onExit: TransitionHook;
    onEnter: TransitionHook;
}

export class RouteStateItem implements RouteState {
    public location: Location = {pathname: '', search: '', state: {}, hash: '', key: ''}
    public childRoutes: RouteState[] = [];
    public fullPath: string;
    public match: match | null = null;
    constructor(public params: RouteWithChild, basePath?: string) {
        const baseFixed = (basePath || "/").replace(/\/$/,"")
        const selfFixed = (params.path || "/").replace(/^\//,"")
        this.fullPath = baseFixed + "/" + selfFixed
        if (params.children) {
            this.childRoutes = params.children.map(r => new RouteStateItem(r, this.fullPath))
        }
    }
    public getMatched = (path: string, matched: RouteState[]): RouteState[] => {
        const initial: RouteState[] = []
        this.match = matchPath(path, {path: this.fullPath})
        console.log("updatet match", this.fullPath, this.match)
        // reset match state and get matched routes
        const childMatched = this.childRoutes.reduce((matched, child) => (child.getMatched(path, matched)), initial)
        if (this.match) {
            return [...matched, this, ...childMatched]
        }
        return matched
    }
    public searchByName(name: string): RouteState | undefined {
        [1].find((i: number) => (i == 1))
        return this.params.name === name ? this : this.childRoutes.map((r) => r.searchByName(name)).find(f => f !== undefined)
    }
    public searchByPath(path: string): RouteState | undefined {
        this.match = matchPath(path, {path: this.fullPath})
        const firstContain = this.childRoutes.map((r) => r.searchByPath(path)).find(f => f !== undefined)
        if (this.match) {
            return firstContain || (this.match.isExact ? this : undefined)
        }
        return undefined;
    }
    public beforeExit: TransitionHook = async (...args) => {
        if (this.params.beforeExit)
            return this.params.beforeExit(...args)
        return;
    }
    public beforeEnter: TransitionHook = async (...args) => {
        if (this.params.beforeEnter)
            return this.params.beforeEnter(...args)
        return;
    }
    public onExit: TransitionHook = async (...args) => {
        if (this.params.onExit)
            return this.params.onExit(...args)
        return;
    }
    public onEnter: TransitionHook = async (...args) => {
        if (this.params.onEnter)
            return this.params.onEnter(...args)
        return;
    }
}