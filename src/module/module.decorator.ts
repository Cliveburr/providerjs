import { IProvider } from '../provider/providers';

export type ImportType = Object | Array<Object>;
export type ProviderType = Object | IProvider | Array<Object | IProvider>;
export type ExportType = Object | IProvider | Array<Object | IProvider>;

export class ModuleData {
    imports?: Array<ImportType> | undefined;
    providers?: Array<ProviderType> | undefined;
    exports?: Array<ExportType> | undefined;
}

export const Module = (data: ModuleData): ClassDecorator => {
    return (cls: Object) => {
        Reflect.defineMetadata('injectable:is', true, cls);
        Reflect.defineMetadata('module:is', true, cls);
        Reflect.defineMetadata('module:data', data, cls);
    }
}
