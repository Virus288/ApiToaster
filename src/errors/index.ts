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

export class MissingCoreStructureError extends FullError {
  constructor() {
    super('MissingCoreStructureError');
    this.message = 'Missing core folder structure. Possibly it was removed, or misplaced ?';
    this.name = 'MissingCoreStructureError';
    this.code = '004';
  }
}

export class NoSavedLogsError extends FullError {
  constructor() {
    super('NoSavedLogsError');
    this.message = 'Looks like you have no saved requests.';
    this.name = 'NoSavedLogsError';
    this.code = '005';
  }
}

export class MalformedLogFilesError extends FullError {
  constructor(fileName: string) {
    super('MalformedLogFilesError');
    this.message = `Log file ${fileName} seems to be malformed`;
    this.name = 'MalformedLogFilesError';
    this.code = '006';
  }
}

export class MissingProtoConfigError extends FullError {
  constructor() {
    super('MissingProtoConfigError');
    this.message =
      'Cannot find protobuff config. If you see this error while using cli / middleware and not working on this package, reinstall it. If problem still persists, report an issue';
    this.name = 'MissingProtoConfigError';
    this.code = '007';
  }
}

export class ApplyingDefaultsError extends FullError {
  constructor() {
    super('ApplyingDefaultsError');
    this.message =
      'Could not apply defaults. If you see this error check for malformed logs because one of the fields are incorrect.';
    this.name = 'ApplyingDefaultsError';
    this.code = '008';
  }
}
