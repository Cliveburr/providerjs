import { Injectable, Required } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { Module } from '../src/module/module.decorator';

console.log('inside-modules.tests Begin');

@Injectable()
export class InsideOneService {
    public value = 'InsideOneService';
}

@Injectable()
export class InsideTwoService {
    public constructor(
        @Required() private insideOneSerivce: InsideOneService
    ) {
    }

    public get value(): string {
        return 'InsideTwoService with ' + this.insideOneSerivce.value;
    }
}

@Module({
    imports: [],
    providers: [InsideOneService, InsideTwoService],
    exports: [InsideTwoService]
})
export class OneModule {
}

@Injectable()
export class OneService {
    public value = 'OneService';

    constructor(
        public insideTwoService: InsideTwoService
    ) {
    }
}

@Application({
    imports: [OneModule],
    providers: [OneService],
    exports: []
})
export class OneApplication {

    public constructor(
        oneService: OneService
    ) {
        console.log('OneModule constructor: OneService: ' + oneService.value);
        console.log('OneModule constructor: InsideTwoService: ' + oneService.insideTwoService.value);
    }
}

console.log('inside-modules.tests Pass');
