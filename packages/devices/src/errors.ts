import {deviceFailure} from './messages.js';
import type {DeviceMessage} from './messages.js';
export class SetupError extends Error {
  readonly code='request.invalid';readonly params:Record<string,unknown>={};
  readonly messageCode:string;readonly messageParams:Record<string,unknown>;
  constructor(value:string|DeviceMessage,options?:ErrorOptions){
    const notice=typeof value==='string'?deviceFailure(new Error(value)):value;
    super(notice.text,options);this.messageCode=notice.code;this.messageParams=notice.params;
  }
}
export class Offline extends SetupError {}
export class Cancelled extends SetupError {}

export class DebugError extends Error {
  readonly code:string;readonly params:Record<string,unknown>;
  constructor(value:string|DeviceMessage,readonly details:Record<string,unknown>={}){
    const notice=typeof value==='string'?deviceFailure(new Error(value)):value;
    super(notice.text);this.code=notice.code;this.params=notice.params;
  }
}
