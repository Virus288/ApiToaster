type IUnifiactionKey = "method" | "body" | "queryParams" | "headers" | "ip" | "statusCode" | "occured";

export type IUnificationParams={
  files: string[];
  values:IUnifiactionKey[]
}

