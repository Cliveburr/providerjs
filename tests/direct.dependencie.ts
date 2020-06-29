import { Injectable } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { Injector } from '../src/provider/injector';

console.log('direct.dependencie Begin');

@Injectable()
export class OneService {
    public value = 'OneService';
}

@Injectable()
export class TwoService {
    constructor(
        private oneService: OneService
    ) {
    }

    public get value(): string {
        return 'TwoService with ' + this.oneService.value;
    }
}

@Application({
    imports: [],
    providers: [OneService, TwoService],
    exports: []
})
export class OneModule {


    public constructor(
        oneService: OneService,
        twoService: TwoService,
        injector: Injector
    ) {
        console.log('OneModule constructor: OneService: ' + oneService.value);
        console.log('OneModule constructor: TwoService: ' + twoService.value);

        if (!injector) {
            console.error('Injector not found!');
        }
    }
}

console.log('direct.dependencie Pass');