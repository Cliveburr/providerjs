import { ModuleStore } from './module.store';
import { ModuleInstance } from './module.instance';

export class ApplicationInstance {

    protected module: ModuleInstance

    public constructor(
        cls: Object
    ) {
        const isApplication = Reflect.getOwnMetadata('application:is', cls);
        if (!isApplication) {
            throw 'Invalid application! ' + cls.toString();
        }

        const store = new ModuleStore(cls, this.appOnInit.bind(this));
        this.module = store.context.imports[0] as ModuleInstance;
    }

    protected appOnInit(): void {
    }
}
