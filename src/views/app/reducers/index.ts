// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { combineReducers } from "redux";
import boardConfigReducer from "./boardConfigReducer";
import boardManagerReducer from "./boardManagerReducer";
import exampleReducer from "./exampleReducer";
import libraryManagerReducer from "./libraryManagerReducer";
import serialPlotterReducer from "./serialPlotterReducer";

const rootReducer = combineReducers({
    boardManagerStore: boardManagerReducer,
    boardConfigStore: boardConfigReducer,
    exampleStore: exampleReducer,
    libraryManagerStore: libraryManagerReducer,
    serialPlotterStore: serialPlotterReducer,
});

export default rootReducer;
