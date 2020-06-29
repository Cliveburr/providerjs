import { Injectable, Identify, Required } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { Injector } from '../src/provider/injector';
import { Module } from '../src/module/module.decorator';
import { ModuleHotImport } from '../src/module/module.hotimport';

console.log('token-injection.tests Begin');

export var TOKEN_PROVIDER = 'TOKEN_PROVIDER';

interface ITokenProviderTest {
    giveValue(): string;
}

@Module({
    imports: [],
    providers: [],
    exports: []
})
export class UseTokenModule {
    public value: string;

    public constructor(
        @Required() @Identify(TOKEN_PROVIDER) token: ITokenProviderTest,
    ) {
        this.value = 'UseTokenModule';
        console.log('Token retrived: ' + token.giveValue());
    }
}

@Injectable({
    identity: TOKEN_PROVIDER
})
export class TokenService implements ITokenProviderTest {
    public giveValue(): string {
        return 'token data';
    }
}

@Application({
    imports: [UseTokenModule],
    providers: [TokenService],
    exports: [TokenService]
})
export class OneModule {
    public constructor(
        tokenModule: UseTokenModule
    ) {
        console.log('Token test: ' + tokenModule.value);
    }
}

console.log('token-injection.tests Pass');
