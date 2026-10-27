import type * as THREE from 'three';
export type Vector = number[];
export interface Port {
    id?: string | undefined;
    label?: string | undefined;
    kind?: string | undefined;
    position: Vector;
    normal?: Vector | undefined;
    direction?: Vector | undefined;
    tangent?: Vector | undefined;
    dockOffset?: number | undefined;
    focusSize?: Vector | undefined;
    evidence?: string | undefined;
    nativeId?: string | undefined;
    nativePositionMm?: Vector | undefined;
    pitchMm?: number | undefined;
}
export interface Step {
    id: string;
    chapter: string;
    short: string;
    title: string;
    sourceStart: number;
    sourceEnd: number;
    parts: string[];
    text: string;
    check: string;
    caption?: string | undefined;
    duration: number;
    camera: Vector;
    target: Vector;
    complete?: boolean | undefined;
    overview?: boolean | undefined;
    software?: boolean | undefined;
    servoIds?: number[] | undefined;
    module?: number | undefined;
}
export type BaseStep = Omit<Step, 'id' | 'chapter'>;
export interface Chapter {
    id: string;
    name: string;
    start: number;
    end: number;
    sourceStart: number;
    sourceEnd: number;
    video?: string | undefined;
    videoStart?: number | undefined;
}
export type State = Record<string, Pose>;
export interface MeshSpec {
    sourceId: string;
    sourceName: string;
    end: Vector;
    size: Vector;
    color?: string | undefined;
    sourceType?: string | undefined;
}
export interface Mount {
    end: Vector;
    rotation?: Vector | undefined;
    holeSource?: string | undefined;
    holeRadius?: number | undefined;
    holeSourceId?: string | undefined;
    holeNormal?: Vector | undefined;
    holeCentre?: Vector | undefined;
}
export interface FineCue {
    id: string;
    actorId: string;
    type: string;
    endpoint?: number | undefined;
    from: number;
    to: number;
    operation: string;
    label?: string | undefined;
    targetActor?: string | undefined;
    point?: number | undefined;
    guide?: string | undefined;
    ordinal?: number | undefined;
    total?: number | undefined;
    fitPending?: boolean | undefined;
}
export type EntityMap = Map<string, THREE.Object3D>;
export interface CableRecord {
    lines: THREE.Mesh[];
    plugs: THREE.Object3D[];
    type?: string | undefined;
    approved: boolean;
    signature: string;
}
export type CableMap = Map<string, CableRecord>;
export interface MaterialItem {
    id: string;
    ids: string[];
    name: string;
    short: string;
    spec: string;
    note: string;
    source: string;
    count: number;
    fastener?: string | null | undefined;
    color?: string | undefined;
    kind?: string | undefined;
    quantity?: string | undefined;
}
export interface PlaybackState {
    step: number;
    progress: number;
    playing: boolean;
    autoplay?: boolean | undefined;
    rate?: number | undefined;
    finished?: boolean | undefined;
    phase?: string | undefined;
}
export type Actor = {
    material?: THREE.Material | undefined;
    "kind"?: string | undefined;
    "boardType"?: string | undefined;
    "label": string;
    "source": string;
    "size"?: (number)[] | undefined;
    "end": (number)[];
    "start"?: (number)[] | undefined;
    "step"?: number | undefined;
    "ports"?: Port[] | undefined;
    "sourceId"?: undefined | string;
    "module"?: number | undefined;
    "color"?: string | undefined;
    "servoPorts"?: Port[] | undefined;
    "cableType"?: string | undefined;
    "endpointPlugs"?: (boolean)[] | undefined;
    "points"?: ((number)[])[] | undefined;
    "mesh"?: string | null | undefined;
    "side"?: string | undefined;
    "fastener"?: null | string | undefined;
    "chip"?: string | undefined;
    "listGroup"?: null | string | undefined;
    "orientationZ"?: number | undefined;
    "spinAxis"?: (number)[] | undefined;
    "holeSource"?: string | undefined;
    "approach"?: (number)[] | undefined;
    "rotation"?: (number)[] | undefined;
    "delay"?: number | undefined;
    "carriedBy"?: string | undefined;
    "removeStep"?: number | undefined;
    "tray"?: (number)[] | undefined;
    "group"?: string | undefined;
    "dockNormal"?: (number)[] | undefined;
    "phase"?: (number)[] | undefined;
    "routeType"?: string | undefined;
    "motor"?: string | undefined;
    "portIndex"?: number | undefined;
    "freeEnd"?: (number)[] | undefined;
    "entry"?: (number)[] | undefined;
    "prepareOffset"?: (number)[] | undefined;
    "installStep"?: number | undefined;
    "installPhase"?: (number)[] | undefined;
    "destination"?: string | undefined;
    "destinationPort"?: number | undefined;
    "connectStep"?: number | undefined;
    "legSide"?: string | undefined;
    "assembly"?: string | undefined | null;
    "to"?: number | undefined;
    "from"?: number | undefined;
    "jawAttached"?: boolean | undefined;
    "subassembly"?: string | undefined;
    "routeAfter"?: number | undefined;
    "finalPoints"?: ((number)[])[] | undefined;
    "attachedPlug"?: string | undefined;
    "plugEnd"?: number | undefined;
    "sourceMotor"?: string | undefined;
    "sourcePort"?: number | undefined;
    "sourceEntry"?: (number)[] | undefined;
    "portMotor"?: string | undefined;
    "outward"?: (number)[] | undefined;
    "padApproach"?: (number)[] | undefined;
    "surfaceSide"?: number | undefined;
    "mountRotation"?: (number)[] | undefined;
    "sourceHoleCenter"?: (number)[] | undefined;
    "sourceHoleNormal"?: (number)[] | undefined;
    "holeSourceId"?: string | undefined;
    "hardwareStatus"?: string | undefined;
    "wireCount"?: number | undefined;
    "wireColors"?: (string)[] | undefined;
    "pins"?: number | undefined;
};
export type Pose = {
    "visible": boolean;
    "position": (number)[];
    "turn": number;
    "status": string;
    "opacity": number;
    "rotation"?: (number)[] | undefined;
    "points"?: ((number)[])[] | undefined;
    "endpointQuaternions"?: ((number)[])[] | undefined;
    connectProgress?: number | undefined;
};
export type AuditedServo = {
    "sourceId": string;
    "sourceVertexCount": number;
    "oldEnvelopeMm": (number)[];
    "oldDepthAxisIndex": number;
    "oldFittedShaftLinePointLocalMm": (number)[];
    "bodyParent": {
        "rotationMatrixRows": ((number)[])[];
        "quaternionXYZW": (number)[];
        "eulerXYZRadians": (number)[];
        "translationMm": (number)[];
        "scale": number;
    };
    "shaftPointLocalMm": (number)[];
    "shaftAxisLocal": (number)[];
    "shaftRadialAlignmentErrorMm": number;
    "frontHornParent": {
        "rotationMatrixRows": ((number)[])[];
        "quaternionXYZW": (number)[];
        "translationMm": (number)[];
        "scale": number;
    };
    "rearHornParent": {
        "rotationMatrixRows": ((number)[])[];
        "quaternionXYZW": (number)[];
        "translationMm": (number)[];
        "scale": number;
    };
    "oldPorts": ({
        "position": (number)[];
        "normal": (number)[];
        "tangent"?: (number)[] | undefined;
        "evidence"?: string | undefined;
        "id"?: string | undefined;
    })[];
    "nativePorts": ({
        "id": string;
        "position": (number)[];
        "normal": (number)[];
        "tangent": (number)[];
        "nativePositionMm": (number)[];
    })[];
    "replaceOldPortSlotsWithNativeIndex": (number)[];
    "portSlotAssignmentGeometricallyAmbiguous": boolean;
    "portSlotAssignmentMeaning": string;
    "existingHorn": null | {
        "actorId": string;
        "screwActorId": string;
        "discSide": string;
        "removeStep": number | null;
        "removed": boolean;
        "moduleIndex": number;
        "moduleLocalRemoveStep": number | null;
        "globalRemoveStep": number | null;
        "globalRemoveStepId": string | null;
        "currentSeatedWorldMm": (number)[];
        "newSeatedWorldMm": (number)[];
        "seatedCorrectionWorldMm": (number)[];
        "newDesiredQuaternionXYZW": (number)[];
        "newDesiredEulerXYZRadians": (number)[];
        "ifKeepingOldActorRotationChildQuaternionXYZW": (number)[];
        "newRetainingHeadOuterFaceWorldMm": (number)[];
        "preserveTrayWorldMm": (number)[];
    };
    "fixedDiscPolicySourceMatched": string;
    "frontSideEvidence": string;
};
export interface HardwareAdapter {
    translationMm?: Vector | undefined;
    quaternionXYZW?: Vector | undefined;
    rotationEulerXYZRad?: Vector | undefined;
}
export interface FocusBox {
    id: string;
    role: string;
    color: number;
    opacity: number;
    center: Vector;
    size: Vector;
}
export interface FocusState {
    phase: string;
    boxes?: FocusBox[];
    fine?: boolean | undefined;
    detailActive?: boolean | undefined;
    detailPhase?: string | undefined;
    detailId?: string | undefined;
    detailType?: string | undefined;
    detailTitle?: string | undefined;
    detailStatus?: string | undefined;
    detailDirection?: Vector | undefined;
    message?: string | undefined;
    totalTargets?: number | undefined;
    completedTargets?: number | undefined;
    matchedSocket?: boolean | undefined;
    animating?: boolean | undefined;
    pulsing?: boolean | undefined;
}
export interface MagnifierState {
    visible: boolean;
    available?: boolean | undefined;
    automatic?: boolean | undefined;
    choice?: string | undefined;
    id?: string | undefined;
    animating?: boolean | undefined;
    zoom?: number | undefined;
    center?: Vector | undefined;
    rect?: {
        x: number | undefined;
        y: number;
        w: number;
        h: number;
    };
    phase?: string | undefined;
    manual?: boolean | undefined;
    section?: boolean | undefined;
    clipped?: boolean | undefined;
}
export type TintableMaterial = THREE.Material & Partial<Pick<THREE.MeshStandardMaterial, "color" | "emissive" | "emissiveIntensity" | "roughness" | "metalness">>;
export type ActorOptions = Partial<Actor>;
