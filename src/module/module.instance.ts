import { IProvider, StaticProvider } from '../provider/providers';
import { IProviderContainer } from '../provider/provider.container';
import { Injector } from '../provider/injector';
import { ModuleData, ImportType, ExportType, ProviderType } from './module.decorator';
import { InjectableData } from '../provider/injectable.decorator';

export class ModuleInstance {

    public instance: any;

    private toMakeInterceptors?: Object[];

    public constructor(
        public container: IProviderContainer,
        public injector: Injector,
        cls: Object
    ) {
        (<any>cls).__module__ = this;

        let isModule = Reflect.getOwnMetadata('module:is', cls);
        if (!isModule) {
            throw 'Invalid module! ' + cls.toString();
        }

        let data = <ModuleData>Reflect.getOwnMetadata('module:data', cls);

        this.generateImports(data.imports);
        this.generateProviders(data.providers);
        this.generateExports(data.exports);
        this.generateInterceptors();

        this.instance = injector.get(cls, new StaticProvider(cls, cls), this.container);
    }

    private generateImports(imports: Array<ImportType> | undefined): void {
        if (imports) {
            if (!this.container.imports) {
                this.container.imports = [];
            }
            this.generateImportsRecur(this.container.imports, imports);
        }
    }

    private generateImportsRecur(array: IProviderContainer[], imports: Array<ImportType>): void {
        for (let impt of imports) {
            if (Array.isArray(impt)) {
                this.generateImportsRecur(array, impt);
            }
            else {
                array.push(this.getInstance(impt).container);
            }
        }
    }

    public getInstance(cls: Object): ModuleInstance {
        let instance = (<any>cls).__module__;
        if (!instance) {
            instance = new ModuleInstance({}, this.injector, cls);
        }
        return instance;
    }

    private generateExports(expts: Array<ExportType> | undefined): void {
        if (expts) {
            if (!this.container.exports) {
                this.container.exports = [];
            }
            this.generateExportsRecur(this.container.exports, expts);
        }
    }

    private generateExportsRecur(array: Array<IProviderContainer | IProvider>, expots: Array<ExportType>): void {
        for (let expt of expots) {
            if (Array.isArray(expt)) {
                this.generateExportsRecur(array, expt);
            }
            else {
                if (this.injector.isProvider(expt)) {
                    array.push(expt);
                }
                else {
                    let provider = this.injector.resolve(expt, this.container);
                    if (provider) {
                        array.push(provider);
                    }
                    else {
                        array.push(this.getInstance(expt).container);
                    }
                }
            }
        }
    }

    private generateProviders(providers: Array<ProviderType> | undefined): void {
        if (providers) {
            this.toMakeInterceptors = [];
            if (!this.container.providers) {
                this.container.providers = [];
            }
            this.generateProvidersRecur(this.container.providers, providers);
        }
    }

    private generateProvidersRecur(array: IProvider[], providers: Array<ProviderType>): void {
        for (let provider of providers) {
            if (Array.isArray(provider)) {
                this.generateProvidersRecur(array, provider);
            }
            else {
                if (this.injector.isProvider(provider)) {
                    array.push(provider);
                }
                else {
                    let isInjectable = Reflect.getOwnMetadata('injectable:is', provider);
                    if (typeof isInjectable == 'undefined') {
                        throw 'Injectable class need to be defined with Injectable decorator!';
                    }

                    let providerInstance = this.createProviderFromObject(provider);
                    if (array.indexOf(providerInstance) == -1) {
                        array.push(providerInstance);
                    }

                    let isIntercetor = Reflect.getOwnMetadata('interceptor:is', provider);
                    if (typeof isIntercetor != 'undefined') {
                        this.toMakeInterceptors?.push(provider);
                    }
                }
            }
        }
    }

    private createProviderFromObject(cls: Object): IProvider {
        let data = <InjectableData>Reflect.getOwnMetadata('injectable:data', cls);
        if (data) {
            if (data.provider) {
                return new (<any>data.provider)(cls);
            }
        }
        return new StaticProvider(cls);
    }

    private generateInterceptors(): void {
        if (this.toMakeInterceptors && this.toMakeInterceptors.length > 0) {
            for (let make of this.toMakeInterceptors) {
                let inter = this.injector.get(make);
                this.injector.interceptions.push(inter);
            }
        }
    }
}