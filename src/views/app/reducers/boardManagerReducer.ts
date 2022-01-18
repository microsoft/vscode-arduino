// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { versionCompare } from "../../../common/sharedUtilities/utils";
import * as actions from "../actions";
import * as util from "../utils/util";

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
                categories: ["All", "Updatable", "Installed"],
            };
        case actions.BOARD_PACKAGES_SUCCESS: {
            const categories = util.parseGroups(action.platforms, "category");
            // Sorting versions in descending order.
            action.platforms.forEach((element) => {
                element.versions = element.versions.sort(versionCompare).reverse();
            });
            return {
                ...state,
                errorMessage: "",
                requesting: false,
                platforms: action.platforms,
                categories: ["All", "Updatable", "Installed"].concat(categories.sort()),
            };
        }
        case actions.BOARD_PACKAGES_FAILURE:
            return {
                ...state,
                errorMessage: action.errorMessage,
                requesting: false,
                platforms: [],
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
