# Overview

Transfer setup data from one Salesforce org to another by using either a **standard dataset definition** or a **custom dataset definition**. A dataset definition is a blueprint that includes:

- Which objects to move  
- Which fields to include  
- How to filter the data  
- How the objects relate to one another  
- The order in which they should be processed

## Standard Dataset Definition

A standard dataset definition is a Salesforce-provided Digital Insurance Product Catalog Management (PCM) dataset that includes 18 PCM-related objects with their complete schema. This out-of-the-box definition, `dipcmlargedefinition version 1.0.0,` is ready to use without any configuration. This is the [complete JSON schema](standard-dataset-definition/pcm-standard-dataset-definition/dipcmlargedefinition-1.0.0.json) for the `Digital Insurance PCM` standard dataset definition.

### Objects Included in Standard Definition

The standard definition includes these 18 objects:

1. **Product2**  Core product information
2. **ProductComponentGroup**  Product component groupings
3. **ProductRelatedComponent**  Relationships between products and components
4. **ProductSellingModelOption**  Selling model options for products
5. **PricebookEntry**  Product pricing entries
6. **ProductAttributeDefinition**  Product attribute definitions
7. **ProductCategoryProduct**  Product category associations
8. **ProductClassification**  Product classification hierarchy
9. **ProductSellingModel**  Selling model configurations
10. **ProductCategory**  Product categories
11. **ProductClassificationAttr**  Product classification attributes
12. **AttributeCategory**  Attribute categories
13. **AttributeDefinition**  Attribute definitions
14. **AttributePicklist**  Attribute picklist configurations
15. **AttributePicklistValue**  Picklist values
16. **AttributeCategoryAttribute**  Attribute category associations
17. **ProductCatalog**  Product catalogs
18. **Pricebook2**  Pricebook configurations

### Key Components of the Standard Dataset Definition

The standard dataset definition schema consists of these root-level properties and object definition properties.

#### Root Level Properties

- **dataSetName**: The identifier for this dataset definition, such as dipcmlargedefinition.  
- **version**: The version number of the definition, such as 1.0.0.  
- **exportSequence**: Defines the order in which objects are exported from the source org.  
- **importSequence**: Defines the order in which objects are imported into the target org.  
- **objects**: Contains the list of all object definitions.

#### Import and Export Sequences

The import and export sequences are lists that define the processing order based on object dependencies. The sequences are critical for maintaining referential integrity.

- **Export Sequence**: Extracts data in an order that ensures all dependencies are captured.  
- **Import Sequence**: Imports data in dependency order with parent objects before children. This ensures that when a child record references a parent via foreign key, the parent record already exists in the target org.

**Example flow:**

1. Import AttributePicklist first (no dependencies)
2. Import AttributePicklistValue next (depends on AttributePicklist)
3. Import Product2 (depends on ProductClassification)
4. Import PricebookEntry last (depends on Product2, ProductSellingModel, and Pricebook2)

**Export Sequence Example (from source org)**:

```
Product2 → ProductComponentGroup → ProductRelatedComponent → ProductSellingModelOption → PricebookEntry → ProductAttributeDefinition → ProductCategoryProduct → ProductClassification → ProductSellingModel → ProductCategory → ProductClassificationAttr → AttributeCategory → AttributeDefinition → AttributePicklist → AttributePicklistValue → AttributeCategoryAttribute → ProductCatalog → Pricebook2
```

**Import Sequence** **Example (to target org):**

```
AttributePicklist → AttributePicklistValue → AttributeCategory → AttributeDefinition → AttributeCategoryAttribute → ProductClassification → ProductCatalog → ProductCategory → ProductSellingModel → Pricebook2 → Product2 → ProductComponentGroup → ProductRelatedComponent → ProductClassificationAttr → ProductAttributeDefinition → ProductCategoryProduct → ProductSellingModelOption → PricebookEntry
```

#### Object Definition Properties

Each object in the `objects.list` array contains these key properties. Both the standard and custom dataset definition types share the same JSON schema structure, with the only difference being that standard definition is pre-configured by Salesforce while you create the custom definition based on your business need.

**1. objectName (Required)**

It’s the API name of the Salesforce object. For example, `Product2` and `ProductCategory`. Each object must have either a `globalKeyField` or `compositeKeys`, not both.

**2. globalKeyField**

This is used for simple objects. It’s a single natural key field that’s used to uniquely identify records across environments. For example, `Product2` uses `ProductCode`, `AttributeDefinition` uses `DeveloperName` and `ProductCategory` uses `Code` as global key fields.

