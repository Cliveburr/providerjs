import 'reflect-metadata'
import { ApplicationInstance } from "./application.instance";
import { ModuleData } from './module.decorator';

export interface ApplicationData extends ModuleData {
}

export const Application = (data: ApplicationData): ClassDecorator => {
    return (cls: Object) => {
        Reflect.defineMetadata('injectable:is', true, cls);
        Reflect.defineMetadata('application:is', true, cls);
        Reflect.defineMetadata('module:is', true, cls);
        Reflect.defineMetadata('module:data', data, cls);

        new ApplicationInstance(cls);
    }
};