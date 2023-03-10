import {expect, test} from '@oclif/test'

describe('config:chains', () => {
  test
  .stdout()
  .command(['config:chains'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['config:chains', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
