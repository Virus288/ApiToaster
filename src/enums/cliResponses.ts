// eslint-disable-next-line import/prefer-default-export
export enum ECliResponses {
  Default = `
  No params provided. Use --help to find available commands`,
  Help = `
  ApiToaster - tools for analyzing api request
  Usage: npx api-toaster [param]
  Params:
   - time-travel: Tests already received requests, by sending them again to your server
   - decode: Decode saved logs to readable json format
   - find: Find requests in logs`,
  TimeTravelUnknownCommand = `
  Available parameters for time-travel:
   -p filename : provide filename to run command on.`,
  TimeTravelHelp = `
  Time-Travel is command, which allows your server to receive saved requests again. This command will read saved logs and send them in synchronous queue
  This command requires your server to be running. Make sure that toaster config file exists or flag with server's port is provided.
  Example usage: 'npx apiToaster time-travel'. This command will load latest file with logs. Files are rotatet based on hardcodded amout of requests.
  You can also specify, what file should be used in testing: 'npx apiToaster time-travel -p logs_1.json'
  Or if you need specific data, you can filter by:
   - json: 'npx apiToaster time-travel -j {"name": "jakob"}'. This will search for requests, which include those elements in body
   - client ip 'npx apiToaster time-travel -ip 192.168.1.100'. Only supported, when storing client's ip is specified in middleware's config. By default for privacy reasons, its disabled.
   - keys 'npx apiToaster time-travel -k password city name'. This will search for requests, which include those keys in body. Usefull if your body has dynamic data
   - value 'npx apiToaster time-travel -v value1 value2 value3'. This will search for requests, which include those values in body.`,
  FindHelp = `
  Find is command, which allows you to decode locally saved files to readable format ( jsoon )
  This command requires your server to be running. Make sure that toaster config file exists or flag with server's port is provided.
  Example usage: 'npx api-toaster find [params...]'.
  You can also specify, what file should be used: 'npx apiToaster find -p logs_1.json'
  Or if you need specific data, you can filter by:
   - json: 'npx apiToaster find -j {"name": "jakob"}'. This will search for requests, which include those elements in body
   - client ip 'npx apiToaster find -ip 192.168.1.100'. Only supported, when storing client's ip is specified in middleware's config. By default for privacy reasons, its disabled.
   - keys 'npx apiToaster find -k password city name'. This will search for requests, which include those keys in body. Usefull if your body has dynamic data
   - value 'npx apiToaster find -v value1 value2 value3'. This will search for requests, which include those values in body.`,
  DecodeUnknownCommand = `
  Available parameters for decode:
   -p filename : provide filename to decode.`,
  DecodeHelp = `
  Decode is command, which is used to decode log files into readable format.
  Example usage: 'npx api-toaster decode [params....]'.
  By default, decode will decode only latest log file. You can change this behaviour, by providing files:
  npx api-toaster decode -p log_1.json`,
}
