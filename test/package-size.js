'use strict';

const fs = require('fs');

const test = require('ava');
const sinon = require('sinon');

const Plugin = require('../');

test.beforeEach(() => {
    sinon.restore();
});

test('has hooks', t => {
    const plugin = new Plugin();
    t.is(typeof plugin.hooks, 'object');
    t.is(typeof plugin.hooks['after:package:createDeploymentArtifacts'], 'function');
});

test('does nothing when no limit set', t => {
    const custom = {};
    const servicePath = __dirname;
    const service = { custom };
    const config = { servicePath };
    const serverless = { service, config };

    const plugin = new Plugin(serverless);

    return plugin.checkSize()
        .then(() => {
            t.pass();
        });
});

test.serial('pass when size is ok', t => {
    const getAllFunctions = sinon.stub().returns(['test']);
    const getFunction = sinon.stub().returns({});

    const custom = { packageLimit: '1mb' };
    const servicePath = __dirname;
    const service = { custom, getAllFunctions, getFunction, service: 'foo' };
    const config = { servicePath };
    const cli = { log: sinon.stub() };
    const serverless = { service, config, cli };
    const options = {};

    const plugin = new Plugin(serverless, options);

    const stat = sinon.stub(fs, 'stat').yields(null, { size: 42 });

    return plugin.checkSize()
        .then(() => {
            t.is(stat.calledOnce, true);
            t.is(cli.log.calledOnce, true);
        });
});

test.serial('rejects when size is bad', t => {
    const getAllFunctions = sinon.stub().returns(['test']);
    const getFunction = sinon.stub().returns({});

    const custom = { packageLimit: '1kb' };
    const servicePath = __dirname;
    const service = { custom, getAllFunctions, getFunction, service: 'foo' };
    const config = { servicePath };
    const serverless = { service, config };
    const options = {};

    const plugin = new Plugin(serverless, options);

    const stat = sinon.stub(fs, 'stat').yields(null, { size: 100000 });

    return plugin.checkSize()
        .then(() => {
            t.fail('should reject');
        })
        .catch(e => {
            t.is(stat.calledOnce, true);
            t.is(e.message, 'Package size for test (100kB) is over 1kb');
        });
});

test.serial('skips checking with --noLimit', t => {
    const getAllFunctions = sinon.stub().returns(['test']);
    const getFunction = sinon.stub().returns({});

    const custom = { packageLimit: '1kb' };
    const servicePath = __dirname;
    const service = { custom, getAllFunctions, getFunction, service: 'foo' };
    const config = { servicePath };
    const serverless = { service, config };
    const options = { noLimit: true };

    const plugin = new Plugin(serverless, options);

    const stat = sinon.stub(fs, 'stat').yields(null, { size: 100000 });

    return plugin.checkSize()
        .then(() => {
            t.is(stat.called, false);
        });
});