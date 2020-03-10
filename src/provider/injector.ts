import { IProviderContainer } from './provider.container';
import { IProvider } from './providers';
import { Interceptor } from '../interception/interceptor';
import { IInterceptEvent } from '../interception/interception.events';

export interface InjectorContext {
    identifier: any;
    create(target: Object): any;
}

interface IResolveResult {
    provider: IProvider;
    container: IProviderContainer;
}

export class Injector {
    
    private interceptor: Interceptor;

    public constructor(
        private container: IProviderContainer
    ) {
        this.interceptor = new Interceptor(this);
    }

    public get interceptions(): IInterceptEvent[] {
        return this.interceptor.interceptions;
    }

    public get rootContainer() : IProviderContainer {
        return this.container;
    }

    public get(identifier: any, ...customs: Array<IProviderContainer | IProvider>): any {
        return this.getIntern(identifier, true, [], ...customs);
    }

    public getNotNeed(identifier: any, ...customs: Array<IProviderContainer | IProvider>): any {
        return this.getIntern(identifier, false, [], ...customs);
    }

    private getIntern(identifier: any, isNeed: boolean, resolving: Object[], ...customs: Array<IProviderContainer | IProvider>): any {
        let result: IResolveResult | undefined = undefined;
        if (customs && customs.length > 0) {
            result = this.resolveIntern(identifier, customs);
        }
        if (!result) {
            result = this.resolveIntern(identifier, [this.container]);
        }
        if (!result) {
            if (isNeed) {
                throw 'Can\'t find provider for identifier: ' + identifier.toString();
            }
            else {
                return undefined;
            }
        }

        const isResolving = resolving.indexOf(result.provider);
        if (isResolving != -1) {
            throw 'Circular dependencie detected on provider: ' + result.provider.toString();
        }
        resolving.push(result.provider);

        const allCustom = new Array<IProviderContainer | IProvider>(result.container, ...customs);
        const obj = result.provider.get({
            identifier,
            create: (target: Object) => this.create(target, resolving, allCustom)
        });

        const index = resolving.indexOf(result.provider);
        resolving.splice(index, 1);

        return obj;
    }

    private create(target: Object, resolving: Object[], customs: Array<IProviderContainer | IProvider>): any {
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

            const obj = this.getIntern(identify, false, resolving, ...customs);
            if (obj) {
                objs.push(obj);
            }
            else {
                const isRequiredKey = `required:is:undefined:${i.toString()}`;
                const isRequired = Reflect.getOwnMetadata(isRequiredKey, target);
                if (typeof isRequired != 'undefined' && isRequired) {
                    throw 'Can\'t find provider for required argument: ' + identify;
                }
                else {
                    objs.push(undefined);
                }
            }
        }

        const result = new (<ObjectConstructor>target)(...objs);
        this.interceptor.applyProxy(target, result)
        return result;
    }

    public resolve(identifier: any, ...providers: Array<IProviderContainer | IProvider>): IProvider | undefined {
        return this.resolveIntern(identifier, providers)?.provider;
    }

    private resolveIntern(identifier: any, providers: Array<IProviderContainer | IProvider>): IResolveResult | undefined {
        if (providers.length > 0) {
            for (let provider of providers) {
                if (this.isProvider(provider)) {
                    if (provider.identify(identifier)) {
                        return {
                            container: {
                              providers: [provider]
                            },
                            provider
                        };
                    }
                }
                else {
                    const containerResolved = this.resolveContainer(identifier, provider);
                    if (containerResolved) {
                        return containerResolved;
                    }
                }
            }
        }
        return undefined;
    }

    private resolveContainer(identifier: any, container: IProviderContainer): IResolveResult | undefined {
        if (container.providers && container.providers.length > 0) {
            for (let provider of container.providers) {
                if (provider.identify(identifier)) {
                    return {
                        container,
                        provider
                    };
                }
            }
        }
        if (container.imports && container.imports.length > 0) {
            for (let containerImpoted of container.imports) {
                const provider = this.resolveImpoted(identifier, containerImpoted);
                if (provider) {
                    return provider;
                }
            }
        }
        return undefined;
    }

    private resolveImpoted(identifier: any, container: IProviderContainer): IResolveResult | undefined {
        if (container.exports) {
            for (let exported of container.exports) {
                if (this.isProvider(exported)) {
                    if (exported.identify(identifier)) {
                        return {
                            provider: exported,
                            container
                        };
                    }
                }
                else {
                    const providerInContainer = this.resolveContainer(identifier, exported);
                    if (providerInContainer) {
                        return providerInContainer;
                    }
                }
            }
        }
        return undefined;
    }

    public isProvider(value: IProviderContainer | IProvider): value is IProvider {
        let test = <IProvider>value;
        return typeof test.identify !== 'undefined' && typeof test.get !== 'undefined';
    }
}