import * as events from './interception.events';
import { IProvider, StaticProvider } from '../provider/providers';
import { IGetContext } from '../provider/provider.container';
import { InterceptionData } from './interception.decorator';

export interface ApplyProxyContext {
    cls: Object;
    instance: any;
    getIntern: (ctx: IGetContext) => any;
    resolving: Object[];
    customs?: IProvider[];
    extraData?: any[];
}

interface ProxyMethodContext {
    methodName: string;
    funcs: events.IInterceptEventDelegate[];
}

export class Interceptor {

    public interceptions: events.IInterceptEvent[];

    constructor(
    ) {
        this.interceptions = [];
    }

    private getInterceptInstance(cls: Object, ctx: ApplyProxyContext): events.IInterceptEvent {
        let provider = <IProvider>Reflect.getOwnMetadata('interceptor:provider', cls);
        if (!provider) {
            provider = this.createProviderFromObject(cls);
            Reflect.defineMetadata('interceptor:provider', provider, cls);
        }
        const customProviders: IProvider[] = [provider];
        if (ctx.customs) {
            customProviders.push(...ctx.customs);
        }
        return ctx.getIntern({
            identifier: cls,
            need: true,
            resolving: ctx.resolving,
            customs: customProviders,
            extraData: ctx.extraData
        });
    }

    private createProviderFromObject(cls: Object): IProvider {
        const data = <InterceptionData>Reflect.getOwnMetadata('injectable:data', cls);
        if (data) {
            if (data.provider) {
                if (this.isProvider(data.provider)) {
                    return data.provider;
                }
                else {
                    return new (<any>data.provider)(cls);
                }
            }
            if (data.identity) {
                return new StaticProvider(data.identity, cls);
            }
        }
        return new StaticProvider(cls);
    }

    private isProvider(value: any): value is IProvider {
        return typeof (<IProvider>value).identify !== 'undefined'
            && typeof (<IProvider>value).get !== 'undefined';
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

    public applyProxy(ctx: ApplyProxyContext): void {
        const propType = Object.getPrototypeOf(ctx.instance);
        const propNames = Object.getOwnPropertyNames(propType);

        const isIntercetor = Reflect.getOwnMetadata('interceptor:is', propType.constructor);
        if (typeof isIntercetor != 'undefined') {
            return;
        }

        const interceptions = this.interceptions.slice();

        const interceptCustoms = <Object[] | undefined>Reflect.getOwnMetadata('intercept:customs', ctx.cls);
        if (typeof interceptCustoms != 'undefined' && Array.isArray(interceptCustoms) && interceptCustoms.length > 0) {
            for (let icObj of interceptCustoms) {
                const intercept = this.getInterceptInstance(icObj, ctx);
                interceptions.push(intercept);
            }
        }

        for (let prop of propNames) {
            if (prop == 'constructor' || typeof ctx.instance[prop] !== 'function') {
                continue;
            }

            const mehtodInterceptions = interceptions.slice();

            const isIntercept = Reflect.getMetadata('intercept:is', propType, prop);
            if (typeof isIntercept != 'undefined') {
                let customs = <Object[]>Reflect.getMetadata('intercept:customs', propType, prop);
                if (typeof customs != 'undefined' && Array.isArray(customs) && customs.length > 0) {
                    for (let custom of customs) {
                        const intercept = this.getInterceptInstance(custom, ctx);
                        mehtodInterceptions.push(intercept);
                    }
                }
            }

            let hasIntercept = false;
            const interpre = <events.IInterceptEventDelegate[]>[];
            const interpos = <events.IInterceptEventDelegate[]>[];
            const intererror = <events.IInterceptEventDelegate[]>[];
            for (let intercept of mehtodInterceptions) {
                if (this.isPreEvent(intercept) && intercept.isPreEventApply(ctx.instance, prop)) {
                    interpre.push(intercept.preEvent.bind(intercept));
                    hasIntercept = true;
                }
                if (this.isPosEvent(intercept) && intercept.isPosEventApply(ctx.instance, prop)) {
                    interpos.push(intercept.posEvent.bind(intercept));
                    hasIntercept = true;
                }
                if (this.isErrorEvent(intercept) && intercept.isErrorEventApply(ctx.instance, prop)) {
                    intererror.push(intercept.errorEvent.bind(intercept));
                    hasIntercept = true;
                }
            }

            if (hasIntercept) {
                const funcs: events.IInterceptEventDelegate[] = [];
                if (interpre.length > 0) {
                    funcs.push(...interpre);
                }
                funcs.push(this.callOriginMethod.bind(this, ctx.instance[prop].bind(ctx.instance)))
                if (intererror.length > 0) {
                    funcs.push(...intererror
                        .map(ev => this.callHandleError.bind(this, ev)));
                }
                if (interpos.length > 0) {
                    funcs.push(...interpos);
                }

                const proxyContext = <ProxyMethodContext>{
                    methodName: prop,
                    funcs
                };
                ctx.instance[prop] = this.methodProx.bind(this, proxyContext);
            }
        }
    }

    private callOriginMethod(origin: Function, context: events.IInterceptEventContext): void | Promise<void> {
        try {
            const ret = origin(...context.arguments);
            if (ret instanceof Promise) {
                return Promise.resolve(ret)
                    .then(v => {
                        context.result = v;
                    })
                    .catch(e => {
                        context.error = e;
                        context.throwError = true;
                    })
            }
            else {
                context.result = ret;
            }
        }
        catch (error) {
            context.error = error;
            context.throwError = true;
        }
    }

    private callHandleError(handler: events.IInterceptEventDelegate, context: events.IInterceptEventContext): void | Promise<void> {
        if (context.error) {
            return handler(context);
        }
    }
    
    private executeFuncs(context: events.IInterceptEventContext, index: number): void | Promise<void> {
        if (index < context.funcs.length && !context.processed) {
            const thisFunc = context.funcs[index];
            const ret = thisFunc(context);
            if (ret instanceof Promise) {
                return Promise.resolve(ret)
                    .then(this.executeFuncs.bind(this, context, index + 1))
            }
            else {
                return this.executeFuncs(context, index + 1);
            }
        }
        else {
            if (context.throwError) {
                throw context.error;
            }
            return context.result;
        }
    }

    private methodProx(proxyContext: ProxyMethodContext, ...args: any[]): any {
        const context = <events.IInterceptEventContext>{
            arguments: args,
            methodName: proxyContext.methodName,
            funcs: proxyContext.funcs,
            processed: false
        }
        return this.executeFuncs(context, 0);
    }
}