// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as actions from "../actions";
import * as util from "../utils/util";

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
        default:
            return state;
    }
}
