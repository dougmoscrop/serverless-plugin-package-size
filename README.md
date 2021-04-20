# serverless-plugin-package-size

Helps avoid accidentally deploying huge artifacts that are either slow to load, can't be debugged, etc.

> cat serverless.yml

```yml
custom:
  packageLimit: '2mb'
```

This will fail if your package artifact exceeds 2mb. Supports whatever `bytes-iec` supports for the limit expression.

If you want to ignore the limit for a specific deployment, you can pass the `--noLimit` option to the `serverless` command:

```sh
serverless deploy --stage staging --noLimit
```
