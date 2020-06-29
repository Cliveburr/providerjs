import { ModuleInstance } from './module.instance';
import { Interceptor } from '../interception/interceptor';
import { ProviderContainer } from '../provider/provider.container';

export interface IDelayInstance {
    toMake: Array<() => void>;
}

interface IStore {
    cls: Object;
    instance: ModuleInstance;
}

export class ModuleStore {

    private modules: IStore[];
    public interceptor: Interceptor;
    public context: ProviderContainer;
    public hasHotImport: boolean;

    public constructor(
        cls: Object
    ) {
        this.modules = [];
        this.interceptor = new Interceptor();
        this.hasHotImport = false;
        this.context = new ProviderContainer();
        this.generateAppModule(cls);
    }

    private generateAppModule(cls: Object): void {
        const delayInstance: Array<() => void> = [];

        const appModule = new ModuleInstance(cls, this, delayInstance);
        this.modules.push({
            cls,
            instance: appModule
        });

        this.context.imports.push(appModule);
        this.context.exports.push(appModule);

        for (let i = 0; i < delayInstance.length; i++) {
            delayInstance[i]();
        }
    }

    public getInstance(cls: Object, delayInstance: Array<() => void> | undefined): ModuleInstance {
        const has = this.modules
            .find(m => m.cls === cls);
        if (has) {
            return has.instance;
        }
        else {
            let isDelayinstance = false;
            if (!delayInstance) {
                delayInstance = [];
                isDelayinstance = true;
            }

            const instance = new ModuleInstance(cls, this, delayInstance);
            this.modules.push({
                cls,
                instance
            });

            if (isDelayinstance) {
                for (let i = 0; i < delayInstance.length; i++) {
                    delayInstance[i]();
                }
            }

            return instance;
        }
    }
}
