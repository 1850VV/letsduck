// Approved v2 geometry audit snapshot. Runtime stays inside this tutorial artifact.
// Regenerate from output/assembly-hardware-v2/{board-audit,servo-audit}.json.
export const BOARD_AUDIT = {
  "version": "assembly-hardware-v2-board-adapter-1",
  "scope": "Read-only source audit and executable data. No tutorial/application or source GLB changed.",
  "units": "All output positions/translations are millimetres; GLB raw geometry is metres.",
  "physicalFitVerified": false,
  "electricalMappingVerified": false,
  "approval": "output/hardware-photo-batch/approval-v2.json supersedes individual metadata awaiting-approval status for appearance/update scope only.",
  "sourceAssets": {
    "uno-q": {
      "sha256": "fad5729ecf80e3dabe046398f6808dfee37a20d959a74a5aa620c93b8800227b",
      "rootNodesHaveIdentityTransform": true,
      "meshCount": 20,
      "boundsMm": {
        "min": [
          -35.599999,
          -3.0,
          -26.671635
        ],
        "max": [
          34.291092,
          9.0,
          26.671635
        ]
      },
      "pcbMeshBoundsMm": {
        "minMm": [
          -34.291092,
          -0.5,
          -26.671635
        ],
        "maxMm": [
          34.291092,
          0.5,
          26.671635
        ]
      }
    },
    "extension-board": {
      "sha256": "fc8386bb3f2d2bce9e8bf1d07f858a4657327b935699f721c27438dff27dbd63",
      "rootNodesHaveIdentityTransform": true,
      "meshCount": 370,
      "boundsMm": {
        "min": [
          -34.575,
          -9.35,
          -26.81
        ],
        "max": [
          34.400001,
          11.725,
          26.690001
        ]
      },
      "pcbMeshBoundsMm": {
        "minMm": [
          -34.274999,
          -0.8,
          -26.690001
        ],
        "maxMm": [
          34.274999,
          0.8,
          26.690001
        ]
      }
    }
  },
  "serializedGeometryCheck": {
    "serializedFemaleSocketCount": 32,
    "serializedMalePinCount": 32,
    "maxInPlaneResidualMm": 1.0774579887020204e-06,
    "extensionMalePlasticMinNativeYMm": -3.2999999821186066,
    "extensionMalePlasticMaxNativeYMm": -3.2999999821186066,
    "extensionPlasticBottomFinalUnoLocalYMm": 9.000000017881394,
    "unoFemaleTopNativeYMm": 9,
    "seatingResidualMm": 1.7881394143159923e-08,
    "method": "Read actual float32 vertex positions: UNO 32 named socket-floor boxes in batched connector-cavities; extension 32 named pin meshes and plastic insulator meshes. Source-level exact mapping is separately verified."
  },
  "adapters": {
    "uno-q": {
      "scale": [
        1000,
        1000,
        1000
      ],
      "rotationEulerXYZRad": [
        0,
        1.5707963267948966,
        0
      ],
      "translationMm": [
        0,
        0,
        0
      ],
      "mapSourceMmToActorLocal": "[z,y,-x]"
    },
    "luwu-extension": {
      "scale": [
        1000,
        1000,
        1000
      ],
      "rotationEulerXYZRad": [
        0,
        -1.5707963267948966,
        0
      ],
      "translationMm": [
        -0.01,
        0.3,
        0
      ],
      "mapSourceMmToActorLocal": "[-z-0.01,y+0.30,x]"
    }
  },
  "adapterApplication": "Scale a child GLB by 1000, rotate it with the given XYZ Euler, then set its local position in mm. Preserve the original source origin; do not Box3-center or rescale to actor.size. Keep existing actor end/start and final BOARD_ROTATION=[-PI/2,0,0]. Port positions below already include the adapter translation; do not apply it twice.",
  "stacking": {
    "relativeSourceRotation": "UNO must be RY(PI) relative to extension to match all four header groups.",
    "pcbOriginSeparationMm": 12.3,
    "extensionSourceOriginInPrepareWorldMm": [
      -35.01,
      22.3,
      -5
    ],
    "unoSourceOriginInPrepareWorldMm": [
      -35,
      10,
      -5
    ],
    "extensionSourceOriginInFinalWorldMm": [
      -0.01,
      100,
      -51.3
    ],
    "unoSourceOriginInFinalWorldMm": [
      0,
      100,
      -39
    ],
    "reason": "+0.01 source-Z extension translation corrects the common row offset; +0.30 actor-local-Y makes extension male plastic underside (-3.30) rest on UNO female top (+9.00) with old actor separation 12.00. This is modeled seating only; measured clearance is unavailable.",
    "pcbDimensionsNativeMm": {
      "uno-q": [
        68.582186,
        1,
        53.343271
      ],
      "extension-board": [
        68.55,
        1.6,
        53.38
      ]
    },
    "pcbDimensionsActorLocalMm": {
      "uno-q": [
        53.343271,
        1,
        68.582186
      ],
      "luwu-extension": [
        53.38,
        1.6,
        68.55
      ]
    },
    "doNotFitTotalBoundsToPcb": true
  },
  "unoPorts": [
    {
      "id": "usb-c",
      "label": "UNO Q USB-C",
      "kind": "usb-c",
      "sourceMatingCentreMm": [
        -35.6,
        2,
        -11.19
      ],
      "position": [
        -11.19,
        2.0,
        35.6
      ],
      "direction": [
        0,
        0,
        1
      ],
      "basis": "UNO source builder capsule face X=-35.6, native Y=11.19, native Z=2.00; source GLB mapping [X,Z,-Y].",
      "positionAndHousingInferred": true,
      "prepareMouthWorldMm": [
        -46.19,
        12.0,
        30.6
      ],
      "finalMouthWorldMm": [
        -11.19,
        135.6,
        -41.0
      ]
    },
    {
      "label": "digital10",
      "kind": "female-header",
      "position": [
        -24.14,
        9.0,
        4.31
      ],
      "direction": [
        0,
        1,
        0
      ],
      "id": "digital10"
    },
    {
      "label": "digital8",
      "kind": "female-header",
      "position": [
        -24.14,
        9.0,
        -21.03
      ],
      "direction": [
        0,
        1,
        0
      ],
      "id": "digital8"
    },
    {
      "label": "power8",
      "kind": "female-header",
      "position": [
        24.12,
        9.0,
        -2.29
      ],
      "direction": [
        0,
        1,
        0
      ],
      "id": "power8"
    },
    {
      "label": "analog6",
      "kind": "female-header",
      "position": [
        24.12,
        9.0,
        -23.19
      ],
      "direction": [
        0,
        1,
        0
      ],
      "id": "analog6"
    }
  ],
  "extensionPorts": [
    {
      "id": "white-3pin-1",
      "label": "white-3pin-1",
      "kind": "servo",
      "sourceMatingCentreMm": [
        34.3,
        3.9,
        3.7
      ],
      "position": [
        -3.71,
        4.2,
        34.3
      ],
      "direction": [
        0,
        0,
        1
      ],
      "pitchMm": 2.0,
      "positionAndHousingInferred": true,
      "housingDimensionsMm": [
        7.2,
        5.8,
        8.1
      ],
      "openingWidthMm": 5.4,
      "prepareMouthWorldMm": [
        -38.71,
        26.2,
        29.3
      ],
      "finalMouthWorldMm": [
        -3.71,
        134.3,
        -55.2
      ]
    },
    {
      "id": "white-3pin-2",
      "label": "white-3pin-2",
      "kind": "servo",
      "sourceMatingCentreMm": [
        34.3,
        3.9,
        12.4
      ],
      "position": [
        -12.41,
        4.2,
        34.3
      ],
      "direction": [
        0,
        0,
        1
      ],
      "pitchMm": 2.0,
      "positionAndHousingInferred": true,
      "housingDimensionsMm": [
        7.2,
        5.8,
        8.1
      ],
      "openingWidthMm": 5.4,
      "prepareMouthWorldMm": [
        -47.41,
        26.2,
        29.3
      ],
      "finalMouthWorldMm": [
        -12.41,
        134.3,
        -55.2
      ]
    },
    {
      "id": "white-3pin-3",
      "label": "white-3pin-3",
      "kind": "servo",
      "sourceMatingCentreMm": [
        34.3,
        3.9,
        21.1
      ],
      "position": [
        -21.11,
        4.2,
        34.3
      ],
      "direction": [
        0,
        0,
        1
      ],
      "pitchMm": 2.0,
      "positionAndHousingInferred": true,
      "housingDimensionsMm": [
        7.2,
        5.8,
        8.1
      ],
      "openingWidthMm": 5.4,
      "prepareMouthWorldMm": [
        -56.11,
        26.2,
        29.3
      ],
      "finalMouthWorldMm": [
        -21.11,
        134.3,
        -55.2
      ]
    },
    {
      "id": "ivory-3pin-1",
      "label": "ivory-3pin-1",
      "kind": "small-servo",
      "sourceMatingCentreMm": [
        33.25,
        3.05,
        -15.6
      ],
      "position": [
        15.59,
        3.35,
        33.25
      ],
      "direction": [
        0,
        0,
        1
      ],
      "pitchMm": 1.25,
      "positionAndHousingInferred": true,
      "housingDimensionsMm": [
        5.1,
        4.1,
        5.8
      ],
      "openingWidthMm": 3.9,
      "prepareMouthWorldMm": [
        -19.41,
        25.35,
        28.25
      ],
      "finalMouthWorldMm": [
        15.59,
        133.25,
        -54.35
      ]
    },
    {
      "id": "ivory-3pin-2",
      "label": "ivory-3pin-2",
      "kind": "small-servo",
      "sourceMatingCentreMm": [
        33.25,
        3.05,
        -9.4
      ],
      "position": [
        9.39,
        3.35,
        33.25
      ],
      "direction": [
        0,
        0,
        1
      ],
      "pitchMm": 1.25,
      "positionAndHousingInferred": true,
      "housingDimensionsMm": [
        5.1,
        4.1,
        5.8
      ],
      "openingWidthMm": 3.9,
      "prepareMouthWorldMm": [
        -25.61,
        25.35,
        28.25
      ],
      "finalMouthWorldMm": [
        9.39,
        133.25,
        -54.35
      ]
    },
    {
      "id": "ivory-3pin-3",
      "label": "ivory-3pin-3",
      "kind": "small-servo",
      "sourceMatingCentreMm": [
        33.25,
        3.05,
        -3.2
      ],
      "position": [
        3.19,
        3.35,
        33.25
      ],
      "direction": [
        0,
        0,
        1
      ],
      "pitchMm": 1.25,
      "positionAndHousingInferred": true,
      "housingDimensionsMm": [
        5.1,
        4.1,
        5.8
      ],
      "openingWidthMm": 3.9,
      "prepareMouthWorldMm": [
        -31.81,
        25.35,
        28.25
      ],
      "finalMouthWorldMm": [
        3.19,
        133.25,
        -54.35
      ]
    },
    {
      "id": "power-2pin-housing",
      "label": "power-2pin-housing",
      "kind": "battery",
      "sourceMatingCentreMm": [
        34.4,
        4.6,
        -22.2
      ],
      "position": [
        22.19,
        4.9,
        34.4
      ],
      "direction": [
        0,
        0,
        1
      ],
      "pitchMm": 2.5,
      "positionAndHousingInferred": true,
      "housingDimensionsMm": [
        7.4,
        7.2,
        6.4
      ],
      "openingWidthMm": 5.2,
      "prepareMouthWorldMm": [
        -12.81,
        26.9,
        29.4
      ],
      "finalMouthWorldMm": [
        22.19,
        134.4,
        -55.9
      ]
    },
    {
      "label": "digital10",
      "kind": "male-header",
      "position": [
        -24.14,
        -3.0,
        4.31
      ],
      "direction": [
        0,
        -1,
        0
      ],
      "id": "digital10"
    },
    {
      "label": "digital8",
      "kind": "male-header",
      "position": [
        -24.14,
        -3.0,
        -21.03
      ],
      "direction": [
        0,
        -1,
        0
      ],
      "id": "digital8"
    },
    {
      "label": "power8",
      "kind": "male-header",
      "position": [
        24.12,
        -3.0,
        -2.29
      ],
      "direction": [
        0,
        -1,
        0
      ],
      "id": "power8"
    },
    {
      "label": "analog6",
      "kind": "male-header",
      "position": [
        24.12,
        -3.0,
        -23.19
      ],
      "direction": [
        0,
        -1,
        0
      ],
      "id": "analog6"
    }
  ],
  "headers": [
    {
      "id": "digital10",
      "count": 10,
      "pitchMm": 2.54,
      "unoFemaleTopPlanePinsLocalMm": [
        [
          -24.14,
          9.0,
          -7.12
        ],
        [
          -24.14,
          9.0,
          -4.58
        ],
        [
          -24.14,
          9.0,
          -2.04
        ],
        [
          -24.14,
          9.0,
          0.5
        ],
        [
          -24.14,
          9.0,
          3.04
        ],
        [
          -24.14,
          9.0,
          5.58
        ],
        [
          -24.14,
          9.0,
          8.12
        ],
        [
          -24.14,
          9.0,
          10.66
        ],
        [
          -24.14,
          9.0,
          13.2
        ],
        [
          -24.14,
          9.0,
          15.74
        ]
      ],
      "extensionMalePlasticBottomPlanePinsLocalMm": [
        [
          -24.14,
          -3.0,
          -7.12
        ],
        [
          -24.14,
          -3.0,
          -4.58
        ],
        [
          -24.14,
          -3.0,
          -2.04
        ],
        [
          -24.14,
          -3.0,
          0.5
        ],
        [
          -24.14,
          -3.0,
          3.04
        ],
        [
          -24.14,
          -3.0,
          5.58
        ],
        [
          -24.14,
          -3.0,
          8.12
        ],
        [
          -24.14,
          -3.0,
          10.66
        ],
        [
          -24.14,
          -3.0,
          13.2
        ],
        [
          -24.14,
          -3.0,
          15.74
        ]
      ],
      "unoPort": {
        "label": "digital10",
        "kind": "female-header",
        "position": [
          -24.14,
          9.0,
          4.31
        ],
        "direction": [
          0,
          1,
          0
        ]
      },
      "extensionPort": {
        "label": "digital10",
        "kind": "male-header",
        "position": [
          -24.14,
          -3.0,
          4.31
        ],
        "direction": [
          0,
          -1,
          0
        ]
      },
      "maxInPlaneResidualMm": 0.0,
      "worldSeatPlaneResidualMmWithOld12MmActorSeparation": 0.0
    },
    {
      "id": "digital8",
      "count": 8,
      "pitchMm": 2.54,
      "unoFemaleTopPlanePinsLocalMm": [
        [
          -24.14,
          9.0,
          -29.92
        ],
        [
          -24.14,
          9.0,
          -27.38
        ],
        [
          -24.14,
          9.0,
          -24.84
        ],
        [
          -24.14,
          9.0,
          -22.3
        ],
        [
          -24.14,
          9.0,
          -19.76
        ],
        [
          -24.14,
          9.0,
          -17.22
        ],
        [
          -24.14,
          9.0,
          -14.68
        ],
        [
          -24.14,
          9.0,
          -12.14
        ]
      ],
      "extensionMalePlasticBottomPlanePinsLocalMm": [
        [
          -24.14,
          -3.0,
          -29.92
        ],
        [
          -24.14,
          -3.0,
          -27.38
        ],
        [
          -24.14,
          -3.0,
          -24.84
        ],
        [
          -24.14,
          -3.0,
          -22.3
        ],
        [
          -24.14,
          -3.0,
          -19.76
        ],
        [
          -24.14,
          -3.0,
          -17.22
        ],
        [
          -24.14,
          -3.0,
          -14.68
        ],
        [
          -24.14,
          -3.0,
          -12.14
        ]
      ],
      "unoPort": {
        "label": "digital8",
        "kind": "female-header",
        "position": [
          -24.14,
          9.0,
          -21.03
        ],
        "direction": [
          0,
          1,
          0
        ]
      },
      "extensionPort": {
        "label": "digital8",
        "kind": "male-header",
        "position": [
          -24.14,
          -3.0,
          -21.03
        ],
        "direction": [
          0,
          -1,
          0
        ]
      },
      "maxInPlaneResidualMm": 0.0,
      "worldSeatPlaneResidualMmWithOld12MmActorSeparation": 0.0
    },
    {
      "id": "power8",
      "count": 8,
      "pitchMm": 2.54,
      "unoFemaleTopPlanePinsLocalMm": [
        [
          24.12,
          9.0,
          -11.18
        ],
        [
          24.12,
          9.0,
          -8.64
        ],
        [
          24.12,
          9.0,
          -6.1
        ],
        [
          24.12,
          9.0,
          -3.56
        ],
        [
          24.12,
          9.0,
          -1.02
        ],
        [
          24.12,
          9.0,
          1.52
        ],
        [
          24.12,
          9.0,
          4.06
        ],
        [
          24.12,
          9.0,
          6.6
        ]
      ],
      "extensionMalePlasticBottomPlanePinsLocalMm": [
        [
          24.12,
          -3.0,
          -11.18
        ],
        [
          24.12,
          -3.0,
          -8.64
        ],
        [
          24.12,
          -3.0,
          -6.1
        ],
        [
          24.12,
          -3.0,
          -3.56
        ],
        [
          24.12,
          -3.0,
          -1.02
        ],
        [
          24.12,
          -3.0,
          1.52
        ],
        [
          24.12,
          -3.0,
          4.06
        ],
        [
          24.12,
          -3.0,
          6.6
        ]
      ],
      "unoPort": {
        "label": "power8",
        "kind": "female-header",
        "position": [
          24.12,
          9.0,
          -2.29
        ],
        "direction": [
          0,
          1,
          0
        ]
      },
      "extensionPort": {
        "label": "power8",
        "kind": "male-header",
        "position": [
          24.12,
          -3.0,
          -2.29
        ],
        "direction": [
          0,
          -1,
          0
        ]
      },
      "maxInPlaneResidualMm": 0.0,
      "worldSeatPlaneResidualMmWithOld12MmActorSeparation": 0.0
    },
    {
      "id": "analog6",
      "count": 6,
      "pitchMm": 2.54,
      "unoFemaleTopPlanePinsLocalMm": [
        [
          24.12,
          9.0,
          -29.54
        ],
        [
          24.12,
          9.0,
          -27.0
        ],
        [
          24.12,
          9.0,
          -24.46
        ],
        [
          24.12,
          9.0,
          -21.92
        ],
        [
          24.12,
          9.0,
          -19.38
        ],
        [
          24.12,
          9.0,
          -16.84
        ]
      ],
      "extensionMalePlasticBottomPlanePinsLocalMm": [
        [
          24.12,
          -3.0,
          -29.54
        ],
        [
          24.12,
          -3.0,
          -27.0
        ],
        [
          24.12,
          -3.0,
          -24.46
        ],
        [
          24.12,
          -3.0,
          -21.92
        ],
        [
          24.12,
          -3.0,
          -19.38
        ],
        [
          24.12,
          -3.0,
          -16.84
        ]
      ],
      "unoPort": {
        "label": "analog6",
        "kind": "female-header",
        "position": [
          24.12,
          9.0,
          -23.19
        ],
        "direction": [
          0,
          1,
          0
        ]
      },
      "extensionPort": {
        "label": "analog6",
        "kind": "male-header",
        "position": [
          24.12,
          -3.0,
          -23.19
        ],
        "direction": [
          0,
          -1,
          0
        ]
      },
      "maxInPlaneResidualMm": 0.0,
      "worldSeatPlaneResidualMmWithOld12MmActorSeparation": 0.0
    }
  ],
  "interfaceSelection": {
    "p_servoCable": "white-3pin-1",
    "f_bus0": "white-3pin-1",
    "f_bus1": "white-3pin-2",
    "f_bus2": "white-3pin-3",
    "p_powerCable": "power-2pin-housing",
    "f_powerPlug": "power-2pin-housing",
    "p_usb": "usb-c",
    "basis": "Three large white 2.0 mm 3-pin ports geometrically match the approved large servo-cable appearance. Three ivory 1.25 mm ports remain visible but unused by these large plugs. This preserves existing cable/branch order; it does not establish electrical branch assignment or contact pinout."
  },
  "prepareEndpoints": {
    "p_powerCableLast": {
      "physicalInterface": "power-2pin-housing",
      "mouthWorldMm": [
        -12.81,
        26.9,
        29.4
      ],
      "outwardNormalWorld": [
        0,
        0,
        1
      ],
      "legacyPlugCentreOffsetMm": 3.1,
      "legacyPlugCentreWorldMm": [
        -12.81,
        26.9,
        32.5
      ],
      "approach18MmFromCentreWorldMm": [
        -12.81,
        26.9,
        50.5
      ],
      "approvedPlugGeometry": "Recompute centre offset from the approved plug mating-plane adapter; these centre offsets reproduce legacy factories only."
    },
    "p_servoCableLast": {
      "physicalInterface": "white-3pin-1",
      "mouthWorldMm": [
        -38.71,
        26.2,
        29.3
      ],
      "outwardNormalWorld": [
        0,
        0,
        1
      ],
      "legacyPlugCentreOffsetMm": 1.65,
      "legacyPlugCentreWorldMm": [
        -38.71,
        26.2,
        30.95
      ],
      "approach18MmFromCentreWorldMm": [
        -38.71,
        26.2,
        48.95
      ],
      "approvedPlugGeometry": "Recompute centre offset from the approved plug mating-plane adapter; these centre offsets reproduce legacy factories only."
    },
    "p_usbFirst": {
      "physicalInterface": "usb-c",
      "mouthWorldMm": [
        -46.19,
        12.0,
        30.6
      ],
      "outwardNormalWorld": [
        0,
        0,
        1
      ],
      "legacyPlugCentreOffsetMm": 3.1,
      "legacyPlugCentreWorldMm": [
        -46.19,
        12.0,
        33.7
      ],
      "approach18MmFromCentreWorldMm": [
        -46.19,
        12.0,
        51.7
      ],
      "approvedPlugGeometry": "Recompute centre offset from the approved plug mating-plane adapter; these centre offsets reproduce legacy factories only."
    }
  },
  "finalEndpoints": {
    "f_powerPlug": {
      "physicalInterface": "power-2pin-housing",
      "mouthWorldMm": [
        22.19,
        134.4,
        -55.9
      ],
      "outwardNormalWorld": [
        0,
        1,
        0
      ],
      "legacyPlugCentreOffsetMm": 1.65,
      "legacyPlugCentreWorldMm": [
        22.19,
        136.05,
        -55.9
      ],
      "approach18MmFromCentreWorldMm": [
        22.19,
        154.05,
        -55.9
      ],
      "approvedPlugGeometry": "Recompute centre offset from the approved plug mating-plane adapter; these centre offsets reproduce legacy factories only."
    },
    "f_busPlug0": {
      "physicalInterface": "white-3pin-1",
      "mouthWorldMm": [
        -3.71,
        134.3,
        -55.2
      ],
      "outwardNormalWorld": [
        0,
        1,
        0
      ],
      "legacyPlugCentreOffsetMm": 1.65,
      "legacyPlugCentreWorldMm": [
        -3.71,
        135.95,
        -55.2
      ],
      "approach18MmFromCentreWorldMm": [
        -3.71,
        153.95,
        -55.2
      ],
      "approvedPlugGeometry": "Recompute centre offset from the approved plug mating-plane adapter; these centre offsets reproduce legacy factories only."
    },
    "f_busPlug1": {
      "physicalInterface": "white-3pin-2",
      "mouthWorldMm": [
        -12.41,
        134.3,
        -55.2
      ],
      "outwardNormalWorld": [
        0,
        1,
        0
      ],
      "legacyPlugCentreOffsetMm": 1.65,
      "legacyPlugCentreWorldMm": [
        -12.41,
        135.95,
        -55.2
      ],
      "approach18MmFromCentreWorldMm": [
        -12.41,
        153.95,
        -55.2
      ],
      "approvedPlugGeometry": "Recompute centre offset from the approved plug mating-plane adapter; these centre offsets reproduce legacy factories only."
    },
    "f_busPlug2": {
      "physicalInterface": "white-3pin-3",
      "mouthWorldMm": [
        -21.11,
        134.3,
        -55.2
      ],
      "outwardNormalWorld": [
        0,
        1,
        0
      ],
      "legacyPlugCentreOffsetMm": 1.65,
      "legacyPlugCentreWorldMm": [
        -21.11,
        135.95,
        -55.2
      ],
      "approach18MmFromCentreWorldMm": [
        -21.11,
        153.95,
        -55.2
      ],
      "approvedPlugGeometry": "Recompute centre offset from the approved plug mating-plane adapter; these centre offsets reproduce legacy factories only."
    }
  },
  "mountingHoles": [
    {
      "extensionHoleIndex": 0,
      "unoHoleIndex": 2,
      "extensionLocalCentreMm": [
        19.04,
        0.3,
        -31.75
      ],
      "unoLocalCentreMm": [
        19.049,
        0.0,
        -31.749
      ],
      "inPlaneResidualMm": 0.009055,
      "geometryCandidate": true,
      "extensionFinalWorldPcbMidplaneMm": [
        19.04,
        68.25,
        -51.3
      ],
      "unoFinalWorldPcbMidplaneMm": [
        19.049,
        68.251,
        -39.0
      ],
      "extensionFinalWorldOuterFaceMm": [
        19.04,
        68.25,
        -52.1
      ],
      "normalWorld": [
        0,
        0,
        -1
      ],
      "sourceUncertaintyMm": "extension hole position inferred +/-0.5 to 1.5 mm; this coordinate comparison is not physical verification"
    },
    {
      "extensionHoleIndex": 1,
      "unoHoleIndex": 3,
      "extensionLocalCentreMm": [
        -8.9,
        0.3,
        -31.75
      ],
      "unoLocalCentreMm": [
        -8.891,
        0.0,
        -31.749
      ],
      "inPlaneResidualMm": 0.009055,
      "geometryCandidate": true,
      "extensionFinalWorldPcbMidplaneMm": [
        -8.9,
        68.25,
        -51.3
      ],
      "unoFinalWorldPcbMidplaneMm": [
        -8.891,
        68.251,
        -39.0
      ],
      "extensionFinalWorldOuterFaceMm": [
        -8.9,
        68.25,
        -52.1
      ],
      "normalWorld": [
        0,
        0,
        -1
      ],
      "sourceUncertaintyMm": "extension hole position inferred +/-0.5 to 1.5 mm; this coordinate comparison is not physical verification"
    },
    {
      "extensionHoleIndex": 2,
      "unoHoleIndex": 0,
      "extensionLocalCentreMm": [
        24.12,
        0.3,
        19.05
      ],
      "unoLocalCentreMm": [
        24.129,
        0.0,
        20.321
      ],
      "inPlaneResidualMm": 1.271032,
      "geometryCandidate": false,
      "extensionFinalWorldPcbMidplaneMm": [
        24.12,
        119.05,
        -51.3
      ],
      "unoFinalWorldPcbMidplaneMm": [
        24.129,
        120.321,
        -39.0
      ],
      "extensionFinalWorldOuterFaceMm": [
        24.12,
        119.05,
        -52.1
      ],
      "normalWorld": [
        0,
        0,
        -1
      ],
      "sourceUncertaintyMm": "extension hole position inferred +/-0.5 to 1.5 mm; this coordinate comparison is not physical verification"
    },
    {
      "extensionHoleIndex": 3,
      "unoHoleIndex": 1,
      "extensionLocalCentreMm": [
        -24.14,
        0.3,
        20.32
      ],
      "unoLocalCentreMm": [
        -24.131,
        0.0,
        19.051
      ],
      "inPlaneResidualMm": 1.269032,
      "geometryCandidate": false,
      "extensionFinalWorldPcbMidplaneMm": [
        -24.14,
        120.32,
        -51.3
      ],
      "unoFinalWorldPcbMidplaneMm": [
        -24.131,
        119.051,
        -39.0
      ],
      "extensionFinalWorldOuterFaceMm": [
        -24.14,
        120.32,
        -52.1
      ],
      "normalWorld": [
        0,
        0,
        -1
      ],
      "sourceUncertaintyMm": "extension hole position inferred +/-0.5 to 1.5 mm; this coordinate comparison is not physical verification"
    }
  ],
  "screwActorRecommendations": {
    "f_boardScrew0": {
      "status": "modeled-hole candidate; physical fit unverified",
      "mappedExtensionHoleIndex": 0,
      "holeFaceCentreWorldMm": [
        19.04,
        68.25,
        -52.1
      ],
      "normalWorld": [
        0,
        0,
        -1
      ]
    },
    "f_boardScrew1": {
      "status": "modeled-hole candidate; physical fit unverified",
      "mappedExtensionHoleIndex": 1,
      "holeFaceCentreWorldMm": [
        -8.9,
        68.25,
        -52.1
      ],
      "normalWorld": [
        0,
        0,
        -1
      ]
    },
    "f_boardScrew2": {
      "status": "unconfirmed; do not render an installed through-both-boards state",
      "mappedExtensionHoleIndex": 2,
      "reason": "1.271032 mm in-plane mismatch to UNO hole; nominal M3 shaft in 3.2 mm holes cannot pass both as modeled."
    },
    "f_boardScrew3": {
      "status": "unconfirmed; do not render an installed through-both-boards state",
      "mappedExtensionHoleIndex": 3,
      "reason": "1.269032 mm in-plane mismatch to UNO hole; nominal M3 shaft in 3.2 mm holes cannot pass both as modeled."
    }
  },
  "requiredActionAdaptations": [
    "Keep 111 steps and existing board insertion timing. Both boards use the fixed child adapters in prepare and final; insertion still follows actor-local -Y / final world +Z into UNO.",
    "Replace all three hard-coded prepare board cable endpoints. p_usb approach currently changes world X; change it to outward +Z. p_powerCable and p_servoCable keep approach along +Z but use new mouth locations.",
    "Replace final boardPort/dockPosition semantic: position is now the actual mating mouth, so remove legacy +3.7 socket-box correction. Add only the mating-plane-to-plug-origin offset from the selected plug adapter.",
    "Regenerate final bus/power end positions and penultimate approach points using outward final world +Y. Existing plugMotion and -PI/2 dock orientation remain compatible.",
    "Keep Torso.BOARD_LEADS motor-side endpoints, global boardLeadSources branch order and wire-handoff semantics. Update only board-side endpoints and route middle/approach points.",
    "Replace old rectangular board screw locations. Render two near-coaxial modeled-hole candidates; leave the other two actors uninstalled/hidden in completion and report their mismatch. Do not modify source GLB holes.",
    "Existing socketAt handles a.servoPorts only; board cable quaternion either uses final segment approach or a board-aware semantic port helper. Do not attach large servo plugs to small 1.25mm ports.",
    "fine-geometry scans userData.focusPort and treats proxy local +Z as opening normal. Add one invisible mouth-centered BoxGeometry proxy per intended USB/servo/power port with local quaternion +Z->port.direction. Exclude proxy materials from visible rendering and use real connector mouth dimensions. Do not recreate visible placeholder socket boxes or let fine-geometry select an arbitrary GLB wall mesh.",
    "Use explicit port IDs for docking if available; current nearest-port search radius 9 mm is wider than some adjacent small-port spacing. Preserve fine-operation cues and their manual controls."
  ],
  "unverified": [
    "Source extension mounting-hole positions +/-0.5–1.5 mm visual uncertainty",
    "Physical PCB separation and collision-free stack",
    "Actual body/backplate support alignment: current t_backplate MOUNTS describe its body attachment, not these new four controller holes",
    "USB and connector exact mating depths, keyed rotations, plug fit",
    "Electrical branch mapping, battery polarity and electrical pin mapping"
  ],
  "verification": {
    "scaleIsUniform1000": true,
    "rootNodeTransformsInspected": true,
    "all32HeaderInPlaneCoordinatesMatchAfterAdapter": true,
    "headerModeledPlasticSeatingPlaneMatches": true,
    "twoNearCoaxialMountingHolePairs": true,
    "twoMismatchedMountingHolePairsExplicitlyPending": true,
    "sourceAssetsModified": false,
    "tutorialModified": false,
    "browserOrPhysicalChecksExecuted": false
  }
};
export const SERVO_AUDIT = {
  "schemaVersion": 1,
  "approval": "output/hardware-photo-batch/approval-v2.json",
  "scope": "read-only geometric audit; no tutorial or GLB modified",
  "sourceSceneUnits": "millimetres",
  "glbUnits": "metres",
  "transformOrder": "P_actor = t_mm + R * (1000 * p_glb_m). Scale only each imported GLB root, outside translation node; do not fit GLB bounding box to old size.",
  "bodyDimensionsMm": [
    34,
    20,
    23
  ],
  "completeDiscEnvelopeMm": 29,
  "maxShaftRadialAlignmentErrorMm": 0.00036621095690255313,
  "physicalFitVerified": false,
  "electricalMappingVerified": false,
  "actors": {
    "p_motor": {
      "sourceId": "right_knee_0",
      "sourceVertexCount": 482,
      "oldEnvelopeMm": [
        29.00008773803711,
        34.00047302246094,
        20.00046157836914
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        -7.499797821044922,
        -7.987022399902344e-05
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "eulerXYZRadians": [
          -1.5707963267948966,
          -1.5707963267948966,
          0
        ],
        "translationMm": [
          0.5,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0.5,
        -7.5,
        0
      ],
      "shaftAxisLocal": [
        -1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 0.000217383491917249,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          -11.95,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            1.2246467991473532e-16,
            0,
            1
          ],
          [
            -1,
            0,
            1.2246467991473532e-16
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5000000000000001,
          0.5,
          -0.5,
          0.5
        ],
        "translationMm": [
          12.95,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "position": [
            3,
            8.5,
            10.8
          ],
          "normal": [
            0,
            0,
            1
          ]
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            -10.9,
            1,
            8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -10.9,
            1,
            -8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": null,
      "fixedDiscPolicySourceMatched": "photographed batch: both discs; main rear always retained, secondary front follows ID policy",
      "frontSideEvidence": "one-sided-source; setup preview may show both approved discs"
    },
    "motor": {
      "sourceId": "right_knee_0",
      "sourceVertexCount": 482,
      "oldEnvelopeMm": [
        29.00008773803711,
        34.00047302246094,
        20.00046157836914
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        -7.499797821044922,
        -7.987022399902344e-05
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "eulerXYZRadians": [
          -1.5707963267948966,
          -1.5707963267948966,
          0
        ],
        "translationMm": [
          0.5,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0.5,
        -7.5,
        0
      ],
      "shaftAxisLocal": [
        -1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 0.000217383491917249,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          -11.95,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            1.2246467991473532e-16,
            0,
            1
          ],
          [
            -1,
            0,
            1.2246467991473532e-16
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5000000000000001,
          0.5,
          -0.5,
          0.5
        ],
        "translationMm": [
          12.95,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "position": [
            3,
            8.5,
            10.8
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "教学接口；精确键位与针脚待核"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            -10.9,
            1,
            8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -10.9,
            1,
            -8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "horn",
        "screwActorId": "hornScrew",
        "discSide": "front",
        "removeStep": 1,
        "removed": true,
        "moduleIndex": 1,
        "moduleLocalRemoveStep": 1,
        "globalRemoveStep": 10,
        "globalRemoveStepId": "r-horn",
        "currentSeatedWorldMm": [
          -65.6,
          26,
          -17.75
        ],
        "newSeatedWorldMm": [
          -61.95089263916016,
          25.998424530029297,
          -17.74871826171875
        ],
        "seatedCorrectionWorldMm": [
          3.6491073608398352,
          -0.001575469970703125,
          0.00128173828125
        ],
        "newDesiredQuaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "newDesiredEulerXYZRadians": [
          -1.5707963267948966,
          -1.5707963267948966,
          0
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          -64.00089263916016,
          25.998424530029297,
          -17.74871826171875
        ],
        "preserveTrayWorldMm": [
          -95,
          10,
          12.25
        ]
      },
      "fixedDiscPolicySourceMatched": "photographed batch: both discs; main rear always retained, secondary front follows ID policy",
      "frontSideEvidence": "front disc side fixed by old single disc and removal action"
    },
    "l_motor": {
      "sourceId": "left_knee_0",
      "sourceVertexCount": 482,
      "oldEnvelopeMm": [
        29.000076293945312,
        34.00030517578125,
        20.00054359436035
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        -7.499898672103882,
        0.00023984909057617188
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          0.5,
          0.5,
          0.5,
          0.5
        ],
        "eulerXYZRadians": [
          1.5707963267948966,
          1.5707963267948966,
          0
        ],
        "translationMm": [
          -0.5,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        -0.5,
        -7.5,
        0
      ],
      "shaftAxisLocal": [
        1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 0.00026037459319593786,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          0.5,
          0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          11.95,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            -1.2246467991473532e-16,
            0,
            -1
          ],
          [
            -1,
            0,
            1.2246467991473532e-16
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          0.5000000000000001,
          0.5,
          -0.5
        ],
        "translationMm": [
          -12.95,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "position": [
            -3,
            8.5,
            10.8
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "教学接口；精确键位与针脚待核"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            10.9,
            1,
            -8.2
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            10.9,
            1,
            8.2
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "l_horn",
        "screwActorId": "l_hornScrew",
        "discSide": "front",
        "removeStep": 10,
        "removed": true,
        "moduleIndex": 1,
        "moduleLocalRemoveStep": 10,
        "globalRemoveStep": 19,
        "globalRemoveStepId": "l-horn",
        "currentSeatedWorldMm": [
          65.6,
          26,
          -17.75
        ],
        "newSeatedWorldMm": [
          61.95070190429688,
          25.998355865478516,
          -17.74834442138672
        ],
        "seatedCorrectionWorldMm": [
          -3.6492980957031165,
          -0.001644134521484375,
          0.00165557861328125
        ],
        "newDesiredQuaternionXYZW": [
          0.5,
          0.5,
          0.5,
          0.5
        ],
        "newDesiredEulerXYZRadians": [
          1.5707963267948966,
          1.5707963267948966,
          0
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          0.5,
          0.5,
          0.5,
          0.5
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          64.00070190429688,
          25.998355865478516,
          -17.74834442138672
        ],
        "preserveTrayWorldMm": [
          95,
          10,
          12.25
        ]
      },
      "fixedDiscPolicySourceMatched": "photographed batch: both discs; main rear always retained, secondary front follows ID policy",
      "frontSideEvidence": "front disc side fixed by old single disc and removal action"
    },
    "r_upperMotor": {
      "sourceId": "right_hip_pitch_2",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        30.00008773803711,
        20.001983642578125,
        34.00101852416992
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        0.0003662109375,
        7.5
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            0,
            -1,
            0
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "eulerXYZRadians": [
          -3.141592653589793,
          -1.5707963267948966,
          0
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        0,
        7.5
      ],
      "shaftAxisLocal": [
        -1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 0.0003662109375,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            0,
            -1,
            0
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "translationMm": [
          -12.45,
          0,
          7.5
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            1.2246467991473532e-16,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            1,
            0,
            -1.2246467991473532e-16
          ]
        ],
        "quaternionXYZW": [
          0.7071067811865476,
          0,
          0.7071067811865475,
          0
        ],
        "translationMm": [
          12.45,
          0,
          7.5
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "position": [
            -5,
            6,
            17.80050926208496
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "双插座教学锚点；物理修订与电气针脚待核"
        },
        {
          "position": [
            5,
            6,
            17.80050926208496
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "双插座教学锚点；物理修订与电气针脚待核"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            -11.4,
            8.2,
            -1
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            -1
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -11.4,
            -8.2,
            -1
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            -1
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1,
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": true,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "r_upperHorn",
        "screwActorId": "r_upperHornScrew",
        "discSide": "front",
        "removeStep": 32,
        "removed": true,
        "moduleIndex": 1,
        "moduleLocalRemoveStep": 32,
        "globalRemoveStep": 41,
        "globalRemoveStepId": "r-top-horn",
        "currentSeatedWorldMm": [
          -72,
          90,
          18
        ],
        "newSeatedWorldMm": [
          -66.95005340576172,
          89.99990844726562,
          18.000078201293945
        ],
        "seatedCorrectionWorldMm": [
          5.049946594238278,
          -9.1552734375e-05,
          7.82012939453125e-05
        ],
        "newDesiredQuaternionXYZW": [
          -0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "newDesiredEulerXYZRadians": [
          -3.141592653589793,
          -1.5707963267948966,
          0
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          -0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          -69.00005340576172,
          89.99990844726562,
          18.000078201293945
        ],
        "preserveTrayWorldMm": [
          -96,
          3,
          60
        ]
      },
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front sign selected to match removable outer horn"
    },
    "l_upperMotor": {
      "sourceId": "left_hip_pitch_0",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        30.000049591064453,
        20.001815795898438,
        34.0010986328125
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        0.0003662109375,
        7.4999998807907104
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          0,
          0.7071067811865475,
          0,
          0.7071067811865476
        ],
        "eulerXYZRadians": [
          0,
          1.5707963267948966,
          0
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        0,
        7.5
      ],
      "shaftAxisLocal": [
        1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 0.00036621095690255313,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          0,
          0.7071067811865475,
          0,
          0.7071067811865476
        ],
        "translationMm": [
          12.45,
          0,
          7.5
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            -1.2246467991473532e-16,
            0,
            -1
          ],
          [
            0,
            1,
            0
          ],
          [
            1,
            0,
            -1.2246467991473532e-16
          ]
        ],
        "quaternionXYZW": [
          0,
          -0.7071067811865476,
          0,
          0.7071067811865475
        ],
        "translationMm": [
          -12.45,
          0,
          7.5
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "position": [
            -5,
            6,
            17.80054931640625
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "双插座教学锚点；物理修订与电气针脚待核"
        },
        {
          "position": [
            5,
            6,
            17.80054931640625
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "双插座教学锚点；物理修订与电气针脚待核"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            11.4,
            -8.2,
            -1
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            -1
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            11.4,
            8.2,
            -1
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            -1
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        0,
        1
      ],
      "portSlotAssignmentGeometricallyAmbiguous": true,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "l_upperHorn",
        "screwActorId": "l_upperHornScrew",
        "discSide": "front",
        "removeStep": 33,
        "removed": true,
        "moduleIndex": 1,
        "moduleLocalRemoveStep": 33,
        "globalRemoveStep": 42,
        "globalRemoveStepId": "l-top-horn",
        "currentSeatedWorldMm": [
          72,
          90,
          18
        ],
        "newSeatedWorldMm": [
          66.95006866455078,
          89.99980163574219,
          18.00034999847412
        ],
        "seatedCorrectionWorldMm": [
          -5.049931335449216,
          -0.0001983642578125,
          0.00034999847412109375
        ],
        "newDesiredQuaternionXYZW": [
          0,
          0.7071067811865475,
          0,
          0.7071067811865476
        ],
        "newDesiredEulerXYZRadians": [
          0,
          1.5707963267948966,
          0
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          0,
          0.7071067811865475,
          0,
          0.7071067811865476
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          69.00006866455078,
          89.99980163574219,
          18.00034999847412
        ],
        "preserveTrayWorldMm": [
          96,
          3,
          60
        ]
      },
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front sign selected to match removable outer horn"
    },
    "r_lowerMotor": {
      "sourceId": "right_hip_pitch_3",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        30.000083923339844,
        34.00130081176758,
        20.001697540283203
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        -7.500001907348633,
        0.0003647804260253906
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "eulerXYZRadians": [
          -1.5707963267948966,
          -1.5707963267948966,
          0
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        -7.5,
        0
      ],
      "shaftAxisLocal": [
        -1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 0.0003647854125236816,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          -12.45,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            1.2246467991473532e-16,
            0,
            1
          ],
          [
            -1,
            0,
            1.2246467991473532e-16
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5000000000000001,
          0.5,
          -0.5,
          0.5
        ],
        "translationMm": [
          12.45,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "position": [
            -5,
            6,
            10.800848770141602
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "双插座教学锚点；物理修订与电气针脚待核"
        },
        {
          "position": [
            5,
            6,
            10.800848770141602
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "双插座教学锚点；物理修订与电气针脚待核"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            -11.4,
            1,
            8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -11.4,
            1,
            -8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        0,
        1
      ],
      "portSlotAssignmentGeometricallyAmbiguous": true,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": null,
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front sign convention: outward side; source has symmetric discs"
    },
    "l_lowerMotor": {
      "sourceId": "left_hip_pitch_4",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        30.000049591064453,
        34.00113296508789,
        20.001779556274414
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        -7.500001907348633,
        0.0003647804260253906
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          0.5,
          0.5,
          0.5,
          0.5
        ],
        "eulerXYZRadians": [
          1.5707963267948966,
          1.5707963267948966,
          0
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        -7.5,
        0
      ],
      "shaftAxisLocal": [
        1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 0.0003647854125236816,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          0.5,
          0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          12.45,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            -1.2246467991473532e-16,
            0,
            -1
          ],
          [
            -1,
            0,
            1.2246467991473532e-16
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          0.5000000000000001,
          0.5,
          -0.5
        ],
        "translationMm": [
          -12.45,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "position": [
            -5,
            6,
            10.800889778137208
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "双插座教学锚点；物理修订与电气针脚待核"
        },
        {
          "position": [
            5,
            6,
            10.800889778137208
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "双插座教学锚点；物理修订与电气针脚待核"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            11.4,
            1,
            -8.2
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            11.4,
            1,
            8.2
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1,
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": true,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": null,
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front sign convention: outward side; source has symmetric discs"
    },
    "t_motor10": {
      "sourceId": "trunk_base_0",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        19.999999523162842,
        30,
        34.000000953674316
      ],
      "oldDepthAxisIndex": 1,
      "oldFittedShaftLinePointLocalMm": [
        0,
        0,
        7.499999284744263
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          0.5,
          0.5,
          0.5
        ],
        "eulerXYZRadians": [
          -1.5707963267948966,
          0,
          1.5707963267948966
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        0,
        7.5
      ],
      "shaftAxisLocal": [
        0,
        1,
        0
      ],
      "shaftRadialAlignmentErrorMm": 7.152557373046875e-07,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          0,
          12.45,
          7.5
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            -1.2246467991473532e-16,
            0,
            -1
          ],
          [
            1,
            0,
            -1.2246467991473532e-16
          ]
        ],
        "quaternionXYZW": [
          -0.5000000000000001,
          0.5,
          -0.5,
          -0.5
        ],
        "translationMm": [
          0,
          -12.45,
          7.5
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -11.3,
            7,
            -3
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            1
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            11.3,
            7,
            -3
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            1
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            8.2,
            11.4,
            -1
          ],
          "normal": [
            0,
            1,
            0
          ],
          "tangent": [
            0,
            0,
            -1
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -8.2,
            11.4,
            -1
          ],
          "normal": [
            0,
            1,
            0
          ],
          "tangent": [
            0,
            0,
            -1
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1,
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "t_motor10Horn",
        "screwActorId": "t_motor10HornScrew",
        "discSide": "rear",
        "removeStep": null,
        "removed": false,
        "moduleIndex": 2,
        "moduleLocalRemoveStep": null,
        "globalRemoveStep": null,
        "globalRemoveStepId": null,
        "currentSeatedWorldMm": [
          -17.5,
          104.5,
          20
        ],
        "newSeatedWorldMm": [
          -17.50000023841858,
          106.55,
          19.999999523162842
        ],
        "seatedCorrectionWorldMm": [
          -2.384185791015625e-07,
          2.049999999999997,
          -4.76837158203125e-07
        ],
        "newDesiredQuaternionXYZW": [
          -0.5000000000000001,
          0.5,
          -0.5,
          -0.5
        ],
        "newDesiredEulerXYZRadians": [
          1.5707963267948968,
          0,
          1.5707963267948966
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          -1.1102230246251565e-16,
          0.7071067811865476,
          -5.551115123125783e-17,
          -0.7071067811865475
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          -17.50000023841858,
          104.5,
          19.999999523162842
        ],
        "preserveTrayWorldMm": [
          -17.5,
          104.5,
          20
        ]
      },
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front +Y chosen by old socket cue at +Y; retained horn is REAR"
    },
    "t_motor20": {
      "sourceId": "trunk_base_4",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        19.999999523162842,
        30,
        34.000000953674316
      ],
      "oldDepthAxisIndex": 1,
      "oldFittedShaftLinePointLocalMm": [
        0,
        0,
        7.499999284744263
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          0.5,
          0.5,
          0.5
        ],
        "eulerXYZRadians": [
          -1.5707963267948966,
          0,
          1.5707963267948966
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        0,
        7.5
      ],
      "shaftAxisLocal": [
        0,
        1,
        0
      ],
      "shaftRadialAlignmentErrorMm": 7.152557373046875e-07,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            -1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          0,
          12.45,
          7.5
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            -1.2246467991473532e-16,
            0,
            -1
          ],
          [
            1,
            0,
            -1.2246467991473532e-16
          ]
        ],
        "quaternionXYZW": [
          -0.5000000000000001,
          0.5,
          -0.5,
          -0.5
        ],
        "translationMm": [
          0,
          -12.45,
          7.5
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -11.3,
            7,
            -3
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            1
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            11.3,
            7,
            -3
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            1
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            8.2,
            11.4,
            -1
          ],
          "normal": [
            0,
            1,
            0
          ],
          "tangent": [
            0,
            0,
            -1
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -8.2,
            11.4,
            -1
          ],
          "normal": [
            0,
            1,
            0
          ],
          "tangent": [
            0,
            0,
            -1
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1,
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "t_motor20Horn",
        "screwActorId": "t_motor20HornScrew",
        "discSide": "rear",
        "removeStep": null,
        "removed": false,
        "moduleIndex": 2,
        "moduleLocalRemoveStep": null,
        "globalRemoveStep": null,
        "globalRemoveStepId": null,
        "currentSeatedWorldMm": [
          17.5,
          104.5,
          20
        ],
        "newSeatedWorldMm": [
          17.50000023841858,
          106.55,
          19.999999523162842
        ],
        "seatedCorrectionWorldMm": [
          2.384185791015625e-07,
          2.049999999999997,
          -4.76837158203125e-07
        ],
        "newDesiredQuaternionXYZW": [
          -0.5000000000000001,
          0.5,
          -0.5,
          -0.5
        ],
        "newDesiredEulerXYZRadians": [
          1.5707963267948968,
          0,
          1.5707963267948966
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          -1.1102230246251565e-16,
          0.7071067811865476,
          -5.551115123125783e-17,
          -0.7071067811865475
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          17.50000023841858,
          104.5,
          19.999999523162842
        ],
        "preserveTrayWorldMm": [
          17.5,
          104.5,
          20
        ]
      },
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front +Y chosen by old socket cue at +Y; retained horn is REAR"
    },
    "t_motor11": {
      "sourceId": "right_hip_yaw_3",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        20.000083923339844,
        34.00016784667969,
        30.000047206878662
      ],
      "oldDepthAxisIndex": 2,
      "oldFittedShaftLinePointLocalMm": [
        0,
        7.5,
        0
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            -1
          ]
        ],
        "quaternionXYZW": [
          -0.7071067811865475,
          0.7071067811865476,
          0,
          0
        ],
        "eulerXYZRadians": [
          -3.141592653589793,
          0,
          1.5707963267948966
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        7.5,
        0
      ],
      "shaftAxisLocal": [
        0,
        0,
        -1
      ],
      "shaftRadialAlignmentErrorMm": 0,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            -1
          ]
        ],
        "quaternionXYZW": [
          -0.7071067811865475,
          0.7071067811865476,
          0,
          0
        ],
        "translationMm": [
          0,
          7.5,
          -12.45
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            1,
            0,
            -1.2246467991473532e-16
          ],
          [
            1.2246467991473532e-16,
            0,
            1
          ]
        ],
        "quaternionXYZW": [
          4.329780281177466e-17,
          -4.329780281177466e-17,
          0.7071067811865475,
          0.7071067811865476
        ],
        "translationMm": [
          0,
          7.5,
          12.45
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -11.3,
            -3,
            -7
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            11.3,
            -3,
            -7
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            8.2,
            -1,
            -11.4
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            0,
            -1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -8.2,
            -1,
            -11.4
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            0,
            -1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1,
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "t_motor11Horn",
        "screwActorId": "t_motor11HornScrew",
        "discSide": "front",
        "removeStep": 8,
        "removed": true,
        "moduleIndex": 2,
        "moduleLocalRemoveStep": 8,
        "globalRemoveStep": 58,
        "globalRemoveStepId": "t-roll-horns",
        "currentSeatedWorldMm": [
          -17.5,
          90,
          3.5001060962677
        ],
        "newSeatedWorldMm": [
          -17.5,
          90,
          7.550106096267701
        ],
        "seatedCorrectionWorldMm": [
          0,
          0,
          4.050000000000001
        ],
        "newDesiredQuaternionXYZW": [
          -0.7071067811865475,
          0.7071067811865476,
          0,
          0
        ],
        "newDesiredEulerXYZRadians": [
          -3.141592653589793,
          0,
          1.5707963267948966
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          -0.5,
          0.5000000000000001,
          -0.4999999999999999,
          0.5
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          -17.5,
          90,
          5.500106096267701
        ],
        "preserveTrayWorldMm": [
          -104,
          3.5,
          100
        ]
      },
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front sign selected to match removal action"
    },
    "t_motor21": {
      "sourceId": "left_hip_yaw_1",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        20.000083923339844,
        34.00016784667969,
        30.000047206878662
      ],
      "oldDepthAxisIndex": 2,
      "oldFittedShaftLinePointLocalMm": [
        0,
        7.5,
        0
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            -1
          ]
        ],
        "quaternionXYZW": [
          -0.7071067811865475,
          0.7071067811865476,
          0,
          0
        ],
        "eulerXYZRadians": [
          -3.141592653589793,
          0,
          1.5707963267948966
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        7.5,
        0
      ],
      "shaftAxisLocal": [
        0,
        0,
        -1
      ],
      "shaftRadialAlignmentErrorMm": 0,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            -1
          ]
        ],
        "quaternionXYZW": [
          -0.7071067811865475,
          0.7071067811865476,
          0,
          0
        ],
        "translationMm": [
          0,
          7.5,
          -12.45
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            0,
            -1,
            0
          ],
          [
            1,
            0,
            -1.2246467991473532e-16
          ],
          [
            1.2246467991473532e-16,
            0,
            1
          ]
        ],
        "quaternionXYZW": [
          4.329780281177466e-17,
          -4.329780281177466e-17,
          0.7071067811865475,
          0.7071067811865476
        ],
        "translationMm": [
          0,
          7.5,
          12.45
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -11.3,
            -3,
            -7
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            11.3,
            -3,
            -7
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            8.2,
            -1,
            -11.4
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            0,
            -1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -8.2,
            -1,
            -11.4
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            0,
            -1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1,
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "t_motor21Horn",
        "screwActorId": "t_motor21HornScrew",
        "discSide": "front",
        "removeStep": 8,
        "removed": true,
        "moduleIndex": 2,
        "moduleLocalRemoveStep": 8,
        "globalRemoveStep": 58,
        "globalRemoveStepId": "t-roll-horns",
        "currentSeatedWorldMm": [
          17.5,
          90,
          3.5001060962677
        ],
        "newSeatedWorldMm": [
          17.5,
          90,
          7.550106096267701
        ],
        "seatedCorrectionWorldMm": [
          0,
          0,
          4.050000000000001
        ],
        "newDesiredQuaternionXYZW": [
          -0.7071067811865475,
          0.7071067811865476,
          0,
          0
        ],
        "newDesiredEulerXYZRadians": [
          -3.141592653589793,
          0,
          1.5707963267948966
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          -0.5,
          0.5000000000000001,
          -0.4999999999999999,
          0.5
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          17.5,
          90,
          5.500106096267701
        ],
        "preserveTrayWorldMm": [
          104,
          3.5,
          100
        ]
      },
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front sign selected to match removal action"
    },
    "h_motor32": {
      "sourceId": "head_yaw_2",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        34.00017070770264,
        30.00006103515625,
        20.000083923339844
      ],
      "oldDepthAxisIndex": 1,
      "oldFittedShaftLinePointLocalMm": [
        7.500000715255737,
        0,
        0
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          0,
          0.7071067811865475,
          0.7071067811865476,
          0
        ],
        "eulerXYZRadians": [
          -1.5707963267948966,
          0,
          -3.141592653589793
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        7.5,
        0,
        0
      ],
      "shaftAxisLocal": [
        0,
        1,
        0
      ],
      "shaftRadialAlignmentErrorMm": 7.152557373046875e-07,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            -1,
            0,
            0
          ],
          [
            0,
            0,
            1
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          0,
          0.7071067811865475,
          0.7071067811865476,
          0
        ],
        "translationMm": [
          7.5,
          12.45,
          0
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            1,
            0,
            -1.2246467991473532e-16
          ],
          [
            -1.2246467991473532e-16,
            0,
            -1
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          0.7071067811865475,
          -4.329780281177466e-17,
          -4.329780281177466e-17,
          0.7071067811865476
        ],
        "translationMm": [
          7.5,
          -12.45,
          0
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -3,
            7,
            -11.3
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            -3,
            7,
            11.3
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            -1,
            11.4,
            -8.2
          ],
          "normal": [
            0,
            1,
            0
          ],
          "tangent": [
            -1,
            0,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -1,
            11.4,
            8.2
          ],
          "normal": [
            0,
            1,
            0
          ],
          "tangent": [
            -1,
            0,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        0,
        1
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": null,
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front +Y convention chosen by old source socket cue; both source discs symmetric"
    },
    "h_motor33": {
      "sourceId": "head_roll_2",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        34.00014877319336,
        20.00042724609375,
        30.000044345855713
      ],
      "oldDepthAxisIndex": 2,
      "oldFittedShaftLinePointLocalMm": [
        7.500000238418579,
        6.103515625e-05,
        0
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            -1,
            0,
            0
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            -1
          ]
        ],
        "quaternionXYZW": [
          0,
          1,
          0,
          0
        ],
        "eulerXYZRadians": [
          -3.141592653589793,
          0,
          -3.141592653589793
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        7.5,
        0,
        0
      ],
      "shaftAxisLocal": [
        0,
        0,
        -1
      ],
      "shaftRadialAlignmentErrorMm": 6.103562190951096e-05,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            -1,
            0,
            0
          ],
          [
            0,
            1,
            0
          ],
          [
            0,
            0,
            -1
          ]
        ],
        "quaternionXYZW": [
          0,
          1,
          0,
          0
        ],
        "translationMm": [
          7.5,
          0,
          -12.45
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            1,
            0,
            -1.2246467991473532e-16
          ],
          [
            0,
            1,
            0
          ],
          [
            1.2246467991473532e-16,
            0,
            1
          ]
        ],
        "quaternionXYZW": [
          0,
          -6.123233995736766e-17,
          0,
          1
        ],
        "translationMm": [
          7.5,
          0,
          12.45
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -3,
            -11.3,
            -7
          ],
          "normal": [
            0,
            -1,
            0
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            -3,
            11.3,
            -7
          ],
          "normal": [
            0,
            1,
            0
          ],
          "tangent": [
            1,
            0,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            -1,
            -8.2,
            -11.4
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            -1,
            0,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -1,
            8.2,
            -11.4
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            -1,
            0,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        0,
        1
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "h_coreHorn",
        "screwActorId": "h_coreHornScrew",
        "discSide": "front",
        "removeStep": 5,
        "removed": true,
        "moduleIndex": 3,
        "moduleLocalRemoveStep": 5,
        "globalRemoveStep": 73,
        "globalRemoveStepId": "head-core-horn-wire",
        "currentSeatedWorldMm": [
          0,
          223.75,
          -6.65
        ],
        "newSeatedWorldMm": [
          -0.000247955322265625,
          223.74966430664062,
          -3.8501839160919182
        ],
        "seatedCorrectionWorldMm": [
          -0.000247955322265625,
          -0.000335693359375,
          2.799816083908082
        ],
        "newDesiredQuaternionXYZW": [
          0,
          1,
          0,
          0
        ],
        "newDesiredEulerXYZRadians": [
          -3.141592653589793,
          0,
          -3.141592653589793
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          0,
          0.7071067811865476,
          0,
          0.7071067811865475
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          -0.000247955322265625,
          223.74966430664062,
          -5.900183916091918
        ],
        "preserveTrayWorldMm": [
          77,
          213,
          -1
        ]
      },
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front sign selected to match removal action"
    },
    "h_mouthMotor": {
      "sourceId": "head_roll_0",
      "sourceVertexCount": 482,
      "oldEnvelopeMm": [
        29.000038146972656,
        20.00042724609375,
        34.00014877319336
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        4.57763671875e-05,
        -7.499998092651367
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "eulerXYZRadians": [
          3.141592653589793,
          1.5707963267948966,
          0
        ],
        "translationMm": [
          -0.5,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        -0.5,
        0,
        -7.5
      ],
      "shaftAxisLocal": [
        1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 4.5816086385590795e-05,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            1
          ],
          [
            0,
            -1,
            0
          ],
          [
            1,
            0,
            0
          ]
        ],
        "quaternionXYZW": [
          0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "translationMm": [
          11.95,
          0,
          -7.5
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            -1.2246467991473532e-16,
            0,
            -1
          ],
          [
            0,
            -1,
            0
          ],
          [
            -1,
            0,
            1.2246467991473532e-16
          ]
        ],
        "quaternionXYZW": [
          -0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "translationMm": [
          -12.95,
          0,
          -7.5
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -7.5,
            -11.3,
            3
          ],
          "normal": [
            0,
            -1,
            0
          ],
          "tangent": [
            0,
            0,
            1
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            -7.5,
            11.3,
            3
          ],
          "normal": [
            0,
            1,
            0
          ],
          "tangent": [
            0,
            0,
            1
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            10.9,
            8.2,
            1
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            1
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            10.9,
            -8.2,
            1
          ],
          "normal": [
            1,
            0,
            0
          ],
          "tangent": [
            0,
            0,
            1
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1,
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": {
        "actorId": "h_mouthHorn",
        "screwActorId": "h_mouthHornScrew",
        "discSide": "front",
        "removeStep": 8,
        "removed": true,
        "moduleIndex": 3,
        "moduleLocalRemoveStep": 8,
        "globalRemoveStep": 76,
        "globalRemoveStepId": "head-mouth-horn-wire",
        "currentSeatedWorldMm": [
          41.25,
          226.55,
          41
        ],
        "newSeatedWorldMm": [
          37.94973297119141,
          226.55020141601562,
          40.99979591369629
        ],
        "seatedCorrectionWorldMm": [
          -3.300267028808591,
          0.00020141601561363132,
          -0.0002040863037109375
        ],
        "newDesiredQuaternionXYZW": [
          0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "newDesiredEulerXYZRadians": [
          3.141592653589793,
          1.5707963267948966,
          0
        ],
        "ifKeepingOldActorRotationChildQuaternionXYZW": [
          0.7071067811865475,
          0,
          0.7071067811865476,
          0
        ],
        "newRetainingHeadOuterFaceWorldMm": [
          39.999732971191406,
          226.55020141601562,
          40.99979591369629
        ],
        "preserveTrayWorldMm": [
          77,
          204,
          -1
        ]
      },
      "fixedDiscPolicySourceMatched": "photographed batch: both discs; main rear always retained, secondary front follows ID policy",
      "frontSideEvidence": "front disc side fixed by old single disc and removal action"
    },
    "h_motor30": {
      "sourceId": "neck_pitch_3",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        30.000021934509277,
        34.00006103515625,
        20.000207901000977
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        -7.5,
        2.765655517578125e-05
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "eulerXYZRadians": [
          -1.5707963267948966,
          -1.5707963267948966,
          0
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        -7.5,
        0
      ],
      "shaftAxisLocal": [
        -1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 2.765655517578125e-05,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            1,
            0,
            0
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          -0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          -12.45,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            1.2246467991473532e-16,
            0,
            1
          ],
          [
            -1,
            0,
            1.2246467991473532e-16
          ],
          [
            0,
            -1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5000000000000001,
          0.5,
          -0.5,
          0.5
        ],
        "translationMm": [
          12.45,
          -7.5,
          0
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -7,
            3,
            -11.3
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            -7,
            3,
            11.3
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            -11.4,
            1,
            8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -11.4,
            1,
            -8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        1,
        0
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": null,
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front -X convention chosen by old source socket cue; both source discs symmetric"
    },
    "h_motor31": {
      "sourceId": "neck_pitch_1",
      "sourceVertexCount": 754,
      "oldEnvelopeMm": [
        30.000021934509277,
        34.00006103515625,
        20.000207901000977
      ],
      "oldDepthAxisIndex": 0,
      "oldFittedShaftLinePointLocalMm": [
        0,
        7.5,
        -2.574920654296875e-05
      ],
      "bodyParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          0.5,
          0.5,
          -0.5
        ],
        "eulerXYZRadians": [
          1.5707963267948966,
          -1.5707963267948966,
          0
        ],
        "translationMm": [
          0,
          0,
          0
        ],
        "scale": 1000
      },
      "shaftPointLocalMm": [
        0,
        7.5,
        0
      ],
      "shaftAxisLocal": [
        -1,
        0,
        0
      ],
      "shaftRadialAlignmentErrorMm": 2.574920654296875e-05,
      "frontHornParent": {
        "rotationMatrixRows": [
          [
            0,
            0,
            -1
          ],
          [
            -1,
            0,
            0
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          -0.5,
          0.5,
          0.5,
          -0.5
        ],
        "translationMm": [
          -12.45,
          7.5,
          0
        ],
        "scale": 1000
      },
      "rearHornParent": {
        "rotationMatrixRows": [
          [
            1.2246467991473532e-16,
            0,
            1
          ],
          [
            1,
            0,
            -1.2246467991473532e-16
          ],
          [
            0,
            1,
            0
          ]
        ],
        "quaternionXYZW": [
          0.5000000000000001,
          0.5,
          0.5,
          0.5
        ],
        "translationMm": [
          12.45,
          7.5,
          0
        ],
        "scale": 1000
      },
      "oldPorts": [
        {
          "id": "bus-a",
          "position": [
            -7,
            -3,
            -11.3
          ],
          "normal": [
            0,
            0,
            -1
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        },
        {
          "id": "bus-b",
          "position": [
            -7,
            -3,
            11.3
          ],
          "normal": [
            0,
            0,
            1
          ],
          "tangent": [
            0,
            1,
            0
          ],
          "evidence": "source-face-cue; illustrative-socket; pinout-unverified"
        }
      ],
      "nativePorts": [
        {
          "id": "native-minus-y",
          "position": [
            -11.4,
            -1,
            -8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            -1,
            0
          ],
          "nativePositionMm": [
            1,
            -8.2,
            11.4
          ]
        },
        {
          "id": "native-plus-y",
          "position": [
            -11.4,
            -1,
            8.2
          ],
          "normal": [
            -1,
            0,
            0
          ],
          "tangent": [
            0,
            -1,
            0
          ],
          "nativePositionMm": [
            1,
            8.2,
            11.4
          ]
        }
      ],
      "replaceOldPortSlotsWithNativeIndex": [
        0,
        1
      ],
      "portSlotAssignmentGeometricallyAmbiguous": false,
      "portSlotAssignmentMeaning": "nearest geometric assignment only; no verified bus identity or electrical pin mapping",
      "existingHorn": null,
      "fixedDiscPolicySourceMatched": "both independent discs, except side owned by existing horn actor",
      "frontSideEvidence": "front -X convention chosen by old source socket cue; both source discs symmetric"
    }
  },
  "hornNodes": {
    "frontFile": "models/servo-horn.glb",
    "rearFile": "models/servo-rear-horn.glb",
    "nativeGeometrySameOrientation": true,
    "discNodes": [
      "eight-hole-disc",
      "shaft-hub"
    ],
    "retainingScrewNode": "retaining-screw",
    "nativeDiscSeatMm": [
      0,
      0,
      0
    ],
    "nativeBoundsZMm": [
      -0.95,
      2.05
    ],
    "retainingScrewBoundsZMm": [
      1.5,
      2.05
    ],
    "screwActorRecenterMm": [
      0,
      0,
      2.05
    ],
    "screwActorRecenterMeaning": "Subtract [0,0,0.00205] metres from retaining-screw mesh in native coordinates; bind outer head face to screw actor position. Actor local +Z is outward after adapter. Retaining head only; no shaft or pointed supplied screw is invented.",
    "noDuplicateRule": "Existing Horn actor owns its disc side and existing HornScrew actor owns retaining-screw. Exclude those nodes from fixed body group; never combine complete hd1910-servo.glb with separate discs.",
    "sourceMatchedRearFor482": "Original motor/l_motor/h_mouthMotor sources contained only an opposite small hub. The confirmed photographed-batch rule adds the main rear disc in the runtime factory. Both shaft-hub nodes stay on the servo; detached actors contain only the secondary disc. Physical fit remains unverified."
  },
  "sockets": {
    "nativePorts": [
      {
        "id": "native-minus-y",
        "position": [
          1,
          -8.2,
          11.4
        ],
        "normal": [
          0,
          0,
          1
        ],
        "tangent": [
          1,
          0,
          0
        ]
      },
      {
        "id": "native-plus-y",
        "position": [
          1,
          8.2,
          11.4
        ],
        "normal": [
          0,
          0,
          1
        ],
        "tangent": [
          1,
          0,
          0
        ]
      }
    ],
    "nativeOpeningPlaneZMm": 11.4,
    "replaceSyntheticSockets": true,
    "reason": "servo-body.glb already includes socket shells and contacts. Existing prototype-v3.mjs synthesized servoSocket geometry would duplicate them.",
    "plugDockOffsetMm": 2.25,
    "oldOffsetMm": 1.65,
    "formula": "dock_actor_local = t_body + R_body * socketNativePositionMm + R_body*[0,0,1]*2.25. World = actorPosePosition + actorQuaternion*dock_actor_local."
  },
  "cable": {
    "file": "models/servo-cable.glb",
    "wireNodeNames": [
      "wire-1",
      "wire-2",
      "wire-3"
    ],
    "nativeWireRadiusMm": 0.52,
    "nativeWireSpacingMm": 1.3,
    "plugDimensionsMm": [
      7.5,
      4.5,
      5.6
    ],
    "nativeMatingFaceDirection": [
      0,
      1,
      0
    ],
    "nativeMatingFaceOffsetMm": 2.25,
    "canonicalMatingFaceDirection": [
      0,
      0,
      -1
    ],
    "canonicalAdapterEulerXYZRadians": [
      -1.5707963267948966,
      0,
      0
    ],
    "canonicalAdapterQuaternionXYZW": [
      -0.7071067811865475,
      0,
      0,
      0.7071067811865476
    ],
    "adapterFormula": "socketQuaternion(port) * Rx(-pi/2); native +Y -> -port.normal, native +X -> port.tangent, native +Z -> port.normal cross port.tangent",
    "ends": [
      {
        "end": 0,
        "nodeNames": [
          "white-plug-0",
          "plug-contact-0-0",
          "plug-contact-0-1",
          "plug-contact-0-2"
        ],
        "nativeCentreMm": [
          0,
          0,
          -67
        ],
        "recenterSubtractMetres": [
          0,
          0,
          -0.067
        ],
        "nativeWireExitAnchorRelativeMm": [
          0,
          0,
          2
        ],
        "nativeWireExitTangent": [
          0,
          0,
          1
        ],
        "canonicalWireExitAnchorRelativeMm": [
          0,
          2,
          0
        ],
        "canonicalWireExitTangent": [
          0,
          1,
          0
        ]
      },
      {
        "end": 1,
        "nodeNames": [
          "white-plug-1",
          "plug-contact-1-0",
          "plug-contact-1-1",
          "plug-contact-1-2"
        ],
        "nativeCentreMm": [
          0,
          0,
          67
        ],
        "recenterSubtractMetres": [
          0,
          0,
          0.067
        ],
        "nativeWireExitAnchorRelativeMm": [
          0,
          0,
          -2
        ],
        "nativeWireExitTangent": [
          0,
          0,
          -1
        ],
        "canonicalWireExitAnchorRelativeMm": [
          0,
          -2,
          0
        ],
        "canonicalWireExitTangent": [
          0,
          -1,
          0
        ]
      }
    ],
    "individualNativeWireExitAnchors": "add native X offsets [-1.3,0,1.3] mm to the listed centre-line exit anchor; original source wire endpoints at z +/-65 mm. Native wire actual tube extrema extend to +/-65.37039 due bend cross-section.",
    "routing": "Keep extracted plug meshes at physical size. Rebuild 3 black tubes along teaching path, anchored at transformed plug wireExit anchors. Do not uniformly scale/deform both white plugs to fit fixed 134 mm original centre separation. The socket neighbor should follow transformed side exit tangent instead of assuming normal-axis wire exit.",
    "materials": "Clone PBR material objects with maps retained. servo-body photographed-label material real-HD1910M-label contains embedded texture; never replace it by actor color."
  },
  "limitations": [
    "Axis line and 34x20x23 housing align to existing source geometry; this is not collision, bore, tolerance, physical fit, cable length or electrical validation.",
    "Two-sided old source geometry does not identify front vs back. Explicit front sign conventions are recorded per actor; their source shaft line remains exact regardless of sign.",
    "New socket locations and plug construction are approved appearance estimates. Geometric nearest port-slot assignment does not identify real daisy-chain ports or pins.",
    "New 29 mm full disc envelope is 1 mm shorter than older 30 mm double-disc source; do not stretch it to 30 or shrink to 23. Old removal seated actors were deliberately offset outside old geometry; reset initial seat to new 12.45 mm native seating and preserve tray endpoints/action order.",
    "Original retaining-screw node is an estimated visible head, not a verified full screw. The unknown supplied short pointed screw remains excluded."
  ]
};
