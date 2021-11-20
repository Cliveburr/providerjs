

import { Identify, Injectable } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { Injector } from '../src/provider/injector';
import { IProvider, InjectorContext, StaticProvider } from '../src/provider/providers';

console.log('getOnResolve Begin');


@Injectable()
export class OneService {
    public value = false;
}

export class OneProvider implements IProvider {

    public identify(identifier: any): boolean {
        return OneService === identifier;
    }

    public get(context: InjectorContext): any {
        const getOnProvider = context.get(GetOnService);
        return getOnProvider;
    }
}

@Injectable()
export class GetOnService {
    public value = true;
}

const oneProvider = new OneProvider();

@Application({
    imports: [],
    providers: [GetOnService, oneProvider],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService
    ) {
        if (oneService.value) {
            throw 'getOnResolve fail!';
        }
        console.log('OneModule constructor: OneService: ' + oneService.value);
    }
}

console.log('getOnResolve Pass');