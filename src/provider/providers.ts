
export interface InjectorContext {
    identifier: any;
    create(target: Object): any;
}

export interface IProvider {
    identify: (identifier: any) => boolean;
    get: (context: InjectorContext) => any;
}

export class StaticProvider implements IProvider {
    
    public instance: any;

    public constructor(
        public identifier: any,
        public cls?: any
    ) {
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

export class DefinedProvider implements IProvider {

    public constructor(
        public identifier: any,
        public instance: any
    ) {
    }

    public identify(identifier: any): boolean {
        return this.identifier === identifier;
    }

    public get(): any {
        return this.instance;
    }
}

export class AsRequestProvider implements IProvider {

    public constructor(
        private identifier: any,
        private cls?: Object
    ) {
    }

    public identify(identifier: any): boolean {
        return this.identifier === identifier;
    }

    public get(context: InjectorContext): any {
        return context.create(this.cls || this.identifier);
    }
}
