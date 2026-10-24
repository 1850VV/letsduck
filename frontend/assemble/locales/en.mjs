// Static assembly copy. Machine-drafted, technical-reference corrections; native review pending.
export default {
  "version": 1,
  "steps": {
    "prepare-intro": {
      "short": "Take a look at the complete robot first",
      "title": "Understand the complete machine and assembly route",
      "text": "First look at the whole machine, then complete the preparation, legs, body, head and neck, final assembly and calibration in sequence.",
      "check": "This is the independent teaching prototype. You can use \"Complete Preview\" to return to the completed state at any time.",
      "caption": ""
    },
    "prepare-boards": {
      "short": "Temporarily plug two boards together",
      "title": "Temporarily plug UNO Q and expansion board",
      "text": "Align the pin headers and female headers of the two boards and press them together in the same direction. The two boards are two separate objects in the tutorial.",
      "check": "Features confirmed photo model. The four sets of 32 pins are aligned according to the modeling coordinates; PCB and the interface are not stretched according to the total envelope. Board clearance, key locations, electrical mapping and physical fit are still to be verified.",
      "caption": "Align the pin header and female header and press them together"
    },
    "prepare-battery": {
      "short": "Connect test battery",
      "title": "Plug in temporary power battery",
      "text": "Insert the battery connector according to the original piece to prepare power supply for the next single servo configuration.",
      "check": "The video reminds you to pay attention to polarity; this prototype does not estimate the actual pins or polarity based on the appearance.",
      "caption": "Power plug and direction are subject to physical verification"
    },
    "prepare-servo": {
      "short": "Connect a servo",
      "title": "Only connect one servo to be configured at a time",
      "text": "First plug the three-core wire into servo, and then plug the other end into the board. Currently only this one is connected to test servo.",
      "check": "After completing the numbering of the current one, disconnect and replace the next one.",
      "caption": "Single servo · Plug in place"
    },
    "prepare-usb": {
      "short": "Turn on the computer and connect it",
      "title": "Power on and connect to Type-C",
      "text": "Press video to turn on the power, and then connect the computer with the Type-C cable.",
      "check": "This page only demonstrates the connection sequence and does not start or connect real devices.",
      "caption": "Power on · Connect to Type-C"
    },
    "prepare-app": {
      "short": "Import and run the application",
      "title": "Import and run the application at Arduino App Lab",
      "text": "Import the XGO Duck application into your computer and run it. The original video does not fully show the first environment installation.",
      "check": "This step provides video comparison and instructional instructions; there is no actual App Lab session here.",
      "caption": "Application startup · Tutorial instructions"
    },
    "prepare-scan": {
      "short": "Scan and center",
      "title": "Enter Servo setup, scan and center the current servo",
      "text": "Open your own device configuration address and enter Servo setup. Scan all IDs → After finding a single one Stop scan → Move to 2047 → Write.",
      "check": "Due to different environments, the device IP and host name do not copy the fixed address of the source video.",
      "caption": "Scan → Stop → 2047 → Write"
    },
    "prepare-id": {
      "short": "Write parameters and ID",
      "title": "Write the parameters and set the target ID",
      "text": "The video parameters are KP=5 and KD=20, click Write; fill in the target ID, execute Change ID and confirm success.",
      "check": "This is the configuration sequence in the video; the current web page does not send parameters to servo.",
      "caption": "KP 5 · KD 20 · Change ID"
    },
    "prepare-all-ids": {
      "short": "Complete 15 and ID one by one",
      "title": "Complete the numbering and centering of the fifteen servos one by one",
      "text": "Complete 10–14, 20–24, 30–34 in order. Only configure one at a time. Subsequent mechanical installation begins from a numbered, centered state.",
      "check": "The fifteen ID on this page are an instructional list and do not represent that real devices have been written or centered.",
      "caption": "15 ID · Processed one by one"
    },
    "r-prepare": {
      "short": "Prepare parts",
      "title": "Prepare right ankle parts",
      "text": "Prepare numbered, centered ID14 servo, as well as the ball of the foot, calf, bearing and ankle shaft on this side.",
      "check": "servo numbering and centering should be completed before mechanical installation.",
      "caption": ""
    },
    "r-horn": {
      "short": "Remove servo horn",
      "title": "Remove servo horn",
      "text": "First unscrew the original fixing screw in the center of the servo horn, and then remove the black servo horn along the direction of the output shaft.",
      "check": "Set aside the servo horn and the original screws; later steps will not replace it with self-tapping screws.",
      "caption": "Remove the central screw first, then remove the servo horn"
    },
    "r-plug": {
      "short": "Plug in the cable",
      "title": "Plug in the servo line",
      "text": "Align the terminal hole of the plug with the protrusion of the interface, insert it in the direction of the interface, and then press it into place.",
      "check": "Check the plug direction clearly. The plugging action is demonstrated here. The pin definition of the three-core wire still needs to be verified physically.",
      "caption": "Align the interface and press it in place"
    },
    "r-shank": {
      "short": "Fixed calf",
      "title": "Fixed lower leg connector",
      "text": "Fit the white lower leg connector to servo, align the mounting holes, and then screw in two M2×6 countersunk head self-tapping screws.",
      "check": "The long end of the connector points upward. Align the holes first and then fix them. No screws are needed to pull the skewed parts into place.",
      "caption": "Correct hole · M2×6 ×2"
    },
    "r-foot": {
      "short": "Fit into the sole of the foot",
      "title": "Install servo into the sole of the foot",
      "text": "Put the module composed of servo and calf connector into the sole of the foot, and fix the four M2×6 countersunk head self-tapping screws as shown in the video.",
      "check": "First confirm the orientation of the soles of the feet and joints, and then fix the four positions. The cables remain on the outside.",
      "caption": "Fixed foot · M2×6 ×4"
    },
    "r-small-bearing": {
      "short": "Press bearing",
      "title": "Press in the small bearing",
      "text": "Align the small bearing with the circular mounting hole on the sole of the foot and press it in along the axial direction.",
      "check": "bearing needs to sit upright, with the center hole and the connector coaxial. The model number corresponds to 10×15×3 mm according to the list.",
      "caption": "Press in axially"
    },
    "r-axle": {
      "short": "Install the ankle shaft",
      "title": "Align and install the ankle shaft",
      "text": "Align the middle hole, place the printed ankle axis in the center of bearing, and then manually screw in the M2.3×8 self-tapping screw.",
      "check": "The ankle axis uses the existing 3MF grid; the positioning here has been adjusted for display and has not been verified for physical fit.",
      "caption": "Align bearing center"
    },
    "r-tighten": {
      "short": "Fixed check",
      "title": "Tighten and check",
      "text": "Screw in the M2.3×8 screw axially until the screw head rests against the surface, then check the ankle connection.",
      "check": "The video calls for the screw head to fit snugly and the end to come out the other side. The prototype only demonstrates motion and does not simulate actual torque or tolerances.",
      "caption": "Tighten until the screw head fits"
    },
    "r-ankle-done": {
      "short": "Complete viewing",
      "title": "The right ankle is installed",
      "text": "You can rotate the inspection before continuing to the next stage. Sole pads are installed during the finishing phase of the legs.",
      "check": "The underfoot cushions are not yet installed in this section; they are installed later in the video on the legs.",
      "caption": ""
    },
    "l-prepare": {
      "short": "Prepare parts",
      "title": "Prepare left ankle parts",
      "text": "Prepare numbered, centered ID24 servo, as well as the ball of the foot, calf, bearing and ankle shaft on this side.",
      "check": "servo numbering and centering should be completed before mechanical installation.",
      "caption": ""
    },
    "l-horn": {
      "short": "Remove servo horn",
      "title": "Remove servo horn",
      "text": "First unscrew the original fixing screw in the center of the servo horn, and then remove the black servo horn along the direction of the output shaft.",
      "check": "Set aside the servo horn and the original screws; later steps will not replace it with self-tapping screws.",
      "caption": "Remove the central screw first, then remove the servo horn"
    },
    "l-plug": {
      "short": "Plug in the cable",
      "title": "Plug in the servo line",
      "text": "Align the terminal hole of the plug with the protrusion of the interface, insert it in the direction of the interface, and then press it into place.",
      "check": "Check the plug direction clearly. The plugging action is demonstrated here. The pin definition of the three-core wire still needs to be verified physically.",
      "caption": "Align the interface and press it in place"
    },
    "l-shank": {
      "short": "Fixed calf",
      "title": "Fixed lower leg connector",
      "text": "Fit the white lower leg connector to servo, align the mounting holes, and then screw in two M2×6 countersunk head self-tapping screws.",
      "check": "The long end of the connector points upward. Align the holes first and then fix them. No screws are needed to pull the skewed parts into place.",
      "caption": "Correct hole · M2×6 ×2"
    },
    "l-foot": {
      "short": "Fit into the sole of the foot",
      "title": "Install servo into the sole of the foot",
      "text": "Put the module composed of servo and calf connector into the sole of the foot, and fix the four M2×6 countersunk head self-tapping screws as shown in the video.",
      "check": "First confirm the orientation of the soles of the feet and joints, and then fix the four positions. The cables remain on the outside.",
      "caption": "Fixed foot · M2×6 ×4"
    },
    "l-small-bearing": {
      "short": "Press bearing",
      "title": "Press in the small bearing",
      "text": "Align the small bearing with the circular mounting hole on the sole of the foot and press it in along the axial direction.",
      "check": "bearing needs to sit upright, with the center hole and the connector coaxial. The model number corresponds to 10×15×3 mm according to the list.",
      "caption": "Press in axially"
    },
    "l-axle": {
      "short": "Install the ankle shaft",
      "title": "Align and install the ankle shaft",
      "text": "Align the middle hole, place the printed ankle axis in the center of bearing, and then manually screw in the M2.3×8 self-tapping screw.",
      "check": "The ankle axis uses the existing 3MF grid; the positioning here has been adjusted for display and has not been verified for physical fit.",
      "caption": "Align bearing center"
    },
    "l-tighten": {
      "short": "Fixed check",
      "title": "Tighten and check",
      "text": "Screw in the M2.3×8 screw axially until the screw head rests against the surface, then check the ankle connection.",
      "check": "The video calls for the screw head to fit snugly and the end to come out the other side. The prototype only demonstrates motion and does not simulate actual torque or tolerances.",
      "caption": "Tighten until the screw head fits"
    },
    "l-ankle-done": {
      "short": "Complete viewing",
      "title": "The left ankle is installed",
      "text": "You can rotate the inspection before continuing to the next stage. Sole pads are installed during the finishing phase of the legs.",
      "check": "The underfoot cushions are not yet installed in this section; they are installed later in the video on the legs.",
      "caption": ""
    },
    "r-pair": {
      "short": "Align double servo",
      "title": "Align the two servo on the right leg",
      "text": "Arrange ID12 / ID13 by video, align pair servo. The left and right in the picture are the shooting angle, not directly equal to the left and right of the robot.",
      "check": "Keep the other completed ankle; check the current side.",
      "caption": "Check servo with direction"
    },
    "r-support": {
      "short": "Fixed thigh support",
      "title": "Fixed double eyelet thigh support",
      "text": "Fit the white double round hole support to the pair of servo, align the four fixed positions, and screw in the four M2×6 as shown in the video.",
      "check": "Check hole by hole and then fix. The hole position and installation fit are still prototype indications.",
      "caption": "M2×6 ×4 · Fixed support"
    },
    "r-bearing": {
      "short": "Press in the big bearing",
      "title": "Press into the large bearing that connects the ankle",
      "text": "Align 16×22×4 mm and large bearing with the support hole and press it in place along the axial direction.",
      "check": "bearing should sit upright and then connect the ankle that has been installed.",
      "caption": "Press in the large bearing along the axial direction"
    },
    "r-join": {
      "short": "Attached ankle",
      "title": "Attach the right ankle subassembly",
      "text": "Move the completed ankle and calf as a whole to the bearing position of the thigh support, and fix four M2×6.",
      "check": "There are already screws, ankles, and cables that move with the subassembly.",
      "caption": "Overall alignment · M2×6 ×4"
    },
    "r-wire-a": {
      "short": "Insert into leg cable harness",
      "title": "Plug in the visible leg bus",
      "text": "Plug in and tighten the visible three-pin servo line according to the video, leaving room for joint movement.",
      "check": "Mating and routing are demonstrated here; the exact connectors and pinouts at each end of each cable have not been verified.",
      "caption": "Plug cable harness · Endpoint diagram"
    },
    "r-wire-b": {
      "short": "Organize cable harness margin",
      "title": "Arrange cable harness and leave the upper connection line",
      "text": "Arrange the loop wire so that cable harness remains on the outside of the mechanism, and retain the subsequent wire ends connected to the body.",
      "check": "Do not pinch the thread, and do not judge the pin definition based on the appearance of the three-core black wire.",
      "caption": "Leave room for movement · No thread clamping"
    },
    "r-leg-done": {
      "short": "Right leg connection completed",
      "title": "Right leg connection part completed",
      "text": "Check the connected ankle, double servo brace and cable harness, then proceed to the next stage.",
      "check": "The upper connectors and underfoot cushions have not yet been installed.",
      "caption": ""
    },
    "l-pair": {
      "short": "Align double servo",
      "title": "Align the two servo on the left leg",
      "text": "Arrange ID23 / ID22 by video, align pair servo. The left and right in the picture are the shooting angle, not directly equal to the left and right of the robot.",
      "check": "Keep the other completed ankle; check the current side.",
      "caption": "Check servo with direction"
    },
    "l-support": {
      "short": "Fixed thigh support",
      "title": "Fixed double eyelet thigh support",
      "text": "Fit the white double round hole support to the pair of servo, align the four fixed positions, and screw in the four M2×6 as shown in the video.",
      "check": "Check hole by hole and then fix. The hole position and installation fit are still prototype indications.",
      "caption": "M2×6 ×4 · Fixed support"
    },
    "l-bearing": {
      "short": "Press in the big bearing",
      "title": "Press into the large bearing that connects the ankle",
      "text": "Align 16×22×4 mm and large bearing with the support hole and press it in place along the axial direction.",
      "check": "bearing should sit upright and then connect the ankle that has been installed.",
      "caption": "Press in the large bearing along the axial direction"
    },
    "l-join": {
      "short": "Attached ankle",
      "title": "Attach the left ankle subassembly",
      "text": "Move the completed ankle and calf as a whole to the bearing position of the thigh support, and fix four M2×6.",
      "check": "There are already screws, ankles, and cables that move with the subassembly.",
      "caption": "Overall alignment · M2×6 ×4"
    },
    "l-wire-a": {
      "short": "Insert into leg cable harness",
      "title": "Plug in the visible leg bus",
      "text": "Plug in and tighten the visible three-pin servo line according to the video, leaving room for joint movement.",
      "check": "Mating and routing are demonstrated here; the exact connectors and pinouts at each end of each cable have not been verified.",
      "caption": "Plug cable harness · Endpoint diagram"
    },
    "l-wire-b": {
      "short": "Organize cable harness margin",
      "title": "Arrange cable harness and leave the upper connection line",
      "text": "Arrange the loop wire so that cable harness remains on the outside of the mechanism, and retain the subsequent wire ends connected to the body.",
      "check": "Do not pinch the thread, and do not judge the pin definition based on the appearance of the three-core black wire.",
      "caption": "Leave room for movement · No thread clamping"
    },
    "l-leg-done": {
      "short": "The left leg is connected",
      "title": "The left leg connection part is completed",
      "text": "Check the connected ankle, double servo brace and cable harness, then proceed to the next stage.",
      "check": "The upper connectors and underfoot cushions have not yet been installed.",
      "caption": ""
    },
    "r-top-horn": {
      "short": "Remove the upper part of the right leg servo horn",
      "title": "Remove the original servo horn on the upper right leg",
      "text": "First remove the central fixing screw, then remove the servo horn and keep it next to it.",
      "check": "The upper end is processed according to the video here; do not remove the fixed ankle.",
      "caption": "Remove the central screw first, then take out the servo horn"
    },
    "l-top-horn": {
      "short": "Remove the upper part of the left leg servo horn",
      "title": "Remove the original servo horn on the upper left leg",
      "text": "Process the other leg in the mirror direction and remove the central screw and servo horn in sequence.",
      "check": "The original parts that were removed remain in the parts area.",
      "caption": "Keep the original parts that were removed"
    },
    "r-top-bearing": {
      "short": "Right connecting piece press bearing",
      "title": "First press bearing into the upper right connector",
      "text": "Press the large bearing into the separate upper connector and then attach the assembly to the leg.",
      "check": "Press bearing first, and then install the connector; do not reverse these two steps.",
      "caption": "First press bearing into the connector"
    },
    "r-top-link": {
      "short": "Install right connector",
      "title": "Fix the upper right connector with bearing",
      "text": "Align the connector that has been pressed into bearing to the upper end position and fix it with four M2×6.",
      "check": "The connector moves with the bearing inside it.",
      "caption": "Overall installation of components · M2×6 ×4"
    },
    "l-top-bearing": {
      "short": "Left connecting piece press bearing",
      "title": "Press bearing into the upper left connector",
      "text": "Press the large bearing into the connector on the other side, keeping the mirror orientation.",
      "check": "The left and right connectors use their own real meshes.",
      "caption": "Mirror direction · Press bearing first"
    },
    "l-top-link": {
      "short": "Install left connector",
      "title": "Fix the upper left connector with bearing",
      "text": "Install the connecting piece on the other side with bearing and fix it with four M2×6.",
      "check": "Check that the directions on both sides are consistent, leaving a connection position for subsequent body assembly.",
      "caption": "Overall installation of components · M2×6 ×4"
    },
    "r-sole": {
      "short": "Fixed right foot sole cushion",
      "title": "Install the right sole cushion",
      "text": "Fit the soft pad to the sole of your foot, align the four holes according to the video, and fix the four M2×6.",
      "check": "This is the sole cushion, not the thigh shell that comes later in the final assembly stage.",
      "caption": "Align the soles of your feet · M2×6 ×4"
    },
    "l-sole": {
      "short": "Fixed left sole cushion",
      "title": "Install left foot sole cushion",
      "text": "Install a soft pad on the bottom of the other foot and fix four M2×6 as shown in the video.",
      "check": "Check the status of the soles of both feet and cable harness, and then proceed to assemble the body and hips.",
      "caption": "Align the soles of your feet · M2×6 ×4"
    },
    "legs-complete": {
      "short": "Legs complete view",
      "title": "The two-leg subassembly is installed",
      "text": "You can now rotate to see both legs, or go back to any stage to see it again.",
      "check": "The current stage is 08:16; the next stage is to install the body hips, and then do the head, neck and electronic control assembly.",
      "caption": ""
    },
    "t-pair": {
      "short": "Arrange double servo",
      "title": "Arrange numbered ID20 and ID10",
      "text": "Arrange two centered servo according to the desktop perspective of the source video: ID20 on the left side of the screen and ID10 on the right side. Keep them original servo horn.",
      "check": "The left and right of the screen does not directly equal the left and right of the robot. The grid is placed according to the existing coordinates of the whole machine, and the installation fit is pending physical verification.",
      "caption": "Screen left 20 · Screen right 10"
    },
    "t-support": {
      "short": "fixed hip support",
      "title": "Secure the double round hole hip support with six screws",
      "text": "Place the P6-09 double round hole hip support on the two servo, align it and fix the six M2×6 countersunk head self-tapping screws.",
      "check": "Keep the bottom two holes in the middle as mentioned in the video, and do not add screws to these two holes. Animated screw anchor points are hole group representations.",
      "caption": "M2×6 ×6 · Leave the two middle holes at the bottom empty"
    },
    "t-wire": {
      "short": "Plugging and wiring",
      "title": "cable harness is visible at the inserted hip and comes out",
      "text": "Press the original piece to tighten the visible plugs on the two bodies servo, leaving aside the subsequent hip motor connection wires and the reserved wires for the motherboard. The reserved wire is led out from the opening.",
      "check": "The double socket is positioned as a simple teaching model according to the characteristics of the source mesh surface. The cable harness path, socket identity and pins have not been verified, and the two bodies servo are not drawn as interconnected without authorization.",
      "caption": "Plug it in axially first, then thread the wires, wiring diagram"
    },
    "t-backplate-front": {
      "short": "Install body back panel",
      "title": "Fit the back panel of the body and fix the two screws on the front",
      "text": "Align the P4-03 body back panel with the hip assembly, first fix the two M2×6 visible on the front of the original piece.",
      "check": "The back panel and cable harness should be fitted together first and then tightened, without sealing the thread into the seam. The hole positions are still for teaching purposes.",
      "caption": "Front M2×6 ×2"
    },
    "t-backplate-back": {
      "short": "fixed back",
      "title": "Secure the two screws on the back of the back panel",
      "text": "Continue working on the back and secure the other two M2×6. The two pcs on the front and the two pcs on the back of the back panel are demonstrated separately.",
      "check": "This step adds two new ones and does not count the previous group again.",
      "caption": "Back M2×6 ×2"
    },
    "t-yaw-r": {
      "short": "Install the right connector",
      "title": "Press bearing first, then install the right Yaw–Roll connector",
      "text": "First press the large bearing into the independent P6-06 connector, and then align the entire connector with bearing to the right side of the body. Finally, the fixing hole group is demonstrated.",
      "check": "Original film 09:41 You can see bearing in the connector. 10: 05 subtitles are four M2×6, but the number and hole group assignments on each side have yet to be verified; the animated screws are only indicated.",
      "caption": "First press bearing → Overall alignment · Hole group diagram"
    },
    "t-yaw-l": {
      "short": "Install the left connector",
      "title": "Install the left side bearing and the connector in the mirror direction",
      "text": "First press the other large bearing into the P6-07 independent connector, and then move this component to the left side of the body to fix it.",
      "check": "The source video 09:57 can be seen as bearing. The left and right parts use their own real grids; the number of screws and precise hole positions on each side need to be verified.",
      "caption": "Mirror direction · Press bearing first and then install the connector"
    },
    "t-roll-pair": {
      "short": "Take the hip servo",
      "title": "Remove the two hips ID21 and ID11 and servo",
      "text": "The desktop viewing angle of the source video is ID21 on the left and ID11 on the right. The two servo are first placed in the independent preparation position, and they have not yet been loaded into the body.",
      "check": "Check the number and centering status, and prepare to remove the original servo horn.",
      "caption": "Screen left 21 · Screen right 11"
    },
    "t-roll-horns": {
      "short": "Unload center servo horn",
      "title": "First remove the central screw, then remove the two original servo horn",
      "text": "Remove the original central fixing screws in sequence, and then remove servo horn along the axial direction. The small parts that were removed are kept in the parts area next to it.",
      "check": "The specifications of the original center screws have not been verified and they are not counted as M2×6 self-tapping screws.",
      "caption": "Remove the central screw first → then take out servo horn"
    },
    "t-motor-r": {
      "short": "Install right hip motor",
      "title": "After wiring, install the right side ID11 hip servo",
      "text": "According to the original piece, first connect the reserved wire on the body, and then connect the free end of the existing wire on the complete right leg. After two insertions are completed, put the ID11 into the right connector, and finally fix the two M2×6.",
      "check": "The wire ends and pins are for illustration only, and the polarity or bus branches cannot be determined based on the appearance of the black three-core wire. Preserve joint movement margin.",
      "caption": "Wire first → Alignment · M2×6 ×2"
    },
    "t-cover-r": {
      "short": "Install the right cover",
      "title": "Fix the right Roll servo cover with four screws",
      "text": "Fit the P6-02 cover plate to the right hip, make sure cable harness is not caught in the cover plate, and then fix the four M2×6 pieces.",
      "check": "After the cover is fixed, press bearing on the upper connector of the independent complete leg; the entire leg is not connected yet.",
      "caption": "Align the cover · M2×6 ×4"
    },
    "t-bearing-r": {
      "short": "Press the right large bearing",
      "title": "Before attaching the legs, press into the right interface size bearing",
      "text": "Press the screen after 11:18, press the new 16×22×4 mm large bearing axially into the upper connector of the independent right leg, and then prepare to connect to the body.",
      "check": "This is not the upper end bearing already installed in the leg module. This step only presses the new bearing, and the right leg is still in the ready position; coaxial fit is a signal.",
      "caption": "First press bearing · The intact leg will not move for the time being."
    },
    "t-join-r": {
      "short": "Access right leg",
      "title": "Attach the complete right leg subassembly to the body",
      "text": "Move the installed right leg as a whole to the body connection position, align it and fix the four M2×6. The screws on the legs, bearing and cable harness move together.",
      "check": "Move only this leg. The other leg remains in the preparation position; hole position and assembly tolerances still need to be physically verified.",
      "caption": "Complete right leg integration · M2×6 ×4"
    },
    "t-motor-l": {
      "short": "Install left hip motor",
      "title": "After wiring, install the other side ID21 hip servo",
      "text": "According to the mirror direction, first connect the reserved line on the body, and then connect the free end of the existing line on the complete left leg. After the two insertions are completed, install the ID21 into the connector and fix the two M2×6.",
      "check": "The finished right leg remains connected. The cable harness paths and endpoints continue to be marked as schematic and no electrical pins are inferred.",
      "caption": "Wire first → Alignment · M2×6 ×2"
    },
    "t-cover-l": {
      "short": "Install the left cover",
      "title": "Fix the other side Roll servo cover",
      "text": "Fit the P6-03 cover plate to the left hip, check that cable harness avoids seams, and then fix four M2×6 pieces.",
      "check": "The left leg is still in the independent preparation position. The next step is to install the new bearing on its upper connector.",
      "caption": "Align the cover · M2×6 ×4"
    },
    "t-bearing-l": {
      "short": "Press left large bearing",
      "title": "Before inserting the second leg, press bearing",
      "text": "Press 12:28 on the screen, press the other new large bearing into the upper connector of the independent left leg, and then connect the second complete leg.",
      "check": "The right leg has been installed; the left leg has not moved yet. The bearing posture and contact surface are illustrated using the existing model.",
      "caption": "Press bearing first · The left leg is still in the ready position"
    },
    "t-join-l": {
      "short": "Access left leg",
      "title": "Attach the second complete leg and secure it",
      "text": "Move the left leg sub-assembly to the body connection position as a whole, check the alignment and then fix four M2×6.",
      "check": "All installed parts on the left leg move together with cable harness; the right leg remains stationary.",
      "caption": "Complete left leg integration · M2×6 ×4"
    },
    "t-complete": {
      "short": "Check legs",
      "title": "Check the connection between body and legs",
      "text": "The body, hips servo and two legs are already connected in the prototype. Rotate to view the orientation of both sides, cover plate and cable harness reservation.",
      "check": "Only the animation status is verified here. The hole positions, tolerances, wire ends and physical load-bearing have not yet been accepted, and the next stage will continue with the head and neck and final assembly.",
      "caption": ""
    },
    "head-yaw-motor": {
      "short": "First bearing then servo",
      "title": "Press in bearing first, then fix ID32 and the first bracket",
      "text": "According to the original piece, first press one bearing into the first white bracket, then insert the numbered and centered ID32, and then fix four M2×6 after fitting. The first bracket uses P6-01.",
      "check": "bearing is schematically installed along the axis of the source mesh cylinder; the axial seat surface and physical fit tolerances still need to be verified.",
      "caption": "Press bearing first, then fit and fix M2×6 ×4"
    },
    "head-yaw-wire": {
      "short": "Plug-in swivel cord",
      "title": "Plug the servo line into ID32",
      "text": "Align the direction of the visible interface and press the plug into place; keep the subsequent line segment around the bracket.",
      "check": "The cable harness path and socket identity are for teaching purposes, and the pins and polarity need to be verified.",
      "caption": "Press in place · End point indication"
    },
    "head-bearings": {
      "short": "Press in bearing first",
      "title": "First press bearing on the independent bracket",
      "text": "Take the second white open-hole bracket P6-08, press bearing into the two bearing positions of the independent bracket according to the original piece, and then assemble ID33.",
      "check": "The first bearing has been installed on the first bracket; here are the other two on the second bracket. The axial position follows the source mesh, and the physical fit needs to be verified.",
      "caption": "Second bracket · Press in two bearing in sequence"
    },
    "head-roll-motor": {
      "short": "Load second servo",
      "title": "Install ID33 into the prepared bracket",
      "text": "According to the video, take ID33, align it with the bracket that has pressed bearing, and first fix the four M2×6 marked at the first part of the screen.",
      "check": "Subassembly ID32 and cable harness are retained; the final set of holes for both fixing locations remains to be verified.",
      "caption": "The first fixation · M2×6 ×4"
    },
    "head-core-join": {
      "short": "Combined rotation module",
      "title": "Connect the subcomponents of the two heads servo",
      "text": "Keep the ID32 sub-assembly in place, connect the ID33 bracket sub-assembly that has installed bearing as a whole, and then press the second mark on the screen to fix it with four M2×6.",
      "check": "P6-08 and its two bearing move with the ID33 subassembly; P6-01 and the first bearing remain on the ID32 side. The hole axis comes from the source mesh, and the physical fit needs to be verified.",
      "caption": "Overall docking and re-fixing of sub-assemblies M2×6 ×4"
    },
    "head-core-horn-wire": {
      "short": "Uninstall and connect",
      "title": "Remove the head output servo horn and wire it",
      "text": "First unscrew the original central fixing screw, then remove the servo horn and keep it next to it; then plug in the visible servo line.",
      "check": "The center original screw is not classified as M2 self-tapping. The output shaft and connector locations are still indicative.",
      "caption": "Remove the central screw first, then take out the servo horn"
    },
    "head-platform": {
      "short": "Put in the head platform",
      "title": "Put the rotating subassembly into the head platform as a whole",
      "text": "Place the connected head rotation subassembly into the P2-02 head platform as a whole. Let the connected wires come out of the opening.",
      "check": "bearing, installed screws, cable harness and plug move together; do not press the wire under the platform.",
      "caption": "The subassembly is placed as a whole and the wires are led out from the opening."
    },
    "head-mouth-prepare": {
      "short": "Check mouth servo",
      "title": "Remove one mouth piece servo and check the number",
      "text": "The subtitle of the servo in the source video reads \"Number 33\", and the official software defines the mouth as ID34; this prototype retains the ambiguity of 33 / 34, and the actual number needs to be verified.",
      "check": "Do not change the number of another ID33 based on this. Geometry only serves as an independent candidate for the mouth servo.",
      "caption": "Video 33 / Official 34 · To be verified"
    },
    "head-mouth-horn-wire": {
      "short": "Mouth servo unloading line",
      "title": "Remove the mouthpiece servo horn and plug in cable harness",
      "text": "First remove the central fixing screw, then remove the mouth servo horn and keep it. Insert the servo line according to the video and press it in place.",
      "check": "Numbering ambiguity remains. Connector keying, actual sockets, and pinouts are not confirmed by this animation.",
      "caption": "Remove the disk first and then plug in cable harness"
    },
    "head-mouth-jaw": {
      "short": "Install servo with chin",
      "title": "Put servo in your mouth and put it on your chin",
      "text": "First put the mouth part servo into the platform, and then align the two sides of the P2-01 chin with the drive shaft and support position. Let cable harness stay out of the opening.",
      "check": "This animation expresses the sequence relationship; the shaft holes on both sides, actual gaps and matching accuracy need to be verified.",
      "caption": "Put servo first · Then insert it into the chin"
    },
    "head-servo-support": {
      "short": "Cover the fixing",
      "title": "Install the head servo fixing piece",
      "text": "Mechanism that attaches the P4-02 head servo fixing piece to the platform. Press the first subtitle to fix four M2×6.",
      "check": "Keep your jaw mobile and avoid cable harness. The specific positions of the four holes are still indicative.",
      "caption": "The first hole group · M2×6 ×4"
    },
    "head-platform-fix": {
      "short": "Fixed chin output side",
      "title": "Four holes on the output side of the fixed chin",
      "text": "According to the instructions of the second four M2×6 on the original piece, fix it from the outside of the driving side of the chin. The four-hole axis of the P2-01 source mesh is used here.",
      "check": "The installed screws then open and close together with the chin. The source mesh hole axis can be verified, but the physical specifications and fit still need to be verified.",
      "caption": "Chin output side · M2×6 ×4"
    },
    "head-mouth-check": {
      "short": "Check mouth opening and closing",
      "title": "Check chin opening and closing and cable harness status",
      "text": "Move your chin slightly to check whether it can be opened and closed, whether it is obviously stuck, and whether the thread is pinched on the side. Animation shows opening and closing at once.",
      "check": "This is just a sign of opening and closing, and it will return to the closed position at the end; whether the actual product is smooth, the gap and the servo angle need to be verified.",
      "caption": "Simulate opening → closing · Actual object to be verified"
    },
    "head-neck-pair": {
      "short": "Connect dual servo",
      "title": "Arrange ID31 and ID30 and install the first connecting board",
      "text": "The desktop perspective of the source video is ID31 on the left and ID30 on the right. First fix the first connecting plate to one servo, then connect the other one to complete the remaining holes of the connecting plate.",
      "check": "The video is first marked with 2 pieces and then with 4 pieces. Whether it is a cumulative quantity remains to be verified. Source P3-02 has only four holes, and the animation is represented by four actual holes without creating two additional holes.",
      "caption": "Fix one end first and then connect the other servo"
    },
    "head-neck-plate": {
      "short": "Install the second connecting plate",
      "title": "Install another neck connection plate",
      "text": "Install the P3-03 connection board candidate on the other side and fix four M2×6 as shown in the video to form a double servo neck subassembly.",
      "check": "Complete the connecting panels on both sides first, and then connect the entire neck to the head.",
      "caption": "Connecting plate on the other side · M2×6 ×4"
    },
    "head-neck-join": {
      "short": "Connect head and neck",
      "title": "Connect the double servo neck to the head",
      "text": "Attach the assembled neck as one unit to the head pitch joint. The source video requires the cable outlet to be on the operator's left.",
      "check": "The operator's left is not necessarily the robot's left. The direction, hole positions and the assembly operation associated with P6-01 remain unverified.",
      "caption": "Check the cable outlet against the operator's left."
    },
    "head-neck-fix": {
      "short": "Fixed head and neck connection",
      "title": "Two hole groups for fixing the head and neck connection",
      "text": "Fix the two head and neck joints in sequence according to the video, and each subtitle is marked with four M2×6.",
      "check": "The two groups rotate in sequence. The actual hole position, axial direction and total consumption must be reviewed in the physical hole-by-hole table.",
      "caption": "Fixed in two places · Each M2×6 ×4"
    },
    "head-neck-wire": {
      "short": "Wire and leave margin",
      "title": "Plug the connector neck bus and organize the wire loops",
      "text": "Insert the connector neck cable harness according to the visible action, and then arrange the wire loop to leave margin for pitch and rotation. Leave the wire ends used for subsequent assembly on the outside.",
      "check": "The wire loops and endpoints are for teaching purposes; the two ends of each wire, the series connection sequence and the electrical pins need to be verified.",
      "caption": "Arrange cable harness first and then close the shell"
    },
    "head-shell": {
      "short": "Head cover set",
      "title": "Put on the white head cover",
      "text": "Put the P4-01 head cover on the completed head mechanism, leaving the reserved cable harness outside the opening.",
      "check": "Inherit the existing real mesh. The shell version, snapping position and clearance are subject to verification.",
      "caption": "Put on the head cover · Avoid cable harness"
    },
    "head-shell-fix": {
      "short": "Internal fixed head cover",
      "title": "Fix the head cover from the inside",
      "text": "According to the subtitle about 17:31, fix two M2×6 from the inside.",
      "check": "The screw positions are for teaching purposes. Make sure that cable harness is not sandwiched between the head cover and the platform.",
      "caption": "Internal fixation · M2×6 ×2"
    },
    "head-eyes": {
      "short": "Install eye circles for eyes",
      "title": "Install eye circles and eye accessories",
      "text": "Align the front holes of the head cover and install the P2-06 eye rims and P3-01 eye component candidates.",
      "check": "The video does not clearly show the small internal parts one by one. The sequence and engagement methods here are for reference only.",
      "caption": "Align the front holes · The identity of small items needs to be verified"
    },
    "head-lower-tape": {
      "short": "Double-sided tape on lower lip",
      "title": "First, apply double-sided tape to the flat surface of the chin cushion",
      "text": "First process the soft pad on the chin according to the original piece, and stick double-sided tape on its flat bottom. Animation retains visible cushions and independent films.",
      "check": "The film is on the outer surface of the grid. The thickness and cutting range are for reference; the next step is to install it into the chin together with the soft pad.",
      "caption": "First apply double-sided tape to the chin cushion"
    },
    "head-lower-pad": {
      "short": "Chin pad",
      "title": "First put the cushion into the chin",
      "text": "According to the original piece, first place the entire glued chin cushion into the open chin, and press it flat to fit. The source mesh uses P1-01.",
      "check": "The film and cushion move together, and the upper and lower identities of the source files are retained as candidates; the physical material and bonding fastness need to be verified.",
      "caption": "Apply the chin cushion first"
    },
    "head-upper-tape": {
      "short": "Double-sided tape on mouth",
      "title": "Then stick double-sided tape on the flat surface of the upper mouth cushion.",
      "text": "Then process the upper mouth soft cushion, stick double-sided tape on its exposed flat surface, and then press it onto the upper mouth as a whole.",
      "check": "The film is located on the outer surface of the grid, and the thickness, contour and bonding strength are still for teaching purposes.",
      "caption": "Then apply double-sided tape to the upper mouth cushion"
    },
    "head-upper-pad-check": {
      "short": "Apply pad to close",
      "title": "Attach the mouth cushion and check the fit of the upper and lower mouth",
      "text": "Press the original piece and attach the upper mouth soft pad together with the film to the upper mouth; use P1-02 for the source mesh. Then check whether the upper and lower mouths fit well and whether there are any obvious gaps.",
      "check": "This step only simulates opening and closing once and returns to the directory closing posture; seamless fit, smooth movement and cable harness margin must be checked by the actual object.",
      "caption": "Simulate closing after fitting · The actual product is to be verified"
    },
    "final-battery": {
      "short": "Battery storage",
      "title": "Put in the battery and pull out the power cord",
      "text": "Place the battery in the independent battery compartment, lead the red and black power cords and connectors through the opening, and then install the battery compartment to the body.",
      "check": "The battery uses the original model's conceptual shape. Its physical dimensions, connector keying and polarity remain unverified. Wire colours do not establish the pinout.",
      "caption": "Enter the warehouse first · The power cord is led out from the opening"
    },
    "final-tray": {
      "short": "Install battery compartment",
      "title": "Secure the battery compartment containing the battery to the body",
      "text": "Align the battery and battery compartment as an assembly to the back of the body, and fix it with 4 M2×6 countersunk head and flat tail self-tapping screws as shown in the video.",
      "check": "Align first and then fix, keeping the power cord out; the screw position and fit are teaching instructions, and you must check the actual object hole by hole.",
      "caption": "The components are in place as a whole · M2×6 ×4"
    },
    "final-body-shells": {
      "short": "Install body shell",
      "title": "Install the body shell on both sides and retain the upper wiring",
      "text": "Align and install the two body shells, leaving the upper cable harness outlet. 19:05 The left and right subtitles mark 5 and M2×6; this step only indicates the total number of this group.",
      "check": "The side-by-side and hole-by-hole distribution of 5 chips has not yet been verified. In the figure, the existing round holes in the source mesh are used as teaching candidates, and the true step attribution of the upper and lower holes and seam holes has yet to be verified; the conclusion of 5 per side is not based on this.",
      "caption": "M2×6 ×5 · Source hole candidate, assigned to be verified"
    },
    "final-head-join": {
      "short": "Connect the entire head and neck",
      "title": "Attach the entire installed head and neck assembly to the body",
      "text": "Move the completed head, neck, screws and cable harness as a whole, first let the lower servo connection part be in place, and then press the 4 and M2×6 marks marked on both sides of the video to fix it.",
      "check": "The head and neck must move as a whole, not just the skull. The total number of 4 pieces on each side of this prototype is 8 pieces; the actual hole position, installation axis and version are still to be verified.",
      "caption": "The head and neck are in place as a whole · M2×6 ×4 on both sides"
    },
    "final-board-mate": {
      "short": "Connect two boards",
      "title": "Align the pin header and plug UNO Q into the Luwu expansion board",
      "text": "Take the UNO Q and Luwu expansion boards respectively, align the expansion board pins with the UNO Q headers, and press them in place along the mating direction. The two boards are always independent objects.",
      "check": "The confirmed board model is used; 32 pin alignment and 12.3mm modeling spacing have been checked, and the hole locations are estimated from photos. The two mounting holes are misaligned by about 1.27mm, and the physical insertion, tolerances and electrical pins have not been verified.",
      "caption": "Two independent boards · Align the headers with the headers"
    },
    "final-board-mount": {
      "short": "fixed controller",
      "title": "Fix the inserted two-plate assembly to the body",
      "text": "Keeping the two boards mated, move the controller assembly to the back of your body. The source video is marked 4 and M3×16; this model only demonstrates insertion in two near-coaxial holes, and the other two are reserved for verification.",
      "check": "The original piece has 4 pieces; the 2 holes of this model are nearly coaxial, and the 2 holes are approximately 1.27mm misaligned. The completed state of passing through the two plates is not shown yet. The source plate shape, hole position, PCB thickness and pin row pitch have not been stretched or patched; the body support and physical fit need to be verified.",
      "caption": "Original film M3×16 ×4 · Demonstrates 2 holes, and the other 2 holes are to be verified"
    },
    "final-power": {
      "short": "Connect battery cable",
      "title": "Insert the remaining battery connector into the battery port on the control board",
      "text": "Move the connector from the battery compartment to the battery interface of the expansion board, align it with the connector key, and press it into place. Actions and paths are demonstrated here.",
      "check": "The exact polarity, pin numbering, connector key position and video board revision have not been verified; the red and black double lines in the picture do not constitute a basis for wiring.",
      "caption": "Aim at the battery port. The polarity and key position need to be verified."
    },
    "final-buses": {
      "short": "Insert bus one by one",
      "title": "Plug the three servo main buses into the expansion board one by one",
      "text": "Align and press the three three-pin plugs in sequence. The video confirms that there are three motherboard-side connections; this step will demonstrate the three connections separately.",
      "check": "The topology, actual endpoints and pins of the three-wire branch ID have not been traced clearly. The expansion board has interface revision differences, and GND, SIGNAL or the power supply pin position cannot be identified based on the model appearance.",
      "caption": "Three separate plug-ins, endpoints and pins to be verified"
    },
    "final-thigh-first": {
      "short": "First side thigh shell",
      "title": "Install the first side thigh housing",
      "text": "Install the first thigh shell. The video subtitle specifies 2 M2.3×4 flat-head self-tapping screws. The prototype shows the robot's right side first; the mapping to the video's left and right remains unverified.",
      "check": "At 20:37 the subtitle specifies M2.3×4, whereas the official BOM lists M2.3×8. Retain this discrepancy; do not substitute either specification or use this guide for purchasing. Hole positions remain unverified.",
      "caption": "Video M2.3×4 ×2 · Differences from BOM"
    },
    "final-route": {
      "short": "Organize cable harness",
      "title": "Arrange cable harness to leave space for the shell and joints on the other side",
      "text": "Arrange the visible cable harness loops so that the cable harness avoids the housing pressure joints and joint activity areas. Leave an appropriate margin before installing the other side of the housing.",
      "check": "The wiring is a visual representation, and the physical bending radius, wire length, and movement clearance have not been verified; this step does not require unplugging the connected motherboard plug.",
      "caption": "Keep connectors connected · Organize margins"
    },
    "final-thigh-second": {
      "short": "Thigh shell on the other side",
      "title": "Install the thigh shell on the other side to complete the final assembly of this section.",
      "text": "Install the other thigh shell in the mirrored orientation. At 20:57 the subtitle again specifies 2 M2.3×4 screws. Retain the discrepancy between the source video and the BOM.",
      "check": "This section ends with the final assembly of 20:58. Control, numbering, and calibration are described in subsequent chapters. This module does not verify power-up or mechanical accuracy.",
      "caption": "The other side M2.3×4 ×2 · Final assembly finishing"
    },
    "calibration-power": {
      "short": "Start up after assembly",
      "title": "Turn on the machine after assembly is complete",
      "text": "This paragraph only shows the teaching sequence. Check the mechanical connection and cable harness, and then press the video to enter your own device configuration page.",
      "check": "This prototype does not connect to the hardware; the following only shows the teaching sequence.",
      "caption": "Teaching demonstration · No control of real equipment"
    },
    "calibration-start": {
      "short": "Start calibration",
      "title": "Enter Calibration and start calibration",
      "text": "Enter Calibration on the real device interface, click Start calibration, and stabilize the robot.",
      "check": "The finished poses on the page do not indicate that the real robot has been calibrated.",
      "caption": "Teaching demonstration · No control of real equipment"
    },
    "calibration-servos": {
      "short": "Adjust 15 ID one by one",
      "title": "Adjust the mechanical zero position of all servo one by one",
      "text": "Adjust the slider ID one by one according to the device interface and press Finish when finished. Right leg 10–14, left leg 20–24, head, neck and mouth 30–34.",
      "check": "Each ID requires verification of physical joints; the list on this page is not a device calibration result.",
      "caption": "Teaching demonstration · No control of real equipment"
    },
    "calibration-pose": {
      "short": "Check body joints",
      "title": "Check centering, joints and foot posture",
      "text": "Continue to make fine adjustments based on the original photo: the body is centered, the joints are aligned, and the feet are flat until the real thing can stand firm.",
      "check": "The standing model of this prototype is only used for teaching observation and cannot replace physical posture inspection.",
      "caption": "Teaching demonstration · No control of real equipment"
    },
    "calibration-exit": {
      "short": "Exit calibration",
      "title": "Exit calibration after completing each joint",
      "text": "After all servo are completed, click Exit according to the original picture, and then exit the setting page.",
      "check": "Confirm that all ID have been processed before performing the default attitude check.",
      "caption": "Teaching demonstration · No control of real equipment"
    },
    "calibration-default": {
      "short": "Check default pose",
      "title": "Execute Default pose",
      "text": "Execute Default pose on a real device and observe whether the body and legs reach the expected posture.",
      "check": "No movement commands are sent here, nor is physical balance simulated.",
      "caption": "Teaching demonstration · No control of real equipment"
    },
    "robot-complete": {
      "short": "Complete machine view",
      "title": "Complete machine assembly tutorial",
      "text": "You can now rotate to see the complete robot, or jump back to any stage to replay. The source video shows the remote control and walking entrance at the end.",
      "check": "This is an independent teaching prototype; actual wiring, hole position matching and equipment calibration still require physical verification.",
      "caption": ""
    }
  },
  "chapters": {
    "prepare": {
      "name": "Preparation and Numbering"
    },
    "right-ankle": {
      "name": "right ankle"
    },
    "left-ankle": {
      "name": "left ankle"
    },
    "right-leg": {
      "name": "Right leg connection"
    },
    "left-leg": {
      "name": "left leg connection"
    },
    "finish": {
      "name": "Legs finish"
    },
    "torso-base": {
      "name": "Body and Hip Support"
    },
    "torso-legs": {
      "name": "Hip motors and leg joints"
    },
    "head-core": {
      "name": "Head rotation and wiring"
    },
    "head-mouth-neck": {
      "name": "Mouth and double servo neck"
    },
    "head-finish": {
      "name": "Head cover and mouth cushions"
    },
    "final-body": {
      "name": "Body and head and neck assembly"
    },
    "final-electronics": {
      "name": "Electronic control and housing finishing"
    },
    "calibration": {
      "name": "Calibration and completion"
    }
  },
  "actors": {
    "p_uno": {
      "label": "Arduino UNO Q · Appearance confirmed v2 batch",
      "source": "Confirmed photo model · Uniform unit conversion 1000; mounting hole estimation and electrical mapping have not been physically verified"
    },
    "p_extension": {
      "label": "Luwu expansion board · Confirmed appearance v2",
      "source": "Confirmed photo model · Uniform unit conversion 1000; mounting hole estimation and electrical mapping have not been physically verified"
    },
    "p_battery": {
      "label": "Temporary power supply battery · Teaching model",
      "source": "Battery size and connectors are subject to physical verification"
    },
    "p_motor": {
      "label": "Single servo to be configured",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "p_powerCable": {
      "label": "Test battery power cord",
      "source": "The wiring and polarity are for teaching purposes only."
    },
    "p_servoCable": {
      "label": "Single servo test line",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "p_usb": {
      "label": "Type-C connecting cable · simple teaching model",
      "source": "Only demonstrates the computer connection direction"
    },
    "motor": {
      "label": "Rightservo · ID14",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified.",
      "chip": "servo"
    },
    "foot": {
      "label": "Right foot · P2-03",
      "source": "Real 3MF grid",
      "chip": "foot"
    },
    "shank": {
      "label": "Right calf · P6-04",
      "source": "Real 3MF grid",
      "chip": "calf"
    },
    "bearing": {
      "label": "Right small bearing · 10×15×3",
      "source": "Existing auxiliary grid",
      "chip": "Smallbearing"
    },
    "axle": {
      "label": "Right ankle axis · P2-05",
      "source": "Real grid·Positioning diagram",
      "chip": "ankle axis"
    },
    "horn": {
      "label": "servo horn removed from the right",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "hornScrew": {
      "label": "Right servo horn central original screw",
      "source": "Added teaching instructions · Specifications to be verified"
    },
    "plug": {
      "label": "Right three-pin servo plug",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "wire": {
      "label": "Right three-core servo line",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "shankScrew0": {
      "label": "Right calf fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×2"
    },
    "shankScrew1": {
      "label": "Right calf fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "footScrew0": {
      "label": "Right foot fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "footScrew1": {
      "label": "Right foot fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "footScrew2": {
      "label": "Right foot fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "footScrew3": {
      "label": "Right foot fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "axisScrew": {
      "label": "Right ankle shaft fixation screw · M2.3×8",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2.3×8"
    },
    "l_motor": {
      "label": "Leftservo · ID24",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified.",
      "chip": "servo"
    },
    "l_foot": {
      "label": "Left foot · P2-04",
      "source": "Real 3MF grid",
      "chip": "foot"
    },
    "l_shank": {
      "label": "Left calf · P6-05",
      "source": "Real 3MF grid",
      "chip": "calf"
    },
    "l_bearing": {
      "label": "Zuo Xiaobearing · 10×15×3",
      "source": "Existing auxiliary grid",
      "chip": "Smallbearing"
    },
    "l_axle": {
      "label": "Left ankle axis · P2-07",
      "source": "Real grid·Positioning diagram",
      "chip": "ankle axis"
    },
    "l_horn": {
      "label": "servo horn removed from the left",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "l_hornScrew": {
      "label": "Left servo horn center original screw",
      "source": "Added teaching instructions · Specifications to be verified"
    },
    "l_plug": {
      "label": "Left three-pin servo plug",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "l_wire": {
      "label": "Left three-core servo line",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "l_shankScrew0": {
      "label": "Left calf fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×2"
    },
    "l_shankScrew1": {
      "label": "Left calf fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "l_footScrew0": {
      "label": "Left foot fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_footScrew1": {
      "label": "Left foot fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "l_footScrew2": {
      "label": "Left foot fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "l_footScrew3": {
      "label": "Left foot fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "l_axisScrew": {
      "label": "Left ankle shaft fixation screw · M2.3×8",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2.3×8"
    },
    "r_upperMotor": {
      "label": "Upper right servo · ID12",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "r_lowerMotor": {
      "label": "Right middle servo · ID13",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "r_support": {
      "label": "Right thigh support · P5-04",
      "source": "Real 3MF grid · fit to be verified"
    },
    "r_lowerBearing": {
      "label": "Right big bearing · 16×22×4",
      "source": "Existing hardware grid"
    },
    "r_supportScrew0": {
      "label": "Right fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew1": {
      "label": "Right fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew2": {
      "label": "Right fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew3": {
      "label": "Right fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew0": {
      "label": "Right fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew1": {
      "label": "Right fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew2": {
      "label": "Right fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew3": {
      "label": "Right fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_upperHorn": {
      "label": "Original servo horn on the upper right",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "r_upperHornScrew": {
      "label": "Original central screw on the upper right side",
      "source": "Simple teaching model·Original specifications to be verified"
    },
    "r_topLink": {
      "label": "Upper right connector · P3-04",
      "source": "Real 3MF grid · fit to be verified"
    },
    "r_topBearing": {
      "label": "Right connector large bearing",
      "source": "Existing hardware grid"
    },
    "r_topScrew0": {
      "label": "Right fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew1": {
      "label": "Right fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew2": {
      "label": "Right fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew3": {
      "label": "Right fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_sole": {
      "label": "Right foot sole cushion · P1-03",
      "source": "Real 3MF grid · fit to be verified"
    },
    "r_soleScrew0": {
      "label": "Right fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew1": {
      "label": "Right fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew2": {
      "label": "Right fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew3": {
      "label": "Right fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "r_legWireA": {
      "label": "Three-core wire inside right leg",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions",
      "chip": "Three core wire inside leg"
    },
    "r_legWireB": {
      "label": "Reserved line at the upper end of right leg",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions",
      "chip": "Reserved line at the upper end"
    },
    "l_upperMotor": {
      "label": "Upper left servo · ID22",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "l_lowerMotor": {
      "label": "Middle left servo · ID23",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "l_support": {
      "label": "Left thigh support · P5-05",
      "source": "Real 3MF grid · fit to be verified"
    },
    "l_lowerBearing": {
      "label": "Zuo Dabearing · 16×22×4",
      "source": "Existing hardware grid"
    },
    "l_supportScrew0": {
      "label": "Left fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew1": {
      "label": "Left fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew2": {
      "label": "Left fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew3": {
      "label": "Left fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew0": {
      "label": "Left fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew1": {
      "label": "Left fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew2": {
      "label": "Left fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew3": {
      "label": "Left fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_upperHorn": {
      "label": "Original servo horn on the upper left",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "l_upperHornScrew": {
      "label": "Original central screw on the upper left side",
      "source": "Simple teaching model·Original specifications to be verified"
    },
    "l_topLink": {
      "label": "Upper left connector · P3-05",
      "source": "Real 3MF grid · fit to be verified"
    },
    "l_topBearing": {
      "label": "Left connector large bearing",
      "source": "Existing hardware grid"
    },
    "l_topScrew0": {
      "label": "Left fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew1": {
      "label": "Left fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew2": {
      "label": "Left fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew3": {
      "label": "Left fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_sole": {
      "label": "Left foot sole cushion · P1-04",
      "source": "Real 3MF grid · fit to be verified"
    },
    "l_soleScrew0": {
      "label": "Left fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew1": {
      "label": "Left fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew2": {
      "label": "Left fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew3": {
      "label": "Left fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "l_legWireA": {
      "label": "Three-core wire inside left leg",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions",
      "chip": "Three core wire inside leg"
    },
    "l_legWireB": {
      "label": "Reserved line at the upper end of left leg",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions",
      "chip": "Reserved line at the upper end"
    },
    "t_motor10": {
      "label": "Hip Yaw servo · ID10",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "t_motor10Horn": {
      "label": "ID10 original servo horn (reserved)",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "t_motor10HornScrew": {
      "label": "ID10 original central screw",
      "source": "Original central screw teaching model·Specifications to be verified"
    },
    "t_motor20": {
      "label": "Hip Yaw servo · ID20",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "t_motor20Horn": {
      "label": "ID20 original servo horn (reserved)",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "t_motor20HornScrew": {
      "label": "ID20 original central screw",
      "source": "Original central screw teaching model·Specifications to be verified"
    },
    "t_support": {
      "label": "Hip Yaw Support · P6-09",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_supportScrew0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_supportScrew1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_supportScrew2": {
      "label": "Fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_supportScrew3": {
      "label": "Fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_supportScrew4": {
      "label": "Fixing screw 5 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_supportScrew5": {
      "label": "Fixing screw 6 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_baseWire": {
      "label": "Reserved line for the right body motherboard · Free end indication",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "t_baseWireL": {
      "label": "Reserved line for left body motherboard · Free end indication",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "t_backplate": {
      "label": "Body back panel · P4-03",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_backFrontScrew0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_backFrontScrew1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_backRearScrew0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_backRearScrew1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_yawR": {
      "label": "Right Yaw connector · P6-06",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_yawBearingR": {
      "label": "Right Yaw Large connector bearing · 16×22×4",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_yawScrewR0": {
      "label": "Right connecting piece fixing screw diagram · M2×6 · Side-by-side quantity to be verified",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_yawScrewR1": {
      "label": "Right connecting piece fixing screw diagram · M2×6 · Side-by-side quantity to be verified",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_yawScrewR2": {
      "label": "Right connecting piece fixing screw diagram · M2×6 · Side-by-side quantity to be verified",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_yawScrewR3": {
      "label": "Right connecting piece fixing screw diagram · M2×6 · Side-by-side quantity to be verified",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_motor11": {
      "label": "Right hip Roll servo · ID11",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "t_motor11Horn": {
      "label": "ID11 Original servo horn",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "t_motor11HornScrew": {
      "label": "ID11 original central fixing screw",
      "source": "Original central screw teaching model·Specifications to be verified"
    },
    "t_rollWireR": {
      "label": "Reserved line from right body to hip motor · Path/endpoint indication",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "t_motorScrewR0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_motorScrewR1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_coverR": {
      "label": "Right Roll servo cover · P6-02",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_coverScrewR0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_coverScrewR1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_coverScrewR2": {
      "label": "Fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_coverScrewR3": {
      "label": "Fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_legBearingR": {
      "label": "The right leg interface is large bearing · 16×22×4",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_legScrewR0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_legScrewR1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_legScrewR2": {
      "label": "Fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_legScrewR3": {
      "label": "Fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_yawL": {
      "label": "Left Yaw connector · P6-07",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_yawBearingL": {
      "label": "Left Yaw Large connector bearing · 16×22×4",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_yawScrewL0": {
      "label": "Instructions for fixing screws of the left connecting piece · M2×6 · Quantity by side to be verified",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_yawScrewL1": {
      "label": "Instructions for fixing screws of the left connecting piece · M2×6 · Quantity by side to be verified",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_yawScrewL2": {
      "label": "Instructions for fixing screws of the left connecting piece · M2×6 · Quantity by side to be verified",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_yawScrewL3": {
      "label": "Instructions for fixing screws of the left connecting piece · M2×6 · Quantity by side to be verified",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_motor21": {
      "label": "Left hip Roll servo · ID21",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "t_motor21Horn": {
      "label": "ID21 Original servo horn",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "t_motor21HornScrew": {
      "label": "ID21 original central fixing screw",
      "source": "Original central screw teaching model·Specifications to be verified"
    },
    "t_rollWireL": {
      "label": "Reserved line from left body to hip motor · Path/endpoint indication",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "t_motorScrewL0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_motorScrewL1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_coverL": {
      "label": "Left Roll servo cover · P6-03",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_coverScrewL0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_coverScrewL1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_coverScrewL2": {
      "label": "Fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_coverScrewL3": {
      "label": "Fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_legBearingL": {
      "label": "The left leg interface is large bearing · 16×22×4",
      "source": "Real source mesh·Video corresponding candidate, hole position/fit needs to be verified"
    },
    "t_legScrewL0": {
      "label": "Fixing screw 1 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_legScrewL1": {
      "label": "Fixing screw 2 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_legScrewL2": {
      "label": "Fixing screw 3 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "t_legScrewL3": {
      "label": "Fixing screw 4 · M2×6",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "h_pitchSupport": {
      "label": "First bracket · P6-01",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_motor32": {
      "label": "Head rotation servo · ID32 candidate",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "h_yawScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew2": {
      "label": "M2×6 Fixing screw 3 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew3": {
      "label": "M2×6 Fixing screw 4 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_yawSupport": {
      "label": "Second opening bracket · P6-08",
      "source": "Real print grid·Video correspondence and fit are subject to verification; the source video comes with the second bracket/ID33 subassembly, and the physical fit is subject to verification"
    },
    "h_bearingFront": {
      "label": "Big head bearing former candidate · 16×22×4",
      "source": "Existing hardware grid · ID and interface need to be verified; according to the original piece, it comes with the second bracket/ID33 sub-assembly, and the physical matching needs to be verified"
    },
    "h_bearingBack": {
      "label": "Candidate after bearing with big head · 16×22×4",
      "source": "Existing hardware grid · ID and interface need to be verified; according to the original piece, it comes with the second bracket/ID33 sub-assembly, and the physical matching needs to be verified"
    },
    "h_bearingCrown": {
      "label": "First bracket large bearing · seat candidate",
      "source": "Reuse head_yaw_1 complete annular grid; along the P6-01 source cylinder axis x=-0.01, z=40.99, the bottom surface falls on the approximately y=206.24 shoulder surface; axial seating surface candidates and physical fit need to be verified"
    },
    "h_motor33": {
      "label": "Head second servo · ID33 candidate",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "h_rollScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew2": {
      "label": "M2×6 Fixing screw 3 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew3": {
      "label": "M2×6 Fixing screw 4 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew2": {
      "label": "M2×6 Fixing screw 3 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew3": {
      "label": "M2×6 Fixing screw 4 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_platform": {
      "label": "Head platform · P2-02",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_mouthMotor": {
      "label": "Mouth servo · Video 33 / Official 34, pending verification",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "h_jaw": {
      "label": "Chin · P2-01",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_servoSupport": {
      "label": "Head servo fixing piece · P4-02",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_supportScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew2": {
      "label": "M2×6 Fixing screw 3 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew3": {
      "label": "M2×6 Fixing screw 4 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew2": {
      "label": "M2×6 Fixing screw 3 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew3": {
      "label": "M2×6 Fixing screw 4 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_motor30": {
      "label": "Lower end of neck servo · ID30 candidate",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "h_motor31": {
      "label": "Upper neck servo · ID31 candidate",
      "source": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified."
    },
    "h_neckA": {
      "label": "Neck connecting plate A · P3-02 candidate",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_neckAScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "First fix the 2 hole"
    },
    "h_neckAScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "First fix the 2 hole"
    },
    "h_neckAScrew2": {
      "label": "M2×6 Fixing screw 3 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "Reinstall to 4 hole"
    },
    "h_neckAScrew3": {
      "label": "M2×6 Fixing screw 4 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "Reinstall to 4 hole"
    },
    "h_neckB": {
      "label": "Neck connecting plate B · P3-03 candidate",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_neckBScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew2": {
      "label": "M2×6 Fixing screw 3 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew3": {
      "label": "M2×6 Fixing screw 4 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew2": {
      "label": "M2×6 Fixing screw 3 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew3": {
      "label": "M2×6 Fixing screw 4 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew4": {
      "label": "M2×6 Fixing screw 5 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew5": {
      "label": "M2×6 Fixing screw 6 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew6": {
      "label": "M2×6 Fixing screw 7 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew7": {
      "label": "M2×6 Fixing screw 8 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×4"
    },
    "h_shell": {
      "label": "Head cover · P4-01",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_shellScrew0": {
      "label": "M2×6 Fixing screw 1 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×2"
    },
    "h_shellScrew1": {
      "label": "M2×6 Fixing screw 2 · Hole location indication",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
      "chip": "M2×6 ×2"
    },
    "h_eyeShell": {
      "label": "Eye circles · P2-06 candidate",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_eyes": {
      "label": "Eye gadgets · P3-01 candidate",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_upperPad": {
      "label": "Lip cushion · P1-02 candidate",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_lowerPad": {
      "label": "Lower mouth cushion · P1-01 candidate",
      "source": "Real printout grid · Video correspondence and fit to be verified"
    },
    "h_wire32": {
      "label": "ID32 reserved line · Endpoint indication",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_wire33": {
      "label": "ID33 reserved line · Endpoint indication",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_wireMouth": {
      "label": "Mouth servo line · 33/34 pending verification",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_neckWire": {
      "label": "Neck wire loop · endpoints and series connection sequence indication",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_headLead": {
      "label": "The end of the head and neck line reserved for final assembly·End point indication",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_plug32": {
      "label": "ID32 plug · teaching interface",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_plug33": {
      "label": "ID33 plug · teaching interface",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_plugMouth": {
      "label": "Mouth plug·Teaching interface",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_plugNeck": {
      "label": "Neck cord plug · Teaching interface",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "h_coreHorn": {
      "label": "Retained original servo horn",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "h_coreHornScrew": {
      "label": "Original central fixing screw · Specifications to be verified",
      "source": "Original central screw teaching model · Not classified as self-tapping screws; according to the original piece, it comes with the second bracket/ID33 subassembly, and the physical fit needs to be verified"
    },
    "h_mouthHorn": {
      "label": "Retained original servo horn",
      "source": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified"
    },
    "h_mouthHornScrew": {
      "label": "Original central fixing screw · Specifications to be verified",
      "source": "Original central screw teaching template · Not classified as self-tapping screws"
    },
    "h_upperAdhesive": {
      "label": "Double-sided tape · Thickness and outline indication",
      "source": "Double-sided tape teaching instructions · Material, thickness, contour and bonding strength are subject to verification"
    },
    "h_lowerAdhesive": {
      "label": "Double-sided tape · Thickness and outline indication",
      "source": "Double-sided tape teaching instructions · Material, thickness, contour and bonding strength are subject to verification"
    },
    "f_batteryTray": {
      "label": "Battery compartment · P5-03",
      "source": "Real source mesh · Mounting holes and fit to be verified"
    },
    "f_sideR": {
      "label": "Body right shell · P5-06",
      "source": "Real source mesh · Mounting holes and fit to be verified"
    },
    "f_sideL": {
      "label": "Body left shell · P5-07",
      "source": "Real source mesh · Mounting holes and fit to be verified"
    },
    "f_thighR": {
      "label": "Thigh right shell · P5-01",
      "source": "Real source mesh · Mounting holes and fit to be verified"
    },
    "f_thighL": {
      "label": "Thigh left shell · P5-02",
      "source": "Real source mesh · Mounting holes and fit to be verified"
    },
    "f_battery": {
      "label": "Battery pack · Actual size to be verified",
      "source": "Follow the trunk_base_8 concept outline · Non-physical measurement"
    },
    "f_trayScrew0": {
      "label": "M2×6 fixing screw 1 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_trayScrew1": {
      "label": "M2×6 fixing screw 2 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_trayScrew2": {
      "label": "M2×6 fixing screw 3 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_trayScrew3": {
      "label": "M2×6 fixing screw 4 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_bodyScrew0": {
      "label": "M2×6 fixing screw 1 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_bodyScrew1": {
      "label": "M2×6 fixing screw 2 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_bodyScrew2": {
      "label": "M2×6 fixing screw 3 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_bodyScrew3": {
      "label": "M2×6 fixing screw 4 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_bodyScrew4": {
      "label": "M2×6 fixing screw 5 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_neckScrewR0": {
      "label": "M2×6 fixing screw 1 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_neckScrewR1": {
      "label": "M2×6 fixing screw 2 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_neckScrewR2": {
      "label": "M2×6 fixing screw 3 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_neckScrewR3": {
      "label": "M2×6 fixing screw 4 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_neckScrewL0": {
      "label": "M2×6 fixing screw 1 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_neckScrewL1": {
      "label": "M2×6 fixing screw 2 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_neckScrewL2": {
      "label": "M2×6 fixing screw 3 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_neckScrewL3": {
      "label": "M2×6 fixing screw 4 · source mesh hole candidate",
      "source": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified."
    },
    "f_boardScrew0": {
      "label": "M3×16 Fixing screw 1 · Candidate for nearly coaxial holes on two plates",
      "source": "Source GLB hole position comparison; 2 holes are nearly coaxial, and 2 holes are approximately 1.27mm misaligned; the holes are not modified or the physical fit is presumed"
    },
    "f_boardScrew1": {
      "label": "M3×16 Fixing screw 2 · Candidate for nearly coaxial holes on two plates",
      "source": "Source GLB hole position comparison; 2 holes are nearly coaxial, and 2 holes are approximately 1.27mm misaligned; the holes are not modified or the physical fit is presumed"
    },
    "f_boardScrew2": {
      "label": "M3×16 Fixing screw 3 · Hole location to be verified",
      "source": "Source GLB hole position comparison; 2 holes are nearly coaxial, and 2 holes are approximately 1.27mm misaligned; the holes are not modified or the physical fit is presumed"
    },
    "f_boardScrew3": {
      "label": "M3×16 Fixing screw 4 · Hole location to be verified",
      "source": "Source GLB hole position comparison; 2 holes are nearly coaxial, and 2 holes are approximately 1.27mm misaligned; the holes are not modified or the physical fit is presumed"
    },
    "f_thighScrewR0": {
      "label": "M2.3×4 fixing screw 1 · source mesh hole candidate",
      "source": "P5-01 source geometry.bin round hole fitting · The actual object and the specific hole use need to be verified"
    },
    "f_thighScrewR1": {
      "label": "M2.3×4 fixing screw 2 · source mesh hole candidate",
      "source": "P5-01 source geometry.bin round hole fitting · The actual object and the specific hole use need to be verified"
    },
    "f_thighScrewL0": {
      "label": "M2.3×4 fixing screw 1 · source mesh hole candidate",
      "source": "P5-02 source geometry.bin round hole fitting · The actual object and the specific hole use need to be verified"
    },
    "f_thighScrewL1": {
      "label": "M2.3×4 fixing screw 2 · source mesh hole candidate",
      "source": "P5-02 source geometry.bin round hole fitting · The actual object and the specific hole use need to be verified"
    },
    "f_uno": {
      "label": "Arduino UNO Q · Appearance confirmed v2 batch",
      "source": "Confirmed photo model · Uniform unit conversion 1000; mounting hole estimation and electrical mapping have not been physically verified"
    },
    "f_extension": {
      "label": "Luwu expansion board · Confirmed appearance v2",
      "source": "Confirmed photo model · Uniform unit conversion 1000; mounting hole estimation and electrical mapping have not been physically verified"
    },
    "f_powerCable": {
      "label": "Battery two-core power cord · Polarity to be verified",
      "source": "Red and black lines are visible in the source video. The path, line length, polarity and actual connector have not been verified."
    },
    "f_powerPlug": {
      "label": "Battery connector · Key position and polarity to be verified",
      "source": "Tutorial simple model · No verified electrical pin definitions"
    },
    "f_bus0": {
      "label": "Three-pin main bus 1 · Branch corresponding diagram",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "f_busPlug0": {
      "label": "Main bus plug 1 · Key position to be verified",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "f_bus1": {
      "label": "Three-pin main bus 2 · Branch corresponding diagram",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "f_busPlug1": {
      "label": "Main bus plug 2 · Key position to be verified",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "f_bus2": {
      "label": "Three-pin main bus 3 · Branch corresponding diagram",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    },
    "f_busPlug2": {
      "label": "Main bus plug 3 · Key position to be verified",
      "source": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions"
    }
  },
  "ui": {
    "先认清这几件": "Let’s first identify these things",
    "准备零件": "Prepare parts",
    "这一段组装一只脚踝。先准备已编号、已居中的舵机，以及脚掌、小腿连接件、轴承和踝轴。": "This section assembles an ankle. First prepare the numbered and centered servo, as well as the sole of the foot, calf connector, bearing and ankle shaft.",
    "舵机编号和居中应在机械安装前完成。": "servo numbering and centering should be completed before mechanical installation.",
    "拆下舵盘": "Remove servo horn",
    "先拧出舵盘中央的原装固定螺丝，再沿输出轴方向取下黑色舵盘。": "First unscrew the original fixing screw in the center of the servo horn, and then remove the black servo horn along the direction of the output shaft.",
    "把舵盘和原装螺丝放在一旁，后面的步骤不会用自攻螺丝替代它。": "Set aside the servo horn and the original screws; later steps will not replace it with self-tapping screws.",
    "插好舵机线": "Plug in the servo line",
    "插入线缆": "Plug in the cable",
    "将插头的端子孔对准接口凸起，沿接口方向插入，再按压到位。": "Align the terminal hole of the plug with the protrusion of the interface, insert it in the direction of the interface, and then press it into place.",
    "看清插头方向。这里演示插接动作，三芯线的针脚定义仍需实物核对。": "Check the plug direction clearly. The plugging action is demonstrated here. The pin definition of the three-core wire still needs to be verified physically.",
    "固定小腿连接件": "Fixed lower leg connector",
    "固定小腿": "Fixed calf",
    "将白色小腿连接件贴合舵机，对齐安装孔，再拧入两颗 M2×6 沉头自攻螺丝。": "Fit the white lower leg connector to servo, align the mounting holes, and then screw in two M2×6 countersunk head self-tapping screws.",
    "连接件的长端朝上。先对孔，再固定，不用螺丝把歪斜的零件硬拉到位。": "The long end of the connector points upward. Align the holes first and then fix them. No screws are needed to pull the skewed parts into place.",
    "把舵机装入脚掌": "Install servo into the sole of the foot",
    "装入脚掌": "Fit into the sole of the foot",
    "把舵机和小腿连接件组成的模块放入脚掌，按视频固定四颗 M2×6 沉头自攻螺丝。": "Put the module composed of servo and calf connector into the sole of the foot, and fix the four M2×6 countersunk head self-tapping screws as shown in the video.",
    "先确认脚掌与关节朝向，再固定四个位置。线缆留在外侧。": "First confirm the orientation of the soles of the feet and joints, and then fix the four positions. The cables remain on the outside.",
    "压入小轴承": "Press in the small bearing",
    "压入轴承": "Press bearing",
    "将小轴承对准脚掌的圆形安装孔，沿轴向压入。": "Align the small bearing with the circular mounting hole on the sole of the foot and press it in along the axial direction.",
    "轴承要坐正，中心孔与连接件同轴。型号按清单对应 10×15×3 mm。": "bearing needs to sit upright, with the center hole and the connector coaxial. The model number corresponds to 10×15×3 mm according to the list.",
    "对齐并装入踝轴": "Align and install the ankle shaft",
    "装入踝轴": "Install the ankle shaft",
    "对齐中间圆孔，将打印的踝轴放到轴承中心，再把 M2.3×8 自攻螺丝手动旋入。": "Align the middle hole, place the printed ankle axis in the center of bearing, and then manually screw in the M2.3×8 self-tapping screw.",
    "踝轴用了现有 3MF 网格；这里的定位经过展示调整，还没有验证实物配合。": "The ankle axis uses the existing 3MF grid; the positioning here has been adjusted for display and has not been verified for physical fit.",
    "拧紧并检查": "Tighten and check",
    "固定检查": "Fixed check",
    "沿轴向拧入 M2.3×8 螺丝，直到螺丝头贴合表面，再检查脚踝连接。": "Screw in the M2.3×8 screw axially until the screw head rests against the surface, then check the ankle connection.",
    "视频要求螺丝头贴合、末端从另一侧伸出。原型只展示动作，不模拟实际扭矩或公差。": "The video calls for the screw head to fit snugly and the end to come out the other side. The prototype only demonstrates motion and does not simulate actual torque or tolerances.",
    "这一只脚踝装好了": "This ankle is installed",
    "完成查看": "Complete viewing",
    "现在可以转到背面看连接位置，或回到任意步骤重看。另一只脚踝按视频做镜像装配。": "Now you can turn to the back to see where the connections are, or go back to any step to review it. Do the mirror assembly of the other ankle as shown in the video.",
    "这段尚未安装脚底软垫；视频在后面的双腿阶段才安装。": "The underfoot cushions are not yet installed in this section; they are installed later in the video on the legs.",
    "舵机 · 视频 ID14": "servo · Video ID14",
    "现有辅助网格": "Existing auxiliary grid",
    "脚掌 · P2-03": "Sole of foot · P2-03",
    "真实 3MF 网格": "Real 3MF grid",
    "小腿连接件 · P6-04": "Calf connector · P6-04",
    "小轴承 · 10×15×3": "Little bearing · 10×15×3",
    "踝轴 · P2-05": "Ankle shaft · P2-05",
    "真实网格 · 定位示意": "Real grid·Positioning diagram",
    "拆下的舵盘": "Removed servo horn",
    "新增教学示意": "Added teaching instructions",
    "舵盘中央原装螺丝": "servo horn central original screw",
    "新增教学示意 · 规格待核": "Added teaching instructions · Specifications to be verified",
    "三针舵机插头": "Three-pin servo plug",
    "三芯舵机线": "Three-core servo line",
    "新增教学示意 · 路径未核验": "Added teaching instructions · The path has not been verified",
    "小腿固定螺丝 1 · M2×6": "Calf fixing screw 1 · M2×6",
    "新增教学示意 · 孔位未核验": "New teaching instructions · Hole position not verified",
    "小腿固定螺丝 2 · M2×6": "Calf fixing screw 2 · M2×6",
    "脚掌固定螺丝 1 · M2×6": "Foot fixing screw 1 · M2×6",
    "脚掌固定螺丝 2 · M2×6": "Foot fixing screw 2 · M2×6",
    "脚掌固定螺丝 3 · M2×6": "Foot fixing screw 3 · M2×6",
    "脚掌固定螺丝 4 · M2×6": "Foot fixing screw 4 · M2×6",
    "踝轴固定螺丝 · M2.3×8": "Ankle shaft fixing screw · M2.3×8",
    "新增教学示意 · 配合未核验": "Added teaching instructions · fit has not been verified",
    "拧入中": "Screwing in",
    "已紧固": "Tightened",
    "预拧中": "Pre-screwed",
    "预拧到位": "Pre-screwed in place",
    "正在取下": "Removing",
    "已取下": "Removed",
    "插接中": "Connecting",
    "已接合": "Engaged",
    "整理中": "Under preparation",
    "余量已留好": "The balance has been reserved",
    "压入中": "Pressing in",
    "已就位": "Already in place",
    "模型配合待核": "Fit not verified",
    "螺丝放大": "Screw detail",
    "舵盘放大": "Servo horn detail",
    "放大": "enlarge",
    "线端放大": "Wire-end detail",
    "接头放大": "Connector detail",
    "{value} · {value}": "{value} · {value}",
    "局部放大": "local magnification",
    "本步可手动开关；换步后，小部位自动开启，大部位默认关闭": "This step can be turned on and off manually; after changing steps, small parts will be automatically turned on, and large parts will be turned off by default.",
    "本步暂无需要放大的装配细节": "There are no assembly details that need to be enlarged in this step.",
    "局部放大 · ": "Partial zoom ·",
    "开": "On",
    "关": "Off",
    " · 剖视": "· Cross-section",
    "对准接口": "Align interface",
    "窗口": "window",
    "当前装配部位的实时三维放大画面": "Real-time three-dimensional enlargement of the current assembly part",
    "右脚踝": "right ankle",
    "左脚踝": "left ankle",
    "右腿连接": "Right leg connection",
    "左腿连接": "left leg connection",
    "双腿收尾": "Legs finish",
    "准备{value}脚踝零件": "Prepare {value} ankle parts",
    "{value}脚踝装好了": "{value} ankle is installed",
    "准备已编号、已居中的 {value} 舵机，以及这一侧的脚掌、小腿、轴承和踝轴。": "Prepare numbered, centered {value} servo, as well as the ball of the foot, calf, bearing and ankle shaft on this side.",
    "可以旋转检查，再继续下一阶段。脚底软垫会在双腿收尾阶段安装。": "You can rotate the inspection before continuing to the next stage. Sole pads are installed during the finishing phase of the legs.",
    "先卸中央螺丝，再取下舵盘": "Remove the central screw first, then remove the servo horn",
    "对准接口，按压到位": "Align the interface and press it in place",
    "对孔 · M2×6 ×2": "Correct hole · M2×6 ×2",
    "固定脚掌 · M2×6 ×4": "Fixed foot · M2×6 ×4",
    "沿轴向压入": "Press in axially",
    "对齐轴承中心": "Align bearing center",
    "拧至螺丝头贴合": "Tighten until the screw head fits",
    "右": "right",
    "左": "Left",
    "对齐双舵机": "Align double servo",
    "对齐{value}腿的两只舵机": "Align the two servo legs of {value}",
    "按视频排列 {value}，对齐成对舵机。画面中的左右是拍摄视角，不直接等于机器人左右。": "Arrange {value} by video, align pair servo. The left and right in the picture are the shooting angle, not directly equal to the left and right of the robot.",
    "保留另一只已完成的脚踝；核对当前这一侧。": "Keep the other completed ankle; check the current side.",
    "核对舵机与方向": "Check servo with direction",
    "固定大腿支撑": "Fixed thigh support",
    "固定双圆孔大腿支撑": "Fixed double eyelet thigh support",
    "把白色双圆孔支撑贴合这对舵机，对齐四个固定位置，按视频拧入四颗 M2×6。": "Fit the white double round hole support to the pair of servo, align the four fixed positions, and screw in the four M2×6 as shown in the video.",
    "逐孔核对后固定。孔位与安装配合仍是原型示意。": "Check hole by hole and then fix. The hole position and installation fit are still prototype indications.",
    "M2×6 ×4 · 固定支撑": "M2×6 ×4 · Fixed support",
    "压入大轴承": "Press in the big bearing",
    "压入连接脚踝的大轴承": "Press into the large bearing that connects the ankle",
    "将 16×22×4 mm 大轴承对准支撑圆孔，沿轴向压到位。": "Align 16×22×4 mm and large bearing with the support hole and press it in place along the axial direction.",
    "轴承应坐正，再连接已经装好的脚踝。": "bearing should sit upright and then connect the ankle that has been installed.",
    "沿轴向压入大轴承": "Press in the large bearing along the axial direction",
    "连接已装脚踝": "Attached ankle",
    "接上{value}脚踝子组件": "Connect the {value} ankle subassembly",
    "把已经完成的脚踝与小腿作为一个整体，移到大腿支撑的轴承位置，再固定四颗 M2×6。": "Move the completed ankle and calf as a whole to the bearing position of the thigh support, and fix four M2×6.",
    "已有螺丝、踝轴与线缆随子组件一起移动。": "There are already screws, ankles, and cables that move with the subassembly.",
    "整体对齐 · M2×6 ×4": "Overall alignment · M2×6 ×4",
    "插接腿内线束": "Insert into leg cable harness",
    "插接可见的腿内总线": "Plug in the visible leg bus",
    "按视频插接并压紧可见的三针舵机线，留出关节活动需要的余量。": "Plug in and tighten the visible three-pin servo line according to the video, leaving room for joint movement.",
    "此处演示插接与路径；每根线两端的准确接口和针脚尚未核验。": "Mating and routing are demonstrated here; the exact connectors and pinouts at each end of each cable have not been verified.",
    "插接线束 · 端点示意": "Plug cable harness · Endpoint diagram",
    "整理线束余量": "Organize cable harness margin",
    "整理线束并留出上端连接线": "Arrange cable harness and leave the upper connection line",
    "整理环线，让线束留在机构外侧，并保留后续与身体相连的线端。": "Arrange the loop wire so that cable harness remains on the outside of the mechanism, and retain the subsequent wire ends connected to the body.",
    "不要夹线，也不要根据三芯黑线的外观判断针脚定义。": "Do not pinch the thread, and do not judge the pin definition based on the appearance of the three-core black wire.",
    "留出活动余量 · 不夹线": "Leave room for movement · No thread clamping",
    "{value}腿连接完成": "{value} leg connection completed",
    "{value}腿连接部分完成": "{value} leg connection part completed",
    "检查已连接的脚踝、双舵机支撑与线束，然后继续下一阶段。": "Check the connected ankle, double servo brace and cable harness, then proceed to the next stage.",
    "上端连接件和脚底软垫还没有安装。": "The upper connectors and underfoot cushions have not yet been installed.",
    "卸右腿上端舵盘": "Remove the upper part of the right leg servo horn",
    "卸下右腿上端的原装舵盘": "Remove the original servo horn on the upper right leg",
    "先卸中央固定螺丝，再取下舵盘，保留在旁边。": "First remove the central fixing screw, then remove the servo horn and keep it next to it.",
    "此处按视频处理上端；不要拆动已经固定的脚踝。": "The upper end is processed according to the video here; do not remove the fixed ankle.",
    "先卸中央螺丝，再取舵盘": "Remove the central screw first, then take out the servo horn",
    "卸左腿上端舵盘": "Remove the upper part of the left leg servo horn",
    "卸下左腿上端的原装舵盘": "Remove the original servo horn on the upper left leg",
    "按镜像方向处理另一条腿，依次卸中央螺丝和舵盘。": "Process the other leg in the mirror direction and remove the central screw and servo horn in sequence.",
    "拆下的原装零件继续保留在零件区。": "The original parts that were removed remain in the parts area.",
    "保留拆下的原装零件": "Keep the original parts that were removed",
    "右连接件压轴承": "Right connecting piece press bearing",
    "先给右上端连接件压入轴承": "First press bearing into the upper right connector",
    "在独立的上端连接件中压入大轴承，然后再把这一组件装到腿上。": "Press the large bearing into the separate upper connector and then attach the assembly to the leg.",
    "先压轴承，再安装连接件；不要把这两步倒过来。": "Press bearing first, and then install the connector; do not reverse these two steps.",
    "先在连接件中压入轴承": "First press bearing into the connector",
    "安装右连接件": "Install right connector",
    "固定右上端连接件与轴承": "Fix the upper right connector with bearing",
    "把已压入轴承的连接件整体对齐上端位置，用四颗 M2×6 固定。": "Align the connector that has been pressed into bearing to the upper end position and fix it with four M2×6.",
    "连接件与它内部的轴承一起移动。": "The connector moves with the bearing inside it.",
    "组件整体安装 · M2×6 ×4": "Overall installation of components · M2×6 ×4",
    "左连接件压轴承": "Left connecting piece press bearing",
    "给左上端连接件压入轴承": "Press bearing into the upper left connector",
    "在另一侧连接件中压入大轴承，保持镜像朝向。": "Press the large bearing into the connector on the other side, keeping the mirror orientation.",
    "左右连接件使用各自的真实网格。": "The left and right connectors use their own real meshes.",
    "镜像方向 · 先压轴承": "Mirror direction · Press bearing first",
    "安装左连接件": "Install left connector",
    "固定左上端连接件与轴承": "Fix the upper left connector with bearing",
    "把另一侧的连接件与轴承整体装到位，用四颗 M2×6 固定。": "Install the connecting piece on the other side with bearing and fix it with four M2×6.",
    "检查两侧方向一致，给后续身体装配留下连接位置。": "Check that the directions on both sides are consistent, leaving a connection position for subsequent body assembly.",
    "固定右脚底软垫": "Fixed right foot sole cushion",
    "安装右脚底软垫": "Install the right sole cushion",
    "将软垫贴合脚底，按视频对齐四个孔，固定四颗 M2×6。": "Fit the soft pad to the sole of your foot, align the four holes according to the video, and fix the four M2×6.",
    "这是脚底软垫，不是稍后总装阶段的大腿外壳。": "This is the sole cushion, not the thigh shell that comes later in the final assembly stage.",
    "对准脚底 · M2×6 ×4": "Align the soles of your feet · M2×6 ×4",
    "固定左脚底软垫": "Fixed left sole cushion",
    "安装左脚底软垫": "Install left foot sole cushion",
    "在另一只脚底安装软垫，按视频固定四颗 M2×6。": "Install a soft pad on the bottom of the other foot and fix four M2×6 as shown in the video.",
    "检查两只脚底与线束状态，然后进入身体与髋部装配。": "Check the status of the soles of both feet and cable harness, and then proceed to assemble the body and hips.",
    "双腿完成查看": "Legs complete view",
    "双腿子组件装好了": "The two-leg subassembly is installed",
    "现在可以旋转查看两条腿，或回到任意阶段重新看。": "You can now rotate to see both legs, or go back to any stage to see it again.",
    "当前阶段到 08:16；下一阶段安装身体髋部，之后再做头颈和电控总装。": "The current stage is 08:16; the next stage is to install the body hips, and then do the head, neck and electronic control assembly.",
    "{value}{value} · {value}": "{value}{value} · {value}",
    "{value}{value}": "{value}{value}",
    "舵机": "servo",
    "小轴承": "Smallbearing",
    "真实 3MF 网格 · 配合待核验": "Real 3MF grid · fit to be verified",
    "现有硬件网格": "Existing hardware grid",
    "教学简模 · 孔位待核验": "Simple teaching model · Hole positions to be verified",
    "{value}固定螺丝 {value} · M2×6": "{value} fixing screw {value} · M2×6",
    "{value}上端舵机 · ID{value}": "{value} upper endservo · ID{value}",
    "{value}中部舵机 · ID{value}": "{value} middle servo · ID{value}",
    "{value}大腿支撑 · {value}": "{value} thigh support · {value}",
    "{value}大轴承 · 16×22×4": "{value} large bearing · 16×22×4",
    "{value}上端原装舵盘": "{value} upper end original servo horn",
    "教学简模 · 安装位示意": "Teaching simple model·Installation position indication",
    "{value}上端原装中央螺丝": "{value} upper end original central screw",
    "教学简模 · 原装规格待核": "Simple teaching model·Original specifications to be verified",
    "{value}上端连接件 · {value}": "{value} upper connector · {value}",
    "{value}连接件大轴承": "{value} large connector bearing",
    "{value}脚底软垫 · {value}": "{value} Soft foot pad · {value}",
    "线束教学示意 · 路径和端点待核验": "cable harness teaching instructions · The path and endpoints need to be verified",
    "{value}腿内三芯线": "{value} three-core cable in leg",
    "腿内三芯线": "Three core wire inside leg",
    "{value}腿上端预留线": "{value} upper leg reserved line",
    "上端预留线": "Reserved line at the upper end",
    "教学接口；精确键位与针脚待核": "Teaching interface; accurate key positions and pins to be verified",
    "双插座教学锚点；物理修订与电气针脚待核": "Dual socket teaching anchor; physical revision and electrical pinout pending",
    "原装螺丝": "original screws",
    "原装舵盘": "Original servo horn",
    "线端余量": "Line end margin",
    "插头": "plug",
    "踝轴": "ankle axis",
    "轴承": "bearing",
    "线束整理": "cable harness finishing",
    "下嘴软垫": "Soft cushion for lower mouth",
    "上嘴软垫": "Lip cushion",
    "右脚底软垫": "Right foot sole cushion",
    "左脚底软垫": "Left foot sole cushion",
    "下巴": "jaw",
    "头部平台": "head platform",
    "右脚": "right foot",
    "左脚": "left foot",
    "右踝轴": "Right ankle axis",
    "眼睛外壳": "eye shell",
    "左踝轴": "left ankle axis",
    "眼睛": "Eye",
    "颈部连接板 A": "Neck connecting plate A",
    "颈部连接板 B": "Neck connecting plate B",
    "右 Roll 舵机输出": "Right Roll servo output",
    "左 Roll 舵机输出": "Left Roll servo output",
    "头盖": "skull",
    "头部舵机固定件": "Head servo fixing piece",
    "身体背板": "body back panel",
    "大腿右外壳": "Thigh right shell",
    "大腿左外壳": "Thigh left shell",
    "电池仓": "battery compartment",
    "右大腿支撑": "Right thigh support",
    "左大腿支撑": "left thigh support",
    "身体右外壳": "Body right shell",
    "身体左外壳": "Body left shell",
    "头部俯仰支架": "Head tilt bracket",
    "右 Roll 舵机盖板": "Right Roll servo cover",
    "左 Roll 舵机盖板": "Left Roll servo cover",
    "右小腿": "Right calf",
    "左小腿": "Left calf",
    "右 Yaw 连接件": "Right Yaw connector",
    "左 Yaw 连接件": "Left Yaw connector",
    "头部 Yaw 支架": "Head Yaw bracket",
    "髋部 Yaw 支撑": "Hip Yaw support",
    "重复 actorId: {value}": "Repeat actorId: {value}",
    "Arduino UNO Q · 已确认外观 v2批次": "Arduino UNO Q · Appearance confirmed v2 batch",
    "陆吾扩展板 · 已确认外观 v2": "Luwu expansion board · Confirmed appearance v2",
    "已确认照片模型 · 均匀单位换算1000；安装孔估算与电气映射未实物验证": "Confirmed photo model · Uniform unit conversion 1000; mounting hole estimation and electrical mapping have not been physically verified",
    "M3×16 固定螺丝 {value} · 两板近共轴孔候选": "M3×16 Fixing screw {value} · Candidate for nearly coaxial holes on two plates",
    "M3×16 固定螺丝 {value} · 孔位待核": "M3×16 Fixing screw {value} · Hole location to be verified",
    "源GLB孔位比较；2孔近共轴，另2孔约1.27mm错位；不修改孔或推定实物配合": "Source GLB hole position comparison; 2 holes are nearly coaxial, and 2 holes are approximately 1.27mm misaligned; the holes are not modified or the physical fit is presumed",
    "已确认 v2 舵机外观 · HD-1910-C001 / HD1910M；转轴按建模坐标适配，配合与针脚未实物验证": "Confirmed v2 servo appearance · HD-1910-C001 / HD1910M; the shaft is adapted according to the modeling coordinates, and the fit and pins have not been physically verified.",
    "已确认 v2 独立舵盘外观 · 按步骤拆卸；实体配合仍待核": "Confirmed v2 independent servo horn appearance · Disassembly according to steps; physical fit is still to be verified",
    "已确认 v2 三芯插头外观与三根黑线；线长、走线和针脚仍为未核验教学示意": "The appearance of the v2 three-core plug and three black wires have been confirmed; the wire length, wiring and pins are still unverified teaching instructions",
    "已确认 v2 指定规格螺丝外观 · 孔位用途、扭矩与实体配合未实物验证": "The appearance of the screws with specified specifications of v2 has been confirmed. The hole position, torque and physical fit have not been physically verified.",
    "保持两块板的插合关系，将控制器组件移到身体背部。原片标示 4 颗 M3×16；本模型只在两处近共轴孔演示插入，另两处保留待核。": "Keeping the two boards mated, move the controller assembly to the back of your body. The source video is marked 4 and M3×16; this model only demonstrates insertion in two near-coaxial holes, and the other two are reserved for verification.",
    "原片4颗；本模型2孔近共轴，另2孔约1.27mm错位，暂不显示穿过两板的完成态。源板形、孔位、PCB厚度和排针节距均未拉伸或补孔；身体支撑与实体配合待核。": "The original piece has 4 pieces; the 2 holes of this model are nearly coaxial, and the 2 holes are approximately 1.27mm misaligned. The completed state of passing through the two plates is not shown yet. The source plate shape, hole position, PCB thickness and pin row pitch have not been stretched or patched; the body support and physical fit need to be verified.",
    "原片 M3×16 ×4 · 演示2孔，另2孔待核": "Original film M3×16 ×4 · Demonstrates 2 holes, and the other 2 holes are to be verified",
    "采用已确认板卡模型；32针对齐与12.3mm建模间距已核对，孔位部分为照片估算。两处安装孔约1.27mm错位，实物插合、公差与电气针脚未验证。": "The confirmed board model is used; 32 pin alignment and 12.3mm modeling spacing have been checked, and the hole locations are estimated from photos. The two mounting holes are misaligned by about 1.27mm, and the physical insertion, tolerances and electrical pins have not been verified.",
    "采用已确认照片模型。四组32针按建模坐标对齐；PCB和接口未按总包络拉伸。板间净空、键位、电气映射和实物配合仍待核。": "Features confirmed photo model. The four sets of 32 pins are aligned according to the modeling coordinates; PCB and the interface are not stretched according to the total envelope. Board clearance, key locations, electrical mapping and physical fit are still to be verified.",
    "萨蒂 · 第一号吉姆诺佩蒂": "Satie No. 1 Jimnoppetti",
    "莫扎特 · K.545 行板": "Mozart · K.545 Andante",
    "已静音": "muted",
    "点一下页面开始音乐": "Click on the page to start music",
    "正在准备钢琴曲…": "Preparing piano music...",
    "正在播放 · ": "Now playing ·",
    "仅播放完成提示音": "Only play the completion tone",
    "声音已关闭": "Sound is off",
    "钢琴曲暂时无法播放，可切换曲目重试": "The piano music cannot be played temporarily. You can switch the track and try again.",
    "打印件用涂装台当前的配色，舵机、板子和螺丝保持原样": "The print uses the current color scheme of the paint table, servo, the board and screws remain the same",
    "还没有涂色，打印件先用白色演示": "It has not been colored yet, so the printout will be demonstrated in white first.",
    "配色 · ": "Color matching ·",
    "白胚": "white embryo",
    ").textContent=s.complete?`{value} · 完成`:`${String(local).padStart(2,": ").textContent=s.complete?`{value} · Complete`:`${String(local).padStart(2,",
    "红框 · 对准这两处": "Red box · Aim at these two places",
    "绿框 · 本次已装好": "Green frame · Already installed this time",
    "真实零件网格": "Real part mesh",
    "模型清单加载失败": "Model manifest loading failed",
    "模型几何加载失败": "Model geometry loading failed",
    "极致 · ": "Extreme ·",
    "极致 · 细腻哑光、边缘柔光与摄影棚反射": "Ultimate · Delicate matte, edge soft light and studio reflection",
    "当前 · 原有材质和渲染": "Current · Original materials and rendering",
    "来做鸭 / letsduck · 3D 组装教程": "Let’s make a duck / letsduck · 3D assembly tutorial",
    "来做鸭 / letsduck": "Let’s make a duck / letsduck",
    "3D 组装教程": "3D assembly tutorial",
    "整机预览": "Whole machine preview",
    "对照原片": "Compare the source video",
    "跟着视频，一步一步装": "Follow the video and install it step by step",
    "整机组装": "Whole machine assembly",
    "原片 00:00—23:10": "Original film 00:00—23:10",
    "画质": "Image quality",
    "渲染画质": "Rendering quality",
    "当前": "current",
    "极致": "extreme",
    "局部放大 · 关": "Partial zoom · Off",
    "最佳视角": "Best viewing angle",
    "正面": "front",
    "背面": "back",
    "三维组装区域": "3D assembly area",
    "正在加载现有模型…": "Loading existing model...",
    "可旋转的整机三维模型": "Rotatable 3D model of the whole machine",
    "接头局部放大窗": "Joint partial magnification window",
    "拖动放大窗": "Drag the magnifying window",
    "收起局部放大": "Collapse local enlargement",
    "当前接头的实时三维放大画面": "Real-time 3D enlargement of the current joint",
    "所选零件信息": "Selected part information",
    "收起零件信息": "Hide parts information",
    "可以开始": "can start",
    "本步动作": "Action of this step",
    "本步动作进度": "Progress of this step",
    "← 上一步": "← Previous",
    "红绿框演示": "Red and green box demonstration",
    "暂停": "pause",
    "自动播放 · 关": "Autoplay · Off",
    "播放倍率": "Playback magnification",
    "声音设置": "sound settings",
    "声音": "sound",
    "收起声音设置": "Collapse sound settings",
    "背景音乐": "background music",
    "选择钢琴曲": "Select piano music",
    "完成提示音": "Completion tone",
    "音量": "volume",
    "曲目与模型来源 ↗": "Track and model source ↗",
    "开始组装": "Start assembling",
    "下一步 →": "Next →",
    "从头再看": "Look at it from the beginning",
    "v4.1 走线复核版 · 新插头与部分3MF支架/外壳有几何干涉，红框部位配合待核。": "v4.1 wiring review version · The new plug has geometric interference with some 3MF brackets/casings, and the fit of the red box parts needs to be verified.",
    "组装步骤": "Assembly steps",
    "组装顺序": "Assembly sequence",
    "选择组装阶段": "Select assembly stage",
    "1 · 准备与编号": "1 · Preparation and Numbering",
    "2 · 右脚踝": "2 · Right ankle",
    "3 · 左脚踝": "3 · Left ankle",
    "4 · 右腿连接": "4 · Right leg connection",
    "5 · 左腿连接": "5 · Left leg connection",
    "6 · 双腿收尾": "6 · Leg finishing",
    "7 · 身体与髋支撑": "7 · Body and Hip Support",
    "8 · 髋电机与接腿": "8 · Hip motors and leg joints",
    "9 · 头部旋转与接线": "9 · Head rotation and wiring",
    "10 · 嘴部与双舵机脖子": "10 · Mouth and double servo neck",
    "11 · 头盖与嘴部软垫": "11 · Head cover and mouth cushion",
    "12 · 身体与头颈总装": "12 · Body and head and neck assembly",
    "13 · 电控与外壳收尾": "13 · Electronic control and housing finishing",
    "14 · 校准与完成": "14 · Calibration and completion",
    "选择组装步骤": "Select assembly steps",
    "本步说明 ↗": "Instructions for this step ↗",
    "收起本步说明": "Collapse this step's instructions",
    "准备": "Prepare",
    "教学说明 · 不连接或控制真实设备": "Tutorial Notes · No connection or control of real devices",
    "本步用到": "Used in this step",
    "看这一步的原片": "Watch the original video of this step",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。": "Teaching instructions: Hole positions, connection fit, board modifications and line endpoints have not yet been physically verified.",
    "原片对照": "Original film comparison",
    "收起原片": "Close the source video",
    "截取自你提供的视频 · 20:58—23:10": "Extracted from the video you provided · 20:58—23:10",
    "{name}放大": "{name} enlarge",
    "{ordinal}/{total} · {status}": "{ordinal}/{total} · {status}",
    "{frame} · {status}": "{frame} · {status}",
    "{title}窗口": "{title} window",
    "{name} · 剖视": "{name} · Cross-section",
    "局部放大 · {state}": "Partial zoom · {state}",
    "自动播放 · {state}": "Autoplay · {state}",
    "截取自你提供的视频 · {start}—{end}": "Excerpted from the video you provided · {start}—{end}",
    "模型没有加载成功：{error}": "The model was not loaded successfully: {error}",
    "配色 · {name}": "Color · {name}",
    "正在播放 · {track}": "Now playing · {track}",
    "本步观看 {seen} / {total} · 实物完成 {built} / {total}": "Watch this step {seen} / {total} · Physical completion {built} / {total}",
    "本步说明": "Instructions for this step",
    "收起说明 · 留出观察空间": "Collapse instructions · Leave space for observation",
    "方向与动作": "direction and action",
    "完成检查": "Complete inspection",
    "已看过此步": "Already seen this step",
    "我已检查实物并装好": "I have checked the physical object and installed it",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。接头键位、实际插座、针脚和极性未核验。": "Teaching instructions: Hole positions, connection fit, board modifications and line endpoints have not yet been physically verified. Connector keys, actual sockets, pins and polarity have not been verified.",
    "观察设置 · 视角 / 聚焦 / 画质": "Observation Settings·Viewing/Focus/Image Quality",
    "播放设置 · 进度 / 倍率 / 声音": "Playback Settings · Progress/Magnification/Sound",
    "收起组装顺序": "Collapse assembly sequence",
    "观看 {seen}/{total} · 实物 {built}/{total}": "Watch {seen}/{total} · Actual {built}/{total}",
    "{chapter} · {local} / {total}": "{chapter} · {local} / {total}",
    "{chapter} · 完成": "{chapter} · Complete",
    "{local}  {short}": "{local} {short}",
    "红框": "Red frame",
    "绿框": "Green frame"
  }
};
