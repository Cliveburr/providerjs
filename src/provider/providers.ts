import { InjectableData } from './injectable.decorator';

export interface InjectorContext {
    identifier: any;
    create(target: Object, providers?: IProvider[], extraData?: any[]): any;
    extraData?: any[];
    get(identifier: any, need?: boolean, customs?: IProvider[], extraData?: any[]): any;
}

export interface IProvider {
    identify: (identifier: any) => boolean;
    get: (context: InjectorContext) => any;
}

export abstract class BasicProvider {

    protected getCustomIdentity(cls: any): any | undefined {
        const data = <InjectableData>Reflect.getOwnMetadata('injectable:data', cls);
        return data?.identity;
    }
}

export class StaticProvider extends BasicProvider implements IProvider {
    
    private instance: any;
    private identifier: any;
    private cls: any;

    public constructor(
        identifier: any,
        cls?: any
    ) {
        super();
        this.cls = cls || identifier;
        const dataIdentity = super.getCustomIdentity(this.cls);
        this.identifier = identifier || dataIdentity;
    }

    public identify(identifier: any): boolean {
        return this.identifier === identifier;
    }

    public get(context: InjectorContext): any {
        if (!this.instance) {
            this.instance = context.create(this.cls || this.identifier);
        }
        return this.instance;
    }
}

export class DefinedProvider extends BasicProvider implements IProvider {

    private identifier: any;

    public constructor(
        identifier: any,
        public instance: any
    ) {
        super();
        const dataIdentity = super.getCustomIdentity(instance.constructor);
        this.identifier = identifier || dataIdentity;
    }

    public identify(identifier: any): boolean {
        return this.identifier === identifier;
    }

    public get(): any {
        return this.instance;
    }
}

export class AsRequestProvider extends BasicProvider implements IProvider {

    private identifier: any;
    private cls: any;

    public constructor(
        identifier: any,
        cls?: Object
    ) {
        super();
        this.cls = cls || identifier;
        const dataIdentity = super.getCustomIdentity(this.cls);
        this.identifier = dataIdentity || identifier;
    }

    public identify(identifier: any): boolean {
        return this.identifier === identifier;
    }

    public get(context: InjectorContext): any {
        return context.create(this.cls);
    }
}
