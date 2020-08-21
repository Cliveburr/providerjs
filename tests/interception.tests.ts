import { Injectable } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { IInterceptPreEvent, IInterceptPosEvent, IInterceptPreEventContext, IInterceptPosEventContext, IInterceptErrorEvent,
    IInterceptErrorEventContext } from '../src/interception/interception.events';
import { Interception, Intercept, InterceptClass } from '../src/interception/interception.decorator';
import * as fs from 'fs';

console.log('interception.tests Begin');

@Interception()
export class FirstInterception implements IInterceptPreEvent, IInterceptPosEvent {
    
    public isPreEventApply(cls: any, methodName: string): boolean {
        return typeof cls.firstNotIntercept != 'undefined' ? cls.firstNotIntercept : true;
    }
    
    public preEvent(context: IInterceptPreEventContext): void {
        console.log(context.methodName + ' pre event');
    }

    public isPosEventApply(cls: any, methodName: string): boolean {
        return typeof cls.firstNotIntercept != 'undefined' ? cls.firstNotIntercept : true;
    }
    
    public posEvent(context: IInterceptPosEventContext): void {
        console.log(context.methodName + ' pos event');
        context.result = 'Intercepted! ' + context.result;
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
        throw new Error('methodTwo inside error!');
    }
}


@Interception()
export class ClassAsyncInterception implements IInterceptErrorEvent {
    
    public isErrorEventApply(cls: Object, methodName: string): boolean {
        return true;
    }
    
    public errorEvent(context: IInterceptErrorEventContext): void {
        console.log('ClassAsyncInterception: ' + context.methodName + ' CatchCustomError: ' + context.error);
        context.raiseError = false;
    }
}

@Injectable()
@InterceptClass(ClassAsyncInterception)
export class ClassAsyncService {

    public firstNotIntercept = false;

    public methodThrow(): Promise<void> {
        return new Promise((e, r) => {
            fs.readFile(__dirname + '\\error.ts', r);
        })
    }
}

@Interception()
export class ClassAsyncCatchInterception implements IInterceptErrorEvent {
    
    public isErrorEventApply(cls: Object, methodName: string): boolean {
        return true;
    }
    
    public errorEvent(context: IInterceptErrorEventContext): void {
        console.log('ClassAsyncInterception: ' + context.methodName + ' CatchCustomError: ' + context.error);
    }
}

@Injectable()
@InterceptClass(ClassAsyncCatchInterception)
export class ClassAsynCatchcService {

    public firstNotIntercept = false;

    public methodThrow(): Promise<void> {
        return new Promise((e, r) => {
            fs.readFile(__dirname + '\\error.ts', r);
        })
    }

    public async methodoSuccess(): Promise<number> {
        return 1234;
    }
}

@Application({
    imports: [],
    providers: [OneService, FirstInterception, ClassAsyncService, ClassAsynCatchcService],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService,
        private classAsyncService: ClassAsyncService,
        private classAsynCatchcService: ClassAsynCatchcService
    ) {
        const ret = oneService.methodOne('arg0', 'arg1');
        if (!ret.startsWith('Intercepted!')) {
            throw 'Not intercepted!';
        }
        console.log('OneModule calls oneService.methodOne return: ' + ret);

        oneService.methodTwo();

        this.callAsync()
            .then();

        this.callErrorAsync()
            .then();

        this.callSuccessAscyn()
            .then();
    }

    public async callAsync(): Promise<void> {
        await this.classAsyncService.methodThrow();
    }

    public async callErrorAsync(): Promise<void> {
        try {
            await this.classAsynCatchcService.methodThrow();
        }
        catch (error) {
            console.log('Error async captured! ' + error);
        }
    }

    public async callSuccessAscyn(): Promise<void> {
        const number = await this.classAsynCatchcService.methodoSuccess();
        if (number != 1234) {
            throw 'Error receivend return from catch async method!'
        }
    }
}

console.log('interception.tests Pass');
