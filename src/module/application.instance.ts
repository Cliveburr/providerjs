import { ModuleInstance } from './module.instance';
import { Injector } from '../provider/injector';
import { DefinedProvider } from '../provider/providers';
import { IProviderContainer } from '../provider/provider.container';

export class ApplicationInstance {

    public constructor(
        cls: Object
    ) {
        (<any>cls).__application__ = this;
        
        let isApplication = Reflect.getOwnMetadata('application:is', cls);
        if (!isApplication) {
            throw 'Invalid application! ' + cls.toString();
        }

        let rootContainer = <IProviderContainer>{};
        let injector = new Injector(rootContainer);
        this.defineCustomData(rootContainer, injector);

        new ModuleInstance(rootContainer, injector, cls);
    }

    protected defineCustomData(container: IProviderContainer, injector: Injector): void {
        if (!container.providers) {
            container.providers = [];
        }
        
        container.providers.push(new DefinedProvider(Injector, injector));
    }
}