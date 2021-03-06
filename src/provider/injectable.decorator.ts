import { genIdentifierHash } from '../helpers/hashgen';

export interface InjectableData {
    provider?: Object;
    identity?: any;
    crossProject?: boolean;
}

export const Injectable = (data?: InjectableData): ClassDecorator => {
    return (target: Function) => {
        Reflect.defineMetadata('injectable:is', true, target);

        if (data) {
            if (data.crossProject) {
                data.identity = genIdentifierHash(target.toString());
            }

            Reflect.defineMetadata('injectable:data', data, target);
        }
    }
}

export const Required = (): ParameterDecorator => {
    return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
        let key = `required:is:${propertyKey?.toString()}:${parameterIndex.toString()}`;
        Reflect.defineMetadata(key, true, target);
    }
}

export const Identify = (identify: any): ParameterDecorator => {
    return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
        let key = `provider:identify:${propertyKey?.toString()}:${parameterIndex.toString()}`;
        Reflect.defineMetadata(key, identify, target);
    }
}