import { info as _info, error as _error, debug as _debug, isDebug } from '@pipeline/core'
import { postLog } from './orchestrator';

export const info = (message: string) => {
    _info(message);
    postLog({level: "info", message, date: new Date().toISOString()})
};

export const debug = (message: string) => {
    _debug(message);

    if (isDebug()) {
        postLog({level: "debug", message, date: new Date().toISOString()})
    }
};

export const error = (message: string) => {
    _error(message);
    postLog({level: "error", message, date: new Date().toISOString()})
};
