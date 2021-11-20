import { IProvider, DefinedProvider } from './providers';
import { Injector } from './injector';
import { Interceptor } from '../interception/interceptor';
import { InjectableData } from './injectable.decorator';

export interface IGetContext {
    identifier: any;
    need: boolean;
    resolving: Object[];
    customs?: IProvider[];
    extraData?: any[];
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

    public get(identifier: any, need?: boolean, customs?: IProvider[], extraData?: any[]): any {
        return this.getIntern({
            identifier,
            need: typeof need === 'undefined' ? true: need,
            resolving: [],
            customs,
            extraData
        });
    }

    private getIntern(ctx: IGetContext): any {
        if (typeof ctx.identifier == 'function') {
            const data = <InjectableData>Reflect.getOwnMetadata('injectable:data', ctx.identifier);
            if (data && data.identity) {
                ctx.identifier = data.identity;
            }
        }

        const resolved = this.resolveIntern(ctx);
        if (!resolved) {
            if (ctx.need) {
                throw `Can\'t find provider for identifier:\n ${ctx.identifier.toString()}`;
            }
            else {
                return undefined;
            }
        }

        const isResolving = ctx.resolving.indexOf(ctx.identifier);
        if (isResolving != -1) {
            throw 'Circular dependencie detected on provider: ' + ctx.identifier.toString();
        }
        ctx.resolving.push(ctx.identifier);

        const obj = resolved.provider.get({
            identifier: ctx.identifier,
            create: this.create.bind(resolved.container, ctx),
            extraData: ctx.extraData,
            get: this.getOnResolve.bind(resolved.container, ctx)
        });

        const index = ctx.resolving.indexOf(ctx.identifier);
        ctx.resolving.splice(index, 1);
        return obj;
    }

    private getOnResolve(ctx: IGetContext, identifier: any, need?: boolean, customs?: IProvider[], extraData?: any[]): any {
        const newCtx = {
            identifier,
            need: typeof need === 'undefined' ? true: need,
            resolving: ctx.resolving,
            customs,
            extraData
        }
        if (ctx.customs) {
            if (newCtx.customs) {
                newCtx.customs = newCtx.customs.concat(ctx.customs);
            }
            else {
                newCtx.customs = new Array<IProvider>().concat(ctx.customs);
            }
        }
        if (ctx.extraData) {
            if (newCtx.extraData) {
                newCtx.extraData = newCtx.extraData.concat(ctx.extraData);
            }
            else {
                newCtx.extraData = new Array<IProvider>().concat(ctx.extraData);
            }
        }
        return this.getIntern(newCtx);
    }

    private create(ctx: IGetContext, target: Object, providers?: IProvider[], extraData?: any[]): any {
        const isInjectable = Reflect.getOwnMetadata('injectable:is', target);
        if (!isInjectable) {
            throw 'Injectable class need to be defined with Injectable decorator!\n' + target.toString();
        }

        let deepCustomsProviders: IProvider[] | undefined;
        if (providers && providers.length > 0) {
            deepCustomsProviders = new Array<IProvider>().concat(providers);
        }
        if (ctx.customs && ctx.customs.length > 0) {
            if (deepCustomsProviders) {
                deepCustomsProviders = deepCustomsProviders.concat(ctx.customs);
            }
            else {
                deepCustomsProviders = new Array<IProvider>().concat(ctx.customs);
            }
        }

        let deepExtraData: any[] | undefined;
        if (extraData && extraData.length > 0) {
            deepExtraData = new Array<any>().concat(extraData);
        }
        if (ctx.extraData && ctx.extraData.length > 0) {
            if (deepExtraData) {
                deepExtraData = deepExtraData.concat(ctx.extraData);
            }
            else {
                deepExtraData = new Array<any>().concat(ctx.extraData);
            }
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

            objs.push(this.getIntern({
                identifier: identify,
                need: isNeed,
                resolving: ctx.resolving,
                customs: deepCustomsProviders,
                extraData: deepExtraData
            }));
        }

        const result = new (<ObjectConstructor>target)(...objs);
        if (this.interceptor) {
            this.interceptor.applyProxy({
                cls: target,
                instance: result,
                getIntern: this.getIntern.bind(this),
                resolving: ctx.resolving,
                customs: deepCustomsProviders,
                extraData: deepExtraData
            });
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
