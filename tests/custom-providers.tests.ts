import { Injectable, Identify } from '../src/provider/injectable.decorator';
import { AsRequestProvider, DefinedProvider, IProvider } from '../src/provider/providers';
import { Application } from '../src/module/application.decorator';
import { Injector } from '../src/provider/injector';

@Injectable({
    provider: AsRequestProvider
})
export class OneService {
    private static indice: number = 0;

    public get value(): string {
        return 'OneService value: ' + OneService.indice++;
    }
}

const SOME_IDENTITY = 'SOME_IDENTITY';
const SOME_VALUE = 'This is static value!';
const CustomDiagnosticProvider = new DefinedProvider(SOME_IDENTITY, SOME_VALUE);

const DIRECT_IDENTITY = 'DIRECT_IDENTITY';
const DIRECT_VALUE = 'This is direct identity';
const CustomDirectProvider: IProvider = {
    identify: (identifier) => identifier === DIRECT_IDENTITY,
    get: (ctx) => DIRECT_VALUE
};

@Application({
    imports: [],
    providers: [OneService, CustomDiagnosticProvider, CustomDirectProvider],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService,
        injector: Injector,
        @Identify(SOME_IDENTITY) value: string,
        @Identify(DIRECT_IDENTITY) direct_value: string
    ) {
        const valueFromOne = oneService.value;
        const anotherOneService = injector.get(OneService);
        const valueFromAnother = anotherOneService.value;

        if (valueFromOne == valueFromAnother) {
            console.error('AsRequestProvider fail!');
        }
        else {
            console.log('AsRequestProvider pass!');
        }

        if (value != SOME_VALUE) {
            console.error('Error: ProviderIdentify - ' + value);
        }

        if (direct_value != DIRECT_VALUE) {
            console.error('Error: DirectIdentify - ' + direct_value);
        }
    }
}