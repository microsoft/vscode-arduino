// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as actions from "../actions";
import * as util from "../utils/util";
import { ActionTypes } from "../WebSocketMiddleware";

interface IState {
    data: {
        [field: string]: Array<[number, number]>,
    };
}

const initalState: IState = {
    data: {},
};

export default function serialPlotterReducer(state = initalState, action) {
    switch (action.type) {
        case ActionTypes.DATA_RECEIVED:
            return onDataReceive(state, action);
        default:
            return state;
    }
}

function onDataReceive(state, action) {
    const currentPlotState = action.payload;
    const time = currentPlotState.time;

    for (const field of Object.keys(currentPlotState)) {
        if (field === "time") {
            continue;
        }
        const fieldData = state.data[field];
        const value = currentPlotState[field];

        const newFieldData = fieldData ? [...fieldData] : [];
        newFieldData.push([time, value]);

        state.data = {
            ...state.data,
            [field]: newFieldData,
        };
    }

    return {
        ...state,
        data: {...state.data},
    };
}
