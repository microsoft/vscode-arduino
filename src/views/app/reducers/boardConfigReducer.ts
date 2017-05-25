/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as actions from "../actions";
import * as util from "../utils/util";

const initalState = {
    selectedBoard: "",
    installedBoards: [],
    configitems: [],
    errorMessage: "",
};

export default function boardConfigReducer(state = initalState, action) {
    switch (action.type) {
        case actions.INSTALLED_BOARDS_REQUEST:
            return {
                ...state,
                errorMessage: "",
            };
        case actions.INSTALLED_BOARDS_SUCCESS:
            const selectedBoard = action.installedBoards.find((b) => b.isSelected);
            return {
                ...state,
                errorMessage: "",
                installedBoards: action.installedBoards,
            };
        case actions.INSTALLED_BOARDS_FAILURE:
            return {
                ...state,
                errorMessage: action.errorMessage,
                installedBoards: [],
            };
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
