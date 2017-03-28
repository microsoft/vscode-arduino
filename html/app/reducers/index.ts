/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import { combineReducers } from "redux";
import boardConfigReducer from "./boardConfigReducer";
import boardManagerReducer from "./boardManagerReducer";
import { libraryManagerReducer } from "./libraryManagerReducer";

const rootReducer = combineReducers({
    boardManagerStore: boardManagerReducer,
    boardConfigStore: boardConfigReducer,
    libraryManagerStore: libraryManagerReducer,
});

export default rootReducer;
