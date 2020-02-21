
export interface InjectableData {
    provider?: Object 
}

export const Injectable = (data?: InjectableData): ClassDecorator => {
    return (target: Function) => {
        Reflect.defineMetadata('injectable:is', true, target);

        if (data) {
            Reflect.defineMetadata('injectable:data', data, target);
        }
    }
}

export const Required = (): ParameterDecorator => {
    return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
        Reflect.defineMetadata('required:is', true, target, propertyKey);
    }
}

export const ProviderIdentify = (identify: any): ParameterDecorator => {
    return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
        let key = `provider:identify:${propertyKey?.toString()}:${parameterIndex.toString()}`;
        Reflect.defineMetadata(key, identify, target);
    }
}