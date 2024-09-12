// eslint-disable-next-line max-classes-per-file
export class FullError extends Error {
  code = '000';
}

export class CannotCreateFile extends FullError {
  constructor(target: string) {
    super('CannotCreateFile');
    this.message = `Cannot create ${target}`;
    this.name = 'CannotCreateFile';
    this.code = '001';
  }
}

export class MissingArgError extends FullError {
  constructor(param: string) {
    super('MissingArgError');
    this.message = `Missing param: ${param}`;
    this.name = 'MissingArgError';
    this.code = '002';
  }
}

export class IncorrectArgTypeError extends FullError {
  constructor(err: string) {
    super('IncorrectArgTypeError');
    this.message = err;
    this.name = 'IncorrectArgTypeError';
    this.code = '003';
  }
}
