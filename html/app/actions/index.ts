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

export function getBoardPackages(dispatch) {
    dispatch(boardPackagesRequest());
    API.getBoardPackages().then((response) => {
        const { platforms } = <any> response;
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
    API.uninstallBoard(packagePath).then((response) => {
        dispatch(uninstallBoardSuccess());
        if (callback) {
            callback();
        }
    }).catch((error) => {
        dispatch(uninstallBoardFailure(error));
    });
}
