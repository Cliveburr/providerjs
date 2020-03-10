import { Injectable, Identify } from '../src/provider/injectable.decorator';
import { AsRequestProvider, DefinedProvider } from '../src/provider/providers';
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
const CustomDiagnosticProvider = new DefinedProvider(SOME_IDENTITY, 'This is static value!');

@Application({
    imports: [],
    providers: [OneService, CustomDiagnosticProvider],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService,
        injector: Injector,
        @Identify(SOME_IDENTITY) value: string
    ) {
        let valueFromOne = oneService.value;
        
        let anotherOneService = injector.get(OneService);

        let valueFromAnother = anotherOneService.value;

        if (valueFromOne == valueFromAnother) {
            console.error('AsRequestProvider fail!');
        }
        else {
            console.log('AsRequestProvider pass!');
        }

        console.log('ProviderIdentify - ' + value);
    }
}