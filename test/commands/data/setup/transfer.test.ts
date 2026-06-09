import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { TestContext, MockTestOrgData } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import SetupTransfer from '../../../../src/commands/data/setup/transfer.js';

describe('data setup transfer', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;

  const mockSourceOrg = new MockTestOrgData();
  const mockTargetOrg = new MockTestOrgData();

  const mockExportResponse = {
    isSuccess: true,
    metadata: {
      dataSetName: 'testDefinition',
      version: '1.0.0',
    },
    objects: [
      {
        objectName: 'Account',
        recordCount: 2,
        records: [
          { Id: '001xx000000001', Name: 'Test Account 1' },
          { Id: '001xx000000002', Name: 'Test Account 2' },
        ],
      },
    ],
  };

  const mockImportResponse = {
    isSuccess: true,
    message: 'Import completed successfully',
  };

  beforeEach(async () => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
    await $$.stubAuths(mockSourceOrg, mockTargetOrg);

    $$.fakeConnectionRequest = (request) => {
      if (typeof request === 'string' || (request as { url: string }).url.includes('/export')) {
        return Promise.resolve(mockExportResponse);
      }
      return Promise.resolve(mockImportResponse);
    };
  });

  afterEach(() => {
    $$.restore();
  });

  describe('flag validation', () => {
    it('throws error when no flags are provided', async () => {
      try {
        await SetupTransfer.run(['--source-org', 'source@test.org', '--target-org', 'target@test.org']);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).to.include('must provide either');
      }
    });

    it('throws error when definition-identifier provided without version', async () => {
      try {
        await SetupTransfer.run([
          '--definition-identifier',
          'testDefinition',
          '--source-org',
          'source@test.org',
          '--target-org',
          'target@test.org',
        ]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).to.include('version is also required');
      }
    });

    it('throws error when version provided without definition-identifier', async () => {
      try {
        await SetupTransfer.run([
          '--version',
          '1.0.0',
          '--source-org',
          'source@test.org',
          '--target-org',
          'target@test.org',
        ]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).to.include('definition-identifier is also required');
      }
    });

    it('throws error when both standard and custom definition flags are provided', async () => {
      const tmpDefFile = path.join(os.tmpdir(), `test-definition-${Date.now()}.json`);
      fs.writeFileSync(tmpDefFile, '{}', 'utf8');

      try {
        await SetupTransfer.run([
          '--definition-identifier',
          'testDefinition',
          '--version',
          '1.0.0',
          '--extended-definition-file',
          tmpDefFile,
          '--source-org',
          'source@test.org',
          '--target-org',
          'target@test.org',
        ]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).to.include('Cannot use');
      } finally {
        fs.rmSync(tmpDefFile, { force: true });
      }
    });
  });

  describe('standard definition mode', () => {
    it('successfully transfers data using standard definition', async () => {
      const result = await SetupTransfer.run([
        '--definition-identifier',
        'testDefinition',
        '--version',
        '1.0.0',
        '--source-org',
        'source@test.org',
        '--target-org',
        'target@test.org',
        '--json',
      ]);

      expect(result.success).to.be.true;
      expect(result.exportResponse).to.deep.include({
        metadata: mockExportResponse.metadata,
        objects: mockExportResponse.objects,
      });
      expect(result.importResponse).to.exist;
    });

    it('logs success messages during transfer', async () => {
      await SetupTransfer.run([
        '--definition-identifier',
        'testDefinition',
        '--version',
        '1.0.0',
        '--source-org',
        'source@test.org',
        '--target-org',
        'target@test.org',
      ]);

      const output = sfCommandStubs.log
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');

      expect(output).to.include('Export from source org completed successfully');
      expect(output).to.include('Setup transfer completed successfully');
      expect(output).to.include('Payload file saved to');
    });
  });

  describe('error handling', () => {
    it('throws error when export API returns error', async () => {
      $$.fakeConnectionRequest = (request) => {
        if (typeof request === 'string' || (request as { url: string }).url.includes('/export')) {
          return Promise.resolve({
            isSuccess: false,
            errors: [{ message: 'Invalid definition identifier' }],
          });
        }
        return Promise.resolve(mockImportResponse);
      };

      try {
        await SetupTransfer.run([
          '--definition-identifier',
          'invalidDefinition',
          '--version',
          '1.0.0',
          '--source-org',
          'source@test.org',
          '--target-org',
          'target@test.org',
        ]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).to.include('Export failed');
        expect((error as Error).message).to.include('Invalid definition identifier');
      }
    });

    it('throws error when export API request fails', async () => {
      $$.fakeConnectionRequest = (request) => {
        if (typeof request === 'string' || (request as { url: string }).url.includes('/export')) {
          return Promise.reject(new Error('REQUEST_FAILED: Bad Request'));
        }
        return Promise.resolve(mockImportResponse);
      };

      try {
        await SetupTransfer.run([
          '--definition-identifier',
          'testDefinition',
          '--version',
          '1.0.0',
          '--source-org',
          'source@test.org',
          '--target-org',
          'target@test.org',
        ]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).to.include('REQUEST_FAILED');
      }
    });
  });

  describe('API version handling', () => {
    it('uses specified api-version flag', async () => {
      await SetupTransfer.run([
        '--definition-identifier',
        'testDefinition',
        '--version',
        '1.0.0',
        '--source-org',
        'source@test.org',
        '--target-org',
        'target@test.org',
        '--api-version',
        '60.0',
        '--json',
      ]);

      // Test passes if no error is thrown with api-version flag
      const output = sfCommandStubs.log
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');

      expect(output).to.include('Setup transfer completed successfully');
    });
  });
});
