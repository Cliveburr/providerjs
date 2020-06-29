import { IProvider, StaticProvider, DefinedProvider } from './providers';
import { Injector } from './injector';
import { Interceptor } from '../interception/interceptor';

interface IGetContext {
    identifier: any;
    need: boolean;
    resolving: Object[];
    customs?: IProvider[];
}

interface IResolverResult {
    provider: IProvider;
    container: ProviderContainer;
}

export class ProviderContainer {

    public providers: Array<IProvider>;
    public imports: Array<ProviderContainer>;
    public exports: Array<ProviderContainer | IProvider>;
    public injector: Injector;
    public interceptor?: Interceptor;

    public constructor(
        providers?: Array<IProvider>,
        imports?: Array<ProviderContainer>,
        exports?: Array<ProviderContainer | IProvider>
    ) {
        this.providers = providers || [];
        this.imports = imports || [];
        this.exports = exports || [];
        this.injector = this.makeInjector();
    }

    private makeInjector(): Injector {
        const injector = new Injector(this);
        this.providers.push(new DefinedProvider(Injector, injector));
        return injector;
    }

    public get(identifier: any, ...customs: IProvider[]): any;
    public get(identifier: any, need: boolean, ...customs: IProvider[]): any;
    public get(identifier: any, ...rest: any[]): any {
        if (rest && rest.length > 0) {
            if (typeof rest[0] === 'boolean') {
                return this.getIntern({
                    identifier,
                    need: rest[0],
                    resolving: [],
                    customs: rest.slice(1)
                });
            }
            else {
                return this.getIntern({
                    identifier,
                    need: true,
                    resolving: [],
                    customs: rest
                });
            }
        }
        else {
            return this.getIntern({
                identifier,
                need: true,
                resolving: [],
                customs: undefined
            });
        }
    }

    private getIntern(ctx: IGetContext): any {
        const resolved = this.resolveIntern(ctx);
        if (!resolved) {
            if (ctx.need) {
                throw `Can\'t find provider for identifier:\n ${ctx.identifier.toString()}`;
            }
            else {
                return undefined;
            }
        }

        const isResolving = ctx.resolving.indexOf(resolved.provider);
        if (isResolving != -1) {
            throw 'Circular dependencie detected on provider: ' + resolved.provider.toString();
        }
        ctx.resolving.push(resolved.provider);

        const obj = resolved.provider.get({
            identifier: ctx.identifier,
            create: this.create.bind(resolved.container, ctx)  //(target: Object) => this.create(target, resolving, customs)
        });

        const index = ctx.resolving.indexOf(resolved.provider);
        ctx.resolving.splice(index, 1);
        return obj;
    }

    private create(ctx: IGetContext, target: Object): any {
        const isInjectable = Reflect.getOwnMetadata('injectable:is', target);
        if (!isInjectable) {
            throw 'Injectable class need to be defined with Injectable decorator!';
        }

        const args = (Reflect.getOwnMetadata('design:paramtypes', target) || []) as any[];
        const objs = [];
        for (let i = 0; i < args.length; i++)
        {
            let identify = <any>args[i];

            const providerIdentifyKey = `provider:identify:undefined:${i.toString()}`;
            const providerIdentify = Reflect.getOwnMetadata(providerIdentifyKey, target);
            if (typeof providerIdentify != 'undefined') {
                identify = providerIdentify;
            }

            let isNeed = false;
            const isRequiredKey = `required:is:undefined:${i.toString()}`;
            const isRequired = Reflect.getOwnMetadata(isRequiredKey, target);
            if (typeof isRequired != 'undefined' && isRequired) {
                isNeed = true;
            }

            const obj = this.getIntern({
                identifier: identify,
                need: isNeed,
                resolving: ctx.resolving,
                customs: ctx.customs
            });
            if (obj) {
                objs.push(obj);
            }
            else {
                objs.push(undefined);
            }
        }

        const result = new (<ObjectConstructor>target)(...objs);
        if (this.interceptor) {
            this.interceptor.applyProxy(target, result, this.injector)
        }
        return result;
    }

    private resolveIntern(ctx: IGetContext): IResolverResult | undefined {
        if (ctx.customs && ctx.customs.length > 0) {
            const result = this.resolveDirect(ctx.identifier, ctx.customs);
            if (result) {
                return result;
            }
        }
        if (this.providers.length > 0) {
            const result = this.resolveDirect(ctx.identifier, this.providers);
            if (result) {
                return result;
            }
        }
        if (this.imports.length > 0) {
            const result = this.resolveImport(ctx, this.imports);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

    protected resolveDirect(identifier: any, providers: IProvider[]): IResolverResult | undefined {
        for (const provider of providers) {
            if (provider.identify(identifier)) {
                return {
                    provider,
                    container: this
                };
            }
        }
        return undefined;
    }

    private resolveImport(ctx: IGetContext, imports: ProviderContainer[]): IResolverResult | undefined {
        for (const imp of imports) {
            const result = imp.resolveExport(ctx);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

    private resolveExport(ctx: IGetContext): IResolverResult | undefined {
        if (this.exports.length > 0) {
            for (const exported of this.exports) {
                if (this.isProvider(exported)) {
                    if (exported.identify(ctx.identifier)) {
                        return {
                            provider: exported,
                            container: this
                        };
                    }
                }
                else {
                    const result = exported.resolveExport(ctx);
                    if (result) {
                        return result;
                    }
                }
            }
        }
        return undefined;
    }

    public isProvider(value: any): value is IProvider {
        return typeof (<IProvider>value).identify !== 'undefined'
            && typeof (<IProvider>value).get !== 'undefined';
    }
}
