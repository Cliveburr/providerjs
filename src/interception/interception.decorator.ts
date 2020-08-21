import { IInterceptEvent } from './interception.events';

export class InterceptionData {
}

export const Interception = (data?: InterceptionData): ClassDecorator => {
    return (cls: Object) => {
        Reflect.defineMetadata('interceptor:is', true, cls);
        Reflect.defineMetadata('injectable:is', true, cls);
        Reflect.defineMetadata('injectable:data', data, cls);
    }
}

export const Intercept = (...customs: IInterceptEvent[]): MethodDecorator => {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata('intercept:is', true, target, propertyKey);
        Reflect.defineMetadata('intercept:customs', customs, target, propertyKey);
    }
}

export const InterceptClass = (...customs: IInterceptEvent[]): ClassDecorator => {
    return (cls: Object) => {
        Reflect.defineMetadata('intercept:is', true, cls);
        Reflect.defineMetadata('intercept:customs', customs, cls);
    }
}