import { afterEach, beforeAll, beforeEach, describe, it, expect, jest } from '@jest/globals';
import * as errors from '../../../src/errors/index.js';
import express from 'express';
import fs from 'fs';
import defaultConfig from '../../../src/tools/config.js';
import Cli from '../../../src/cli/index.js';
import State from '../../../src/tools/state.js';
import Log from '../../../src/tools/logger.js';
import { IFullError } from '../../../types/error.js';
import FileWriter from '../../../src/module/files/writer.js';
import FileDecoder from '../../../src/module/decode/index.js';
import Unification from '../../../src/module/unification/index.js';
import { INotFormattedLogEntry } from '../../../types/logs.js';
import { IUnificationParams } from '../../../types/unification.js';

describe('Unification', () => {
    const clear = async (target?: string): Promise<void> => {
        return new Promise<void>((resolve) => {
            fs.rmdir(target ?? 'Toaster', { recursive: true }, (_err) => {
                resolve(undefined);
            });
        });
    };
    const fileWriter = new FileWriter();
    const fileDecoder = new FileDecoder();
    const unification = new Unification();
    const cli = new Cli();
    const params: IUnificationParams = {
        files: [],
        values: [],
        remove:false
    };
    const defaultReq: Partial<express.Request> = {
        headers: {
            header: 'val',
        },
        query: {
            key: 'value',
        },
        ip: '127.0.0.2',
        body: {},
    };
    beforeAll(() => {
        State.config = { ...defaultConfig(), ip: true };
    });

    beforeEach(async () => {
        jest.spyOn(Log, 'error').mockImplementation(() => { });
        await clear();
        State.config = { ...defaultConfig(), ip: true };
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        await clear();
    });

    describe('Should throw', () => {
        it('unification - wrong key parametr', async () => {
            let error: IFullError | undefined = undefined;
            State.config = { ...defaultConfig(), ip: false, headers: false, body: false, method: false, queryParams: false };

            jest.spyOn(cli, 'readConfig').mockReturnValue({
                path: '/valid/path',
                port: 0,
            });
            try {
                process.argv = ['npx', 'api-toaster', 'uni', '-p', 'logs_0.json', '-v', 'ksdjfsdkfj'];
                await cli.handleInit();
            } catch (err) {
                error = err as IFullError;
            }
            expect(error).toBeInstanceOf(errors.IncorrectArgTypeError);
            expect(error).toEqual(new errors.IncorrectArgTypeError('Passed value should be a valid IUnificationKey'));
        });
    });

    describe('Should pass', () => {
        it(`unification - add default method value`, async () => {
            let error: IFullError | undefined = undefined;
            let callback: [string, INotFormattedLogEntry][] = [];

            try {
                await fileWriter.init(defaultReq as express.Request);
                await unification.init(params);
                callback = await fileDecoder.init('logs_0.json');
            } catch (err) {
                error = err as IFullError;
            }
            expect(error).toBeUndefined();
            expect(callback[0]![1]).toEqual({
                method: 'GET',
                headers: {
                    header: 'val',
                },
                ip: '127.0.0.2',
                occured: expect.anything(),
                queryParams: {
                    key: 'value',
                },
                body: {},
                statusCode: 200,
            });
        });

        it(`unification - add only specified default value for method`, async () => {
            let error: IFullError | undefined = undefined;
            let callback: [string, INotFormattedLogEntry][] = [];
            State.config = { ...defaultConfig(), ip: false, headers: false, body: false, method: false, queryParams: false };
            try {
                const paramsClone = structuredClone(params);
                paramsClone.values.push('method');
                await fileWriter.init(defaultReq as express.Request);
                await unification.init(paramsClone);
                callback = await fileDecoder.init('logs_0.json');
            } catch (err) {
                error = err as IFullError;
            }
            expect(error).toBeUndefined();
            expect(callback[0]![1]).toEqual({
                method: 'GET',
                occured: expect.anything(),
                body: {},
            });
        });

        it(`unification - add only specified default value for method and ip`, async () => {
            let error: IFullError | undefined = undefined;
            let callback: [string, INotFormattedLogEntry][] = [];
            State.config = { ...defaultConfig(), ip: false, headers: false, body: false, method: false, queryParams: false };
            try {
                const paramsClone = structuredClone(params);
                paramsClone.values.push('ip');
                paramsClone.values.push('method');
                await fileWriter.init(defaultReq as express.Request);
                await unification.init(paramsClone);
                callback = await fileDecoder.init('logs_0.json');
            } catch (err) {
                error = err as IFullError;
            }
            expect(error).toBeUndefined();
            expect(callback[0]![1]).toEqual({
                method: 'GET',
                ip: '::ffff:127.0.0.1',
                occured: expect.anything(),
                body: {},
            });
        });
        it(`unification - add all default values`, async () => {
            let error: IFullError | undefined = undefined;
            let callback: [string, INotFormattedLogEntry][] = [];
            State.config = { ...defaultConfig(), ip: false, headers: false, body: false, method: false, queryParams: false };
            try {
                await fileWriter.init(defaultReq as express.Request);
                await unification.init(params);
                callback = await fileDecoder.init('logs_0.json');
            } catch (err) {
                error = err as IFullError;
            }
            expect(error).toBeUndefined();
            expect(callback[0]![1]).toEqual({
                method: 'GET',
                ip: '::ffff:127.0.0.1',
                occured: expect.anything(),
                body: {},
                statusCode: 200,
            });
        });

        it(`unification - remove ip`, async () => {
            let error: IFullError | undefined = undefined;
            let callback: [string, INotFormattedLogEntry][] = [];
            State.config = { ...defaultConfig(), ip: true ,disableProto:true,headers: false,method: false};
            try {
                await fileWriter.init(defaultReq as express.Request);
                const cloneParams=structuredClone(params)
                cloneParams.remove=true
                cloneParams.values.push('ip')
                await unification.init(cloneParams);
                callback = await fileDecoder.init('logs_0.json');
            } catch (err) {
                error = err as IFullError;
            }
            expect(error).toBeUndefined();
            expect(callback[0]![1]).toEqual({
                occured: expect.anything(),
                body: {},
            });
        });
    });
});
