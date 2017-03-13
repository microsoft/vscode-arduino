/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as API from "./api";
import * as JSONHelper from "./cycle";

export const BOARD_PACKAGES_REQUEST = "BOARD_PACKAGES_REQUEST";
export const BOARD_PACKAGES_SUCCESS = "BOARD_PACKAGES_SUCCESS";
export const BOARD_PACKAGES_FAILURE = "BOARD_PACKAGES_FAILURE";
export const INSTALL_BOARD_REQUEST = "INSTALL_BOARD_REQUEST";
export const INSTALL_BOARD_SUCCESS = "INSTALL_BOARD_SUCCESS";
export const INSTALL_BOARD_FAILURE = "INSTALL_BOARD_FAILURE";
export const UNINSTALL_BOARD_REQUEST = "UNINSTALL_BOARD_REQUEST";
export const UNINSTALL_BOARD_SUCCESS = "UNINSTALL_BOARD_SUCCESS";
export const UNINSTALL_BOARD_FAILURE = "UNINSTALL_BOARD_FAILURE";
export const LIBRARIES_REQUEST = "LIBRARIES_REQUEST";
export const LIBRARIES_SUCCESS = "LIBRARIES_SUCCESS";
export const LIBRARIES_FAILURE = "LIBRARIES_FAILURE";
export const INSTALL_LIBRARY_REQUEST = "INSTALL_LIBRARY_REQUEST";
export const INSTALL_LIBRARY_SUCCESS = "INSTALL_LIBRARY_SUCCESS";
export const INSTALL_LIBRARY_FAILURE = "INSTALL_LIBRARY_FAILURE";
export const UNINSTALL_LIBRARY_REQUEST = "UNINSTALL_LIBRARY_REQUEST";
export const UNINSTALL_LIBRARY_SUCCESS = "UNINSTALL_LIBRARY_SUCCESS";
export const UNINSTALL_LIBRARY_FAILURE = "UNINSTALL_LIBRARY_FAILURE";

export function boardPackagesRequest() {
    return {
        type: BOARD_PACKAGES_REQUEST,
    };
}

export function boardPackagesSuccess(platforms) {
    return {
        type: BOARD_PACKAGES_SUCCESS,
        platforms,
    };
}

export function boardPackagesFailure(errorMessage) {
    return {
        type: BOARD_PACKAGES_FAILURE,
        errorMessage,
    };
}

export function installBoardRequest(boardName) {
    return {
        type: INSTALL_BOARD_REQUEST,
        boardName,
    };
}

export function installBoardSuccess() {
    return {
        type: INSTALL_BOARD_SUCCESS,
    };
}

export function installBoardFailure(errorMessage) {
    return {
        type: INSTALL_BOARD_FAILURE,
        errorMessage,
    };
}

export function uninstallBoardRequest(boardName) {
    return {
        type: UNINSTALL_BOARD_REQUEST,
        boardName,
    };
}

export function uninstallBoardSuccess() {
    return {
        type: UNINSTALL_BOARD_SUCCESS,
    };
}

export function uninstallBoardFailure(errorMessage) {
    return {
        type: UNINSTALL_BOARD_FAILURE,
        errorMessage,
    };
}

export function librariesRequest() {
    return {
        type: LIBRARIES_REQUEST,
    };
}

export function librariesSuccess(libraries) {
    return {
        type: LIBRARIES_SUCCESS,
        libraries,
    };
}

export function librariesFailure(errorMessage) {
    return {
        type: LIBRARIES_FAILURE,
        errorMessage,
    };
}

export function installLibraryRequest(libraryName) {
    return {
        type: INSTALL_LIBRARY_REQUEST,
        libraryName,
    };
}

export function installLibrarySuccess(libraryName) {
    return {
        type: INSTALL_LIBRARY_SUCCESS,
        libraryName,
    };
}

export function installLibraryFailure(libraryName, errorMessage) {
    return {
        type: INSTALL_LIBRARY_FAILURE,
        libraryName,
        errorMessage,
    };
}

export function uninstallLibraryRequest(libraryName) {
    return {
        type: UNINSTALL_LIBRARY_REQUEST,
        libraryName,
    };
}

export function uninstallLibrarySuccess(libraryName) {
    return {
        type: UNINSTALL_LIBRARY_SUCCESS,
        libraryName,
    };
}

export function uninstallLibraryFailure(libraryName, errorMessage) {
    return {
        type: UNINSTALL_LIBRARY_FAILURE,
        libraryName,
        errorMessage,
    };
}

export function getBoardPackages(dispatch) {
    dispatch(boardPackagesRequest());
    API.getBoardPackages().then((response) => {
        const { platforms } = <any>response;
        dispatch(boardPackagesSuccess(JSONHelper.retrocycle(platforms)));
    }).catch((error) => {
        dispatch(boardPackagesFailure(error));
    });
}

export function installBoard(dispatch, boardName, packageName, arch, version, callback?: Function) {
    dispatch(installBoardRequest(boardName));
    API.installBoard(packageName, arch, version).then((response) => {
        dispatch(installBoardSuccess());
        if (callback) {
            callback();
        }
    }).catch((error) => {
        dispatch(installBoardFailure(error));
    });
}

export function uninstallBoard(dispatch, boardName, packagePath, callback?: Function) {
    dispatch(uninstallBoardRequest(boardName));
    API.uninstallBoard(boardName, packagePath).then((response) => {
        dispatch(uninstallBoardSuccess());
        if (callback) {
            callback();
        }
    }).catch((error) => {
        dispatch(uninstallBoardFailure(error));
    });
}

export function getLibraries(dispatch, callback?: Function) {
    dispatch(librariesRequest());
    API.getLibraries().then((response) => {
        const { libraries } = <any>response;
        dispatch(librariesSuccess(libraries));
        if (callback) {
            callback();
        }
    }).catch((error) => {
        dispatch(librariesFailure(error));
        if (callback) {
            callback();
        }
    });
}

export function installLibrary(dispatch, libraryName, version, callback?: Function) {
    dispatch(installLibraryRequest(libraryName));
    API.installLibrary(libraryName, version).then((response) => {
        dispatch(installLibrarySuccess(libraryName));
        if (callback) {
            callback();
        }
    }).catch((error) => {
        dispatch(installLibraryFailure(libraryName, error));
        if (callback) {
            callback(error);
        }
    });
}

export function uninstallLibrary(dispatch, libraryName, libraryPath, callback?: Function) {
    dispatch(uninstallLibraryRequest(libraryName));
    API.uninstallLibrary(libraryName, libraryPath).then((response) => {
        dispatch(uninstallLibrarySuccess(libraryName));
        if (callback) {
            callback();
        }
    }).catch((error) => {
        dispatch(uninstallLibraryFailure(libraryName, error));
        if (callback) {
            callback(error);
        }
    });
}
