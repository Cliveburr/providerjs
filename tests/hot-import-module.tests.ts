import { Injectable } from '../src/provider/injectable.decorator';
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

console.log('hot-import-module.tests Pass');