Standard record IDs aren’t used as global key fields as the record IDs change between orgs.

**3. compositeKeys**

These are used for junction objects or when multiple fields are used to uniquely identify a record. These keys include:

- Direct fields  
- Parent references, such as `Product2.ProductCode`, `ProductCategory.Code`

It contains a list array with multiple field paths using dot-notation.  
This is an example from `ProductRelatedComponent`.

Example:

```
{
  "compositeKeys": {
    "list": [
      "ParentProduct.ProductCode",
      "ProductComponentGroup.Code",
      "ProductRelationshipType.Name",
      "ChildProduct.ProductCode",
      "ChildProductClassification.Code"
    ]
  }
}
```

This is an example from `ProductAttributeDefinition` where the composite key includes a reference to `ProductClassificationAttribute` which itself uses a composite key.

```
{
  "objectName": "ProductAttributeDefinition",
  "compositeKeys": {
    "list": [
      "Product2.ProductCode",
      "AttributeDefinition.DeveloperName",
      "ProductClassificationAttribute.ProductClassification.Code",
      "ProductClassificationAttribute.AttributeDefinition.DeveloperName"
    ]
  },
  "fields": "Product2Id, AttributeDefinitionId, ProductClassificationAttributeId",
  "filterCriteria": "",
  "foreignKeys": {
    "list": [
      {
        "field": "Product2",
        "targetObject": "Product2",
        "lookupField": "Product2Id",
        "globalKeyField": "ProductCode"
      },
      {
        "field": "OverriddenProductAttributeDefinition",
        "targetObject": "ProductAttributeDefinition",
        "lookupField": "OverriddenProductAttributeDefinitionId"
      },
      {
        "field": "AttributeDefinition",
        "targetObject": "AttributeDefinition",
        "lookupField": "AttributeDefinitionId",
        "globalKeyField": "DeveloperName"
      },
      {
        "field": "AttributeCategory",
        "targetObject": "AttributeCategory",
        "lookupField": "AttributeCategoryId",
        "globalKeyField": "Code"
      },
      {
        "field": "ProductClassificationAttribute",
        "targetObject": "ProductClassificationAttr",
        "lookupField": "ProductClassificationAttributeId"
      }
    ]
  }
}
```

This is an example where the composite key includes direct fields. In this example, the composite key list includes both a parent reference using dot-notation (`ParentAccount__c.Name`) and a direct field (`Name`).

```
{
  "objectName": "AccountContext__c",
  "compositeKeys": {
    "list": [
      "ParentAccount__c.Name",
      "Name"
    ]
  },
  "fields": "Name",
  "filterCriteria": "",
  "foreignKeys": {
    "list": [
      {
        "field": "ParentAccount__c",
        "targetObject": "Account",
        "lookupField": "ParentAccount__c",
        "globalKeyField": "Name"
      }
    ]
  }
}
```

**4. fields**

These are comma-separated lists of field API names to include in the dataset definition. It uses dot-notation to reference parent fields. By default, the data transfer tool automatically exports all non-null fields that you (login-user) have read access to in the source org. You can customize this behavior by explicitly specifying which fields to include in the `fields` property.  
Example:

```
"fields": "AvailabilityDate, BasedOn.Code, Name, ProductCode"
```

**5. filterCriteria**

SQL-based clause to filter records during export. Keep this empty If no filtering is required.  
Special placeholder: {SETFILTER}  If configured, you must specify the `--filter-value` CLI flag in the command line and replace the values at runtime.  
Example:

```
"filterCriteria": "ProductCode IN ({SET_FILTER})"
```

**6. foreignKeys**

Foreign keys define the relationships between objects. Each foreign key entry contains:

- **field**: The relationship field name (without the "Id" suffix)  
- **targetObject**: The API name of the related object  
- **lookupField**: The actual ID field name  
- **globalKeyField**: The natural key field in the target object used for matching

Example:

```
{
  "foreignKeys": {
    "list": [
      {
        "field": "BasedOn",
        "targetObject": "ProductClassification",
        "lookupField": "BasedOnId",
        "globalKeyField": "Code"
      }
    ]
  }
}
```

Some objects have no foreign keys:

```
"foreignKeys": { "list": [] }
```

## Custom Dataset Definition

A custom dataset definition is a JSON file that you create locally with the entire schema that you want to migrate. It shares the same JSON schema of the Salesforce-provided standard dataset definition. You can include custom objects, different fields, and filters when no standard definition exists for your business requirement.  
You can create custom dataset definitions when:

