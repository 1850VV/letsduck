import type {Mount} from './types.js';
// Measured from planar circular boundaries in the existing source geometry.
// Source hash and fitting residuals: output/fullrobot-audit/geometry/holes.json.
// Position validation is against the current mesh, not physical tolerances.
export const LEG_MOUNTS: Record<string,Mount>={
  "r_support": {
    "end": [
      -42.50143814086914,
      79.66496552841134,
      -0.37224236860921067
    ],
    "rotation": [
      0.12050389550406526,
      0,
      0
    ]
  },
  "l_support": {
    "end": [
      42.50136184692383,
      79.66555934554418,
      -0.3696711835102171
    ],
    "rotation": [
      0.12027039021351404,
      0,
      0
    ]
  },
  "shankScrew0": {
    "end": [
      -34.7465705871582,
      48.46733856201172,
      -25.757591247558594
    ],
    "holeSource": "P6-04",
    "holeRadius": 2.25
  },
  "shankScrew1": {
    "end": [
      -34.73723220825195,
      48.47975158691406,
      -9.757575035095215
    ],
    "holeSource": "P6-04",
    "holeRadius": 2.25
  },
  "l_shankScrew0": {
    "end": [
      34.742698669433594,
      48.48811340332031,
      -25.760448455810547
    ],
    "holeSource": "P6-05",
    "holeRadius": 2.25
  },
  "l_shankScrew1": {
    "end": [
      34.743717193603516,
      48.48530197143555,
      -9.760425567626953
    ],
    "holeSource": "P6-05",
    "holeRadius": 2.25
  },
  "footScrew0": {
    "end": [
      -68.38321685791016,
      20.158418655395508,
      -17.124330520629883
    ],
    "holeSource": "P2-03",
    "holeRadius": 2.05
  },
  "footScrew1": {
    "end": [
      -67.38654327392578,
      25.67467498779297,
      -10.67057991027832
    ],
    "holeSource": "P2-03",
    "holeRadius": 2.05
  },
  "footScrew2": {
    "end": [
      -68.1020278930664,
      26.63258934020996,
      -22.623559951782227
    ],
    "holeSource": "P2-03",
    "holeRadius": 2.05
  },
  "footScrew3": {
    "end": [
      -67.64042663574219,
      32.136817932128906,
      -16.163537979125977
    ],
    "holeSource": "P2-03",
    "holeRadius": 2.05
  },
  "l_footScrew0": {
    "end": [
      68.10221862792969,
      21.08445167541504,
      -17.215757369995117
    ],
    "holeSource": "P2-04",
    "holeRadius": 2.05
  },
  "l_footScrew1": {
    "end": [
      67.42668151855469,
      26.674983978271484,
      -10.849828720092773
    ],
    "holeSource": "P2-04",
    "holeRadius": 2.05
  },
  "l_footScrew2": {
    "end": [
      67.58781433105469,
      27.450151443481445,
      -22.823684692382812
    ],
    "holeSource": "P2-04",
    "holeRadius": 2.05
  },
  "l_footScrew3": {
    "end": [
      66.92704772949219,
      33.041290283203125,
      -16.457895278930664
    ],
    "holeSource": "P2-04",
    "holeRadius": 2.05
  },
  "r_supportScrew0": {
    "end": [
      -41.551273345947266,
      81.99899540692435,
      -4.499459435996008
    ],
    "holeSource": "P5-04",
    "holeRadius": 1.1
  },
  "r_supportScrew1": {
    "end": [
      -41.56106185913086,
      90.49794725976977,
      -25.749898027972733
    ],
    "holeSource": "P5-04",
    "holeRadius": 1.1
  },
  "r_supportScrew2": {
    "end": [
      -41.55855941772461,
      90.4987064231556,
      -9.749872166700404
    ],
    "holeSource": "P5-04",
    "holeRadius": 1.1
  },
  "r_supportScrew3": {
    "end": [
      -41.56343460083008,
      97.99892986159115,
      -4.500241195550071
    ],
    "holeSource": "P5-04",
    "holeRadius": 1.1
  },
  "l_supportScrew0": {
    "end": [
      41.55044174194336,
      81.99898979205203,
      -4.4993670159567625
    ],
    "holeSource": "P5-05",
    "holeRadius": 1.1
  },
  "l_supportScrew1": {
    "end": [
      41.53935623168945,
      90.49795829318217,
      -25.749811292799066
    ],
    "holeSource": "P5-05",
    "holeRadius": 1.1
  },
  "l_supportScrew2": {
    "end": [
      41.5412712097168,
      90.49869917119612,
      -9.749751783411693
    ],
    "holeSource": "P5-05",
    "holeRadius": 1.1
  },
  "l_supportScrew3": {
    "end": [
      41.53438186645508,
      97.99901030382006,
      -4.500214432014186
    ],
    "holeSource": "P5-05",
    "holeRadius": 1.1
  },
  "r_joinScrew0": {
    "end": [
      -32.7369270324707,
      61.97280502319336,
      -17.769258499145508
    ],
    "holeSource": "P6-04",
    "holeRadius": 2
  },
  "r_joinScrew1": {
    "end": [
      -32.73836135864258,
      67.9681396484375,
      -23.773914337158203
    ],
    "holeSource": "P6-04",
    "holeRadius": 2
  },
  "r_joinScrew2": {
    "end": [
      -32.73106384277344,
      67.97747039794922,
      -11.773927688598633
    ],
    "holeSource": "P6-04",
    "holeRadius": 2
  },
  "r_joinScrew3": {
    "end": [
      -32.732505798339844,
      73.97279357910156,
      -17.778579711914062
    ],
    "holeSource": "P6-04",
    "holeRadius": 2
  },
  "l_joinScrew0": {
    "end": [
      32.73992919921875,
      61.98621368408203,
      -17.757949829101562
    ],
    "holeSource": "P6-05",
    "holeRadius": 2
  },
  "l_joinScrew1": {
    "end": [
      32.73807907104492,
      67.98725891113281,
      -23.756906509399414
    ],
    "holeSource": "P6-05",
    "holeRadius": 2
  },
  "l_joinScrew2": {
    "end": [
      32.73887634277344,
      67.98516082763672,
      -11.756895065307617
    ],
    "holeSource": "P6-05",
    "holeRadius": 2
  },
  "l_joinScrew3": {
    "end": [
      32.73701858520508,
      73.9862289428711,
      -17.755840301513672
    ],
    "holeSource": "P6-05",
    "holeRadius": 2
  },
  "r_topScrew0": {
    "end": [
      -33.747859954833984,
      83.98810577392578,
      17.99741554260254
    ],
    "holeSource": "P3-04",
    "holeRadius": 2
  },
  "r_topScrew1": {
    "end": [
      -33.752315521240234,
      89.98458862304688,
      11.993860244750977
    ],
    "holeSource": "P3-04",
    "holeRadius": 2
  },
  "r_topScrew2": {
    "end": [
      -33.751468658447266,
      89.99163818359375,
      23.993858337402344
    ],
    "holeSource": "P3-04",
    "holeRadius": 2
  },
  "r_topScrew3": {
    "end": [
      -33.755916595458984,
      95.98812866210938,
      17.990325927734375
    ],
    "holeSource": "P3-04",
    "holeRadius": 2
  },
  "l_topScrew0": {
    "end": [
      33.76100158691406,
      84.00247955322266,
      18.00724983215332
    ],
    "holeSource": "P3-05",
    "holeRadius": 2
  },
  "l_topScrew1": {
    "end": [
      33.75639724731445,
      90.00445556640625,
      12.009202003479004
    ],
    "holeSource": "P3-05",
    "holeRadius": 2
  },
  "l_topScrew2": {
    "end": [
      33.7487678527832,
      90.00049591064453,
      24.009201049804688
    ],
    "holeSource": "P3-05",
    "holeRadius": 2
  },
  "l_topScrew3": {
    "end": [
      33.74417495727539,
      96.00249481201172,
      18.011192321777344
    ],
    "holeSource": "P3-05",
    "holeRadius": 2
  },
  "r_soleScrew0": {
    "end": [
      -63.42282485961914,
      4.615733623504639,
      11.672118186950684
    ],
    "holeSource": "P1-03",
    "holeRadius": 1.85
  },
  "r_soleScrew1": {
    "end": [
      -33.43179702758789,
      5.254670143127441,
      11.31035041809082
    ],
    "holeSource": "P1-03",
    "holeRadius": 1.85
  },
  "r_soleScrew2": {
    "end": [
      -64.05502319335938,
      8.33270263671875,
      -34.17311477661133
    ],
    "holeSource": "P1-03",
    "holeRadius": 1.85
  },
  "r_soleScrew3": {
    "end": [
      -34.06399917602539,
      8.971637725830078,
      -34.534854888916016
    ],
    "holeSource": "P1-03",
    "holeRadius": 1.85
  },
  "l_soleScrew0": {
    "end": [
      33.659996032714844,
      5.333556652069092,
      11.386092185974121
    ],
    "holeSource": "P1-04",
    "holeRadius": 1.85
  },
  "l_soleScrew1": {
    "end": [
      63.652278900146484,
      5.855447769165039,
      11.823500633239746
    ],
    "holeSource": "P1-04",
    "holeRadius": 1.85
  },
  "l_soleScrew2": {
    "end": [
      34.27771759033203,
      8.305024147033691,
      -34.51367950439453
    ],
    "holeSource": "P1-04",
    "holeRadius": 1.85
  },
  "l_soleScrew3": {
    "end": [
      64.27001190185547,
      8.826912879943848,
      -34.07624435424805
    ],
    "holeSource": "P1-04",
    "holeRadius": 1.85
  }
};
