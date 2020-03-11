import { IProvider } from './providers';
import { Injectable } from './injectable.decorator';

@Injectable()
export class Injector {

    public constructor(
        private containerGet: (identifier: any, ...rest: any[]) => any
    ) {
    }

    public get(identifier: any, ...customs: IProvider[]): any;
    public get(identifier: any, need: boolean, ...customs: IProvider[]): any;
    public get(identifier: any, ...rest: any[]): any {
        return this.containerGet(identifier, ...rest);
    }
}
