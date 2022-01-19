// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { versionCompare } from "../../../common/sharedUtilities/utils";
import * as actions from "../actions";
import * as util from "../utils/util";

const initalState = {
    libraries: [],
    types: ["All", "Updatable", "Installed"],
    categories: ["All", "Uncategorized"],
    requesting: false,
    errorMessage: "",
    installingLibraryName: "",
    uninstallingLibraryName: "",
};

export default function libraryManagerReducer(state = initalState, action) {
    switch (action.type) {
        case actions.LIBRARIES_REQUEST:
            return {
                ...state,
                requesting: true,
                errorMessage: "",
            };
        case actions.LIBRARIES_SUCCESS: {
            const types = util.parseGroups(action.libraries, "types");
            const categories = util.parseGroups(action.libraries, (item) => {
                return item.category || "Uncategorized";
            });
            // Sorting versions in descending order.
            // for loop is faster than forEach iterator.
            for (const element of action.libraries) {
                element.versions = element.versions ? element.versions.sort(versionCompare).reverse() : element.versions;
            }
            return {
                ...state,
                libraries: action.libraries,
                types: ["All", "Updatable", "Installed"].concat(types.sort()),
                categories: ["All"].concat(categories.sort()),
                requesting: false,
                errorMessage: "",
            };
        }
        case actions.LIBRARIES_FAILURE:
            return {
                ...state,
                libraries: [],
                requesting: false,
                errorMessage: action.errorMessage,
            };
        case actions.INSTALL_LIBRARY_REQUEST:
            return {
                ...state,
                installingLibraryName: action.libraryName,
            };
        case actions.INSTALL_LIBRARY_SUCCESS:
            return {
                ...state,
                installingLibraryName: "",
            };
        case actions.INSTALL_LIBRARY_FAILURE:
            return {
                ...state,
                installingLibraryName: "",
            };

        case actions.UNINSTALL_LIBRARY_REQUEST:
            return {
                ...state,
                uninstallingLibraryName: action.libraryName,
            };
        case actions.UNINSTALL_LIBRARY_SUCCESS:
            return {
                ...state,
                uninstallingLibraryName: "",
            };
        case actions.UNINSTALL_LIBRARY_FAILURE:
            return {
                ...state,
                uninstallingLibraryName: "",
            };
        default:
            return state;
    }
}
