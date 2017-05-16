/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as actions from "../actions";
import * as util from "../utils/util";

const initalState = {
    configitems: [],
    errorMessage: "",
};

export default function configItemReducer(state = initalState, action) {
    switch (action.type) {
        case actions.CONFIGITEMS_REQUEST:
            return {
                ...state,
                errorMessage: "",
            };
        case actions.CONFIGITEMS_SUCCESS:
            return {
                ...state,
                errorMessage: "",
                configitems: action.configitems,
            };
        case actions.CONFIGITEMS_FAILURE:
            return {
                ...state,
                errorMessage: action.errorMessage,
                configitems: [],
            };
        default:
            return state;
    }
}
