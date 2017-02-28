/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import { combineReducers } from "redux";
import boardManagerReducer from "./boardManagerReducer";

const rootReducer = combineReducers({
    boardManagerStore: boardManagerReducer,
});

export default rootReducer;
