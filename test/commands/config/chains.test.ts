import { expect, test } from '@oclif/test';
import sinon, { SinonStub, SinonSpy } from 'sinon';
import fs from 'node:fs/promises';

import ConfigChains from '../../../src/commands/config/chains';
import { configString } from '../../mocks/configFile';
import { chainString } from '../../mocks/chainFile';

const expectHelp = (ctx: any) => {
  expect(ctx.stdout).to.contain('Description:');
  expect(ctx.stdout).to.contain('USAGE');
  expect(ctx.stdout).to.contain('Available commands:');
  expect(ctx.stdout).to.contain(ConfigChains.summary.split('.')[0]);
};

describe('config chains', () => {
  let accessStub: SinonStub;
  let writeStub: SinonStub;
  let readStub: SinonStub;
  let mkdirStub: SinonSpy;
  let readdirStub: SinonSpy;

  before(() => {
    accessStub = sinon.stub(fs, 'access').rejects();
    writeStub = sinon.stub(fs, 'writeFile');
    readStub = sinon.stub(fs, 'readFile').callsFake(async () => configString);
    mkdirStub = sinon.stub(fs, 'mkdir');
    readdirStub = sinon.stub(fs, 'readdir');
  });

  after(() => {
    accessStub.restore();
    writeStub.restore();
    readStub.restore();
    mkdirStub.restore();
    readdirStub.restore();
  });

  describe('import', () => {
    before(() => {
      readStub.restore();
      readStub = sinon.stub(fs, 'readFile').callsFake(async () => chainString);
    });

    after(() => {
      readStub.restore();
      readStub = sinon.stub(fs, 'readFile').callsFake(async () => configString);
    });

    test
      .stdout()
      .command(['config chains import', 'constantine-2'])
      .it('imports chain and writes file', ctx => {
        expect(ctx.stdout).to.contain('Imported chain');
        expect(writeStub.called).to.be.true;
      });

    test
      .stderr()
      .command(['config chains import'])
      .catch(/(Please specify the file)/)
      .it('fails on missing filename');

    test
      .stderr()
      .command(['config chains import', 'constantine-2', '"{}"'])
      .catch(/(Please specify only one file to import)/)
      .it('fails on double input');
  });

  describe('export', () => {
    test
      .stdout()
      .command(['config chains export', 'constantine-2'])
      .it('exports chain to file', ctx => {
        expect(ctx.stdout).to.contain('Exported chain to');
        expect(writeStub.called).to.be.true;
      });
  });

  describe('use', () => {
    test
      .stdout()
      .command(['config chains use', '--chain=constantine-2'])
      .it('updates config file to use chain', ctx => {
        expect(ctx.stdout).to.contain('Switched chain to');
        expect(writeStub.called).to.be.true;
      });
  });

  describe('help', () => {
    test.stdout().command(['config chains']).it('shows the config help when no other arguments', expectHelp);

    test.stdout().command(['config chains', '--help']).it('shows the config help when the flag is set', expectHelp);
  });
});