- You need to migrate custom objects that aren’t included in the standard definition  
- You need different fields or filters than what the standard definition provides  
- Your business requirements differ from the out-of-the-box PCM setup

You can create a custom dataset definition by authoring the JSON structure yourself. Use the standard definition JSON as a template and modify the objects, fields, or filter criteria to suit your needs.

### Difference Between Standard and Custom Definitions


| Aspect          | Standard Definition    | Custom Definition                                                                    |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| **Creation**    | Provided by Salesforce | Created by you                                                                       |
| **Objects**     | Fixed 18 PCM objects   | Any objects you choose                                                               |
| **Maintenance** | Managed by Salesforce  | Managed by you                                                                       |
| **Schema**      | Pre-configured         | Fully customizable but share the same JSON schema of the standard dataset definition |
| **Use Case**    | Digital Insurance PCM  | Any custom requirement                                                               |
| **CLI Flag**    | Uses i and v flags     | Uses e flag                                                                          |


#### Critical Configurations for Custom Dataset Definitions

When creating custom dataset definitions, you must adhere to specific configurational logic to ensure successful data transfer.

**1. Import Sequence**

Specify Objects in a specific dependency-based order. Define the parent objects before child objects, and child objects before grandchildren, to ensure foreign key references are available during import. During import, when a record is inserted into the target org, any lookup or master-detail relationship fields must reference records that already exist. If you try to import a child record before its parent, the import will fail.  

**Example**:

```
Correct Order:
1. ProductClassification (parent)
2. Product2 (child; references ProductClassification)
3. ProductComponentGroup (references Product2)

Incorrect Order:
1. ProductComponentGroup ❌ (references Product2 which doesn't exist yet)
2. Product2 ❌ (references ProductClassification which doesn't exist yet)
3. ProductClassification


```

**2. Export Sequence**

Export sequence defines the order in which objects are exported from the source org. This sequence has two use cases:

- If you define the parent objects before child objects, all parent records that satisfy the parent object filter criteria are exported.

```
Correct Order:
1. ProductClassification (parent)
2. Product2 (child, references ProductClassification)
```

- If you define the child objects before parent objects, the parent records that are referenced by child objects are exported.

**Example**:

```
Correct Order:
 1. Product2 (child, references ProductClassification)
 2. ProductClassification (parent)

```

**3. Record Identification Keys**

Because standard Salesforce record IDs change between environments, do not use the record IDs for matching records. Use global and composite keys for record identification.

##### **Global Keys (Single Natural Key)**

Use a single natural key field that has the same value across all orgs.

- Use fields like ProductCode, DeveloperName, Name, or Code  
- Ensure the field value is unique within that object  
- Choose fields that are meaningful and don't change

**Example**:

```
{
  "objectName": "Product2",
  "globalKeyField": "ProductCode",
  ...
}

```

##### **Composite Keys (Multi-Field Keys)**

For junction objects or complex records where no single field provides uniqueness, use a combination of fields.

- Include at least one parent references using dot-notation, for example, `Product2.ProductCode`  
- Combine multiple fields that together create a unique identifier. Do not keep the direct field in the first position of the composite key list. Use this for many-to-many junction objects

**Example**:

```
{
  "objectName": "ProductRelatedComponent",
  "compositeKeys": {
    "list": [
      "ParentProduct.ProductCode",
      "ProductComponentGroup.Code",
      "ProductRelationshipType.Name",
      "ChildProduct.ProductCode",
      "ChildProductClassification.Code"
    ]
  }
}
```

**4. Set Filter Placeholder**

The `{SET_FILTER}` placeholder is a special token in the filter criteria. If you specify **{SETF_ILTER}** placeholder when configuring a custom dataset definition**,** the `--filter-value` CLI becomes a required parameter during runtime and the log-in user must specify values for it during run time. If **{SET_FILTER}** isn’t configured in the dataset definition, it is optional during runtime.

When the placeholder is present in the dataset definition, the CLI will replace it with the comma-separated values you provide at runtime.  
**Example**:

```
{
  "objectName": "Product2",
  "filterCriteria": "ProductCode IN ({SET_FILTER})"
}
```

**Example CLI command**:

```
sf data setup transfer \
  --extended-definition-file my-custom-definition.json \
  --source-org sourceOrg \
  --target-org targetOrg \
  --filter-value 'autoSilver,autoGold,autoPlatinum'


```

