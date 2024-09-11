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
