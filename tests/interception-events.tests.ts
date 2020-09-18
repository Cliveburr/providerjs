import { Injectable } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { IInterceptPreEvent, IInterceptEventContext } from '../src/interception/interception.events';
import { Interception, Intercept } from '../src/interception/interception.decorator';

console.log('interception-events.tests Begin');

@Interception()
export class FirstInterception implements IInterceptPreEvent {
    
    public isPreEventApply(cls: any, methodName: string): boolean {
        return true;
    }
    
    public preEvent(context: IInterceptEventContext): void {
        if (context.arguments[0] == 1) {
            context.result = 'return from first!';
            context.processed = true;
        }
    }
}

@Interception()
export class SecondInterception implements IInterceptPreEvent {
    
    public isPreEventApply(cls: any, methodName: string): boolean {
        return true;
    }
    
    public async preEvent(context: IInterceptEventContext): Promise<void> {
        return new Promise(r => {
            if (context.arguments[0] == 2) {
                setTimeout(() => {
                    context.result = 'return from second!';
                    context.processed = true;
                    r();
                }, 3000);
            }
            else {
                r();
            }
        });
    }
}


@Injectable()
export class OneService {

    @Intercept(FirstInterception, SecondInterception)
    public methodTest(code: number): void {
        throw new Error('cant reach here!');
    }
}

@Application({
    imports: [],
    providers: [OneService],
    exports: []
})
export class OneModule {

    public constructor(
        private oneService: OneService,
    ) {
        this.callDirect();

        Promise.resolve(this.callAsync());
    }

    public callDirect(): void {
        const ret = <any>this.oneService.methodTest(1);
        if (ret != 'return from first!') {
            throw 'preevent sync error!';
        }
    }

    public async callAsync(): Promise<void> {
        const ret = await <any>this.oneService.methodTest(2);
        if (ret != 'return from second!') {
            throw 'preevent async error!';
        }
    }
}

console.log('interception-events.tests Pass');

// export interface ExecuteFuncsContext {
//     funcs: ((context: ExecuteFuncsContext) => void | Promise<void>)[];
//     processed: boolean;
//     result?: any;
//     error?: any;
//     throwError?: boolean;
// }

// function executeFuncs(context: ExecuteFuncsContext, index: number): void | Promise<void> {
//     if (index < context.funcs.length && !context.processed) {
//         const thisFunc = context.funcs[index];
//         const ret = thisFunc(context);
//         if (ret instanceof Promise) {
//             return Promise.resolve(ret)
//                 .then(executeFuncs.bind(executeFuncs, context, index + 1))
//         }
//         else {
//             return executeFuncs(context, index + 1);
//         }
//     }
//     else {
//         if (context.throwError) {
//             throw context.error;
//         }
//         return context.result;
//     }
// }

// function fun01(context: ExecuteFuncsContext): void {
//     console.log('hit01');
//     //throw 'error 01';
// }

// function fun02(context: ExecuteFuncsContext): void {
//     console.log('hit02');
// }

// async function fun03(context: ExecuteFuncsContext): Promise<void> {
//     console.log('hit03');
//     //throw 'error 03';
// }

// async function fun04(context: ExecuteFuncsContext): Promise<void> {
//     return new Promise(e => {
//         setTimeout(() => {
//             console.log('hit04');
//             e();
//         }, 1000);
//     })
// }

// function fun05(context: ExecuteFuncsContext): void {
//     console.log('hit05');
//     context.result = 'resultado certo!';
//     //context.processed = true;
// }


// async function fun06(context: ExecuteFuncsContext): Promise<void> {
//     return new Promise(e => {
//         setTimeout(() => {
//             console.log('hit06');
//             context.error = 'error na função principal';
//             context.throwError = true;
//             context.processed = true;
//             e();
//         }, 1000);
//     })
// }

// function fun07(context: ExecuteFuncsContext): void {
//     console.log('hit07');
// }


// const result = executeFuncs({
//     //funcs: [ fun01, fun02, fun03, fun05, fun07 ],
//     funcs: [ fun01, fun02, fun03, fun04, fun05, fun06, fun07 ],
//     processed: false
// }, 0);
// if (result instanceof Promise) {
//     Promise.resolve(result)
//         .then(value => console.log(value));
// }
// else {
//     console.log(result);
// }
