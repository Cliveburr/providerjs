
# ProviderJS
A [NodeJS](http://nodejs.org) framework for create general purpose.

Write using [TypeScript](http://www.typescriptlang.org) with [Visual Studio Code](https://code.visualstudio.com).

```ts
import { Injectable, Application } from 'providerjs';

@Injectable()
export class OneService {
    public value = 'OneService';
}

@Application({
    imports: [],
    providers: [OneService],
    exports: []
})
export class OneModule {

    public constructor(
        oneService: OneService
    ) {
        console.log('OneModule constructor: OneService: ' + oneService.value);
    }
}
```

## Installation

```bash
$ npm install providerjs
```

## Features

  * Lightweight
  * Dependencie Inject system
  * Intercept abstract implementation

## Docs

  * [Github](https://github.com/Cliveburr/providerjs) for Official Code

## Quick Start

  Create a empty NPM package:

```bash
npm init -y
```

  Install ProviderJS:

```bash
npm install providerjs --save
```

  Work with code:

```bash
code .
```

## Example

```bash
https://github.com/Cliveburr/providerjs/tree/master/tests
```