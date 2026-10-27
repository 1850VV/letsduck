// Transitional snapshots are checked against the legacy entries until those move.
export const servoMap = {
  "version": "tutorial-reference-1",
  "bindings": [
    {
      "id": 10,
      "actorId": "t_motor20",
      "role": "左髋旋转",
      "status": "reference",
      "installedAt": "t-yaw-l"
    },
    {
      "id": 11,
      "actorId": "t_motor21",
      "role": "左髋侧摆",
      "status": "reference",
      "installedAt": "t-motor-l"
    },
    {
      "id": 12,
      "actorId": "l_upperMotor",
      "role": "左腿上端",
      "status": "reference",
      "installedAt": "l-leg-done"
    },
    {
      "id": 13,
      "actorId": "l_lowerMotor",
      "role": "左腿中部",
      "status": "reference",
      "installedAt": "l-leg-done"
    },
    {
      "id": 14,
      "actorId": "l_motor",
      "role": "左脚踝",
      "status": "reference",
      "installedAt": "l-tighten"
    },
    {
      "id": 20,
      "actorId": "t_motor10",
      "role": "右髋旋转",
      "status": "reference",
      "installedAt": "t-yaw-l"
    },
    {
      "id": 21,
      "actorId": "t_motor11",
      "role": "右髋侧摆",
      "status": "reference",
      "installedAt": "t-motor-r"
    },
    {
      "id": 22,
      "actorId": "r_upperMotor",
      "role": "右腿上端",
      "status": "reference",
      "installedAt": "r-leg-done"
    },
    {
      "id": 23,
      "actorId": "r_lowerMotor",
      "role": "右腿中部",
      "status": "reference",
      "installedAt": "r-leg-done"
    },
    {
      "id": 24,
      "actorId": "motor",
      "role": "右脚踝",
      "status": "reference",
      "installedAt": "r-tighten"
    },
    {
      "id": 30,
      "actorId": "h_motor30",
      "role": "脖子下端",
      "status": "candidate",
      "installedAt": "head-neck-plate"
    },
    {
      "id": 31,
      "actorId": "h_motor31",
      "role": "脖子上端",
      "status": "candidate",
      "installedAt": "head-neck-plate"
    },
    {
      "id": 32,
      "actorId": "h_motor32",
      "role": "头部旋转",
      "status": "candidate",
      "installedAt": "head-yaw-motor"
    },
    {
      "id": 33,
      "actorId": "h_motor33",
      "role": "头部第二关节",
      "status": "candidate",
      "installedAt": "head-core-join"
    },
    {
      "id": 34,
      "actorId": "h_mouthMotor",
      "role": "嘴部",
      "status": "reference",
      "installedAt": "head-platform-fix"
    }
  ]
} as const;
export const servoLeads = {
  "reportedRequirement": {
    "source": "setup-notes",
    "servosRequiringLongLead": 3,
    "regionHint": "head-neck",
    "regionConfirmed": false,
    "ids": null,
    "lengthMm": null,
    "connectionEndpoints": null
  },
  "requirements": {
    "10": {
      "connections": null
    },
    "11": {
      "connections": null
    },
    "12": {
      "connections": null
    },
    "13": {
      "connections": null
    },
    "14": {
      "connections": null
    },
    "20": {
      "connections": null
    },
    "21": {
      "connections": null
    },
    "22": {
      "connections": null
    },
    "23": {
      "connections": null
    },
    "24": {
      "connections": null
    },
    "30": {
      "connections": null
    },
    "31": {
      "connections": null
    },
    "32": {
      "connections": null
    },
    "33": {
      "connections": null
    },
    "34": {
      "connections": null
    }
  }
} as const;
export const SERVO_BINDINGS = servoMap.bindings;
export const SERVO_IDS = Object.fromEntries(SERVO_BINDINGS.map(binding => [binding.actorId, binding.id]));
