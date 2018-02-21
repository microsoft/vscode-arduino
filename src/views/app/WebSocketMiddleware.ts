import { Action, Dispatch, Middleware, MiddlewareAPI } from "redux";

export enum ActionTypes {
    DATA_RECEIVED,
}

export function createSocketMiddleware(): Middleware {
    const ws = new WebSocket(`ws://${window.location.host}`);

    return <T>(store: MiddlewareAPI<T>) => {
        ws.onmessage = (e: MessageEvent) => {
            store.dispatch({
                type: ActionTypes.DATA_RECEIVED,
                payload: JSON.parse(e.data),
            });
        };

        return <T>(next: Dispatch<T>) => <A extends Action>(action: A) => {
            return next(action);
        }
    }
}