**Result**: The filter becomes ProductCode IN ('autoSilver','autoGold','autoPlatinum')

You can also filter a chain of objects by a root object filter condition. To do that, add `{SET_FILTER}` placeholder to root object Product2, such as  "filterCriteria": "ProductCode IN ({SETFILTER})". Then, in the export sequence, define the child objects before the parent objects. This retrieves only those object records that are directly or indirectly related to the root object `Product2` whose `ProductCode` is included in `{SET_FILTER}`.

Example:

```
Product2 → ProductComponentGroup → ProductRelatedComponent → ProductSellingModelOption →
PricebookEntry → ProductAttributeDefinition → ProductCategoryProduct → ProductClassification →
ProductSellingModel → ProductCategory → ProductClassificationAttr → AttributeCategory →
AttributeDefinition → AttributePicklist → AttributePicklistValue → AttributeCategoryAttribute →
ProductCatalog → Pricebook2

```

**5. Product Classification Rule**

If your definition includes product classifications as child records, the system cannot automatically resolve the underlying products. You must:

1. Identify all product codes that belong to each product classification
2. Explicitly list ALL those product codes in the `-filter-value` flag

**Example Scenario**:

- You have a ProductClassification "CommercialProperty"  
- Under this classification, you have products: commProperty, commLocation, commBuilding  
- Your filter value must include all three product codes

**Use this in your custom definition**:

```
{
  "objectName": "Product2",
  "filterCriteria": "ProductCode IN ({SET_FILTER})"
}

```

**Use this in your CLI command**:

```
sf data setup transfer \
  --extended-definition-file my-definition.json \
  --source-org sourceOrg \
  --target-org targetOrg \
  --filter-value 'commProperty,commLocation,commBuilding'

```

**6. Multiple Filter Values with IN Operator**

When you need to filter on multiple values, use the `IN` operator in your filter criteria.  
**Format in custom definition**:

```
"filterCriteria": "ProductCode IN ('value1','value2','value3')"
```

Or **with placeholder**:

```
"filterCriteria": "ProductCode IN ({SET\_FILTER})"
```

**CLI usage with multiple values**:

```
--filter-value 'value1,value2,value3'
```

**Important**: Values are comma-separated without spaces.

**7. Foreign Key Configuration**

Foreign keys define how objects relate to each other and are crucial for maintaining referential integrity.

- **field (Required)**: The relationship field name without "Id"  
- **targetObject (Required)**: The object being referenced  
- **lookupField (Required)**: The actual ID field name in the current object  
- **globalKeyField (Required)**: The natural key in the target object  
- **isPseudoLookup (optional)**: Set to `true` for polymorphic foreign key fields (a foreign key field that references more than one object). Include this property when its value is `true`. This property is not used in the Salesforce-provided standard dataset definition.

**Example**:

```
"foreignKeys": {
  "list": [
    {
      "field": "ParentProduct",
      "targetObject": "Product2",
      "lookupField": "ParentProductId",
      "globalKeyField": "ProductCode"
    }
  ]
}

```

**Self-referencing relationships** (hierarchies):

```
{
  "field": "ParentProductClassification",
  "targetObject": "ProductClassification",
  "lookupField": "ParentProductClassificationId",
  "globalKeyField": "Code"
}
```

**Example with Polymorphic Foreign Key (isPseudoLookup):**

When a foreign key field references more than one object type (polymorphic), you must use the `isPseudoLookup: true` property. This foreign key field does not support DOT notation.

```
{
  "objectName": "ExpressionSetConstraintObj",
  "compositeKeys": {
    "list": [
      "ExpressionSet.ApiName",
      "ReferenceObjectId",
      "ConstraintModelTag"
    ]
  },
  "fields": "ExpressionSetId, ExpressionSet.ApiName, ReferenceObjectId, ConstraintModelTag, ConstraintModelTagType",
  "filterCriteria": "",
  "foreignKeys": {
    "list": [
      {
        "field": "ExpressionSet",
        "targetObject": "ExpressionSet",
        "lookupField": "ExpressionSetId",
        "globalKeyField": "ApiName"
      },
      {
        "field": "ReferenceObject",
        "targetObject": "Product2",
        "lookupField": "ReferenceObjectId",
        "globalKeyField": "ProductCode",
        "isPseudoLookup": true
      },
      {
        "field": "ReferenceObject",
        "targetObject": "ProductRelatedComponent",
        "lookupField": "ReferenceObjectId",
        "isPseudoLookup": true
      },
      {
        "field": "ReferenceObject",
        "targetObject": "ProductClassification",
        "lookupField": "ReferenceObjectId",
        "globalKeyField": "Code",
        "isPseudoLookup": true
      },
      {
        "field": "ReferenceObject",
        "targetObject": "ProductComponentGroup",
        "lookupField": "ReferenceObjectId",
        "globalKeyField": "Code",
        "isPseudoLookup": true
      }
    ]
  }
}
```

