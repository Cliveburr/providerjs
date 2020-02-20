
export interface IInterceptEvent {
}

export interface IInterceptPreEventContext {
    arguments: Object[];
    methodName: string;
    callMethod: boolean;
}

export interface IInterceptPreEventDelegate {
    (context: IInterceptPreEventContext): void;
}

export interface IInterceptPreEvent extends IInterceptEvent {
    isPreEventApply(cls: Object, methodName: string): boolean;
    preEvent: IInterceptPreEventDelegate;
}

export interface IInterceptPosEventContext {
    arguments: Object[];
    methodName: string;
}

export interface IInterceptPosEventDelegate {
    (context: IInterceptPosEventContext): void;
}

export interface IInterceptPosEvent extends IInterceptEvent {
    isPosEventApply(cls: Object, methodName: string): boolean;
    posEvent: IInterceptPosEventDelegate;
}

export interface IInterceptErrorEventContext {
    arguments: Object[];
    methodName: string;
    raiseError: boolean;
    error: any;
}

export interface IInterceptErrorEventDelegate {
    (context: IInterceptErrorEventContext): void;
}

export interface IInterceptErrorEvent extends IInterceptEvent {
    isErrorEventApply(cls: Object, methodName: string): boolean;
    errorEvent: IInterceptErrorEventDelegate;
}