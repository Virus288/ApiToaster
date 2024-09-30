export interface IToasterTimeTravel {
  waitUntillNextReq?: number;
  inputBeforeNextReq?: boolean;
  port: number;
  path?: string;
  countTime?: boolean
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
  body?: string
  headers?: Record<string, string>;
}