**8. Field Selection**

**Best Practices**:

- Do NOT specify fields unless there is a special reason.
- This tool will include all not-null fields that the authenticated user running the tool can access.

**Example**:

```
"fields": ""
```

**9. Empty Filter Criteria**

Some objects don't need filtering. They should include all records related through foreign key relationships.  
**Use empty string for no filter**:

```
"filterCriteria": ""
```

This is common for child objects that are automatically included based on their parent relationship.

### Creating Custom Dataset Definitions

Follow these steps to create a custom dataset definition:

**Step 1: Create the JSON File Structure**

Start with the basic structure:

```
{
  "dataSetName": "my-custom-definition",
  "version": "1.0.0",
  "exportSequence": {
    "list": []
  },
  "importSequence": {
    "list": []
  },
  "objects": {
    "list": []
  }
}
```

**Step 2: Identify Your Objects and Dependencies**

1. List all objects you need to transfer
2. Identify parent-child relationships
3. Map out the dependency hierarchy

**Example hierarchy**:

```
Account (no dependencies)
  ├── Contact (depends on Account)
  └── Opportunity (depends on Account)
      └── OpportunityLineItem (depends on Opportunity and Product)
Product2 (no dependencies)
```

**Step 3: Define Export Sequence**

List objects in order that captures dependencies (parents can come before or after children in export):

```
"exportSequence": {
  "list": [
    "Account",
    "Contact",
    "Product2",
    "Opportunity",
    "OpportunityLineItem"
  ]
}
```

**Step 4: Define Import Sequence**

**Critical**: List objects in dependency order  parents BEFORE children:

```
"importSequence": {
  "list": [
    "Account",
    "Product2",
    "Contact",
    "Opportunity",
    "OpportunityLineItem"
  ]
}
```

**Step 5: Define Each Object**

For each object, specify:

**Simple Object (with globalKeyField)**

```
{
  "objectName": "Account",
  "globalKeyField": "AccountNumber",
  "fields": "Name, AccountNumber, Industry, Type",
  "filterCriteria": "Industry = 'Technology'",
  "foreignKeys": {
    "list": []
  }
}
```

**Object with Foreign Keys**

```
{
  "objectName": "Contact",
  "globalKeyField": "Email",
  "fields": "FirstName, LastName, Email, AccountId",
  "filterCriteria": "",
  "foreignKeys": {
    "list": [
      {
        "field": "Account",
        "targetObject": "Account",
        "lookupField": "AccountId",
        "globalKeyField": "AccountNumber"
      }
    ]
  }
}
```

**Junction Object (with compositeKeys)**

```
{
  "objectName": "OpportunityLineItem",
  "compositeKeys": {
    "list": [
      "Opportunity.OpportunityNumber",
      "Product2.ProductCode",
      "PricebookEntry.Name"
    ]
  },
  "fields": "OpportunityId, PricebookEntryId, Quantity, UnitPrice",
  "filterCriteria": "",
  "foreignKeys": {
    "list": [
      {
        "field": "Opportunity",
        "targetObject": "Opportunity",
        "lookupField": "OpportunityId",
        "globalKeyField": "OpportunityNumber"
      },
      {
        "field": "Product2",
        "targetObject": "Product2",
        "lookupField": "Product2Id",
        "globalKeyField": "ProductCode"
      }
    ]
  }
}
```

**Step 6: Add Filter Criteria**

Choose between static filters and runtime filters:  
**Static filter**:

```
"filterCriteria": "Industry = 'Technology' AND Type = 'Customer'"
```

**Runtime filter with placeholder**:

```
"filterCriteria": "AccountNumber IN ({SET_FILTER})"
```

**Multiple conditions**:

```
"filterCriteria": "ProductCode IN ({SET_FILTER}) AND Status = 'Active'"
```

**Step 7: Validate Your Definition**

Check these aspects:

- ✅ All parent objects appear before children in importSequence  
- ✅ Every object has either globalKeyField OR compositeKeys  
- ✅ All foreign key targetObject values exist in your objects list  
- ✅ All foreign key globalKeyField values match the target object's key field  
- ✅ Field names are valid API names  
- ✅ JSON syntax is valid

