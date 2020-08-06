import { Injectable, Identify } from '../src/provider/injectable.decorator';
import { Application } from '../src/module/application.decorator';
import { Injector } from '../src/provider/injector';
import { Module } from '../src/module/module.decorator';
import { ModuleHotImport } from '../src/module/module.hotimport';

console.log('hot-import-module.tests Begin');

@Injectable()
export class HotService {
    public value = 'HotService';
}

@Module({
    imports: [],
    providers: [HotService],
    exports: [HotService]
})
export class HotModule {
}


@Application({
    imports: [],
    providers: [],
    exports: []
})
export class OneModule {

    public constructor(
        failService: HotService,
        hotImport: ModuleHotImport,
        injector: Injector
    ) {
        try {
            const testValue = failService.value;
        } catch {
            console.log('FailService ok!');
        }

        hotImport.import(HotModule);

        const importedService = injector.get(HotService) as HotService;
        const value = importedService.value;

        console.log('ModuleHotImport works! ' + value);
    }
}


@Injectable()
export class ToBeUsedService {
    public value = 'ToBeUsedService';
}

@Module({
    imports: [],
    providers: [ToBeUsedService],
    exports: [ToBeUsedService]
})
export class ToBeUsedModule {
}

const TO_LOAD_PROVIDER = 'TO_LOAD_PROVIDER';

@Injectable({
    identity: TO_LOAD_PROVIDER
})
export class ToLoadService {
    public constructor(
        private hotImport: ModuleHotImport
    ) {
    }

    public load(): void {
        this.hotImport.import(ToBeUsedModule);
    }
}

@Module({
    imports: [],
    providers: [],
    exports: []
})
export class ToUseModule {
    public constructor(
        @Identify(TO_LOAD_PROVIDER) toLoadService: ToLoadService,
        injector: Injector
    ) {
        toLoadService.load();

        const importedService = injector.get(ToBeUsedService, false) as ToBeUsedService;
        if (!(importedService && importedService.value == 'ToBeUsedService')) {
            throw 'ModuleHotImport deep error!';
        }

        console.log('ModuleHotImport deep works! ' + importedService.value);
    }
}


@Application({
    imports: [HotModule, ToUseModule],
    providers: [ToLoadService],
    exports: [ToLoadService]
})
export class TwoModule {

    public constructor(
    ) {
    }
}

console.log('hot-import-module.tests Pass');
