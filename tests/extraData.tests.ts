import { Injectable, Identify } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { Injector } from '../src/provider/injector';
import { IProvider, InjectorContext } from '../src';

console.log('extraData Begin');

export const UNIQUE_IDENTIFIER = 'UNIQUE_IDENTIFIER';

export class UsingExtraDataProvider implements IProvider {

    public identify(identifier: any): boolean {
        return identifier === UNIQUE_IDENTIFIER;
    }

    public get(context: InjectorContext): any {
        if (context.extraData && context.extraData.length > 0 && context.extraData[0] == 1) {
            return 'Custom data form extraData!';
        }
        else {
            return 'Invalid extraData';
        }
    }
}

@Application({
    imports: [],
    providers: [new UsingExtraDataProvider()],
    exports: []
})
export class OneModule {


    public constructor(
        injector: Injector
    ) {
        const customData = injector.get(UNIQUE_IDENTIFIER, true, undefined, [1]);
        if (customData != 'Custom data form extraData!') {
            throw 'extraData - customData 1 error!';
        }

        const invalidData = injector.get(UNIQUE_IDENTIFIER, true, undefined, [2]);
        if (invalidData != 'Invalid extraData') {
            throw 'Invalid extraData error!';
        }
    }
}

console.log('extraData Pass');