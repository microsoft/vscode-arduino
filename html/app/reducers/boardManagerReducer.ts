/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as actions from "../actions";
import * as helper from "../utils/util";

const initalState = {
    platforms: [],
    categories: ["All", "Updatable"],
    requesting: false,
    errorMessage: "",
    installingBoardName: "",
    installErrorMessage: "",
    uninstallingBoardName: "",
    uninstallErrorMessage: "",
};

export default function boardManagerReducer(state = initalState, action) {
    switch (action.type) {
        case actions.BOARD_PACKAGES_REQUEST:
            return {
                ...state,
                errorMessage: "",
                requesting: true,
                categories: ["All", "Updatable"],
            };
        case actions.BOARD_PACKAGES_SUCCESS:
            const group = helper.groupBy(action.platforms, "category");
            const categories = ["All", "Updatable"];
            // Sorting versions in descending order.
            action.platforms.forEach((element) => {
                element.versions = element.versions.sort(helper.versionCompare).reverse();
            });
            return {
                ...state,
                errorMessage: "",
                requesting: false,
                platforms: action.platforms,
                categories: categories.concat(Object.keys(group).sort()),
            };
        case actions.BOARD_PACKAGES_FAILURE:
            return {
                ...state,
                errorMessage: action.errorMessage,
                requesting: false,
                platforms: [],
                categories: ["All", "Updatable"],
            };
        case actions.INSTALL_BOARD_REQUEST:
            return {
                ...state,
                installingBoardName: action.boardName,
                installErrorMessage: "",
            };
        case actions.INSTALL_BOARD_SUCCESS:
            return {
                ...state,
                installingBoardName: "",
                installErrorMessage: "",
            };
        case actions.INSTALL_BOARD_FAILURE:
            return {
                ...state,
                installingBoardName: "",
                installErrorMessage: action.errorMessage,
            };
        case actions.UNINSTALL_BOARD_REQUEST:
            return {
                ...state,
                uninstallingBoardName: action.boardName,
                uninstallErrorMessage: "",
            };
        case actions.UNINSTALL_BOARD_SUCCESS:
            return {
                ...state,
                uninstallingBoardName: "",
                uninstallErrorMessage: "",
            };
        case actions.UNINSTALL_BOARD_FAILURE:
            return {
                ...state,
                uninstallingBoardName: "",
                uninstallErrorMessage: action.errorMessage,
            };
        default:
            return state;
    }
}
