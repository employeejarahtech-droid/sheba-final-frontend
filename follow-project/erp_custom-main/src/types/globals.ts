
import React from "react";


export type TError = {
    data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorMessages: [any]
        message: string;
        stack: string | null;
        success: boolean;
    };
    status: number;
}


export type TMeta = {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
}

export type TResponse<T> = {
    data?: T;
    error?: TError;
    meta?: TMeta;
    success: boolean;
    message: string;
}

// export type TResponseRedux<T> = TResponse<T> & BaseQueryApi;


export type TQueryParams = {
    name: string;
    value: boolean | React.Key
}




