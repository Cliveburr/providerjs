import { IProviderContainer } from './provider.container';
import { IProvider } from './providers';
import { Interceptor } from '../interception/interceptor';
import { IInterceptEvent } from '../interception/interception.events';

export interface InjectorContext {
    identifier: any;
    create(target: Object): any;
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
        let provider: IProvider | undefined = undefined;
        if (customs && customs.length > 0) {
            provider = this.resolveIntern(identifier, customs);
        }
        if (!provider) {
            provider = this.resolveIntern(identifier, [this.container]);
        }
        if (!provider) {
            if (isNeed) {
                throw 'Can\'t find provider for identifier: ' + identifier.toString();
            }
            else {
                return undefined;
            }
        }

        let isResolving = resolving.indexOf(provider);
        if (isResolving != -1) {
            throw 'Circular dependencie detected on provider: ' + provider.toString();
        }
        resolving.push(provider);

        let obj = provider.get({
            identifier,
            create: (target: Object) => this.create(target, resolving, ...customs)
        });

        let index = resolving.indexOf(provider);
        resolving.splice(index, 1);

        return obj;
    }

    private create(target: Object, resolving: Object[], ...customs: Array<IProviderContainer | IProvider>): any {

        let isInjectable = Reflect.getOwnMetadata('injectable:is', target);
        if (!isInjectable) {
            throw 'Injectable class need to be defined with Injectable decorator!';
        }

        let args = (Reflect.getOwnMetadata('design:paramtypes', target) || []) as any[];

        let objs = [];
        for (let i = 0; i < args.length; i++)
        {
            let identify = <any>args[i];

            let providerIdentifyKey = `provider:identify:undefined:${i.toString()}`;
            let providerIdentify = Reflect.getOwnMetadata(providerIdentifyKey, target);
            if (typeof providerIdentify != 'undefined') {
                identify = providerIdentify;
            }

            let obj = this.getIntern(identify, false, resolving, ...customs);
            if (obj) {
                objs.push(obj);
            }
            else {
                // let isRequired = Reflect.getOwnMetadata('required:is', target, arg);
                // if (isRequired) {
                //     throw 'Can\'t find provider for required argument: ' + arg;
                // }
                // else {
                //     objs.push(undefined);
                // }
            }
        }

        let result = new (<ObjectConstructor>target)(...objs);
        this.interceptor.applyProxy(target, result)
        return result;
    }

    public resolve(identifier: any, ...providers: Array<IProviderContainer | IProvider>): IProvider | undefined {
        return this.resolveIntern(identifier, providers);
    }

    public resolveIntern(identifier: any, providers: Array<IProviderContainer | IProvider>): IProvider | undefined {

        if (providers.length > 0) {
            for (let provider of providers) {
                if (this.isProvider(provider)) {
                    if (provider.identify(identifier)) {
                        return provider;
                    }
                }
                else {
                    if (provider.providers && provider.providers.length > 0) {
                        let resolved = this.resolveIntern(identifier, provider.providers);
                        if (resolved) {
                            return resolved;
                        }
                    }
                    if (provider.imports && provider.imports.length > 0) {
                        for (let containerImpoted of provider.imports) {
                            let provider = this.resolveImpoted(containerImpoted, identifier);
                            if (provider) {
                                return provider;
                            }
                        }
                    }
                }
            }
        }

        return undefined;
    }

    private resolveImpoted(container: IProviderContainer, identifier: any): IProvider | undefined {

        if (container.exports) {
            for (let exported of container.exports) {
                if (this.isProvider(exported)) {
                    if (exported.identify(identifier)) {
                        return exported;
                    }
                }
                else {
                    let provider = this.resolveIntern(identifier, [exported]);
                    if (provider) {
                        return provider;
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