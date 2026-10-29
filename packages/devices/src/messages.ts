/** Explicit system messages only. This module has no runtime or Node dependencies. */
export const DEVICE_SOURCE_MESSAGES = {
 "device.debug.001": "控制器返回格式异常",
 "device.debug.002": "控制器回显与请求不一致",
 "device.debug.003": "控制器未确认操作成功",
 "device.debug.004": "舵机准备任务尚未停止，请稍后再试",
 "device.debug.005": "MCU 反馈已过期，请检查主控连接",
 "device.debug.006": "MCU 尚未进入单舵机模式",
 "device.debug.007": "舵机读写回执编号或结果不匹配",
 "device.debug.008": "PING 未收到可靠回执，请重新扫描",
 "device.debug.009": "PING 回执不匹配",
 "device.debug.010": "舵机参数读回不完整",
 "device.debug.011": "改号后的参数或旧编号缺席校验未通过",
 "device.debug.012": "改号尚未完成读回复核",
 "device.debug.013": "没有可用的临时编号，未继续交换",
 "device.debug.unknown_action": "未知调试操作",
 "device.debug.015": "微动步幅不能为零",
 "device.debug.016": "请选择要改号的舵机",
 "device.debug.017": "改号计划格式不对",
 "device.debug.018": "原编号或目标编号重复",
 "device.debug.019": "控制模式不对",
 "device.debug.020": "缺少控制输入",
 "device.debug.021": "轮滑开关格式不对",
 "device.debug.022": "缺少滤波参数",
 "device.debug.023": "保护开关和电流阈值请分别写入",
 "device.debug.024": "保护开关格式不对",
 "device.debug.025": "该编号没有对应的校准关节",
 "device.debug.026": "调试窗口已停止",
 "device.debug.027": "请先停止扫描",
 "device.debug.028": "单舵机读取已暂停",
 "device.debug.029": "请先选择控制模式或开始校准",
 "device.debug.030": "控制反馈尚未就绪；请检查 IMU 与 MCU",
 "device.debug.031": "请先开始校准",
 "device.debug.032": "中位保持回执不匹配",
 "device.debug.033": "目标编号已在线，请使用编号互换",
 "device.debug.034": "写入结果尚未读回复核",
 "device.debug.035": "参数读回不一致",
 "device.debug.036": "KP/KD 读回与请求不一致",
 "device.debug.037": "写入未确认，请重新读取",
 "device.debug.039": "保护广播回执不匹配",
 "device.debug.040": "单次目标变化不能超过10单位，请根据最新读回位置微调",
 "device.debug.041": "微动目标超出编码器范围",
 "device.debug.042": "操作未执行",
 "device.setup.001": "运行端返回格式异常。",
 "device.setup.002": "请选择清单里的舵机编号。",
 "device.setup.003": "无法匹配运行端配置档。请核对 Duck OS 与舵机设置页面，当前保持只读。",
 "device.setup.004": "板子未处于卸载状态。请先在运行端停止运动并卸载，再开始编号。",
 "device.setup.005": "没有新鲜的 MCU 反馈，请检查扩展板与运行应用。",
 "device.setup.006": "已暂停。再次开始时会先读回设备状态。",
 "device.setup.007": "舵机准备已关闭。",
 "device.setup.008": "参数与配置档不一致",
 "device.setup.009": "原编号仍有响应，需复核当前连接",
 "device.setup.ready": "已读取当前在线舵机，配置时只连接一只。",
 "device.setup.011": "请等当前配置结束后再修正参数。",
 "device.setup.012": "修正参数时请只连接所选的这一只舵机。",
 "device.setup.013": "舵机回复未通过校验，请保持单只连接后重新检测。",
 "device.setup.014": "MCU 未确认舵机调试模式，请检查反馈后再试。",
 "device.setup.015": "未发现舵机。请检查供电和单只舵机的连接。",
 "device.setup.016": "这个目标已有配置记录，请先接回对应舵机只读复核。",
 "device.setup.017": "十五个编号都已有记录，请接回对应舵机复核。",
 "device.setup.018": "读取完成，保持舵机卸载",
 "device.setup.019": "写入匹配运行端的 KP / KD",
 "device.setup.020": "设置目标编号",
 "device.setup.021": "目标编号已占用，请只保留当前舵机后重新检测。",
 "device.setup.022": "读回参数，复核新旧编号",
 "device.setup.023": "参数或新旧编号读回不一致。这只仍待复核，再次开始时只修正不一致的项目。",
 "device.setup.024": "请直接为下一只开始配置。",
 "device.setup.025": "这个编号已有记录，请接回对应舵机核查。",
 "device.setup.026": "请等本只配置结束后再请求停机。",
 "device.setup.027": "停机命令已发送。等待至少 15 秒并确认停止，再断开 USB 和电池后换接舵机。",
 "device.runtime.001": "没有找到 ADB。请先安装 Arduino App Lab，完成 UNO Q 的首次设置。",
 "device.runtime.002": "ADB 未连接到 UNO Q，请检查 USB 线和板卡供电。",
 "device.runtime.003": "USB 连接没有响应，请重新插接 UNO Q。",
 "device.runtime.004": "请只连接一块 UNO Q。",
 "device.runtime.005": "尚未发现 UNO Q，请连接 USB 并等待板子启动。",
 "device.runtime.006": "无法建立 UNO Q 的本机连接。",
 "device.runtime.007": "运行端拒绝了当前操作，请重新检测连接与参数。",
 "device.runtime.008": "UNO Q 或运行应用暂未就绪，正在等待重新连接。",
 "device.runtime.009": "无法确认板卡身份，未发送停机命令。",
 "device.preparation.001": "请选择有效且不重复的舵机编号。",
 "device.preparation.002": "取件状态不正确。",
 "device.preparation.003": "预接线记录不正确。",
 "device.preparation.004": "线材规格尚未核定，不能记为已备好。",
 "device.preparation.005": "没有要保存的取件或预接线记录。",
 "device.diagnostic": "设备操作未完成：{detail}",
 "device.debug.integer": "{name} 需要 {low}–{high} 的整数",
 "device.debug.range": "{name} 超出范围 {low}–{high}",
 "device.debug.vector": "{name} 格式不对",
 "device.debug.no_response": "控制器无响应；写入结果请重新读回复核",
 "device.debug.occupied": "ID{id} 已被其他在线舵机使用",
 "device.debug.stopped_remap": "{detail}；已停止，请重新扫描并复核当前编号",
 "device.debug.not_retried": "{detail}；未自动重试，请重新读取",
 "device.setup.scan": "扫描编号 {id} / 253",
 "device.setup.multiple": "检测到多个编号 [{ids}]。断开 USB 和电池后，只保留一只舵机。",
 "device.setup.pending": "上一只的写入结果待复核。请先接回 ID{sourceId} 或 ID{id} 的那只舵机。",
 "device.setup.assigned": "当前接着已编号 ID{id}，请接回所选舵机或换一只未编号舵机。",
 "device.setup.success": "ID{id} 的编号与参数已读回验证。请给实物贴上编号。",
 "device.field.id": "编号",
 "device.field.new_id": "新编号",
 "device.field.target_position": "目标位置",
 "device.field.jog_step": "微动步幅",
 "device.field.source_id": "原编号",
 "device.field.target_id": "目标编号",
 "device.field.motion": "运动输入",
 "device.field.head": "头颈输入",
 "device.field.mouth": "鸭嘴角度",
 "device.field.action_scale": "动作幅度",
 "device.field.gyro_alpha": "角速度平滑",
 "device.field.gravity_tau": "重力滤波",
 "device.field.current": "电流阈值",
 "device.access.debug_local": "请在连接 UNO Q 的这台电脑上打开调试鸭。",
 "device.access.debug_origin": "请从本机调试鸭执行操作。",
 "device.access.preparation_local": "请在本机组装台记录取件。",
 "device.access.preparation_origin": "请从本机组装台记录取件。",
 "device.access.setup_local": "请在连接 UNO Q 的这台电脑上打开组装台。",
 "device.access.setup_origin": "请从本机组装台执行此操作。"
} as const;
export type DeviceMessageCode=keyof typeof DEVICE_SOURCE_MESSAGES;
export interface DeviceDescriptor {code:DeviceMessageCode;params:Record<string,unknown>;}
export interface DeviceMessage extends DeviceDescriptor {text:string;}
function descriptor(value:unknown):DeviceDescriptor|undefined {
 if(value&&typeof value==='object'){
  const messageCode=Reflect.get(value,'messageCode');
  const preferred=typeof messageCode==='string'&&Object.hasOwn(DEVICE_SOURCE_MESSAGES,messageCode);
  const code=preferred?messageCode:Reflect.get(value,'code'),params=Reflect.get(value,preferred?'messageParams':'params');
  if(typeof code==='string'&&Object.hasOwn(DEVICE_SOURCE_MESSAGES,code))return {code:code as DeviceMessageCode,params:params&&typeof params==='object'?params:{}};
 }
 return undefined;
}
function sourceValue(value:unknown):string {
 const nested=descriptor(value);if(nested)return deviceMessage(nested.code,nested.params).text;
 if(typeof value==='string'&&value.startsWith('device.field.')&&Object.hasOwn(DEVICE_SOURCE_MESSAGES,value))return DEVICE_SOURCE_MESSAGES[value as DeviceMessageCode];
 return String(value);
}
export function deviceMessage(code:DeviceMessageCode,params:Record<string,unknown>={}):DeviceMessage {
 const text=DEVICE_SOURCE_MESSAGES[code].replace(/\{(\w+)\}/g,(token,name:string)=>Object.hasOwn(params,name)?sourceValue(params[name]):token);
 return {text,code,params};
}
/** Known descriptors pass through; unknown technical diagnostics are retained as data. */
export function deviceFailure(error:unknown,fallback:DeviceMessageCode='device.diagnostic'):DeviceMessage {
 const text=error instanceof Error?error.message:String(error),known=descriptor(error);
 if(known)return {...known,text};
 if(!text&&fallback!=='device.diagnostic')return deviceMessage(fallback);
 return {text,code:'device.diagnostic',params:{detail:text}};
}
export const reviewDescriptor=(notice:DeviceMessage)=>({reviewReason:notice.text,reviewReasonCode:notice.code,reviewReasonParams:notice.params});
