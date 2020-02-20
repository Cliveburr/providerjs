import 'reflect-metadata'
import { Injector } from "../src/provider/injector";
import { Injectable, Required } from '../src/provider/injectable.decorator';
import { StaticProvider } from '../src/provider/providers';
import { IProviderContainer } from '../src/provider/provider.container';

let container = <IProviderContainer>{
    imports: [],
    providers: [],
    exports: []
};
let injector = new Injector(container);

@Injectable()
class TestOne {
    public value1 = 'test one';
}
container.providers?.push(new StaticProvider(TestOne));

var testOne = <TestOne>injector.get(TestOne);
if (testOne.value1 != 'test one') {
    throw 'bug 0';
}

@Injectable()
class TestTwo {
    public value2 = 'test two';

    constructor(
        public testOne: TestOne
    ) {
    }
}
container.providers?.push(new StaticProvider(TestTwo));

var testTwo = <TestTwo>injector.get(TestTwo);
if (testTwo.value2 != 'test two' || testTwo.testOne.value1 != 'test one') {
    throw 'bug 3';
}

@Injectable()
class TestTreeOnSeconedContainer {
    public value3 = 'test tree';

    constructor(
        @Required() public testOne: TestOne
    ) {
    }
}
let testTreeProvider = new StaticProvider(TestTreeOnSeconedContainer);
var containerTwo: IProviderContainer = {
    providers: [ testTreeProvider],
    exports: [ testTreeProvider ]
};
container.imports?.push(containerTwo);

var testTree = <TestTreeOnSeconedContainer>injector.get(TestTreeOnSeconedContainer);
if (testTree.value3 != 'test tree' || testTwo.testOne.value1 != 'test one') {
    throw 'bug 4';
}

// @Injectable()
// class TestFour {
//     constructor(
//         @Required() public testRequire: string
//     ) {
//     }
// }
// injector.providers.push(new StaticProvider(TestFour));
// let mustBeError = false;
// try
// {
//     var testFour = <TestFour>injector.get(TestFour);
// }
// catch (err)
// {
//     if (!err.toString().startsWith('Can\'t find provider for required argument')) {
//         throw 'bug 5';
//     }
//     else {
//         mustBeError = true;
//     }
// }
// if (!mustBeError) {
//     throw 'bug 6';
// }


console.log('provider tests end');