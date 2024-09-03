# ApiToaster

This project is simple api tester, allowing developers to "redo" requests from the past. Either in testing, or in development stage.

TLDR;
1. [Use this package](#1-use-package)
2. [Work on this project](#1-work-on-this-project)

## 1. Use this package

## 2. Work on this project

### 2.1 How to start

#### Install dependencies

```shell
npm install / yarn
```

#### Prepare environment

### 2.2. How to build

```shell
npm run build / yarn build
```

If you even encounter strange build behavior, tsconfig is set to create build with cache. Set option `incremental` in tsConfig to false. In addition to that, remove `tsconfig.tsbuildinfo`, which contains cached information about build

### 2.3. Useful information

#### 2.3.1 Logs folder, where every log from this application is stored. You can change it in `src/tools/logger/logger.ts`

##### Linux

```text
~/.cache/"package.json -> productName"/logs
```

##### Windows

```text
~/AppData/Roaming/"package.json -> productName"/logs
```

#### 2.3.2 Testing

##### All test currently are written using jest. You can run all tests or just type specific tests

##### Available targets

```text
make tests = run all tests
npm run tests:e2e = run 'end to end' tests
npm run tests:unit = run 'unit' tests
```

##### Alongside tests, this app have 'test mode' which will help you run e2e tests. It runs in memory instance of mongoDB and fill it with "fakeData.json" data

