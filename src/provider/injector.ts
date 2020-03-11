import { IProvider } from './providers';
import { Injectable } from './injectable.decorator';
import { ProviderContainer } from './provider.container';

@Injectable()
export class Injector {

    public constructor(
        private container: ProviderContainer
    ) {
    }

    public get(identifier: any, ...customs: IProvider[]): any;
    public get(identifier: any, need: boolean, ...customs: IProvider[]): any;
    public get(identifier: any, ...rest: any[]): any {
        return this.container.get(identifier, ...rest);
    }

    public get imports(): Array<ProviderContainer> {
        return this.container.imports;
    }

    public get providers(): Array<IProvider> {
        return this.container.providers;
    }

    public get exports(): Array<ProviderContainer | IProvider> {
        return this.container.exports;
    }
}
