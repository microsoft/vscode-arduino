// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

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
export const INSTALLED_BOARDS_REQUEST = "INSTALLED_BOARDS_REQUEST";
export const INSTALLED_BOARDS_SUCCESS = "INSTALLED_BOARDS_SUCCESS";
export const INSTALLED_BOARDS_FAILURE = "INSTALLED_BOARDS_FAILURE";
export const CONFIGITEMS_REQUEST = "CONFIGITEMS_REQUEST";
export const CONFIGITEMS_SUCCESS = "CONFIGITEMS_SUCCESS";
export const CONFIGITEMS_FAILURE = "CONFIGITEMS_FAILURE";
export const EXAMPLES_REQUEST = "EXAMPLES_REQUEST";
export const EXAMPLES_SUCCESS = "EXAMPLES_SUCCESS";
export const EXAMPLES_FAILURE = "EXAMPLES_FAILURE";

function boardPackagesRequest() {
    return {
        type: BOARD_PACKAGES_REQUEST,
    };
}

function boardPackagesSuccess(platforms) {
    return {
        type: BOARD_PACKAGES_SUCCESS,
        platforms,
    };
}

function boardPackagesFailure(errorMessage) {
    return {
        type: BOARD_PACKAGES_FAILURE,
        errorMessage,
    };
}

function installBoardRequest(boardName) {
    return {
        type: INSTALL_BOARD_REQUEST,
        boardName,
    };
}

function installBoardSuccess() {
    return {
        type: INSTALL_BOARD_SUCCESS,
    };
}

function installBoardFailure(errorMessage) {
    return {
        type: INSTALL_BOARD_FAILURE,
        errorMessage,
    };
}

function uninstallBoardRequest(boardName) {
    return {
        type: UNINSTALL_BOARD_REQUEST,
        boardName,
    };
}

function uninstallBoardSuccess() {
    return {
        type: UNINSTALL_BOARD_SUCCESS,
    };
}

function uninstallBoardFailure(errorMessage) {
    return {
        type: UNINSTALL_BOARD_FAILURE,
        errorMessage,
    };
}

function librariesRequest() {
    return {
        type: LIBRARIES_REQUEST,
    };
}

function librariesSuccess(libraries) {
    return {
        type: LIBRARIES_SUCCESS,
        libraries,
    };
}

function librariesFailure(errorMessage) {
    return {
        type: LIBRARIES_FAILURE,
        errorMessage,
    };
}

function installLibraryRequest(libraryName) {
    return {
        type: INSTALL_LIBRARY_REQUEST,
        libraryName,
    };
}

function installLibrarySuccess(libraryName) {
    return {
        type: INSTALL_LIBRARY_SUCCESS,
        libraryName,
    };
}

function installLibraryFailure(libraryName, errorMessage) {
    return {
        type: INSTALL_LIBRARY_FAILURE,
        libraryName,
        errorMessage,
    };
}

function uninstallLibraryRequest(libraryName) {
    return {
        type: UNINSTALL_LIBRARY_REQUEST,
        libraryName,
    };
}

function uninstallLibrarySuccess(libraryName) {
    return {
        type: UNINSTALL_LIBRARY_SUCCESS,
        libraryName,
    };
}

function uninstallLibraryFailure(libraryName, errorMessage) {
    return {
        type: UNINSTALL_LIBRARY_FAILURE,
        libraryName,
        errorMessage,
    };
}

function installedBoardsRequest() {
    return {
        type: INSTALLED_BOARDS_REQUEST,
    };
}

function installedBoardsSuccess(installedBoards) {
    return {
        type: INSTALLED_BOARDS_SUCCESS,
        installedBoards,
    };
}

function installedBoardsFailure(errorMessage) {
    return {
        type: INSTALLED_BOARDS_FAILURE,
        errorMessage,
    };
}

function configItemsRequest() {
    return {
        type: CONFIGITEMS_REQUEST,
    };
}

function configItemsSuccess(configitems) {
    return {
        type: CONFIGITEMS_SUCCESS,
        configitems,
    };
}

function configItemsFailure(errorMessage) {
    return {
        type: CONFIGITEMS_FAILURE,
        errorMessage,
    };
}

function examplesRequest() {
    return {
        type: EXAMPLES_REQUEST,
    };
}

function exampleSuccess(examples) {
    return {
        type: EXAMPLES_SUCCESS,
        examples,
    };
}

function exampleFailure(errorMessage) {
    return {
        type: EXAMPLES_FAILURE,
        errorMessage,
    };
}

export function getBoardPackages(dispatch, update: boolean) {
    dispatch(boardPackagesRequest());
    API.getBoardPackages(update).then((response) => {
        const { platforms } = <any>response;
        dispatch(boardPackagesSuccess(JSONHelper.retrocycle(platforms)));
    }).catch((error) => {
        dispatch(boardPackagesFailure(error));
    });
}

export function installBoard(dispatch, boardName, packageName, arch, version, callback?: () => void) {
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

export function uninstallBoard(dispatch, boardName, packagePath, callback?: () => void) {
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

export function getLibraries(dispatch, update: boolean, callback?: () => void) {
    dispatch(librariesRequest());
    API.getLibraries(update).then((response) => {
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

export function installLibrary(dispatch, libraryName, version, callback?: (error?) => void) {
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

export function uninstallLibrary(dispatch, libraryName, libraryPath, callback?: (error?) => void) {
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

export function getInstalledBoards(dispatch, callback?: () => void) {
    dispatch(installedBoardsRequest());
    API.getInstalledBoards().then((response) => {
        const { installedBoards } = <any>response;
        dispatch(installedBoardsSuccess(installedBoards));
        if (callback) {
            callback();
        }
    }).catch((error) => {
        dispatch(installedBoardsFailure(error));
        if (callback) {
            callback();
        }
    });
}

export function getConfigItems(dispatch, callback?: () => void) {
    dispatch(configItemsRequest());
    API.getConfigItems().then((response) => {
        const { configitems } = <any>response;
        dispatch(configItemsSuccess(configitems));
        if (callback) {
            callback();
        }
    }).catch((error) => {
        dispatch(configItemsFailure(error));
        if (callback) {
            callback();
        }
    });
}

export function getExamples(dispatch) {
    dispatch(examplesRequest());
    API.getExamples().then((response) => {
        const { examples } = <any>response;
        dispatch(exampleSuccess(examples));
    }).catch((error) => {
        dispatch(exampleFailure(error));
    });
}
