import * as events from './interception.events';
import { Injector } from '../provider/injector';
import { StaticProvider } from '../provider/providers';

interface ProxyClsStruct {
    methods: ProxyMethodStruct[];
}

interface ProxyMethodStruct {
    name: string;
    preevents?: events.IInterceptPreEventDelegate[];
    posevents?: events.IInterceptPosEventDelegate[];
    errorevents?: events.IInterceptErrorEventDelegate[];
}

interface ProxyMethodContext {
    method: ProxyMethodStruct;
    origen: Function;
}

export class Interceptor {

    public interceptions: events.IInterceptEvent[];
    private proxyClsStructs: { [key: string]: ProxyClsStruct | undefined };

    constructor(
    ) {
        this.interceptions = [];
        this.proxyClsStructs = {};
    }

    public applyProxy(cls: Object, instance: any, injector: Injector): void {
        let id = <Symbol>Reflect.getOwnMetadata('interception:id', cls);
        if (!id) {
            id = Symbol();
            Reflect.defineMetadata('interception:id', id, cls);
            const isIntercetor = Reflect.getOwnMetadata('interceptor:is', cls);
            if (typeof isIntercetor != 'undefined') {
                this.proxyClsStructs[<any>id] = undefined;
            }
            else {
                const struct = this.createStruct(cls, instance, injector);
                this.proxyClsStructs[<any>id] = struct;
            }
        }
        const struct = this.proxyClsStructs[<any>id];
        if (struct) {
            this.createProxy(struct, instance);
        }
    }

    private createStruct(cls: Object, instance: any, injector: Injector): ProxyClsStruct | undefined {
        const methods = <ProxyMethodStruct[]>[];
        const propType = Object.getPrototypeOf(instance);
        const propNames = Object.getOwnPropertyNames(propType);

        const interceptions = this.interceptions.slice();

        const interceptCustoms = <Object[] | undefined>Reflect.getOwnMetadata('intercept:customs', cls);
        if (typeof interceptCustoms != 'undefined' && Array.isArray(interceptCustoms) && interceptCustoms.length > 0) {
            for (let icObj of interceptCustoms) {
                const intercept = this.getInterceptInstance(icObj, injector);
                interceptions.push(intercept);
            }
        }

        for (let prop of propNames) {
            if (prop == 'constructor' || typeof instance[prop] !== 'function') {
                continue;
            }

            let isIntercept = Reflect.getMetadata('intercept:is', propType, prop);
            if (typeof isIntercept != 'undefined') {
                let customs = <Object[]>Reflect.getMetadata('intercept:customs', propType, prop);
                if (typeof customs != 'undefined' && Array.isArray(customs) && customs.length > 0) {
                    for (let custom of customs) {
                        const intercept = this.getInterceptInstance(custom, injector);
                        interceptions.push(intercept);
                    }
                }
            }

            let interpre = <events.IInterceptPreEventDelegate[]>[];
            let interpos = <events.IInterceptPosEventDelegate[]>[];
            let intererror = <events.IInterceptErrorEventDelegate[]>[];
            for (let intercept of interceptions) {
                if (this.isPreEvent(intercept) && intercept.isPreEventApply(instance, prop)) {
                    interpre.push(intercept.preEvent);
                }
                if (this.isPosEvent(intercept) && intercept.isPosEventApply(instance, prop)) {
                    interpos.push(intercept.posEvent);
                }
                if (this.isErrorEvent(intercept) && intercept.isErrorEventApply(instance, prop)) {
                    intererror.push(intercept.errorEvent);
                }
            }

            if (interpre.length > 0 || interpos.length > 0 || intererror.length > 0) {
                methods.push({
                    name: prop,
                    preevents: interpre.length > 0 ? interpre : undefined,
                    posevents: interpos.length > 0 ? interpos : undefined,
                    errorevents: intererror.length > 0 ? intererror : undefined
                })
            }
        }

        if (methods.length > 0) {
            return {
                methods
            };
        }
        else {
            return undefined;
        }
    }

    private getInterceptInstance(cls: Object, injector: Injector): events.IInterceptEvent {
        let intercept = <events.IInterceptEvent>Reflect.getMetadata('intercept:instance', cls);
        if (typeof intercept == 'undefined') {
            intercept = injector.get(cls, true, [new StaticProvider(cls)]);
            Reflect.defineMetadata('intercept:instance', intercept, cls);
        }
        return intercept;
    }

    private isPreEvent(value: events.IInterceptEvent): value is events.IInterceptPreEvent {
        let test = <events.IInterceptPreEvent>value;
        return typeof test.isPreEventApply !== 'undefined' && typeof test.preEvent !== 'undefined';
    }

    private isPosEvent(value: events.IInterceptEvent): value is events.IInterceptPosEvent {
        let test = <events.IInterceptPosEvent>value;
        return typeof test.isPosEventApply !== 'undefined' && typeof test.posEvent !== 'undefined';
    }

    private isErrorEvent(value: events.IInterceptEvent): value is events.IInterceptErrorEvent {
        let test = <events.IInterceptErrorEvent>value;
        return typeof test.isErrorEventApply !== 'undefined' && typeof test.errorEvent !== 'undefined';
    }

    private createProxy(struct: ProxyClsStruct, instance: any): void {
        for (let method of struct.methods) {
            let proxyContext = <ProxyMethodContext>{
                method,
                origen: instance[method.name].bind(instance)
            };

            instance[method.name] = this.methodProx.bind(this, proxyContext);
        }
    }

    private methodProx(proxyContext: ProxyMethodContext, ...args: any[]): any {
        if (proxyContext.method.preevents && proxyContext.method.preevents.length > 0) {
            let context = <events.IInterceptPreEventContext>{
                methodName: proxyContext.method.name,
                arguments: args
            };
            for (let preevent of proxyContext.method.preevents) {
                preevent(context);
            }
        }
        let ret = <any>undefined;
        const handlePost = () => {
            if (proxyContext.method.posevents && proxyContext.method.posevents.length > 0) {
                let context = <events.IInterceptPosEventContext>{
                    methodName: proxyContext.method.name,
                    arguments: args,
                    result: ret
                };
                for (let posevent of proxyContext.method.posevents) {
                    posevent(context);
                }
                ret = context.result;
            }
        }
        if (proxyContext.method.errorevents && proxyContext.method.errorevents.length > 0) {
            const handleError = (error: any, reject: ((reason?: string) => void) | undefined) => {
                const context = <events.IInterceptErrorEventContext>{
                    methodName: proxyContext.method.name,
                    arguments: args,
                    error,
                    raiseError: true
                };
                for (let errorevent of proxyContext.method.errorevents!) {
                    errorevent(context);
                }
                if (context.raiseError) {
                    if (reject) {
                        reject(context.error);
                    }
                    else {
                        throw context.error;
                    }
                }
            }

            try {
                ret = proxyContext.origen(...args);
                if (ret instanceof Promise) {
                    return new Promise((eRet, rRet) => {
                        Promise.resolve(ret)
                            .then(value => {
                                eRet(value);
                                handlePost();
                            })
                            .catch(error => handleError(error, rRet));
                    });
                }
            } catch (error) {
                handleError(error, undefined);
            }
        }
        else {
            ret = proxyContext.origen(...args);
            if (ret instanceof Promise) {
                return new Promise((eRet, rRet) => {
                    Promise.resolve(ret)
                        .then(value => {
                            eRet(value);
                            handlePost();
                        });
                });
            }
        }
        handlePost();
        return ret;
    }
}