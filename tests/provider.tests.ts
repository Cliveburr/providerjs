import 'reflect-metadata'
import { Injector } from "../src/provider/injector";
import { Injectable, Required } from '../src/provider/injectable.decorator';
import { StaticProvider, AsRequestProvider } from '../src/provider/providers';
import { ProviderContainer } from '../src/provider/provider.container';

// creating containerOne
const containerOne = new ProviderContainer([], [], []);

// resolving provider in containerOne direct
@Injectable()
class TestOne {
    public value1 = 'test one';
}
const providerOne = new StaticProvider(TestOne);
containerOne.providers?.push(providerOne);
const testOne = <TestOne>containerOne.get(TestOne);
if (testOne.value1 != 'test one') {
    throw 'bug 1';
}

// resolving provider in containerOne direct
// with argument also in containerOne
@Injectable()
class TestTwo {
    public value2 = 'test two';

    constructor(
        public testOne: TestOne
    ) {
    }
}
const providerTwo = new AsRequestProvider(TestTwo);
containerOne.providers?.push(providerTwo);
const testTwo = <TestTwo>containerOne.get(TestTwo);
if (testTwo.value2 != 'test two' || testTwo.testOne.value1 != 'test one') {
    throw 'bug 2';
}

// creating containerTwo
const containerTwo = new ProviderContainer([], [], []);

// importing containerOne into containerTwo
containerTwo.imports?.push(containerOne);

// exporting TestTwo on containerOne
containerOne.exports?.push(providerTwo);

// resolving provider in containerTwo direct
// with argument in containerOne
@Injectable()
class TestTree {
    public value3 = 'test tree';

    constructor(
        public testTwo: TestTwo,
        public stringUndefined: string
    ) {
    }
}
const providerTree = new StaticProvider(TestTree);
containerTwo.providers?.push(providerTree);
const testTree = <TestTree>containerTwo.get(TestTree);
if (testTree.value3 != 'test tree' || testTree.testTwo.testOne.value1 != 'test one') {
    throw 'bug 4';
}
if (typeof testTree.stringUndefined !== 'undefined') {
    throw 'bug arg undefined';
}

// testing the Required decorator
@Injectable()
class TestFour {
    constructor(
        @Required() public testRequire: string
    ) {
    }
}
containerOne.providers?.push(new StaticProvider(TestFour));
let mustBeError = false;
try
{
    const testFour = <TestFour>containerOne.get(TestFour);
    if (!testFour) {
        throw 'bug 4 provider';
    }
}
catch (err)
{
    if (!err.toString().startsWith('Can\'t find provider for identifier')) {
        throw 'bug 4 wrong error';
    }
    else {
        mustBeError = true;
    }
}
if (!mustBeError) {
    throw 'bug 4';
}

// creating containerTree
const containerTree = new ProviderContainer([], [], []);

// importing containerOne into containerTree
containerTree.imports?.push(containerOne);

// adding new provider into containerOne
@Injectable()
class TestFive {
    public value5 = 'test five';

    constructor(
    ) {
    }
}
const providerFive = new StaticProvider(TestFive);
containerOne.providers?.push(providerFive);

// adding new provider into containerOne that need provider in containerOne
// exporting this provider
@Injectable()
class TestSix {
    public value6 = 'test six';

    constructor(
        public testFive: TestFive
    ) {
    }
}
const providerSix = new StaticProvider(TestSix);
containerOne.providers?.push(providerSix);
containerOne.exports?.push(providerSix);

// resolving provider in containerTree
// with argument on containerOne exported
@Injectable()
class TestSeven {
    public value7 = 'test seven';

    constructor(
        public testSix: TestSix
    ) {
    }
}
const providerSeven = new StaticProvider(TestSeven);
containerTree.providers?.push(providerSeven);
const testSeven = <TestSeven>containerTree.get(TestSeven);
if (testSeven.value7 != 'test seven' || testSeven.testSix.value6 != 'test six' || testSeven.testSix.testFive.value5 != 'test five') {
    throw 'bug 7';
}

// resolving provider in containerTree
// but chaging his identity
// obs.: this only works automatic on module
@Injectable({
    identity: TestOne
})
class TestEight {
    public value8 = 'test eight';

    constructor(
        public testTwo: TestTwo
    ) {
    }
}
const providerEight = new StaticProvider(TestOne, TestEight);
containerTree.providers?.push(providerEight);
const testEight = <TestEight>containerTree.get(TestOne);
if (testEight.value8 != 'test eight' || testEight.testTwo.value2 != 'test two') {
    throw 'bug 8';
}

console.log('Provider Tests Pass');