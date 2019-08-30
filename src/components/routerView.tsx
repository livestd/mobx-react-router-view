import React from 'react';
import { observer } from 'mobx-react';
import RouterStore from '../lib/store'
import {RouteState} from '../lib/state';

export type WithRoute<T> = T & {route: RouteState; store: RouterStore}
export type WithRouteDescription<T> = T & {route?: RouteState[]; store: RouterStore}

const RouteView = (props: WithRoute<any>) => {
    const {component: Component} = props.route.params
    return (
        <Component {...props} />
    )
}

export const RouterView = observer((props: WithRouteDescription<any>) => {
    const {routes: storeRoutes, lastMatchedRoute, actualRoute} = props.store
    const routes: RouteState[] = (props.route && props.route.childRoutes) || storeRoutes
    let matched: RouteState | undefined = undefined;
    if (!!lastMatchedRoute) {
        matched = routes.find(route => props.store.isMatched(route.params.name))
    }
    if (!lastMatchedRoute) {
        matched = actualRoute
    }
    return (
        <>
            {matched && <RouteView {...props} route={matched} />}
        </>
    )
})