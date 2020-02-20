import { Module } from '../src/module/module.decorator';
import { Injectable } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';


@Injectable()
export class ThreeService {
    public value = 'ThreeService';
}

@Module({
    imports: [],
    providers: [ThreeService],
    exports: [ThreeService]
})
export class ThreeModule {

    constructor() {
        console.log('ThreeModule constructor.');
    }
}




@Injectable()
export class TwoService {
    public value = 'TwoService';
}

@Module({
    imports: [ThreeModule],
    providers: [TwoService],
    exports: [ThreeModule, TwoService]
})
export class TwoModule {

    public constructor(
    ) {
        console.log('TwoModule constructor.');
    }
}





@Injectable()
export class OneService {
    public value = 'OneService';
}

@Application({
    imports: [TwoModule],
    providers: [OneService],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService,
        twoService: TwoService,
        threService: ThreeService,
    ) {
        console.log('OneModule constructor: OneService: ' + oneService.value);
        console.log('OneModule constructor: TwoService: ' + twoService.value);
        console.log('ThreeService constructor: ThreeService: ' + threService.value);
    }
}