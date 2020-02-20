import { IProvider } from './providers';

export interface IProviderContainer {
    imports?: Array<IProviderContainer>;
    providers?: Array<IProvider>;
    exports?: Array<IProviderContainer | IProvider>;
}