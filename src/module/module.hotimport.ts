import { ImportType } from './module.decorator';
import { Injectable } from '../provider/injectable.decorator';

@Injectable()
export class ModuleHotImport {
    
    public import(imports: ImportType): void {
    }
}
