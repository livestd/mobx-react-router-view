import {Location} from "history";
import {match, matchPath} from "react-router"
import RouterStore from "./store";
import { observable } from 'mobx';

export type HookParams = [RouteState, RouteState, RouterStore]

export type TransitionHook = (
    ...[]: HookParams
) => Promise<void>;
export interface RouteHooks {
    beforeExit?: TransitionHook;
    beforeEnter?: TransitionHook;
    onExit?: TransitionHook;
    onEnter?: TransitionHook;
}
export interface RouteParams extends RouteHooks {
    name: string; // e.g. 'department'
    path: string; // e.g. '/departments/:id'
    component: any;
    children?: RouteParams[];
    meta?: any;
}

export interface RouteState {
    params: RouteParams;
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
    constructor(public params: RouteParams, basePath?: string) {
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

        // reset match state and get matched routes
        const childMatched = this.childRoutes.reduce((matched, child) => (child.getMatched(path, matched)), initial)
        if (this.match) {
            // have exact route
            if ( this.match.isExact || !!childMatched.find((r) => (r.match && r.match.isExact)) ) {
                return [...matched, this, ...childMatched]
            }
        }
        return matched
    }
    public searchByName(name: string): RouteState | undefined {
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