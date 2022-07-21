import { InstanceOptions, IOContext, ExternalClient } from '@vtex/api'

interface ISendingPoints {
  userID: string;
  points: number ;
}
export class PointsClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('https://gs9vut5z2m.execute-api.sa-east-1.amazonaws.com', ctx, {
      ...options,
      headers:{
        Accept:"application/json",
        "Content-Type":"application/json",
        "X-Vtex-Use-Https" : "true",
      }
    })
  }

  public async sendingPoints(data: ISendingPoints) {
    return this.http.post('points', data);
  }
}
