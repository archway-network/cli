import { expect, test } from '@oclif/test';
import sinon, { SinonStub } from 'sinon';
import fs from 'node:fs/promises';
import { expectOutputJSON } from '../../helpers/expect';
import { noDeploymentsMessage } from '../../../src/domain/Deployments';
import * as filesystem from '../../../src/utils/filesystem';
import { deploymentFile, deploymentString } from '../../mocks/deploymentsFile';

describe('config deployments', () => {
  let readStub: SinonStub;
  let readdirStub: SinonStub;

  describe('successful', () => {
    let readFilesStub: SinonStub;

    before(() => {
      readStub = sinon.stub(fs, 'readFile').callsFake(async () => '{}');
      readdirStub = sinon.stub(fs, 'readdir');
      readFilesStub = sinon.stub(filesystem, 'readFilesFromDirectory').callsFake(async () => ({ foo: deploymentString }));
    });

    after(() => {
      readStub.restore();
      readdirStub.restore();
      readFilesStub.restore();
    });

    test
      .stdout()
      .command(['config deployments'])
      .it('shows deployments', ctx => {
        expect(ctx.stdout).to.contain('Deployments on');
        expect(ctx.stdout).to.contain(deploymentFile.deployments[0].contract.name);
        expect(ctx.stdout).to.contain(deploymentFile.deployments[0].contract.version);
      });

    test
      .stdout()
      .command(['config deployments', '--action=premium'])
      .it('filters out deployments by action', ctx => {
        expect(ctx.stdout).to.contain(noDeploymentsMessage);
      });

    test.stdout().command(['config deployments', '--json']).it('shows a JSON representation of the deployments', expectOutputJSON);
  });

  describe('no deployments', () => {
    before(() => {
      readStub = sinon.stub(fs, 'readFile').callsFake(async () => '{}');
      readdirStub = sinon.stub(fs, 'readdir');
    });

    after(() => {
      readStub.restore();
      readdirStub.restore();
    });
    test
      .stdout()
      .command(['config deployments'])
      .it('shows no deployments', ctx => {
        expect(ctx.stdout).to.contain(noDeploymentsMessage);
      });
  });
});
