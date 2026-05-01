# summary

Retrieve setup data from one org and deploy it to another in a single step.

# description

Combines retrieve and deploy into one command: exports setup data from a source org using the Connect API, then imports it into a target org. Supports two modes: (1) Standard dataset definition — provide a definition identifier and version. (2) Custom dataset definition — provide a complete custom definition file via --extended-definition-file.

# flags.definition-identifier.summary

The definition identifier for the standard dataset.

# flags.definition-identifier.description

The unique identifier of the standard setup dataset definition (e.g., 'dipcmlargedefinition'). This value is sent as `dataSetName` in the export API payload. Required when not using --extended-definition-file.

# flags.version.summary

The version of the standard dataset.

# flags.version.description

The version string for the standard dataset definition (e.g., '1.0.0'). Required when not using --extended-definition-file.

# flags.extended-definition-file.summary

Path to a JSON file containing a complete custom dataset definition.

# flags.extended-definition-file.description

Path to a JSON file containing a fully custom dataset definition. The file contents are used as the export API payload and the definition headers are merged into the retrieved data before deploying to the target org.

# flags.source-org.summary

The source org alias or username to retrieve data from.

# flags.source-org.description

The Salesforce org from which to retrieve the setup data. Can be an org alias or username.

# flags.target-org.summary

The target org alias or username to deploy data to.

# flags.target-org.description

The Salesforce org where the setup data will be deployed. Can be an org alias or username.

# flags.api-version.summary

API version to use for the connection.

# flags.api-version.description

The Salesforce API version to use when connecting to the orgs. If not specified, uses the org's default API version.

# flags.filter-value.summary

Comma-separated list of filter values for the export.

# flags.filter-value.description

Optional comma-separated list of filter values to include in the export (e.g., 'autoSilver, autoRoot'). This value is sent as `filterValue` in the export API payload.

# examples

- Retrieve and deploy using a standard dataset definition:

  <%= config.bin %> <%= command.id %> --definition-identifier dipcmlargedefinition --version 1.0.0 --source-org sourceOrg --filter-value 'autoSilver' --target-org targetOrg

- Retrieve and deploy using a custom dataset definition file:

  <%= config.bin %> <%= command.id %> --extended-definition-file definition/dipcmlargedefinition-extension.json --source-org sourceOrg --filter-value 'autoSilver' --target-org targetOrg

# info.connecting

Connecting to source org...

# info.readingDefinition

Reading custom definition file...

# info.callingExportApi

Calling Connect API for dataset export on source org...

# info.exportSuccess

Export from source org completed successfully.

# info.merging

Merging definition headers with exported data...

# info.connectingTarget

Connecting to target org...

# info.callingImportApi

Calling Connect API for dataset import on target org...

# info.success

Setup transfer completed successfully.

# info.payloadFileSaved

Payload file saved to: %s

# errors.missingFlags

You must provide either --definition-identifier and --version (standard definition), or --extended-definition-file (custom definition).

# errors.conflictingFlags

Cannot use --definition-identifier or --version together with --extended-definition-file. Use either --definition-identifier and --version for a standard definition, or --extended-definition-file alone for a custom definition.

# errors.missingVersion

When using --definition-identifier, --version is also required.

# errors.missingIdentifier

When using --version, --definition-identifier is also required.

# errors.exportFailed

Export failed with errors:\n%s

# errors.transferFailed

Setup transfer operation failed: %s