**Step 8: Save and Test**

1. Save your file with a .json extension (e.g., my-custom-definition.json)
2. Test with a small data set first
3. Use the CLI command with -extended-definition-file flag

**Complete Example**

Here's a complete custom definition for Account and Contact:

```
{
  "dataSetName": "account-contact-setup",
  "version": "1.0.0",
  "exportSequence": {
    "list": [
      "Account",
      "Contact"
    ]
  },
  "importSequence": {
    "list": [
      "Account",
      "Contact"
    ]
  },
  "objects": {
    "list": [
      {
        "objectName": "Account",
        "globalKeyField": "AccountNumber",
        "fields": "Name, AccountNumber, Industry, Type, Phone, Website",
        "filterCriteria": "AccountNumber IN ({SET_FILTER})",
        "foreignKeys": {
          "list": []
        }
      },
      {
        "objectName": "Contact",
        "globalKeyField": "Email",
        "fields": "FirstName, LastName, Email, Phone, AccountId, Title",
        "filterCriteria": "",
        "foreignKeys": {
          "list": [
            {
              "field": "Account",
              "targetObject": "Account",
              "lookupField": "AccountId",
              "globalKeyField": "AccountNumber"
            }
          ]
        }
      }
    ]
  }
}
```

#### CLI Tool Installation and Usage

**Before you begin:**

- You must have a Salesforce Administrator user profile.  
- Install and authenticate the [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli).

**Install the Plugin**

1. Open a Terminal window.
2. Authorize your orgs and then check the connectivity status of the orgs:

```
# Authorize source org
sf org login web --alias sourceOrg

# Authorize target org  
sf org login web --alias targetOrg

# Verify connectivity
sf org list
```

1. Use this command to install the plugin.

```
sf plugins install @salesforce/plugin-data-setup-transfer
```

1. Use this command to install a specific version.

```
sf plugins install @salesforce/plugin-data-setup-transfer@x.y.z
```

**Run the Plugin**

After installation, use the `sf data setup transfer` command to transfer the setup data from a source org to the target org.

```
sf data setup transfer [-s <value>] -o <value> [--json] [--flags-dir <value>] [-i <value>] [-v <value>] [-e <value>][-x <value>][--api-version <value>]
```

### Flags References

**Required Flags**

**s, -source-org** (Required)

- **Type**: Value  
- **Description**: Alias or username of the source org to retrieve data from.  
- **Example**: -source-org sourceOrg

**o, -target-org** (Required)

- **Type**: Value  
- **Description**: Alias or username of the target org to which data is transferred.  
- **Example**: -target-org targetOrg

#### Standard Dataset Definition Flags

**i, -definition-identifier** (Required for standard definition)

- **Type**: Value  
- **Description**: ID of the standard dataset definition.  
- **Example**: -definition-identifier dipcmlargedefinition  
- **Note**: Cannot be used with e

**v, -version** (Required for standard definition)

- **Type**: Value  
- **Description**: Version of the standard dataset definition.  
- **Example**: -version 1.0.0  
- **Note**: Must be used with i, cannot be used with e

#### Custom Dataset Definition Flags

**e, -extended-definition-file** (Required for custom definition)

- **Type**: Value  
- **Description**: Path to a JSON file containing a complete custom dataset definition.  
- **Example**: `--extended-definition-file definition/my-custom-definition.json`  
- **Note**: Cannot be used with `-i` or `-v`

**x, -filter-value** (Optional or Required based on dataset definition configuration)

- **Type**: Value  
- **Description**: Comma-separated filter values. If specified, the command excludes these values while doing te .  
- **Example**: -filter-value 'autoSilver,autoGold'  
- **Behavior**:  
  - Optional if the dataset definition doesn't use `{SET_FILTER}` placeholder.  
  - Required if the dataset definition includes `{SET_FILTER}` placeholder.

**-api-version** (Optional)

- **Type**: Value  
- **Description**: Salesforce API version to use when connecting to orgs  
- **Default**: Uses org's default API version if not specified  
- **Example**: -api-version 58.0

**-json** (Optional)

- **Description**: Output results in JSON format  
- **Use Case**: Useful for scripting and automation

**-flags-dir** (Optional)

- **Type**: Value  
- **Description**: Directory containing flag configuration files

#### Validation Rules

- Do not use custom (-e) and standard definition (-i) flags together.
- Using custom definition (-e) with api version (-v) shows error.  
- Using standard definition (-i) without api version (-v) shows error.

