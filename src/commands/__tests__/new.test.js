const _ = require('lodash');
const path = require('path');
const prompts = require('prompts');
const { writeFile } = require('fs/promises');
const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const New = require('../new');

jest.mock('prompts');
jest.mock('fs/promises');

beforeEach(() => {
  jest.spyOn(prompts, 'override')
    .mockImplementationOnce(prompts.mockResolvedValue);

  mockConsole(['info', 'warn', 'error']);

  spawk.clean();
  spawk.preventUnmatched();
});

afterEach(() => {
  spawk.done();
  jest.resetAllMocks();
});

describe('project settings', () => {
  describe('without cli arguments', () => {
    const originalPrompts = jest.requireActual('prompts');

    async function fetchAnswers() {
      return new Promise((resolve, reject) => {
        prompts.mockImplementationOnce(async (questions, { onCancel } = {}) => {
          // prompts() will mutate the questions, so we need to clone it to avoid side effects
          try {
            const answers = await originalPrompts(_.cloneDeep(questions), { onCancel });
            resolve(answers);
            onCancel();
          } catch (err) {
            reject(err);
          }
        });

        New();
      });
    }

    afterEach(() => {
      delete originalPrompts._injected;
    });

    test('asks for user input', async () => {
      const name = 'archonauts';
      const useTemplate = false;
      const docker = false;
      const environment = 'mainnet';

      originalPrompts.inject([name, useTemplate, docker, environment]);

      const answers = await fetchAnswers();
      expect(answers).toEqual({
        name,
        useTemplate,
        docker,
        environment,
      });
    });

    test('asks for template only when enabled', async () => {
      const useTemplate = true;
      const template = 'increment';

      originalPrompts.inject(['archonauts', useTemplate, template, false, 'local']);

      const answers = await fetchAnswers();
      expect(answers).toMatchObject({
        useTemplate,
        template,
      });
    });

    test('asks for network name only when environment is testnet', async () => {
      const environment = 'testnet';
      const testnet = 'titus';

      originalPrompts.inject(['archonauts', false, false, environment, testnet]);

      const answers = await fetchAnswers();
      expect(answers).toMatchObject({
        environment,
        testnet,
      });
    });
  });

  describe('with cli arguments', () => {
    test('overrides prompt with defaults', async () => {
      spawk.spawn('cargo');

      const name = 'archonauts';
      const options = {
        template: 'increment',
        docker: false,
        environment: 'testnet',
        testnet: 'titus',
      };

      await New(name, options);

      expect(prompts.override).toHaveBeenCalledWith({
        name,
        useTemplate: true,
        ...options
      });
    });
  });
});

describe('project structure', () => {
  test('calls cargo generate with proper arguments', async () => {
    const name = 'archonauts';

    const cargo = spawk.spawn('cargo');

    await New(name, {
      useTemplate: false,
      docker: false,
      environment: 'local',
    });

    expect(cargo.calledWith).toMatchObject({
      command: 'cargo',
      args: expect.arrayContaining([
        'generate',
        '--name', name,
        '--git', 'archway-network/archway-templates',
        '--branch', 'main',
        'default'
      ])
    });
  });

  test('generate project from network branch', async () => {
    const name = 'archonauts';
    const testnet = 'augusta';

    const cargo = spawk.spawn('cargo');

    await New(name, {
      useTemplate: false,
      docker: false,
      environment: 'testnet',
      testnet,
    });

    expect(cargo.calledWith).toMatchObject({
      args: expect.arrayContaining([
        '--branch', `network/${testnet}`
      ])
    });
  });

  test('generate project from selected template subfolder', async () => {
    const name = 'archonauts';
    const template = 'increment';
    const cargo = spawk.spawn('cargo', args => _.last(args) === template);

    await New(name, {
      template,
      docker: false,
      environment: 'local',
    });

    expect(cargo.called).toBeTruthy();
  });

  test('do initial git commit', async () => {
    const name = 'archonauts';

    spawk.spawn('cargo');
    const gitAdd = spawk.spawn('git', args => args.includes('add'));
    const gitCommit = spawk.spawn('git', args => args.includes('commit'));

    await New(name, {
      useTemplate: false,
      docker: false,
      environment: 'local',
    });

    expect(gitAdd.calledWith).toMatchObject({
      args: ['-C', name, 'add', '-A']
    });

    expect(gitCommit.calledWith).toMatchObject({
      args: ['-C', name, 'commit', '-m', 'Initialized with archway-cli']
    });
  });
});

describe('config file', () => {
  beforeEach(() => {
    spawk.spawn('cargo');
  });

  test('is saved in the project root folder', async () => {
    const name = 'archonauts';

    await New(name, {
      useTemplate: false,
      docker: true,
      environment: 'testnet',
      testnet: 'constantine',
    });

    expect(writeFile).toHaveBeenCalledWith(
      path.join(name, 'config.json'),
      expect.any(String)
    );
  });

  test('contains project data', async () => {
    expect.hasAssertions();

    const name = 'archonauts';
    const docker = true;

    writeFile.mockImplementationOnce((_path, configFile) => {
      const config = JSON.parse(configFile);
      expect(config).toMatchObject({
        name,
        developer: {
          archwayd: { docker }
        }
      });
    });

    await New(name, {
      useTemplate: false,
      docker,
      environment: 'testnet',
      testnet: 'constantine',
    });
  });

  test('contains network information', async () => {
    expect.hasAssertions();

    const environment = 'testnet';
    const testnet = 'constantine';

    writeFile.mockImplementationOnce((_path, configFile) => {
      const config = JSON.parse(configFile);
      expect(config).toMatchObject({
        network: {
          type: environment,
          name: testnet,
          chainId: 'constantine-1',
          fees: {
            feeDenom: 'uconst'
          }
        }
      });
    });

    await New('archonauts', {
      useTemplate: false,
      docker: false,
      environment,
      testnet,
    });
  });
});
