// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as actions from "../actions";

const initalState = {
    requesting: false,
    examples: [],
    errorMessage: "",
};

export default function exampleReducer(state = initalState, action) {
    switch (action.type) {
        case actions.EXAMPLES_REQUEST:
            return {
                ...state,
                errorMessage: "",
                requesting: true,
            };
        case actions.EXAMPLES_SUCCESS:
            return {
                ...state,
                errorMessage: "",
                requesting: false,
                examples: action.examples,
            };
        case actions.EXAMPLES_FAILURE:
            return {
                ...state,
                errorMessage: action.errorMessage,
                requesting: false,
                examples: [],
            };
        default:
            return state;
    }
}
