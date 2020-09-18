
export interface IInterceptEvent {
}

export interface IInterceptEventContext {
    arguments: Object[];
    methodName: string;
    funcs: IInterceptEventDelegate[];
    processed: boolean;
    result?: any;
    error?: any;
    throwError?: boolean;
}

export interface IInterceptEventDelegate {
    (context: IInterceptEventContext): void | Promise<void>;
}

export interface IInterceptPreEvent extends IInterceptEvent {
    isPreEventApply(cls: Object, methodName: string): boolean;
    preEvent: IInterceptEventDelegate;
}

export interface IInterceptPosEvent extends IInterceptEvent {
    isPosEventApply(cls: Object, methodName: string): boolean;
    posEvent: IInterceptEventDelegate;
}

export interface IInterceptErrorEvent extends IInterceptEvent {
    isErrorEventApply(cls: Object, methodName: string): boolean;
    errorEvent: IInterceptEventDelegate;
}