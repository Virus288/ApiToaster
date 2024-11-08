import Log from '../../tools/logger.js';
import type express from 'express';
import type { Send } from 'express';

export default class CodeSaver {
  init(res: express.Response): void {
    Log.debug('Code saver', 'Initing');
    this.overwriteSend(res);
  }

  private overwriteSend(res: express.Response): void {
    Log.debug('Code saver', 'Overwriting send method');
    const { send } = res;
    const orginalSend = send;
    res.send = function (body?) {
      Log.log('Code saver', res.statusCode);
      return orginalSend.call(res, body);
    } as Send;
  }
}
