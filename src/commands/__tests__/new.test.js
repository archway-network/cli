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
  jest.clearAllMocks();
});

describe('project settings', () => {
  describe('without cli arguments', () => {
    const originalPrompts = jest.requireActual('prompts');

    function fetchAnswers() {
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

describe('project setup', () => {
  test('calls cargo generate with proper arguments', async () => {
    const name = 'archonauts';

    const cargo = spawk.spawn('cargo');

    await New(name, {
      useTemplate: false,
      docker: false,
      environment: 'local',
      build: false,
    });

    expect(cargo.calledWith).toMatchObject({
      command: 'cargo',
      args: expect.arrayContaining([
        'generate',
        '--name', name,
        '--git', 'https://github.com/archway-network/archway-templates',
        '--branch', 'main',
        'default'
      ])
    });
  });

  test('converts snake case project name to lowercased kebab-case', async () => {
    const name = {
      raw: 'archonauts_snake_case',
      normalized: 'archonauts-snake-case'
    };

    const cargo = spawk.spawn('cargo');

    await New(name.raw, {
      useTemplate: false,
      docker: false,
      environment: 'local',
      build: false,
    });

    expect(cargo.calledWith).toMatchObject({
      command: 'cargo',
      args: expect.arrayContaining([
        'generate',
        '--name', name.normalized,
        '--git', 'https://github.com/archway-network/archway-templates',
        '--branch', 'main',
        'default'
      ])
    });
  });

  test('converts camel case project name to lowercased kebab-case', async () => {
    const name = {
      raw: 'archonautsCamelCase',
      normalized: 'archonautscamelcase'
    };

    const cargo = spawk.spawn('cargo');

    await New(name.raw, {
      useTemplate: false,
      docker: false,
      environment: 'local',
      build: false,
    });

    expect(cargo.calledWith).toMatchObject({
      command: 'cargo',
      args: expect.arrayContaining([
        'generate',
        '--name', name.normalized,
        '--git', 'https://github.com/archway-network/archway-templates',
        '--branch', 'main',
        'default'
      ])
    });
  });

  test('converts whitespaced project names to lowercased kebab-case', async () => {
    const name = {
      raw: 'archonauts string case',
      normalized: 'archonauts-string-case'
    };

    const cargo = spawk.spawn('cargo');

    await New(name.raw, {
      useTemplate: false,
      docker: false,
      environment: 'local',
      build: false,
    });

    expect(cargo.calledWith).toMatchObject({
      command: 'cargo',
      args: expect.arrayContaining([
        'generate',
        '--name', name.normalized,
        '--git', 'https://github.com/archway-network/archway-templates',
        '--branch', 'main',
        'default'
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
      build: false,
    });

    expect(cargo.called).toBeTruthy();
  });

  test('calls cargo build only when flag is set', async () => {
    const name = 'archonauts';

    spawk.spawn('cargo', _.includes('generate'));
    const cargoBuild = spawk.spawn('cargo', ['build']);

    await New(name, {
      useTemplate: false,
      docker: false,
      environment: 'local',
      build: true,
    });

    expect(cargoBuild.calledWith).toMatchObject({
      command: 'cargo',
      args: ['build'],
      options: expect.objectContaining({
        cwd: path.join(process.cwd(), name),
      })
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
      build: false,
    });

    expect(writeFile).toHaveBeenCalledWith(
      path.join(name, 'config.json'),
      expect.any(String)
    );
  });

  test('contains project data', async () => {
    const name = 'archonauts';
    const docker = true;

    let config = {};
    writeFile.mockImplementationOnce((_path, configFile) => {
      config = JSON.parse(configFile);
    });

    await New(name, {
      useTemplate: false,
      docker,
      environment: 'testnet',
      testnet: 'constantine',
      build: false,
    });

    expect(config).toMatchObject({
      name,
      developer: {
        archwayd: { docker },
        scripts: expect.objectContaining({
          test: expect.any(String),
          build: expect.any(String),
        }),
        deployments: []
      }
    });
  });

  test('contains network information', async () => {
    const environment = 'testnet';
    const testnet = 'constantine';

    let config = {};
    writeFile.mockImplementationOnce((_path, configFile) => {
      config = JSON.parse(configFile);
    });

    await New('archonauts', {
      useTemplate: false,
      docker: false,
      environment,
      testnet,
      build: false,
    });

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
});
