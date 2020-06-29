import { IProvider, StaticProvider, DefinedProvider } from '../provider/providers';
import { ProviderContainer } from '../provider/provider.container';
import { ModuleData, ImportType, ExportType, ProviderType } from './module.decorator';
import { InjectableData } from '../provider/injectable.decorator';
import { ModuleStore } from './module.store';
import { ModuleHotImport } from './module.hotimport';

export class ModuleInstance extends ProviderContainer {

    public instance: any;
    private toMakeInterceptors?: Object[];

    public constructor(
        private cls: Object,
        private store: ModuleStore,
        delayInstance: Array<() => void>
    ) {
        super([], [], []);

        this.interceptor = store.interceptor;

        const isModule = Reflect.getOwnMetadata('module:is', cls);
        if (!isModule) {
            throw 'Invalid module! ' + cls.toString();
        }

        const data = <ModuleData>Reflect.getOwnMetadata('module:data', cls);

        this.imports.push(this.store.context);
        this.generateImports(data.imports, delayInstance);
        this.generateProviders(data.providers);
        this.generateExports(data.exports, delayInstance);
        this.generateInterceptors();
        this.generateHotImport();
        delayInstance.push(this.generateInstance.bind(this));
    }

    private generateInstance(): void {
        this.instance = this.injector.get(this.cls, new StaticProvider(this.cls));
        this.generateMyProvider();
    }

    private generateHotImport(): void {
        if (!this.store.hasHotImport) {
            const hotImport = new ModuleHotImport();
            hotImport.import = this.hotImport.bind(this);
            const hotImportProvider = new DefinedProvider(ModuleHotImport, hotImport);
            this.store.context.providers.push(hotImportProvider);
            this.store.context.exports.push(hotImportProvider);
            this.store.hasHotImport = true;
        }
    }

    public hotImport(imports: ImportType): void {
        this.generateImportsRecur([imports], undefined);
    }

    private generateMyProvider(): void {
        const myProvider = new DefinedProvider(this.cls, this.instance);
        this.store.context.providers.push(myProvider);
        this.store.context.exports.push(myProvider);
    }

    private generateImports(imports: Array<ImportType> | undefined, delayInstance: Array<() => void>): void {
        if (imports) {
            this.generateImportsRecur(imports, delayInstance);
        }
    }

    private generateImportsRecur(imports: Array<ImportType>, delayInstance: Array<() => void> | undefined): void {
        for (const impt of imports) {
            if (Array.isArray(impt)) {
                this.generateImportsRecur(impt, delayInstance);
            }
            else {
                this.imports.push(this.store.getInstance(impt, delayInstance));
            }
        }
    }

    private generateExports(expts: Array<ExportType> | undefined, delayInstance: Array<() => void>): void {
        if (expts) {
            this.generateExportsRecur(expts, delayInstance);
        }
    }

    private generateExportsRecur(expots: Array<ExportType>, delayInstance: Array<() => void>): void {
        for (let expt of expots) {
            if (Array.isArray(expt)) {
                this.generateExportsRecur(expt, delayInstance);
            }
            else {
                if (this.isProvider(expt)) {
                    this.exports.push(expt);
                }
                else {
                    const isModule = Reflect.getOwnMetadata('module:is', expt);
                    if (typeof isModule != 'undefined' && isModule) {
                        const inst = this.store.getInstance(expt, delayInstance);
                        const inImport = this.imports?.find(i => i === inst);
                        if (!inImport) {
                            throw 'Need to import a module to export it! ' + expt;
                        }
                        this.exports.push(inst);
                        continue;
                    }
            
                    const isInjectable = Reflect.getOwnMetadata('injectable:is', expt);
                    if (typeof isInjectable != 'undefined' && isInjectable && this.providers) {
                        let identity: any = expt;
                        const data = <InjectableData>Reflect.getOwnMetadata('injectable:data', expt);
                        if (data && data.identity) {
                            identity = data.identity;
                        }

                        const resolved = super.resolveDirect(identity, this.providers);
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