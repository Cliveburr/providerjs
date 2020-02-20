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
        private injector: Injector
    ) {
        this.interceptions = [];
        this.proxyClsStructs = {};
    }

    public applyProxy(cls: Object, instance: any): void {
        let id = <string>Reflect.getOwnMetadata('interception:id', cls);
        if (!id) {
            id = Symbol().toString();
            Reflect.defineMetadata('interception:id', id, cls);
            let isIntercetor = Reflect.getOwnMetadata('interceptor:is', cls);
            if (typeof isIntercetor != 'undefined') {
                this.proxyClsStructs[id] = undefined;
            }
            else {
                let struct = this.createStruct(cls, instance);
                this.proxyClsStructs[id] = struct;
            }
        }

        let struct = this.proxyClsStructs[id];
        if (struct) {
            this.createProxy(struct, instance);
        }
    }

    private createStruct(cls: Object, instance: any): ProxyClsStruct | undefined {
        let methods = <ProxyMethodStruct[]>[];
        let propType = Object.getPrototypeOf(instance);
        let propNames = Object.getOwnPropertyNames(propType);
        for (let prop of propNames) {
            if (prop == 'constructor' || typeof instance[prop] !== 'function') {
                continue;
            }

            let interceptions = this.interceptions;

            let isIntercept = Reflect.getMetadata('intercept:is', propType, prop);
            if (typeof isIntercept != 'undefined') {
                let customsInterceptions = <events.IInterceptEvent[]>[];
                let customs = <Object[]>Reflect.getMetadata('intercept:customs', propType, prop);
                if (typeof customs != 'undefined' && Array.isArray(customs)) {
                    for (let custom of customs) {
                        let intercept = <events.IInterceptEvent>Reflect.getMetadata('intercept:instance', custom);
                        if (typeof intercept == 'undefined') {
                            intercept = this.injector.get(custom, new StaticProvider(custom));
                            Reflect.defineMetadata('intercept:instance', intercept, custom);
                        }
                        customsInterceptions.push(intercept);
                    }
                }

                interceptions = interceptions
                    .concat(customsInterceptions);
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
                origen: instance[method.name]
            };

            instance[method.name] = this.preMethodProx.bind(instance, proxyContext);
        }
    }

    private preMethodProx(proxyContext: ProxyMethodContext, ...args: any[]): any {
        if (proxyContext.method.preevents && proxyContext.method.preevents.length > 0) {
            let context = <events.IInterceptPreEventContext>{
                methodName: proxyContext.method.name,
                arguments: args
            };
            for (let preevent of proxyContext.method.preevents) {
                preevent(context);
            }
        }
        let ret = undefined;
        if (proxyContext.method.errorevents && proxyContext.method.errorevents.length > 0) {
            try {
                ret = proxyContext.origen(...args);
            } catch (error) {
                let context = <events.IInterceptErrorEventContext>{
                    methodName: proxyContext.method.name,
                    arguments: args,
                    error,
                    raiseError: true
                };
                for (let preevent of proxyContext.method.errorevents) {
                    preevent(context);
                }
                if (context.raiseError) {
                    throw error;
                }
            }
        }
        else {
            ret = proxyContext.origen(...args);
        }
        if (proxyContext.method.posevents && proxyContext.method.posevents.length > 0) {
            let context = <events.IInterceptPosEventContext>{
                methodName: proxyContext.method.name,
                arguments: args
            };
            for (let posevent of proxyContext.method.posevents) {
                posevent(context);
            }
        }
        return ret;
    }
}