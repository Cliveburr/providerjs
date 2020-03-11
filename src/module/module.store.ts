import { ModuleInstance } from './module.instance';
import { Interceptor } from '../interception/interceptor';
import { ProviderContainer } from '../provider/provider.container';

interface IStore {
    cls: Object;
    instance: ModuleInstance;
}

export class ModuleStore extends ProviderContainer {

    private modules: IStore[] = [];
    public interceptor: Interceptor;

    public constructor() {
        super();
        this.interceptor = new Interceptor();
    }

    public getInstance(cls: Object): ModuleInstance {
        const has = this.modules
            .find(m => m.cls === cls);
        if (has) {
            return has.instance;
        }
        else {
            const instance = new ModuleInstance(cls, this);
            this.modules.push({
                cls,
                instance
            });
            return instance;
        }
    }
}