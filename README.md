# plugin-data-setup-transfer

[![NPM](https://img.shields.io/npm/v/plugin-data-setup-transfer.svg?label=plugin-data-setup-transfer)](https://www.npmjs.com/package/plugin-data-setup-transfer) [![Downloads/week](https://img.shields.io/npm/dw/plugin-data-setup-transfer.svg)](https://npmjs.org/package/plugin-data-setup-transfer) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/plugin-data-setup-transfer/main/LICENSE.txt)

## Using the template

This repository provides a template for creating a plugin for the Salesforce CLI. To convert this template to a working plugin:

1. Please get in touch with the Platform CLI team. We want to help you develop your plugin.
2. Generate your plugin:

   ```
   sf plugins install dev
   sf dev generate plugin

   git init -b main
   git add . && git commit -m "chore: initial commit"
   ```

3. Create your plugin's repo in the salesforcecli github org
4. When you're ready, replace the contents of this README with the information you want.

## Learn about `sf` plugins

Salesforce CLI plugins are based on the [oclif plugin framework](<(https://oclif.io/docs/introduction.html)>). Read the [plugin developer guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_plugins.meta/sfdx_cli_plugins/cli_plugins_architecture_sf_cli.htm) to learn about Salesforce CLI plugin development.

This repository contains a lot of additional scripts and tools to help with general Salesforce node development and enforce coding standards. You should familiarize yourself with some of the [node developer packages](#tooling) used by Salesforce. 

Additionally, there are some additional tests that the Salesforce CLI will enforce if this plugin is ever bundled with the CLI. These test are included by default under the `posttest` script and it is required to keep these tests active in your plugin if you plan to have it bundled.

### Tooling

- [@salesforce/core](https://github.com/forcedotcom/sfdx-core)
- [@salesforce/kit](https://github.com/forcedotcom/kit)
- [@salesforce/sf-plugins-core](https://github.com/salesforcecli/sf-plugins-core)
- [@salesforce/ts-types](https://github.com/forcedotcom/ts-types)
- [@salesforce/ts-sinon](https://github.com/forcedotcom/ts-sinon)
- [@salesforce/dev-config](https://github.com/forcedotcom/dev-config)
- [@salesforce/dev-scripts](https://github.com/forcedotcom/dev-scripts)

### Hooks

For cross clouds commands, e.g. `sf env list`, we utilize [oclif hooks](https://oclif.io/docs/hooks) to get the relevant information from installed plugins.

This plugin includes sample hooks in the [src/hooks directory](src/hooks). You'll just need to add the appropriate logic. You can also delete any of the hooks if they aren't required for your plugin.

# Everything past here is only a suggestion as to what should be in your specific plugin's description

This plugin is bundled with the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). For more information on the CLI, read the [getting started guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm).

We always recommend using the latest version of these commands bundled with the CLI, however, you can install a specific version or tag if needed.

## Install

```bash
sf plugins install plugin-data-setup-transfer@x.y.z
```

## Issues

Please report any issues at https://github.com/forcedotcom/cli/issues

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Sign CLA (see [CLA](#cla) below).
9. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:salesforcecli/plugin-data-setup-transfer

# Install the dependencies and compile
yarn && yarn build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev data setup transfer
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sf cli
sf plugins link .
# To verify
sf plugins
```

## Commands

<!-- commands -->

- [`sf data setup transfer`](#sf-data-setup-transfer)

## `sf data setup transfer`

Retrieve setup data from one org and deploy it to another in a single step.

```
USAGE
  $ sf data setup transfer -s <value> -o <value> [--json] [--flags-dir <value>] [-i <value>] [-v <value>] [-e
    <value>] [-x <value>] [--api-version <value>]

FLAGS
  -e, --extended-definition-file=<value>  Path to a JSON file containing a complete custom dataset definition.
  -i, --definition-identifier=<value>     The definition identifier for the standard dataset.
  -o, --target-org=<value>                (required) The target org alias or username to deploy data to.
  -s, --source-org=<value>                (required) The source org alias or username to retrieve data
                                          from.
  -v, --version=<value>                   The version of the standard dataset.
  -x, --filter-value=<value>              Comma-separated list of filter values for the export.
      --api-version=<value>               API version to use for the connection.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Retrieve setup data from one org and deploy it to another in a single step.

  Combines retrieve and deploy into one command: exports setup data from a source org using the Connect API, then imports it into a target
  org. Supports two modes: (1) Standard dataset definition — provide a definition identifier and version. (2) Custom dataset definition —
  provide a complete custom definition file via --extended-definition-file.

EXAMPLES
  Retrieve and deploy using a standard dataset definition:
  $ sf data setup transfer --definition-identifier dipcmlargedefinition --version 1.0.0 --source-org sourceOrg --filter-value 'autoSilver' --target-org targetOrg

  Retrieve and deploy using a custom dataset definition file:
  $ sf data setup transfer --extended-definition-file definition/dipcmlargedefinition-extension.json --source-org sourceOrg --filter-value 'autoSilver' --target-org targetOrg

FLAG DESCRIPTIONS
  -e, --extended-definition-file=<value>  Path to a JSON file containing a complete custom dataset definition.

    Path to a JSON file containing a fully custom dataset definition. The file contents are used as the export API payload and the
    definition headers are merged into the retrieved data before deploying to the target org.

  -i, --definition-identifier=<value>  The definition identifier for the standard dataset.

    The unique identifier of the standard setup dataset definition (e.g., 'dipcmlargedefinition'). This value is sent as `dataSetName` in
    the export API payload. Required when not using --extended-definition-file.

  -o, --target-org=<value>  The target org alias or username to deploy data to.

    The Salesforce org where the setup data will be deployed. Can be an org alias or username.

  -s, --source-org=<value>  The source org alias or username to retrieve data from.

    The Salesforce org from which to retrieve the setup data. Can be an org alias or username.

  -v, --version=<value>  The version of the standard dataset.

    The version string for the standard dataset definition (e.g., '1.0.0'). Required when not using --extended-definition-file.

  -x, --filter-value=<value>  Comma-separated list of filter values for the export.

    Optional comma-separated list of filter values to include in the export (e.g., 'autoSilver, autoRoot'). This value is sent as
    `filterValue` in the export API payload.

  --api-version=<value>  API version to use for the connection.

    The Salesforce API version to use when connecting to the orgs. If not specified, uses the org's default API version.
```

<!-- commandsstop -->
