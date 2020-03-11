import { IProvider, StaticProvider, DefinedProvider } from '../provider/providers';
import { ProviderContainer } from '../provider/provider.container';
import { Injector } from '../provider/injector';
import { ModuleData, ImportType, ExportType, ProviderType } from './module.decorator';
import { InjectableData } from '../provider/injectable.decorator';
import { ModuleStore } from './module.store';

export class ModuleInstance extends ProviderContainer {

    public instance: any;
    private toMakeInterceptors?: Object[];

    public constructor(
        cls: Object,
        private store: ModuleStore
    ) {
        super([], [], []);

        this.interceptor = store.interceptor;

        const isModule = Reflect.getOwnMetadata('module:is', cls);
        if (!isModule) {
            throw 'Invalid module! ' + cls.toString();
        }

        const data = <ModuleData>Reflect.getOwnMetadata('module:data', cls);

        this.generateImports(data.imports);
        this.generateProviders(data.providers);
        this.generateExports(data.exports);
        this.generateInterceptors();

        this.imports.push(this.store);
        this.instance = this.injector.get(cls, new StaticProvider(cls));
        const myProvider = new DefinedProvider(cls, this.instance);
        this.store.providers.push(myProvider);
        this.store.exports.push(myProvider);
    }

    private generateImports(imports: Array<ImportType> | undefined): void {
        if (imports) {
            this.generateImportsRecur(imports);
        }
    }

    private generateImportsRecur(imports: Array<ImportType>): void {
        for (const impt of imports) {
            if (Array.isArray(impt)) {
                this.generateImportsRecur(impt);
            }
            else {
                this.imports.push(this.store.getInstance(impt));
            }
        }
    }

    private generateExports(expts: Array<ExportType> | undefined): void {
        if (expts) {
            this.generateExportsRecur(expts);
        }
    }

    private generateExportsRecur(expots: Array<ExportType>): void {
        for (let expt of expots) {
            if (Array.isArray(expt)) {
                this.generateExportsRecur(expt);
            }
            else {
                if (this.isProvider(expt)) {
                    this.exports.push(expt);
                }
                else {
                    const isModule = Reflect.getOwnMetadata('module:is', expt);
                    if (typeof isModule != 'undefined' && isModule) {
                        const inst = this.store.getInstance(expt);
                        const inImport = this.imports?.find(i => i === inst);
                        if (!inImport) {
                            throw 'Need to import a module to export it! ' + expt;
                        }
                        this.exports.push(inst);
                        continue;
                    }
            
                    const isInjectable = Reflect.getOwnMetadata('injectable:is', expt);
                    if (typeof isInjectable != 'undefined' && isInjectable && this.providers) {
                        const resolved = super.resolveDirect(expt, this.providers);
                        if (resolved) {
                            this.exports.push(resolved.provider);
                        }
                        else {
                            throw 'Exported class not found in providers! ' + expt;
                        }
                        continue;
                    }

                    throw 'Only Module and Injectable class can be expoted! ' + expt;
                }
            }
        }
    }

    private generateProviders(providers: Array<ProviderType> | undefined): void {
        if (providers) {
            this.toMakeInterceptors = [];
            this.generateProvidersRecur(providers);
        }
    }

    private generateProvidersRecur(providers: Array<ProviderType>): void {
        for (const provider of providers) {
            if (Array.isArray(provider)) {
                this.generateProvidersRecur(provider);
            }
            else {
                if (this.isProvider(provider)) {
                    this.providers.push(provider);
                }
                else {
                    const isInjectable = Reflect.getOwnMetadata('injectable:is', provider);
                    if (typeof isInjectable == 'undefined') {
                        throw 'Injectable class need to be defined with Injectable decorator!';
                    }

                    const providerInstance = this.createProviderFromObject(provider);
                    this.providers.push(providerInstance);

                    const isIntercetor = Reflect.getOwnMetadata('interceptor:is', provider);
                    if (typeof isIntercetor != 'undefined') {
                        this.toMakeInterceptors?.push(provider);
                    }
                }
            }
        }
    }

    private createProviderFromObject(cls: Object): IProvider {
        const data = <InjectableData>Reflect.getOwnMetadata('injectable:data', cls);
        if (data) {
            if (data.provider) {
                if (this.isProvider(data.provider)) {
                    return data.provider;
                }
                else {
                    return new (<any>data.provider)(cls);
                }
            }
            if (data.identity) {
                return new StaticProvider(data.identity, cls);
            }
        }
        return new StaticProvider(cls);
    }

    private generateInterceptors(): void {
        if (this.toMakeInterceptors && this.toMakeInterceptors.length > 0) {
            for (let make of this.toMakeInterceptors) {
                let inter = this.injector.get(make);
                this.interceptor?.interceptions.push(inter);
            }
        }
    }
}