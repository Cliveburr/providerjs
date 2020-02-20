import { Injectable } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { IInterceptPreEvent, IInterceptPosEvent, IInterceptPreEventContext, IInterceptPosEventContext, IInterceptErrorEvent,
    IInterceptErrorEventContext } from '../src/interception/interception.events';
import { Interception, Intercept } from '../src/interception/interception.decorator';

@Interception()
export class FirstInterception implements IInterceptPreEvent, IInterceptPosEvent {
    
    public isPreEventApply(cls: Object, methodName: string): boolean {
        return true;
    }
    
    public preEvent(context: IInterceptPreEventContext): void {
        console.log(context.methodName + ' pre event');
    }

    public isPosEventApply(cls: Object, methodName: string): boolean {
        return true;
    }
    
    public posEvent(context: IInterceptPosEventContext): void {
        console.log(context.methodName + ' pos event');
    }
}

@Interception()
export class CatchCustomError implements IInterceptErrorEvent {
    
    public isErrorEventApply(cls: Object, methodName: string): boolean {
        return true;
    }
    
    public errorEvent(context: IInterceptErrorEventContext): void {
        console.log(context.methodName + ' CatchCustomError: ' + context.error);
        context.raiseError = false;
    }
}


@Injectable()
export class OneService {
    public methodOne(a0: string, a1: string): string {
        console.log(`methodOne inside - a0: ${a0}, a1: ${a1}`);
        return 'true';
    }

    @Intercept(CatchCustomError)
    public methodTwo(): void {
        throw 'methodTwo inside error!';
    }
}

@Application({
    imports: [],
    providers: [OneService, FirstInterception],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService
    ) {
        let ret = oneService.methodOne('arg0', 'arg1');
        console.log('OneModule calls oneService.methodOne return: ' + ret);

        oneService.methodTwo();
    }
}