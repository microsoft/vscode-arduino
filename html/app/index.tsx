/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { Router, Route, IndexRoute, browserHistory, Link } from 'react-router';
import reducer from "./reducers";
import BoardManager from "./components/BoardManager";

import "./styles";

class App extends React.Component<{}, {}> {
  render() {
    return (<div>
        <div>
          { this.props.children }
        </div>
      </div>)
  }
}

const createStoreWithMiddleware = applyMiddleware()(createStore);
const store = createStoreWithMiddleware(reducer);

ReactDOM.render(
  <Provider store={store}>
    <Router history={ browserHistory }>
      <Route path="/" component={App}>
        <Route path="boardmanager" component={BoardManager} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById("mainContent"));
