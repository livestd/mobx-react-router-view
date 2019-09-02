# mobx-react-router-view
React routing like Vue router-view sync with your MobX state

demo usage https://github.com/livestd/react-router-view-demo

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)

## Installation
```
npm install --save mobx-react-router-view
```

### Typescript

If you are using typescript - the built in typings for this project depend on
`@types/history`, so make sure you have them installed too.

```js
const store = new RouterStore();
```

## Usage

`routes.js`
```js
export const beforeEach = async (...[from, to, store]) => {
    return await new Promise((res) => {res()});
}

export const notFoundRoute = {
    name: '404',
    path: '/404',
    component: NoMatchComponent
}

export const initialRoute = {
    name: 'initial',
    path: '/',
    component: LoadingComponent,
    beforeExit: () => {return new Promise((res) => {setTimeout(res, 1000)})}
}

export const routes = [
    {
        name: 'home',
        path: '/',
        component: MainComponent,
        children: [
            {
                name: 'test',
                path: '/test',
                component: TestComponent
            },
        ]
    },
    {
        name: 'info',
        path: '/info',
        component: InfoComponent,
        children: [
            {
                name: 'infoItem',
                path: '/:id',
                component: InfoIdComponent,
                children: [
                    {
                        name: "infoDetails",
                        path: '/details',
                        component: InfoDetailsComponent
                    }
                ],
            },
            {
                name: 'infoList',
                path: '/list',
                component: InfoListComponent,
            },
        ]
    }
]
```
`index.js`
```js

import RouterStore, {syncHistoryWithStore} from "mobx-react-router-view";
import {routes, notFoundRoute, initialRoute, beforeEach} from "./routes"

const routingStore = new RouterStore(routes, {
     notFoundRoute: notFoundRoute,
     initialRoute: initialRoute,
     beforeEach: beforeEach
 });
const stores = {
  // Key can be whatever you want
  routing: routingStore,
  // ...other stores
};

const browserHistory = createBrowserHistory();
const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render(
  <Provider {...stores}>
    <Router history={history}>
      <App />
    </Router>
  </Provider>,
  document.getElementById('root')
);
```

`App.js`
```js
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { RouterView } from 'mobx-react-router-view';

@inject('routing')
@observer
export default class App extends Component {
  render() {
    const { actualRoute, push, goBack, goTo } = this.props.routing;

    return (
      <div>
        <span>Current pathname: {actualRoute.location.pathname}</span>
        <button onClick={() => goTo('home')}>Main</button>
        <button onClick={() => push('/test')}>Change url</button>
        <button onClick={() => goTo('test', {test: 1})}>With state</button>
        <button onClick={() => goBack()}>Go Back</button>
        <RouterView store={this.props.routing}/>
      </div>
    );
  }
}
```

`mainComponent.js`
```js
import React from 'react';
import { RouterView, WithRoute } from '../route';

const MainComponent = (props) => { //props: WithRoute<any>
    return (
        <div>
            is main component
            <RouterView route={props.route} store={props.store}/>
        </div>
    )
}

export default MainComponent
```

## Features
- add props matching for the goTo function