import { Deployment } from '../types/Deployment';

export class Deployments {
  private _data: Deployment[];

  constructor(data: Deployment[]) {
    this._data = data;
  }

  get data(): Deployment[] {
    return this._data;
  }

  static init(data: Deployment[]): Deployments {
    return new Deployments(data);
  }

  // to do: Add logic to read data from real files
  static async open(): Promise<Deployments> {
    return new Deployments([{ chainId: 'test1' }, { chainId: 'test2' }]);
  }
}