✅ **Valid Combinations**:

- i  v (standard definition)  
- e alone (custom definition)

### Usage Examples

**Example 1: Transfer Using Standard Dataset Definition**

```
sf data setup transfer \
  --definition-identifier dipcmlargedefinition \
  --version 1.0.0 \
  --source-org sourceOrg \
  --target-org targetOrg \
  --filter-value 'autoSilver'
```

**What this does**:

- Uses the standard Digital Insurance PCM definition  
- Version 1.0.0  
- Extracts data from sourceOrg  
- Deploys to targetOrg  
- Filters Product2 records where ProductCode IN ('autoSilver')

**Example 2: Transfer Using Standard Definition with Multiple Filter Values**

```
sf data setup transfer \
  --definition-identifier dipcmlargedefinition \
  --version 1.0.0 \
  --source-org sourceOrg \
  --target-org targetOrg \
  --filter-value 'autoSilver,autoGold,autoPlatinum'
```

**What this does**:

- Same as Example 1  
- Filters for three product codes: autoSilver, autoGold, and autoPlatinum

**Example 3: Transfer Using Custom Dataset Definition**

```
sf data setup transfer \
  --extended-definition-file definition/my-custom-definition.json \
  --source-org sourceOrg \
  --target-org targetOrg \
  --filter-value 'customValue1,customValue2'

```

**What this does**:

- Uses your custom definition file  
- Extracts from sourceOrg  
- Deploys to targetOrg  
- Uses the filter values you specified

**Example 4: Custom Definition with Product Classification (PCM Specific)**

```
sf data setup transfer \
  --extended-definition-file definition/dipcmlargedefinition-extension.json \
  --source-org sourceOrg \
  --target-org targetOrg \
  --filter-value 'commProperty,commLocation,commBuilding,commHeadOffice'
```

**What this does**:

- Uses a custom PCM extension definition  
- Explicitly lists all product codes under the product classification  
- This is required because the system cannot automatically resolve products under a classification

**Example 5: Custom Definition with Multiple Filter Criteria**

When your custom definition includes multiple `IN` clauses in your JSON file

```
"filterCriteria": "ProductCode IN ('commProperty','commLocation','commBuilding','commHeadOffice')"
```

**CLI command**:

```
sf data setup transfer \
  --extended-definition-file definition/commercial-products.json \
  --source-org sourceOrg \
  --target-org targetOrg
```

**Note**: Filter values are hardcoded in the dataset definition, so no -filter-value flag needed.

**Example 6: With API Version Override**

```
sf data setup transfer \
  --definition-identifier dipcmlargedefinition \
  --version 1.0.0 \
  --source-org sourceOrg \
  --target-org targetOrg \
  --filter-value 'autoSilver' \
  --api-version 58.0
```

**Example 7: JSON Output for Automation**

```
sf data setup transfer \
  --definition-identifier dipcmlargedefinition \
  --version 1.0.0 \
  --source-org sourceOrg \
  --target-org targetOrg \
  --filter-value 'autoSilver' \
  --json > transfer-result.json
```

**What this does**:

- Executes the transfer  
- Outputs result in JSON format  
- Redirects output to transfer-result.json file  
- Useful for CI/CD pipelines and automation scripts

#### Best Practices

1. **Test with Small Dataset First**: Use a limited filter value to test your definition before transferring large amounts of data
2. **Verify Source Data**: Check that your filter criteria returns the expected records in the source org
3. **Check Target Org**: Ensure the target org has the same custom objects and fields as the source
4. **Use Descriptive Aliases**: Name your orgs with clear aliases (e.g., dev-org, uat-org, prod-org)
5. **Version Control**: Keep your custom definition files in version control
6. **Document Filters**: Document what each filter value represents for future reference
7. **Backup Target Org**: Create a backup of the target org before large data transfers
8. **Review Import Logs**: Check the CLI output for any errors or warnings after the transfer

### Validations

**Error: "You must provide either e or i and v (not both)"**

- **Cause**: Invalid flag combination  
- **Solution**: Use either custom definition flag (-e) OR standard definition flags (-i and v)

**Error: "filter-value is required"**

- **Cause**: Your definition uses {SETFILTER} placeholder but no filter value was provided  
- **Solution**: Add -filter-value flag with appropriate values

**Error: "Foreign key reference not found"**

- **Cause**: Import sequence is incorrect  child imported before parent  
- **Solution**: Review and correct the import sequence in your definition

