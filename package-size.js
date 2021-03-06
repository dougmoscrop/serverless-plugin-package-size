'use strict';

const fs = require('fs');
const path = require('path');
const bytes = require('bytes-iec');

module.exports = class PackageLimit {

    constructor(serverless, options) {
        const hooks = {
            'after:package:createDeploymentArtifacts': this.checkSize.bind(this)
        };

        Object.assign(this, { serverless, hooks, options });
    }

    checkSize() {
        const { serverless, options } = this;
        const { service, config, cli } = serverless;
        const { servicePath } = config;
        const { custom = {} } = service;
        const { packageLimit } = custom;

        const serviceName = service.service;
        const servicePackage = service.package || {};

        if (packageLimit === undefined || options.noLimit) {
            return Promise.resolve();
        }

        const byteLimit = bytes(packageLimit);
        const functions = service.getAllFunctions();
        const checked = new Set();

        return Promise.all(functions.map(functionName => {
            const functionObject = service.getFunction(functionName);
            const functionPackage = functionObject.package || {};

            if (functionPackage.disable) {
                return Promise.resolve();
            }
            
            const individually = !!functionPackage.individually || !!servicePackage.individually;
            const { artifact } = individually ? functionPackage : servicePackage;
            
            const fileName = individually ? functionName : serviceName;
            const filePath = artifact ? path.join(servicePath, artifact) : path.join(servicePath, '.serverless', `${fileName}.zip`);

            if (checked.has(filePath)) {
                return Promise.resolve();
            }

            checked.add(filePath);

            return new Promise((resolve, reject) => {
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        reject(err);
                    } else {
                        const { size } = stats;

                        if (size < byteLimit) {
                            cli.log(`[serverless-plugin-package-size] Size of ${fileName} is ${bytes(size)}`);
                            resolve();
                        } else {
                            reject(new Error(`Package size for ${fileName} (${bytes(size)}) is over ${packageLimit}`))
                        }
                    }
                });
            });
        }));
    }

};
