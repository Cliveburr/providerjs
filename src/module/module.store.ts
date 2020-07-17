import { ModuleInstance } from './module.instance';
import { Interceptor } from '../interception/interceptor';
import { ProviderContainer } from '../provider/provider.container';
import { setTimeout } from 'timers';

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
        cls: Object,
        appOnInit: () => void
    ) {
        this.modules = [];
        this.interceptor = new Interceptor();
        this.hasHotImport = false;
        this.context = new ProviderContainer();
        this.generateAppModule(cls, appOnInit);
    }

    private generateAppModule(cls: Object, appOnInit: () => void): void {
        const delayInstance: Array<() => void> = [];

        const appModule = new ModuleInstance(cls, this, delayInstance);
        this.modules.push({
            cls,
            instance: appModule
        });

        this.context.imports.push(appModule);
        this.context.exports.push(appModule);

        setTimeout(() => {
            for (let i = 0; i < delayInstance.length; i++) {
                delayInstance[i]();
            }
            appOnInit();
        }, 1);
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
