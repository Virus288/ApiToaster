export interface IToasterTimeTravel {
  port: number;
  path?: string;
}

export interface ITimeTravelStats {
  failed: {
    amount: number;
    ids: string[];
  };
  succeeded: {
    amount: number;
    ids: string[];
  };
}
export interface ITimeTravelReq {
  method: string;
  body?:string
  headers?: Record<string, string>;
}
