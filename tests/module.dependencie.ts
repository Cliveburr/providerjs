import { Module } from '../src/module/module.decorator';
import { Injectable } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';


@Injectable()
export class ThreeService {
    public value3 = 'ThreeService';
}

@Module({
    imports: [],
    providers: [ThreeService],
    exports: [ThreeService]
})
export class ThreeModule {
}


@Injectable()
export class FourService {
    public value4 = 'FourService';
}

@Injectable()
export class TwoService {
    public value2 = 'TwoService';

    public constructor(
        public fourService: FourService
    ) {
    }
}


@Module({
    imports: [ThreeModule],
    providers: [TwoService, FourService],
    exports: [ThreeModule, TwoService]
})
export class TwoModule {
}





@Injectable()
export class OneService {
    public value1 = 'OneService';
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
        console.log('OneModule constructor: OneService: ' + oneService.value1);
        console.log('TwoModule constructor: TwoService: ' + twoService.value2);
        console.log('TwoModule constructor: TwoService.FourService: ' + twoService.fourService.value4);
        console.log('ThreeService constructor: ThreeService: ' + threService.value3);
    }
}