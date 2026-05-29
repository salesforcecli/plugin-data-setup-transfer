/*
 * Copyright 2026, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, Connection, Org } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('plugin-data-setup-transfer', 'data.setup.transfer');

type DefinitionForeignKey = {
  field: string;
  targetObject: string;
  lookupField: string;
  globalKeyField?: string;
};

type DefinitionEntity = {
  objectName: string;
  globalKeyField?: string;
  compositeKeys?: { list: string[] };
  fields: string;
  filterCriteria: string;
  foreignKeys: { list: DefinitionForeignKey[] };
};

type DefinitionFile = {
  dataSetName: string;
  version: string;
  importSequence?: { list: string[] };
  objects: { list: DefinitionEntity[] };
};

type EntityRecord = Record<string, unknown>;

type ExportEntity = {
  objectName: string;
  recordCount?: number;
  records: EntityRecord[];
};

type ExportResponse = {
  [key: string]: unknown;
  objects: ExportEntity[];
  metadata: Record<string, unknown>;
};

type MergedEntityHeader = {
  objectName: string;
  globalKeyField?: string;
  compositeKeys?: string[];
  fields: string;
  filterCriteria: string;
  foreignKeys: DefinitionForeignKey[];
};

type MergedEntity = {
  header: MergedEntityHeader;
  objectName: string;
  recordCount?: number;
  records: Array<Record<string, unknown>>;
};

type MergedPayload = {
  importSequence: string[];
  metadata: Record<string, unknown>;
  objects: MergedEntity[];
};

export type SetupTransferResult = {
  success: boolean;
  exportResponse: unknown;
  importResponse: unknown;
};

export default class SetupTransfer extends SfCommand<SetupTransferResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'definition-identifier': Flags.string({
      char: 'i',
      summary: messages.getMessage('flags.definition-identifier.summary'),
      description: messages.getMessage('flags.definition-identifier.description'),
      required: false,
    }),
    version: Flags.string({
      char: 'v',
      summary: messages.getMessage('flags.version.summary'),
      description: messages.getMessage('flags.version.description'),
      required: false,
    }),
    'extended-definition-file': Flags.file({
      char: 'e',
      summary: messages.getMessage('flags.extended-definition-file.summary'),
      description: messages.getMessage('flags.extended-definition-file.description'),
      required: false,
      exists: true,
    }),
    'source-org': Flags.requiredOrg({
      char: 's',
      summary: messages.getMessage('flags.source-org.summary'),
      description: messages.getMessage('flags.source-org.description'),
      required: true,
    }),
    'filter-value': Flags.string({
      char: 'x',
      summary: messages.getMessage('flags.filter-value.summary'),
      description: messages.getMessage('flags.filter-value.description'),
      required: false,
    }),
    'target-org': Flags.requiredOrg({
      char: 'o',
      summary: messages.getMessage('flags.target-org.summary'),
      description: messages.getMessage('flags.target-org.description'),
      required: true,
    }),
    'api-version': Flags.string({
      summary: messages.getMessage('flags.api-version.summary'),
      description: messages.getMessage('flags.api-version.description'),
    }),
  };

  private static validateFlags(
    definitionIdentifier: string | undefined,
    version: string | undefined,
    extendedDefinitionFile: string | undefined
  ): void {
    const hasIdentifier = Boolean(definitionIdentifier);
    const hasVersion = Boolean(version);
    const hasExtFile = Boolean(extendedDefinitionFile);

    if (!hasIdentifier && !hasVersion && !hasExtFile) {
      throw new Error(messages.getMessage('errors.missingFlags'));
    }

    if ((hasIdentifier || hasVersion) && hasExtFile) {
      throw new Error(messages.getMessage('errors.conflictingFlags'));
    }

    if (hasIdentifier && !hasVersion) {
      throw new Error(messages.getMessage('errors.missingVersion'));
    }

    if (!hasIdentifier && hasVersion) {
      throw new Error(messages.getMessage('errors.missingIdentifier'));
    }
  }

  private static mergeDefinitionAndData(
    definition: DefinitionFile,
    data: { metadata: Record<string, unknown>; objects: ExportEntity[] }
  ): MergedPayload {
    const defEntityMap = new Map<string, DefinitionEntity>();
    for (const entity of definition.objects.list) {
      defEntityMap.set(entity.objectName, entity);
    }

    const importSequence = definition.importSequence?.list ?? [];
    const metadata = data.metadata ?? {};

    const mergedEntities: MergedEntity[] = data.objects.map((dataEntity) => {
      const defEntity = defEntityMap.get(dataEntity.objectName);

      const header: MergedEntityHeader = {
        objectName: dataEntity.objectName,
        fields: defEntity?.fields ?? '',
        filterCriteria: defEntity?.filterCriteria ?? '',
        foreignKeys: defEntity?.foreignKeys?.list ?? [],
      };
      if (defEntity?.globalKeyField) {
        header.globalKeyField = defEntity.globalKeyField;
      }
      if (defEntity?.compositeKeys?.list) {
        header.compositeKeys = defEntity.compositeKeys.list;
      }

      const merged: MergedEntity = {
        header,
        objectName: dataEntity.objectName,
        records: dataEntity.records,
      };
      if (dataEntity.recordCount != null) {
        merged.recordCount = dataEntity.recordCount;
      }
      return merged;
    });

    return {
      importSequence,
      metadata,
      objects: mergedEntities,
    };
  }

  public async run(): Promise<SetupTransferResult> {
    const { flags } = await this.parse(SetupTransfer);

    const definitionIdentifier = flags['definition-identifier'];
    const version = flags['version'];
    const extendedDefinitionFile = flags['extended-definition-file'];
    const filterValue = flags['filter-value']
      ?.split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .join(',');

    SetupTransfer.validateFlags(definitionIdentifier, version, extendedDefinitionFile);

    const sourceOrg: Org = flags['source-org'];
    const sourceConnection: Connection = sourceOrg.getConnection(flags['api-version']);

    const targetOrg: Org = flags['target-org'];
    const targetConnection: Connection = targetOrg.getConnection(flags['api-version']);

    this.spinner.start(messages.getMessage('info.connecting'));

    try {
      // ── Step 1: Export from source org ──

      let exportPayload: Record<string, unknown>;
      let customDefinition: DefinitionFile | undefined;

      if (extendedDefinitionFile && !definitionIdentifier && !version) {
        this.spinner.status = messages.getMessage('info.readingDefinition');
        const fileContent = fs.readFileSync(extendedDefinitionFile, 'utf8');
        customDefinition = JSON.parse(fileContent) as DefinitionFile;
        exportPayload = { ...customDefinition } as Record<string, unknown>;

        if (filterValue) {
          exportPayload.filterValue = filterValue;
        }
      } else {
        exportPayload = {
          dataSetName: definitionIdentifier!,
          version: version!,
        };

        if (filterValue) {
          exportPayload.filterValue = filterValue;
        }
      }

      this.spinner.status = messages.getMessage('info.callingExportApi');
      const sourceApiVersion = sourceConnection.version;
      const exportApiPath = `/services/data/v${sourceApiVersion}/connect/industries/setup/dataset/actions/export`;
      const instanceUrl = sourceConnection.instanceUrl ?? '';
      const fullUrl = `${instanceUrl}${exportApiPath}`;

      const httpResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sourceConnection.accessToken ?? ''}`,
        },
        body: JSON.stringify(exportPayload),
      });

      const rawBody = await httpResponse.text();

      if (!httpResponse.ok) {
        throw new Error(`Export API returned ${httpResponse.status}: ${rawBody}`);
      }

      // eslint-disable-next-line no-control-regex
      const sanitizedBody = rawBody.replace(/[\x00-\x1F\x7F]/g, (ch) =>
        ch === '\n' || ch === '\r' || ch === '\t' ? ch : ''
      );

      const exportResponse = JSON.parse(sanitizedBody) as ExportResponse;

      const errors = exportResponse.errors as Array<{ message?: string }> | undefined;
      if (exportResponse.isSuccess === false) {
        const errorDetails = errors?.map((e) => e.message ?? JSON.stringify(e)).join('\n') ?? 'Unknown error';
        throw new Error(messages.getMessage('errors.exportFailed', [errorDetails]));
      }

      delete exportResponse.isSuccess;
      delete exportResponse.errors;

      this.log(messages.getMessage('info.exportSuccess'));

      // ── Step 2: Prepare import payload ──

      let importPayload: unknown;

      if (customDefinition) {
        this.spinner.status = messages.getMessage('info.merging');
        importPayload = SetupTransfer.mergeDefinitionAndData(customDefinition, exportResponse);
      } else {
        importPayload = exportResponse;
      }

      const payloadFilePath = path.resolve('tmp', 'setup-transfer-payload.json');
      fs.mkdirSync(path.dirname(payloadFilePath), { recursive: true });
      fs.writeFileSync(payloadFilePath, JSON.stringify(importPayload, null, 4), 'utf8');
      this.log(messages.getMessage('info.payloadFileSaved', [payloadFilePath]));

      // ── Step 3: Import to target org ──

      this.spinner.status = messages.getMessage('info.callingImportApi');
      const targetApiVersion = targetConnection.version;
      const importApiPath = `/services/data/v${targetApiVersion}/connect/industries/setup/dataset/actions/import`;
      const importResponse = await targetConnection.request<unknown>({
        method: 'POST',
        url: importApiPath,
        body: JSON.stringify(importPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.spinner.stop();
      this.log(messages.getMessage('info.success'));

      return {
        success: true,
        exportResponse,
        importResponse,
      };
    } catch (error) {
      this.spinner.stop();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(messages.getMessage('errors.transferFailed', [errorMessage]));
    }
  }
}