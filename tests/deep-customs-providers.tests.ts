import { Injectable } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { Injector } from '../src/provider/injector';
import { IProvider, InjectorContext, StaticProvider } from '../src/provider/providers';

console.log('deep-customs-providers Begin');

@Injectable()
export class OneDeepService {
    public value = 'OneDeepService';
}

@Injectable()
export class OneService {
    public value = 'OneService';

    public constructor(
        public oneDeepService: OneDeepService
    ) {
        console.log('OneService constructor: OneDeepService: ' + oneDeepService.value);
    }
}

export class OneProvider implements IProvider {

    public identify(identifier: any): boolean {
        return OneService === identifier;
    }

    public get(context: InjectorContext): any {
        const deepProvider = new StaticProvider(OneDeepService);
        return context.create(OneService, [deepProvider]);
    }
}

const oneProvider = new OneProvider();

@Application({
    imports: [],
    providers: [oneProvider],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService
    ) {
        console.log('OneModule constructor: OneService: ' + oneService.value);
    }
}

console.log('deep-customs-providers Pass');