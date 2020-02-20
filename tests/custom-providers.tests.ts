import { Injectable } from '../src/provider/injectable.decorator';
import { AsRequestProvider } from '../src/provider/providers';
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

@Application({
    imports: [],
    providers: [OneService],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService,
        injector: Injector
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
    }
}