**Warning: "Some records failed to import"**

- **Cause**: Could be validation rules, required fields, or duplicate global keys  
- **Solution**: Check the detailed error log and fix data or definition accordingly

## Frequently Asked Questions

**Q:** The global key has an empty value. What should I do?  
**A:** If a global key (for example, the `Code` field of `ProductComponentGroup`) is empty, update the value in the source org and rerun the CLI command. 

**Q:** How to identify the issue is in source org or target org?  
**A:** In the folder from which the CLI command is run, look for the tmp`/setup-transfer-payload.json` file. This file has the exported data.  

**Q:** Does the tool delete a record in the target org?  
**A:** No

**Q:** Objects in a managed package.
**A:** The namespace prefix must be added to custom objects/fields in the dataset definition. Ex: "devopsimpkg15__" is the namespace prefix.
```
{
  "dataSetName": "custom-object-managed-package",
  "version": "1.0.0",
  "exportSequence": {
    "list": [
      "devopsimpkg15__AdminTabLayout__c"
    ]
  },
  "importSequence": {
    "list": [
      "devopsimpkg15__AdminTabLayout__c"
    ]
  },
  "objects": {
    "list": [
      {
        "objectName": "devopsimpkg15__AdminTabLayout__c",
        "globalKeyField": "Name",
        "fields": "Name",
        "filterCriteria": "",
        "foreignKeys": {
          "list": []
        }
      }
    ]
  }
}
```

**Q:** Will this plugin create custom objects and fields in the target org?
**A:** Custom objects and fields are not created by this plugin. Please use Salesforce Platform CLI to retrieve them from the source org and deploy them to the target org.

**Q:** Why do I get this error message?
Setup transfer operation failed: {"errors":[{"code":"UNKNOWN_EXCEPTION","message":"Failed to import data: DML save failed for entity ProductClassificationAttr: [We couldn't find the reference object and field. Ask your Salesforce admin for help.] [We couldn't find the reference object and field. Ask your Salesforce admin for help.]"}]}
**A:** The Picklist values (Account, Contact, Asset) for ReferenceObject field of object ProductClassificationAttr are not created by this plugin. They need to be created manually in the target org. Go to Setup -> Object Manager -> ProductClassificationAttr -> click ReferenceObject field -> Add Picklist values: Account, Contact, Asset
ReferenceObject and ReferenceFieldApiName are required by the extended attributes configuration.

Example of the exported records of ProductClassificationAttr from the source org:
```
{
  "Status": "Active",
  "IsHidden": false,
  "AttributeNameOverride": "Model",
  "AttributeCategory.Code": "Auto Information",
  "AttributeDefinition.DeveloperName": "Model",
  "CurrencyIsoCode": "USD",
  "Name": "Model",
  "ReferenceObject": "Asset",
  "ReferenceFieldApiName": "Model__c",
  "IsRequired": false,
  "ProductClassification.Code": "Auto",
  "IsPriceImpacting": false,
  "IsReadOnly": true
}
```

**Q:** Some objects (ex: Contract, FulfillmentStepDefinitionGroup) do not have a natural key field which can uniquly identify a record.
**A:** Create a custom field (ex: GlobalKey__c) and use it as "globalKeyField" in the custom dataset definition.

**Q:** Why do I get this error?
{"errors":[{"code":"FIELD_NOT_ACCESSIBLE","message":"You don&#39;t have permission to access the ShouldAttachInvoiceDocToEmail field on the LegalEntity object. Your Salesforce admin can help with that."}]}
**A:** Please assign FLS to the ShouldAttachInvoiceDocToEmail field of the LegalEntity object.

**Q:** Why do I get this error?
Error (1): Setup transfer operation failed: {"errors":[{"code":"UNKNOWN_EXCEPTION","message":"Failed to import data: Failed to get object Id for object devopsimpkg15__AdminTabLayout__c: sObject type &#39;devopsimpkg15__AdminTabLayout__c&#39; is not supported. If you are attempting to use a custom object, be sure to append the &#39;__c&#39; after the entity name. Please reference your WSDL or the describe call for the appropriate names."}]}
**A:** create custom object devopsimpkg15__AdminTabLayout__c on the target org. Please note "devopsimpkg15__" is the package namespace prefix.

## **Additional Resources**

- **GitHub Repository**: [plugin-data-setup-transfer](https://github.com/salesforcecli/plugin-data-setup-transfer/tree/main)  
- **Salesforce CLI Documentation**: [Install Salesforce CLI](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm)

