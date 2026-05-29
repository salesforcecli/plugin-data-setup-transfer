# plugin-data-setup-transfer

[NPM](https://www.npmjs.com/package/plugin-data-setup-transfer) [Downloads/week](https://npmjs.org/package/plugin-data-setup-transfer) [License](https://raw.githubusercontent.com/salesforcecli/plugin-data-setup-transfer/main/LICENSE.txt)

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

    Path to a JSON file containing a fully custom dataset definition.

  -i, --definition-identifier=<value>  The definition identifier for the standard dataset.

    The unique identifier of the standard setup dataset definition (e.g., 'dipcmlargedefinition'). Required when not using --extended-definition-file.

  -o, --target-org=<value>  The target org alias or username to deploy data to.

    The Salesforce org where the setup data will be deployed. Can be an org alias or username.

  -s, --source-org=<value>  The source org alias or username to retrieve data from.

    The Salesforce org from which to retrieve the setup data. Can be an org alias or username.

  -v, --version=<value>  The version of the standard dataset.

    The version string for the standard dataset definition (e.g., '1.0.0'). Required when not using --extended-definition-file.

  -x, --filter-value=<value>  Comma-separated list of filter values for the export.

    Optional comma-separated list of filter values to include in the export (e.g., 'autoSilver, autoRoot').

  --api-version=<value>  API version to use for the connection.

    The Salesforce API version to use when connecting to the orgs. If not specified, uses the org's default API version.
```

