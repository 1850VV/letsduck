// Static assembly copy. Machine-drafted, technical-reference corrections; native review pending.
export default {
  "version": 1,
  "steps": {
    "prepare-intro": {
      "short": "Primero eche un vistazo al robot completo.",
      "title": "Comprender la máquina completa y la ruta de montaje.",
      "text": "Primero mire toda la máquina, luego complete la preparación, piernas, cuerpo, cabeza y cuello, montaje final y calibración en secuencia.",
      "check": "Este es el prototipo de enseñanza independiente. Puede utilizar \"Vista previa completa\" para volver al estado completado en cualquier momento.",
      "caption": ""
    },
    "prepare-boards": {
      "short": "Conecte temporalmente dos placas juntas",
      "title": "Conecte temporalmente UNO Q y la placa de expansión",
      "text": "Alinee los cabezales de los pasadores y los cabezales hembra de las dos tablas y presiónelos juntos en la misma dirección. Los dos tableros son dos objetos separados en el tutorial.",
      "check": "Características del modelo de fotografía confirmado. Los cuatro conjuntos de pines 32 están alineados según las coordenadas de modelado; PCB y la interfaz no se estiran según la envolvente total. Aún quedan por verificar la autorización de la placa, las ubicaciones clave, el mapeo eléctrico y el ajuste físico.",
      "caption": "Alinee el cabezal del pasador y el cabezal hembra y presiónelos juntos."
    },
    "prepare-battery": {
      "short": "Conecte la batería de prueba",
      "title": "Conecte la batería de alimentación temporal",
      "text": "Inserte el conector de la batería de acuerdo con la pieza original para preparar la fuente de alimentación para la siguiente configuración única servo.",
      "check": "El vídeo te recuerda que debes prestar atención a la polaridad; Este prototipo no estima los pines reales ni la polaridad según la apariencia.",
      "caption": "El enchufe y la dirección están sujetos a verificación física."
    },
    "prepare-servo": {
      "short": "Conecte un servo",
      "title": "Solo conecte un servo para configurar a la vez",
      "text": "Primero conecte el cable de tres núcleos en servo y luego conecte el otro extremo a la placa. Actualmente solo este está conectado para probar servo.",
      "check": "Después de completar la numeración del actual, desconecta y reemplaza el siguiente.",
      "caption": "Sencillo servo · Enchufe en su lugar"
    },
    "prepare-usb": {
      "short": "Enciende el ordenador y conéctalo.",
      "title": "Encienda y conéctese a Type-C",
      "text": "Presione video para encender la alimentación y luego conecte la computadora con el cable Type-C.",
      "check": "Esta página solo demuestra la secuencia de conexión y no inicia ni conecta dispositivos reales.",
      "caption": "Encendido · Conectar a Type-C"
    },
    "prepare-app": {
      "short": "Importar y ejecutar la aplicación.",
      "title": "Importe y ejecute la aplicación en Arduino App Lab",
      "text": "Importe la aplicación XGO Duck a su computadora y ejecútela. El vídeo original no muestra completamente la instalación del primer entorno.",
      "check": "Este paso proporciona comparación de videos e instrucciones instructivas; aquí no hay una sesión App Lab real.",
      "caption": "Inicio de la aplicación · Instrucciones del tutorial"
    },
    "prepare-scan": {
      "short": "Escanear y centrar",
      "title": "Ingrese Servo setup, escanee y centre el servo actual",
      "text": "Abra la dirección de configuración de su propio dispositivo e ingrese Servo setup. Scan all IDs → Después de encontrar uno solo Stop scan → Move to 2047 → Write.",
      "check": "Debido a diferentes entornos, el dispositivo IP y el nombre del host no copian la dirección fija de la película original.",
      "caption": "Scan → Stop → 2047 → Write"
    },
    "prepare-id": {
      "short": "Escribir parámetros y ID",
      "title": "Escriba los parámetros y establezca el objetivo ID",
      "text": "Los parámetros de video son KP=5 y KD=20, haga clic en Write; complete el objetivo ID, ejecute Change ID y confirme el éxito.",
      "check": "Esta es la secuencia de configuración en el vídeo; la página web actual no envía parámetros a servo.",
      "caption": "KP 5 · KD 20 · Change ID"
    },
    "prepare-all-ids": {
      "short": "Completa 15 y ID uno por uno.",
      "title": "Completa la numeración y centrado de los quince servo uno a uno",
      "text": "Complete 10–14, 20–24, 30–34 en orden. Configure solo uno a la vez. La instalación mecánica posterior comienza desde un estado centrado y numerado.",
      "check": "Los quince ID en esta página son una lista instructiva y no representan que se hayan escrito o centrado dispositivos reales.",
      "caption": "15 ID · Procesados ​​uno por uno"
    },
    "r-prepare": {
      "short": "preparar piezas",
      "title": "Preparar las partes del tobillo derecho.",
      "text": "Prepare ID14 servo numerado y centrado, así como la punta del pie, la pantorrilla, rodamiento y el eje del tobillo de este lado.",
      "check": "La numeración y el centrado servo deben completarse antes de la instalación mecánica.",
      "caption": ""
    },
    "r-horn": {
      "short": "Quitar brazo del servo",
      "title": "Quitar brazo del servo",
      "text": "Primero desenrosque el tornillo de fijación original en el centro del brazo del servo y luego retire el brazo del servo negro a lo largo de la dirección del eje de salida.",
      "check": "Deje a un lado el brazo del servo y los tornillos originales; Los pasos posteriores no lo reemplazarán con tornillos autorroscantes.",
      "caption": "Retire primero el tornillo central, luego retire el brazo del servo."
    },
    "r-plug": {
      "short": "Conecte el cable",
      "title": "Conecte la línea servo",
      "text": "Alinee el orificio del terminal del enchufe con la protuberancia de la interfaz, insértelo en la dirección de la interfaz y luego presiónelo en su lugar.",
      "check": "Verifique claramente la dirección del enchufe. La acción de taponamiento se demuestra aquí. La definición de los pines del cable de tres núcleos aún debe verificarse físicamente.",
      "caption": "Alinee la interfaz y presiónela en su lugar."
    },
    "r-shank": {
      "short": "Pantorrilla fija",
      "title": "Conector fijo en la parte inferior de la pierna.",
      "text": "Coloque el conector blanco de la pata inferior en servo, alinee los orificios de montaje y luego atornille dos tornillos autorroscantes de cabeza avellanada M2×6.",
      "check": "El extremo largo del conector apunta hacia arriba. Primero alinee los agujeros y luego fíjelos. No se necesitan tornillos para colocar las piezas torcidas en su lugar.",
      "caption": "Agujero correcto · M2×6 ×2"
    },
    "r-foot": {
      "short": "Se adapta a la planta del pie",
      "title": "Instale servo en la planta del pie.",
      "text": "Coloque el módulo compuesto por servo y conector de pantorrilla en la planta del pie y fije los cuatro tornillos autorroscantes de cabeza avellanada M2×6 como se muestra en el vídeo.",
      "check": "Primero confirme la orientación de las plantas de los pies y las articulaciones, y luego fije las cuatro posiciones. Los cables quedan en el exterior.",
      "caption": "Pie fijo · M2×6 ×4"
    },
    "r-small-bearing": {
      "short": "Presione rodamiento",
      "title": "Presione en el pequeño rodamiento",
      "text": "Alinee el pequeño rodamiento con el orificio de montaje circular en la planta del pie y presiónelo a lo largo de la dirección axial.",
      "check": "rodamiento debe estar en posición vertical, con el orificio central y el conector coaxial. El número de modelo corresponde a 10×15×3 mm según la lista.",
      "caption": "Presione axialmente"
    },
    "r-axle": {
      "short": "Instale el eje del tobillo",
      "title": "Alinee e instale el eje del tobillo.",
      "text": "Alinee el orificio central, coloque el eje del tobillo impreso en el centro de rodamiento y luego atornille manualmente el tornillo autorroscante M2.3×8.",
      "check": "El eje del tobillo utiliza la rejilla 3MF existente; la posición aquí se ha ajustado para su visualización y no se ha verificado su ajuste físico.",
      "caption": "Alinear rodamiento al centro"
    },
    "r-tighten": {
      "short": "cheque fijo",
      "title": "Apretar y comprobar",
      "text": "Atornille el tornillo M2.3×8 axialmente hasta que la cabeza del tornillo descanse contra la superficie, luego verifique la conexión del tobillo.",
      "check": "El video pide que la cabeza del tornillo encaje perfectamente y que el extremo salga por el otro lado. El prototipo sólo demuestra movimiento y no simula el par ni las tolerancias reales.",
      "caption": "Apriete hasta que la cabeza del tornillo encaje"
    },
    "r-ankle-done": {
      "short": "Visualización completa",
      "title": "El tobillo derecho está instalado.",
      "text": "Puede rotar la inspección antes de continuar con la siguiente etapa. Las plantillas se instalan durante la fase de acabado de las piernas.",
      "check": "Los cojines debajo de los pies aún no están instalados en esta sección; se instalan más adelante en el video en las piernas.",
      "caption": ""
    },
    "l-prepare": {
      "short": "preparar piezas",
      "title": "Preparar las partes del tobillo izquierdo.",
      "text": "Prepare ID24 servo numerado y centrado, así como la punta del pie, la pantorrilla, rodamiento y el eje del tobillo de este lado.",
      "check": "La numeración y el centrado servo deben completarse antes de la instalación mecánica.",
      "caption": ""
    },
    "l-horn": {
      "short": "Quitar brazo del servo",
      "title": "Quitar brazo del servo",
      "text": "Primero desenrosque el tornillo de fijación original en el centro del brazo del servo y luego retire el brazo del servo negro a lo largo de la dirección del eje de salida.",
      "check": "Deje a un lado el brazo del servo y los tornillos originales; Los pasos posteriores no lo reemplazarán con tornillos autorroscantes.",
      "caption": "Retire primero el tornillo central, luego retire el brazo del servo."
    },
    "l-plug": {
      "short": "Conecte el cable",
      "title": "Conecte la línea servo",
      "text": "Alinee el orificio del terminal del enchufe con la protuberancia de la interfaz, insértelo en la dirección de la interfaz y luego presiónelo en su lugar.",
      "check": "Verifique claramente la dirección del enchufe. La acción de taponamiento se demuestra aquí. La definición de los pines del cable de tres núcleos aún debe verificarse físicamente.",
      "caption": "Alinee la interfaz y presiónela en su lugar."
    },
    "l-shank": {
      "short": "Pantorrilla fija",
      "title": "Conector fijo en la parte inferior de la pierna.",
      "text": "Coloque el conector blanco de la pata inferior en servo, alinee los orificios de montaje y luego atornille dos tornillos autorroscantes de cabeza avellanada M2×6.",
      "check": "El extremo largo del conector apunta hacia arriba. Primero alinee los agujeros y luego fíjelos. No se necesitan tornillos para colocar las piezas torcidas en su lugar.",
      "caption": "Agujero correcto · M2×6 ×2"
    },
    "l-foot": {
      "short": "Se adapta a la planta del pie",
      "title": "Instale servo en la planta del pie.",
      "text": "Coloque el módulo compuesto por servo y conector de pantorrilla en la planta del pie y fije los cuatro tornillos autorroscantes de cabeza avellanada M2×6 como se muestra en el vídeo.",
      "check": "Primero confirme la orientación de las plantas de los pies y las articulaciones, y luego fije las cuatro posiciones. Los cables quedan en el exterior.",
      "caption": "Pie fijo · M2×6 ×4"
    },
    "l-small-bearing": {
      "short": "Presione rodamiento",
      "title": "Presione en el pequeño rodamiento",
      "text": "Alinee el pequeño rodamiento con el orificio de montaje circular en la planta del pie y presiónelo a lo largo de la dirección axial.",
      "check": "rodamiento debe estar en posición vertical, con el orificio central y el conector coaxial. El número de modelo corresponde a 10×15×3 mm según la lista.",
      "caption": "Presione axialmente"
    },
    "l-axle": {
      "short": "Instale el eje del tobillo",
      "title": "Alinee e instale el eje del tobillo.",
      "text": "Alinee el orificio central, coloque el eje del tobillo impreso en el centro de rodamiento y luego atornille manualmente el tornillo autorroscante M2.3×8.",
      "check": "El eje del tobillo utiliza la rejilla 3MF existente; la posición aquí se ha ajustado para su visualización y no se ha verificado su ajuste físico.",
      "caption": "Alinear rodamiento al centro"
    },
    "l-tighten": {
      "short": "cheque fijo",
      "title": "Apretar y comprobar",
      "text": "Atornille el tornillo M2.3×8 axialmente hasta que la cabeza del tornillo descanse contra la superficie, luego verifique la conexión del tobillo.",
      "check": "El video pide que la cabeza del tornillo encaje perfectamente y que el extremo salga por el otro lado. El prototipo sólo demuestra movimiento y no simula el par ni las tolerancias reales.",
      "caption": "Apriete hasta que la cabeza del tornillo encaje"
    },
    "l-ankle-done": {
      "short": "Visualización completa",
      "title": "El tobillo izquierdo está instalado.",
      "text": "Puede rotar la inspección antes de continuar con la siguiente etapa. Las plantillas se instalan durante la fase de acabado de las piernas.",
      "check": "Los cojines debajo de los pies aún no están instalados en esta sección; se instalan más adelante en el video en las piernas.",
      "caption": ""
    },
    "r-pair": {
      "short": "Alinear doble servo",
      "title": "Alinee los dos servo en la pierna derecha.",
      "text": "Organice ID12 / ID13 por video, alinee el par servo. La izquierda y la derecha en la imagen son el ángulo de disparo, no directamente iguales a la izquierda y la derecha del robot.",
      "check": "Mantenga el otro tobillo completo; comprobar el lado actual.",
      "caption": "Verifique servo con dirección"
    },
    "r-support": {
      "short": "Soporte fijo para muslos.",
      "title": "Soporte fijo para muslos con doble ojal.",
      "text": "Coloque el soporte blanco de doble orificio redondo en el par de servo, alinee las cuatro posiciones fijas y atornille los cuatro M2×6 como se muestra en el vídeo.",
      "check": "Verifique agujero por agujero y luego arregle. La posición de los orificios y la coordinación de la instalación siguen siendo indicaciones prototipo.",
      "caption": "M2×6 ×4 · Soporte fijo"
    },
    "r-bearing": {
      "short": "Presione en el gran rodamiento",
      "title": "Presione en el rodamiento grande que conecta el tobillo.",
      "text": "Alinee 16×22×4 mm y rodamiento grande con el orificio de soporte y presiónelos en su lugar a lo largo de la dirección axial.",
      "check": "rodamiento debe sentarse erguido y luego conectar el tobillo que se ha instalado.",
      "caption": "Presione el rodamiento grande a lo largo de la dirección axial"
    },
    "r-join": {
      "short": "tobillo adjunto",
      "title": "Conecte el subconjunto del tobillo derecho",
      "text": "Mueva el tobillo y la pantorrilla completos en su conjunto a la posición rodamiento del soporte para muslos y fije cuatro M2×6.",
      "check": "Ya hay tornillos, tobillos y cables que se mueven con el subconjunto.",
      "caption": "Alineación general · M2×6 ×4"
    },
    "r-wire-a": {
      "short": "Insertar en la pierna mazo de cables",
      "title": "Conecte el autobús de la pierna visible",
      "text": "Conecte y apriete la línea visible servo de tres pines según el video, dejando espacio para el movimiento de las articulaciones.",
      "check": "Aquí se demuestran el acoplamiento y el enrutamiento; No se han verificado los conectores y pines exactos en cada extremo de cada cable.",
      "caption": "Enchufe mazo de cables · Diagrama de punto final"
    },
    "r-wire-b": {
      "short": "Organizar el margen mazo de cables",
      "title": "Organizar mazo de cables y dejar la línea de conexión superior.",
      "text": "Disponga el cable del bucle de modo que mazo de cables quede en el exterior del mecanismo y mantenga los extremos del cable subsiguientes conectados al cuerpo.",
      "check": "No pellizque el hilo y no juzgue la definición del pasador según la apariencia del cable negro de tres núcleos.",
      "caption": "Deje espacio para el movimiento · Sin sujeción del hilo"
    },
    "r-leg-done": {
      "short": "Conexión de la pierna derecha completada",
      "title": "Parte de conexión de la pierna derecha completada",
      "text": "Verifique el tobillo conectado, la abrazadera doble servo y mazo de cables, luego continúe con la siguiente etapa.",
      "check": "Los conectores superiores y los cojines debajo de los pies aún no se han instalado.",
      "caption": ""
    },
    "l-pair": {
      "short": "Alinear doble servo",
      "title": "Alinee los dos servo en la pierna izquierda.",
      "text": "Organice ID23 / ID22 por video, alinee el par servo. La izquierda y la derecha en la imagen son el ángulo de disparo, no directamente iguales a la izquierda y la derecha del robot.",
      "check": "Mantenga el otro tobillo completo; comprobar el lado actual.",
      "caption": "Verifique servo con dirección"
    },
    "l-support": {
      "short": "Soporte fijo para muslos.",
      "title": "Soporte fijo para muslos con doble ojal.",
      "text": "Coloque el soporte blanco de doble orificio redondo en el par de servo, alinee las cuatro posiciones fijas y atornille los cuatro M2×6 como se muestra en el vídeo.",
      "check": "Verifique agujero por agujero y luego arregle. La posición de los orificios y la coordinación de la instalación siguen siendo indicaciones prototipo.",
      "caption": "M2×6 ×4 · Soporte fijo"
    },
    "l-bearing": {
      "short": "Presione en el gran rodamiento",
      "title": "Presione en el rodamiento grande que conecta el tobillo.",
      "text": "Alinee 16×22×4 mm y rodamiento grande con el orificio de soporte y presiónelos en su lugar a lo largo de la dirección axial.",
      "check": "rodamiento debe sentarse erguido y luego conectar el tobillo que se ha instalado.",
      "caption": "Presione el rodamiento grande a lo largo de la dirección axial"
    },
    "l-join": {
      "short": "tobillo adjunto",
      "title": "Conecte el subconjunto del tobillo izquierdo",
      "text": "Mueva el tobillo y la pantorrilla completos en su conjunto a la posición rodamiento del soporte para muslos y fije cuatro M2×6.",
      "check": "Ya hay tornillos, tobillos y cables que se mueven con el subconjunto.",
      "caption": "Alineación general · M2×6 ×4"
    },
    "l-wire-a": {
      "short": "Insertar en la pierna mazo de cables",
      "title": "Conecte el autobús de la pierna visible",
      "text": "Conecte y apriete la línea visible servo de tres pines según el video, dejando espacio para el movimiento de las articulaciones.",
      "check": "Aquí se demuestran el acoplamiento y el enrutamiento; No se han verificado los conectores y pines exactos en cada extremo de cada cable.",
      "caption": "Enchufe mazo de cables · Diagrama de punto final"
    },
    "l-wire-b": {
      "short": "Organizar el margen mazo de cables",
      "title": "Organizar mazo de cables y dejar la línea de conexión superior.",
      "text": "Disponga el cable del bucle de modo que mazo de cables quede en el exterior del mecanismo y mantenga los extremos del cable subsiguientes conectados al cuerpo.",
      "check": "No pellizque el hilo y no juzgue la definición del pasador según la apariencia del cable negro de tres núcleos.",
      "caption": "Deje espacio para el movimiento · Sin sujeción del hilo"
    },
    "l-leg-done": {
      "short": "La pierna izquierda está conectada.",
      "title": "La parte de conexión de la pierna izquierda está completa.",
      "text": "Verifique el tobillo conectado, la abrazadera doble servo y mazo de cables, luego continúe con la siguiente etapa.",
      "check": "Los conectores superiores y los cojines debajo de los pies aún no se han instalado.",
      "caption": ""
    },
    "r-top-horn": {
      "short": "Retire la parte superior de la pierna derecha brazo del servo",
      "title": "Retire el brazo del servo original en la parte superior de la pierna derecha.",
      "text": "Primero retiramos el tornillo de fijación central, luego retiramos el brazo del servo y lo guardamos junto a él.",
      "check": "El extremo superior se procesa según el vídeo aquí; No retire el tobillo fijo.",
      "caption": "Retire primero el tornillo central, luego saque el brazo del servo."
    },
    "l-top-horn": {
      "short": "Retire la parte superior de la pierna izquierda brazo del servo",
      "title": "Retire el brazo del servo original en la parte superior de la pierna izquierda.",
      "text": "Procese la otra pata en la dirección del espejo y retire el tornillo central y brazo del servo en secuencia.",
      "check": "Las piezas originales que fueron retiradas permanecen en el área de piezas.",
      "caption": "Conserve las piezas originales que fueron retiradas."
    },
    "r-top-bearing": {
      "short": "Prensa de pieza de conexión derecha rodamiento",
      "title": "Primero presione rodamiento en el conector superior derecho",
      "text": "Presione el rodamiento grande en el conector superior separado y luego fije el conjunto a la pata.",
      "check": "Presione primero rodamiento y luego instale el conector; No invierta estos dos pasos.",
      "caption": "Primero presione rodamiento en el conector."
    },
    "r-top-link": {
      "short": "Instale el conector derecho",
      "title": "Fije el conector superior derecho con rodamiento",
      "text": "Alinee el conector que se ha presionado en rodamiento con la posición final superior y fíjelo con cuatro M2×6.",
      "check": "El conector se mueve con el rodamiento en su interior.",
      "caption": "Instalación general de componentes · M2×6 ×4"
    },
    "l-top-bearing": {
      "short": "Prensa de pieza de conexión izquierda rodamiento",
      "title": "Presione rodamiento en el conector superior izquierdo",
      "text": "Presione el rodamiento grande en el conector del otro lado, manteniendo la orientación del espejo.",
      "check": "Los conectores izquierdo y derecho utilizan sus propias mallas reales.",
      "caption": "Dirección del espejo · Presione primero rodamiento"
    },
    "l-top-link": {
      "short": "Instalar el conector izquierdo",
      "title": "Fije el conector superior izquierdo con rodamiento",
      "text": "Instale la pieza de conexión en el otro lado con rodamiento y fíjela con cuatro M2×6.",
      "check": "Comprobar que las direcciones en ambos lados son consistentes, dejando una posición de conexión para el posterior montaje de la carrocería.",
      "caption": "Instalación general de componentes · M2×6 ×4"
    },
    "r-sole": {
      "short": "Cojín fijo planta pie derecho",
      "title": "Instale el cojín de suela derecho",
      "text": "Coloque la almohadilla suave en la planta de su pie, alinee los cuatro orificios según el video y fije los cuatro M2×6.",
      "check": "Este es el único cojín, no la cubierta del muslo que viene más adelante en la etapa de montaje final.",
      "caption": "Alinea las plantas de tus pies · M2×6 ×4"
    },
    "l-sole": {
      "short": "Cojín fijo de suela izquierda",
      "title": "Instale el cojín de la planta del pie izquierdo",
      "text": "Instale una almohadilla suave en la parte inferior del otro pie y fije cuatro M2×6 como se muestra en el video.",
      "check": "Comprobar el estado de las plantas de ambos pies y mazo de cables, para luego proceder al montaje del cuerpo y caderas.",
      "caption": "Alinea las plantas de tus pies · M2×6 ×4"
    },
    "legs-complete": {
      "short": "Vista completa de piernas",
      "title": "El subconjunto de dos patas está instalado",
      "text": "Ahora puedes girar para ver ambas piernas o volver a cualquier nivel para verla nuevamente.",
      "check": "La etapa actual es 08:16; la siguiente etapa es instalar las caderas del cuerpo y luego realizar el ensamblaje de la cabeza, el cuello y el control electrónico.",
      "caption": ""
    },
    "t-pair": {
      "short": "Organizar doble servo",
      "title": "Organizar los números ID20 y ID10.",
      "text": "Organice dos servo centrados según la perspectiva del escritorio de la película original: ID20 en el lado izquierdo de la pantalla y ID10 en el lado derecho. Mantenlos originales brazo del servo.",
      "check": "La izquierda y la derecha de la pantalla no equivalen directamente a la izquierda y la derecha del robot. La rejilla se coloca según las coordenadas existentes de toda la máquina, quedando pendiente de verificación física la coordinación de la instalación.",
      "caption": "Pantalla izquierda 20 · Pantalla derecha 10"
    },
    "t-support": {
      "short": "soporte fijo para la cadera",
      "title": "Asegure el soporte de cadera con orificio redondo doble con seis tornillos",
      "text": "Coloque el soporte de cadera de doble orificio redondo P6-09 sobre los dos servo, alinéelo y fije los seis tornillos autorroscantes de cabeza avellanada M2×6.",
      "check": "Mantenga los dos orificios inferiores en el medio como se menciona en el video y no agregue tornillos a estos dos orificios. Los puntos de anclaje de tornillos animados son representaciones de grupos de agujeros.",
      "caption": "M2×6 ×6 · Deje vacíos los dos agujeros del medio en la parte inferior"
    },
    "t-wire": {
      "short": "Conexión y cableado",
      "title": "mazo de cables es visible en la cadera insertada y sale",
      "text": "Presionamos la pieza original para apretar los enchufes visibles en los dos cuerpos servo, dejando a un lado los siguientes cables de conexión del motor de cadera y los cables reservados para la placa base. El cable reservado sale por la abertura.",
      "check": "El enchufe doble se posiciona como un modelo didáctico sencillo según las características de la superficie de la rejilla fuente. La ruta mazo de cables, la identidad del zócalo y los pines no se han verificado, y los dos cuerpos servo no están interconectados sin autorización.",
      "caption": "Conéctelo axialmente primero, luego pase los cables, diagrama de cableado"
    },
    "t-backplate-front": {
      "short": "Instalar el panel trasero de la carrocería",
      "title": "Coloque el panel trasero del cuerpo y fije los dos tornillos en el frente.",
      "text": "Alinee el panel trasero de la carrocería P4-03 con el conjunto de cadera, primero fije los dos M2×6 visibles en el frente de la pieza original.",
      "check": "El panel trasero y el mazo de cables deben ensamblarse primero y luego apretarse, sin sellar el hilo en la costura. Las posiciones de los agujeros siguen siendo para fines didácticos.",
      "caption": "Frente M2×6 ×2"
    },
    "t-backplate-back": {
      "short": "espalda fija",
      "title": "Asegure los dos tornillos en la parte posterior del panel trasero.",
      "text": "Continúe trabajando en la espalda y asegure los otros dos M2×6. Las dos piezas del frente y las dos piezas de la parte posterior del panel posterior se muestran por separado.",
      "check": "Este paso suma dos nuevos y no vuelve a contar el grupo anterior.",
      "caption": "Volver M2×6 ×2"
    },
    "t-yaw-r": {
      "short": "Monte la pieza de unión derecha",
      "title": "Presione primero rodamiento, luego instale el conector Yaw–Roll derecho",
      "text": "Primero presione el rodamiento grande en el conector P6-06 independiente y luego alinee todo el conector con el rodamiento con el lado derecho del cuerpo. Finalmente, se demuestra el grupo de orificios de fijación.",
      "check": "Película original 09:41 Puedes ver rodamiento en el conector. 10: Los subtítulos de 05 son cuatro M2×6, pero el número y las asignaciones de grupos de agujeros en cada lado aún no se han verificado; los tornillos animados sólo están indicados.",
      "caption": "Primera pulsación rodamiento → Alineación general · Diagrama de grupo de agujeros"
    },
    "t-yaw-l": {
      "short": "Instale el conector izquierdo",
      "title": "Instale el lado izquierdo rodamiento y el conector en la dirección del espejo.",
      "text": "Primero presione el otro rodamiento grande en el conector independiente P6-07 y luego mueva este componente hacia el lado izquierdo del cuerpo para fijarlo.",
      "check": "La película original 09:57 puede verse como rodamiento. Las partes izquierda y derecha utilizan sus propias cuadrículas reales; Es necesario verificar la cantidad de tornillos y las posiciones precisas de los orificios en cada lado.",
      "caption": "Dirección del espejo · Presione primero rodamiento y luego instale el conector."
    },
    "t-roll-pair": {
      "short": "Toma la cadera servo",
      "title": "Retire las dos caderas ID21 y ID11 y servo.",
      "text": "El ángulo de visión del escritorio de la película original es ID21 a la izquierda y ID11 a la derecha. Los dos servo se colocan primero en la posición de preparación independiente y aún no se han cargado en la carrocería.",
      "check": "Verifique el número y el estado de centrado y prepárese para retirar el brazo del servo original.",
      "caption": "Pantalla izquierda 21 · Pantalla derecha 11"
    },
    "t-roll-horns": {
      "short": "Centro de descarga brazo del servo",
      "title": "Primero retiramos el tornillo central, luego retiramos los dos brazo del servo originales.",
      "text": "Retire los tornillos de fijación centrales originales en secuencia y luego retire brazo del servo en la dirección axial. Las piezas pequeñas que se quitaron se guardan en el área de piezas al lado.",
      "check": "Las especificaciones de los tornillos centrales originales no han sido verificadas y no se cuentan como tornillos autorroscantes M2×6.",
      "caption": "Retire primero el tornillo central → luego saque brazo del servo"
    },
    "t-motor-r": {
      "short": "Instale el motor de la cadera derecha",
      "title": "Después del cableado, instale la cadera ID11 del lado derecho servo",
      "text": "Según la pieza original, primero conecte el cable reservado en el cuerpo, y luego conecte el extremo libre del cable existente en la pata derecha completa. Después de completar dos inserciones, coloque el ID11 en el conector derecho y finalmente fije los dos M2×6.",
      "check": "Los extremos de los cables y las clavijas son solo para ilustración y la polaridad o las ramas del bus no se pueden determinar basándose en la apariencia del cable negro de tres núcleos. Preservar el margen de movimiento articular.",
      "caption": "Cable primero → Alineación · M2×6 ×2"
    },
    "t-cover-r": {
      "short": "Instale la cubierta derecha",
      "title": "Fije la cubierta Roll servo derecha con cuatro tornillos",
      "text": "Coloque la placa de cubierta P6-02 en la cadera derecha, asegúrese de que mazo de cables no quede atrapado en la placa de cubierta y luego fije las cuatro piezas M2×6.",
      "check": "Después de fijar la cubierta, presione rodamiento en el conector superior de la pata completa independiente; toda la pierna aún no está conectada.",
      "caption": "Alinear la cubierta · M2×6 ×4"
    },
    "t-bearing-r": {
      "short": "Presione el rodamiento grande derecho",
      "title": "Antes de acoplar la pata, inserte a presión el rodamiento grande en la unión derecha",
      "text": "Presione la pantalla después de 11:18, presione el nuevo 16×22×4 mm grande rodamiento axialmente en el conector superior de la pierna derecha independiente y luego prepárese para conectarse al cuerpo.",
      "check": "Este no es el extremo superior rodamiento que ya está instalado en el módulo de patas. Este paso solo presiona el nuevo rodamiento, y la pierna derecha todavía está en la posición lista; La cooperación coaxial es una señal.",
      "caption": "Primero presione rodamiento · La pierna intacta no se moverá por el momento."
    },
    "t-join-r": {
      "short": "Acceder pierna derecha",
      "title": "Conecte el subconjunto completo de la pierna derecha al cuerpo.",
      "text": "Mueva la pata derecha instalada en su conjunto a la posición de conexión del cuerpo, alinéela y fije los cuatro M2×6. Los tornillos de las patas rodamiento y mazo de cables se mueven juntos.",
      "check": "Mueve sólo esta pierna. La otra pierna permanece en posición de preparación; La posición del orificio y las tolerancias de ensamblaje aún deben verificarse físicamente.",
      "caption": "Integración completa de la pierna derecha · M2×6 ×4"
    },
    "t-motor-l": {
      "short": "Instalar el motor de la cadera izquierda",
      "title": "Después del cableado, instale el otro lado ID21 cadera servo",
      "text": "De acuerdo con la dirección del espejo, primero conecte la línea reservada en el cuerpo y luego conecte el extremo libre de la línea existente en la pierna izquierda completa. Una vez completadas las dos inserciones, instale el ID21 en el conector y fije los dos M2×6.",
      "check": "La pierna derecha terminada permanece conectada. Las rutas y los puntos finales de mazo de cables continúan marcados como esquemáticos y no se infieren pines eléctricos.",
      "caption": "Cable primero → Alineación · M2×6 ×2"
    },
    "t-cover-l": {
      "short": "Instale la cubierta izquierda",
      "title": "Fije la cubierta del otro lado Roll servo",
      "text": "Coloque la placa de cubierta P6-03 en la cadera izquierda, verifique que mazo de cables evite costuras y luego fije cuatro piezas M2×6.",
      "check": "La pierna izquierda todavía está en posición de preparación independiente. El siguiente paso es instalar el nuevo rodamiento en su conector superior.",
      "caption": "Alinear la cubierta · M2×6 ×4"
    },
    "t-bearing-l": {
      "short": "Presione izquierda grande rodamiento",
      "title": "Antes de insertar la segunda pierna, presione rodamiento",
      "text": "Presione 12:28 en la pantalla, presione el otro nuevo rodamiento grande en el conector superior de la pata izquierda independiente y luego conecte la segunda pata completa.",
      "check": "Se ha instalado la pierna derecha; la pierna izquierda aún no se ha movido. La postura rodamiento y la superficie de contacto se ilustran utilizando el modelo existente.",
      "caption": "Presione primero rodamiento · La pierna izquierda todavía está en la posición lista"
    },
    "t-join-l": {
      "short": "Acceder pierna izquierda",
      "title": "Coloque la segunda pata completa y asegúrela.",
      "text": "Mueva el subconjunto de la pata izquierda a la posición de conexión del cuerpo como un todo, verifique la alineación y luego fije cuatro M2×6.",
      "check": "Todas las piezas instaladas en la pierna izquierda se mueven junto con mazo de cables; la pierna derecha permanece estacionaria.",
      "caption": "Integración completa de la pierna izquierda · M2×6 ×4"
    },
    "t-complete": {
      "short": "comprobar las piernas",
      "title": "Verifique la conexión entre el cuerpo y las piernas.",
      "text": "El cuerpo, las caderas servo y dos piernas ya están conectados en el prototipo. Gire para ver la orientación de ambos lados, la placa de cubierta y la reserva mazo de cables.",
      "check": "Aquí solo se verifica el estado de la animación. Aún no se han aceptado las posiciones de los orificios, tolerancias, extremos de los cables y capacidad de carga física, y la siguiente etapa continuará con la cabeza y el cuello y el ensamblaje final.",
      "caption": ""
    },
    "head-yaw-motor": {
      "short": "Primero rodamiento y luego servo",
      "title": "Primero presione rodamiento, luego arregle ID32 y el primer soporte.",
      "text": "Según la pieza original, primero presione un rodamiento en el primer soporte blanco, luego inserte el ID32 numerado y centrado, y luego fije cuatro M2×6 después del montaje. El primer soporte usa P6-01.",
      "check": "rodamiento se instala esquemáticamente a lo largo del eje del cilindro de la rejilla fuente; Aún es necesario verificar la superficie del asiento axial y las tolerancias de ajuste físico.",
      "caption": "Presione primero rodamiento, luego coloque y fije M2×6 ×4."
    },
    "head-yaw-wire": {
      "short": "Cable giratorio enchufable",
      "title": "Conecte la línea servo a ID32",
      "text": "Alinee la dirección de la interfaz visible y presione el enchufe en su lugar; Mantenga el siguiente segmento de línea alrededor del corchete.",
      "check": "La ruta mazo de cables y la identidad del zócalo tienen fines didácticos y es necesario verificar los pines y la polaridad.",
      "caption": "Presione en su lugar · Indicación de punto final"
    },
    "head-bearings": {
      "short": "Presione primero rodamiento",
      "title": "Primero presione rodamiento en el soporte independiente.",
      "text": "Tome el segundo soporte blanco con orificio abierto P6-08, presione rodamiento en las dos posiciones rodamiento del soporte independiente de acuerdo con la pieza original y luego ensamble ID33.",
      "check": "Se ha instalado el primer rodamiento en el primer soporte; Aquí están los otros dos en el segundo grupo. La posición axial sigue la cuadrícula de origen y es necesario verificar el ajuste físico.",
      "caption": "Segundo soporte · Presione dos rodamiento en secuencia"
    },
    "head-roll-motor": {
      "short": "Cargar segundo servo",
      "title": "Instale ID33 en el soporte preparado.",
      "text": "Según el vídeo, coge ID33, alinéalo con el soporte que ha presionado rodamiento, y primero fija los cuatro M2×6 marcados en la primera parte de la pantalla.",
      "check": "Se conservan los subconjuntos ID32 y mazo de cables; Queda por verificar el juego final de agujeros para ambas ubicaciones de fijación.",
      "caption": "La primera fijación · M2×6 ×4"
    },
    "head-core-join": {
      "short": "Módulo de rotación combinado",
      "title": "Conecte los subcomponentes de los dos cabezales servo",
      "text": "Mantenga el subconjunto ID32 en su lugar, conecte el subconjunto del soporte ID33 que ha instalado rodamiento como un todo y luego presione la segunda marca en la pantalla para fijarlo con cuatro M2×6.",
      "check": "P6-08 y sus dos rodamiento se mueven con el subconjunto ID33; P6-01 y el primer rodamiento quedan del lado de ID32. El eje del orificio proviene de la rejilla de origen y es necesario verificar el ajuste físico.",
      "caption": "Acoplamiento general y refijación de subconjuntos M2×6 ×4"
    },
    "head-core-horn-wire": {
      "short": "Desinstalar y conectar",
      "title": "Retire la salida del cabezal brazo del servo y conéctelo.",
      "text": "Primero desenrosque el tornillo de fijación central original, luego retire el brazo del servo y manténgalo junto a él; luego conecte la línea servo visible.",
      "check": "El tornillo central original no está clasificado como autorroscante M2. Las ubicaciones del eje de salida y del conector siguen siendo indicativas.",
      "caption": "Retire primero el tornillo central, luego saque el brazo del servo."
    },
    "head-platform": {
      "short": "Poner en la plataforma de la cabeza.",
      "title": "Coloque el subconjunto giratorio en la plataforma del cabezal como un todo.",
      "text": "Coloque el subconjunto de rotación del cabezal conectado en la plataforma del cabezal P2-02 como un todo. Deje que los cables conectados salgan por la abertura.",
      "check": "rodamiento, los tornillos instalados, mazo de cables y el enchufe se mueven juntos; No presione el cable debajo de la plataforma.",
      "caption": "Se coloca el subconjunto como un todo y se sacan los cables por la abertura."
    },
    "head-mouth-prepare": {
      "short": "Comprobar boca servo",
      "title": "Retire una boquilla servo y verifique el número.",
      "text": "El subtítulo del servo en la película original dice \"Número 33\", y el software oficial define la boca como ID34; este prototipo conserva la ambigüedad de 33 / 34 y es necesario verificar el número real.",
      "check": "No cambie el número de otro ID33 basándose en esto. La geometría sólo sirve como candidato independiente para la boca servo.",
      "caption": "Video 33 / 34 Oficial · Por verificar"
    },
    "head-mouth-horn-wire": {
      "short": "Línea de descarga boca servo",
      "title": "Retire la boquilla brazo del servo y conecte mazo de cables.",
      "text": "Primero retiramos el tornillo de fijación central, luego retiramos la boca brazo del servo y la guardamos. Inserte la línea servo según el video y presiónela en su lugar.",
      "check": "La ambigüedad en la numeración persiste. Esta animación no confirma la codificación de conectores, los zócalos reales ni la distribución de pines.",
      "caption": "Retire el disco primero y luego conecte mazo de cables"
    },
    "head-mouth-jaw": {
      "short": "Instalar servo con barbilla",
      "title": "Pon servo en tu boca y ponlo en tu barbilla.",
      "text": "Primero coloque la pieza bucal servo en la plataforma y luego alinee los dos lados del mentón P2-01 con el eje impulsor y la posición de soporte. Dejemos que mazo de cables se quede fuera de la apertura.",
      "check": "Esta animación expresa la relación de secuencia; Es necesario verificar los orificios del eje en ambos lados, los espacios reales y la precisión de coincidencia.",
      "caption": "Ponga primero servo · Luego insértelo en la barbilla."
    },
    "head-servo-support": {
      "short": "Cubrir la fijación",
      "title": "Instale la pieza de fijación del cabezal servo.",
      "text": "Mecanismo que fija la pieza de fijación del cabezal P4-02 servo a la plataforma. Presione el primer subtítulo para arreglar cuatro M2×6.",
      "check": "Mantenga su mandíbula móvil y evite mazo de cables. Las posiciones específicas de los cuatro agujeros siguen siendo indicativas.",
      "caption": "El primer grupo de agujeros · M2×6 ×4"
    },
    "head-platform-fix": {
      "short": "Lado de salida de mentón fijo",
      "title": "Cuatro agujeros en el lado de salida del mentón fijo.",
      "text": "Según las instrucciones de los segundos cuatro M2×6 de la pieza original, fíjelo desde el exterior del lado conductor del mentón. Aquí se utiliza el eje de cuatro orificios de la cuadrícula fuente P2-01.",
      "check": "Los tornillos instalados se abren y cierran junto con la barbilla. El eje del orificio de la rejilla de origen se puede verificar, pero aún es necesario verificar las especificaciones físicas y la coordinación.",
      "caption": "Lado de salida del mentón · M2×6 ×4"
    },
    "head-mouth-check": {
      "short": "Comprobar apertura y cierre de la boca.",
      "title": "Verifique la apertura y cierre del mentón y el estado de mazo de cables",
      "text": "Mueva ligeramente la barbilla para comprobar si se puede abrir y cerrar, si está obviamente atascado y si el hilo está pellizcado en el costado. La animación muestra apertura y cierre a la vez.",
      "check": "Esto es solo una señal de apertura y cierre, y al final volverá a la posición cerrada; Si el producto real es liso, es necesario verificar el espacio y el ángulo servo.",
      "caption": "Simular apertura → cierre · Objeto real a verificar"
    },
    "head-neck-pair": {
      "short": "Conecte doble servo",
      "title": "Organice ID31 y ID30 e instale la primera placa de conexión",
      "text": "La perspectiva del escritorio de la película original es ID31 a la izquierda y ID30 a la derecha. Primero fije la primera placa de conexión a un servo, luego conecte la otra para completar los orificios restantes de la placa de conexión.",
      "check": "El vídeo está marcado primero con piezas 2 y luego con piezas 4. Queda por verificar si se trata de una cantidad acumulativa. La fuente P3-02 tiene solo cuatro agujeros y la animación está representada por cuatro agujeros reales sin crear dos agujeros adicionales.",
      "caption": "Fije primero un extremo y luego conecte el otro servo"
    },
    "head-neck-plate": {
      "short": "Instale la segunda placa de conexión.",
      "title": "Instale otra placa de conexión del cuello.",
      "text": "Instale la placa candidata de conexión P3-03 en el otro lado y fije cuatro M2×6 como se muestra en el video para formar un subconjunto de cuello doble servo.",
      "check": "Primero complete los paneles de conexión en ambos lados y luego conecte todo el cuello a la cabeza.",
      "caption": "Placa de conexión en el otro lado · M2×6 ×4"
    },
    "head-neck-join": {
      "short": "Conectar cabeza y cuello",
      "title": "Conecte el cuello doble servo a la cabeza.",
      "text": "Monte el cuello ya ensamblado como una sola unidad en la articulación de inclinación de la cabeza. El vídeo original exige que la salida del cable quede a la izquierda del operador.",
      "check": "La izquierda del operador no equivale necesariamente a la izquierda del robot. Quedan por verificar la orientación, los orificios y la operación de montaje correspondiente a P6-01.",
      "caption": "Compruebe la salida del cable tomando como referencia la izquierda del operador."
    },
    "head-neck-fix": {
      "short": "Conexión fija para cabeza y cuello.",
      "title": "Dos grupos de agujeros para fijar la conexión de cabeza y cuello.",
      "text": "Fije las dos articulaciones de la cabeza y el cuello en secuencia según el vídeo, y cada subtítulo está marcado con cuatro M2×6.",
      "check": "Los dos grupos rotan en secuencia. La posición real del orificio, la dirección axial y el consumo total deben revisarse en la tabla física orificio por orificio.",
      "caption": "Fijado en dos lugares · Cada M2×6 ×4"
    },
    "head-neck-wire": {
      "short": "Cablear y dejar margen",
      "title": "Conecte el bus del cuello del conector y organice los bucles de cables.",
      "text": "Inserte el cuello del conector mazo de cables según la acción visible y luego coloque el bucle de cable para dejar margen para el paso y la rotación. Deje los extremos de los cables utilizados para el posterior montaje en el exterior.",
      "check": "Los bucles de alambre y los puntos finales tienen fines didácticos; Es necesario verificar los dos extremos de cada cable, la secuencia de conexión en serie y los pines eléctricos.",
      "caption": "Organice mazo de cables primero y luego cierre el caparazón"
    },
    "head-shell": {
      "short": "Juego de fundas para la cabeza",
      "title": "Ponte la cubierta blanca para la cabeza.",
      "text": "Coloque la cubierta del cabezal P4-01 en el mecanismo del cabezal completo, dejando el mazo de cables reservado fuera de la abertura.",
      "check": "Hereda la malla real existente. La versión de la carcasa, la posición de encaje y la holgura están sujetas a verificación.",
      "caption": "Colóquese la funda para la cabeza · Evite mazo de cables"
    },
    "head-shell-fix": {
      "short": "Cubierta de cabeza fija interna",
      "title": "Fije la cubierta de la cabeza desde el interior.",
      "text": "Según el subtítulo sobre 17:31, arregle dos M2×6 desde el interior.",
      "check": "Las posiciones de los tornillos son para fines didácticos. Asegúrese de que mazo de cables no quede atrapado entre la cubierta del cabezal y la plataforma.",
      "caption": "Fijación interna · M2×6 ×2"
    },
    "head-eyes": {
      "short": "Instalar círculos oculares para los ojos.",
      "title": "Instalar ojeras y accesorios para los ojos.",
      "text": "Alinee los orificios frontales de la cubierta del cabezal e instale los bordes de los ojos P2-06 y los componentes candidatos para los ojos P3-01.",
      "check": "El vídeo no muestra claramente las pequeñas piezas internas una por una. La secuencia y los métodos de participación aquí son solo como referencia.",
      "caption": "Alinee los orificios frontales · Es necesario verificar la identidad de los elementos pequeños"
    },
    "head-lower-tape": {
      "short": "Cinta de doble cara en el labio inferior",
      "title": "Primero, aplique cinta adhesiva de doble cara a la superficie plana de la almohadilla para la barbilla.",
      "text": "Primero procese la almohadilla suave en la barbilla de acuerdo con la pieza original y pegue cinta adhesiva de doble cara en su parte inferior plana. La animación conserva cojines visibles y películas independientes.",
      "check": "La película está en la superficie exterior de la rejilla. El espesor y el rango de corte son de referencia; el siguiente paso es instalarlo en la barbilla junto con la almohadilla suave.",
      "caption": "Primero aplique cinta adhesiva de doble cara a la almohadilla de la barbilla."
    },
    "head-lower-pad": {
      "short": "Almohadilla para la barbilla",
      "title": "Primero pon el cojín en la barbilla.",
      "text": "De acuerdo con la pieza original, primero coloque todo el cojín de barbilla pegado en la barbilla abierta y presiónelo para que encaje. La cuadrícula de origen utiliza P1-01.",
      "check": "La película y el cojín se mueven juntos y las identidades superior e inferior de los archivos de origen se conservan como candidatos; Es necesario verificar el material físico y la solidez de la unión.",
      "caption": "Aplique primero la almohadilla para la barbilla."
    },
    "head-upper-tape": {
      "short": "Cinta de doble cara en la boca.",
      "title": "Luego pegue cinta adhesiva de doble cara en la superficie plana del cojín superior de la boca.",
      "text": "Luego procese el cojín suave de la parte superior de la boca, pegue cinta adhesiva de doble cara en su superficie plana expuesta y luego presiónela sobre la parte superior de la boca en su conjunto.",
      "check": "La película está situada en la superficie exterior de la rejilla, y el espesor, el contorno y la fuerza de unión todavía tienen fines didácticos.",
      "caption": "Luego aplique cinta adhesiva de doble cara en la almohadilla superior de la boca."
    },
    "head-upper-pad-check": {
      "short": "Aplique la almohadilla para cerrar",
      "title": "Coloque el cojín bucal y compruebe el ajuste de la boca superior e inferior.",
      "text": "Presione la pieza original y coloque la almohadilla suave de la parte superior de la boca junto con la película en la parte superior de la boca; utilice P1-02 para la cuadrícula de origen. Luego verifique si las bocas superior e inferior encajan bien y si hay espacios obvios.",
      "check": "Este paso solo simula la apertura y el cierre una vez y vuelve a la postura de cierre del directorio; El objeto real debe verificar el ajuste perfecto, el movimiento suave y el margen mazo de cables.",
      "caption": "Simular el cierre después del montaje · El producto real debe ser verificado"
    },
    "final-battery": {
      "short": "Almacenamiento de batería",
      "title": "Coloque la batería y desconecte el cable de alimentación.",
      "text": "Coloque la batería en el compartimiento independiente, pase los cables y conectores de alimentación rojo y negro a través de la abertura y luego instale el compartimiento de la batería en el cuerpo.",
      "check": "El tamaño de la batería sigue la forma conceptual del modelo original y el tamaño físico, las posiciones de las teclas del conector y la polaridad aún no se han verificado. El color del hilo no representa un pin verificado.",
      "caption": "Ingrese primero al almacén · El cable de alimentación sale por la abertura"
    },
    "final-tray": {
      "short": "Instalar el compartimiento de la batería",
      "title": "Asegure el compartimiento de la batería que contiene la batería al cuerpo.",
      "text": "Alinee la batería y el compartimiento de la batería como un conjunto con la parte posterior del cuerpo y fíjelo con tornillos autorroscantes de cabeza avellanada y cola plana 4 M2×6 como se muestra en el video.",
      "check": "Alinee primero y luego fíjelo, manteniendo el cable de alimentación afuera; La posición del tornillo y la coordinación son instrucciones de enseñanza, y debes comprobar el objeto real agujero por agujero.",
      "caption": "Los componentes están en su lugar en su conjunto · M2×6 ×4"
    },
    "final-body-shells": {
      "short": "Instalar la carrocería",
      "title": "Instale la carrocería en ambos lados y conserve el cableado superior.",
      "text": "Alinee e instale las dos carrocerías, dejando la salida superior mazo de cables. 19:05 Los subtítulos izquierdo y derecho marcan 5 y M2×6; este paso sólo indica el número total de este grupo.",
      "check": "La distribución lado a lado y agujero por agujero de los chips 5 aún no se ha verificado. En la figura, los orificios redondos existentes en la cuadrícula de origen se utilizan como candidatos de enseñanza, y la verdadera atribución de paso de los orificios superior e inferior y los orificios de costura aún no se ha verificado; la conclusión de 5 por lado no se basa en esto.",
      "caption": "M2×6 ×5 · Candidato a agujero fuente, asignado para ser verificado"
    },
    "final-head-join": {
      "short": "Conecta toda la cabeza y el cuello.",
      "title": "Conecte todo el conjunto de cabeza y cuello instalado al cuerpo.",
      "text": "Mueva la cabeza, el cuello, los tornillos y el mazo de cables completos en su conjunto, primero deje que la parte de conexión inferior servo esté en su lugar y luego presione las marcas 4 y M2×6 marcadas en ambos lados del video para fijarlo.",
      "check": "La cabeza y el cuello deben moverse como un todo, no sólo el cráneo. El número total de piezas 4 en cada lado de este prototipo es de piezas 8; aún deben verificarse la posición real del orificio, el eje de instalación y la versión.",
      "caption": "La cabeza y el cuello están en su lugar como un todo · M2×6 ×4 en ambos lados"
    },
    "final-board-mate": {
      "short": "Conecta dos tableros",
      "title": "Alinee el encabezado del pin y conecte UNO Q en la placa de expansión Luwu",
      "text": "Tome las placas de expansión UNO Q y Luwu respectivamente, alinee los pines de la placa de expansión con los cabezales UNO Q y presiónelos en su lugar a lo largo de la dirección de acoplamiento. Los dos tableros son siempre objetos independientes.",
      "check": "Se utiliza el modelo de tablero confirmado; Se ha verificado la alineación de los pasadores 32 y el espaciado del modelado 12.3mm, y las ubicaciones de los orificios se estiman a partir de fotografías. Los dos orificios de montaje están desalineados aproximadamente 1.27mm y no se han verificado la inserción física, las tolerancias y los pines eléctricos.",
      "caption": "Dos tableros independientes · Alinear los encabezados con los encabezados"
    },
    "final-board-mount": {
      "short": "controlador fijo",
      "title": "Fije el conjunto de dos placas insertado al cuerpo.",
      "text": "Manteniendo las dos placas acopladas, mueva el conjunto del controlador hacia la parte posterior de su cuerpo. La película original está marcada como 4 y M3×16; este modelo solo demuestra la inserción en dos orificios casi coaxiales y los otros dos están reservados para verificación.",
      "check": "La pieza original tiene piezas 4; los orificios 2 de este modelo son casi coaxiales y los orificios 2 están aproximadamente desalineados 1.27mm. Aún no se muestra el estado completo del paso a través de las dos placas. La forma de la placa fuente, la posición de los orificios, el grosor de PCB y el paso de la fila de pines no se han estirado ni parcheado; Es necesario verificar el soporte del cuerpo y la coordinación física.",
      "caption": "Película original M3×16 ×4 · Muestra los orificios 2 y los otros orificios 2 deben verificarse"
    },
    "final-power": {
      "short": "Conecte el cable de la batería",
      "title": "Inserte el conector de la batería restante en el puerto de la batería en el tablero de control.",
      "text": "Mueva el conector del compartimiento de la batería a la interfaz de la batería de la placa de expansión, alinéelo con la llave del conector y presiónelo en su lugar. Aquí se demuestran acciones y caminos.",
      "check": "No se ha verificado la polaridad exacta, la numeración de pines, la posición de la llave del conector y la revisión de la placa de video; Las líneas dobles rojas y negras de la imagen no constituyen una base para el cableado.",
      "caption": "Apunte al puerto de la batería. Es necesario verificar la polaridad y la posición clave."
    },
    "final-buses": {
      "short": "Insertar bus uno por uno",
      "title": "Conecte los tres buses principales servo a la placa de expansión uno por uno.",
      "text": "Alinee y presione los tres enchufes de tres clavijas en secuencia. El vídeo confirma que hay tres conexiones del lado de la placa base; Este paso demostrará las tres conexiones por separado.",
      "check": "La topología, los puntos finales reales y los pines de la rama de tres cables ID no se han rastreado claramente. La placa de expansión tiene diferencias en la revisión de la interfaz y GND, SIGNAL o la posición del pin de la fuente de alimentación no se pueden identificar según la apariencia del modelo.",
      "caption": "Se verificarán tres complementos, puntos finales y pines separados"
    },
    "final-thigh-first": {
      "short": "Concha del muslo del primer lado",
      "title": "Instale la primera carcasa lateral para muslos.",
      "text": "Instale la primera carcasa lateral del muslo y fije la marca del subtítulo con los tornillos autorroscantes de cabeza plana 2 M2.3×4. El prototipo primero muestra el lado derecho del robot y es necesario verificar el mapeo izquierdo y derecho del video.",
      "check": "20: Los subtítulos 37 M2.3×4 son diferentes de los subtítulos oficiales BOM M2.3×8; Las especificaciones originales de la película se conservan y no se reemplazan ni se utilizan directamente para la compra. Las ubicaciones de los agujeros están sujetas a verificación.",
      "caption": "Vídeo M2.3×4 ×2 · Diferencias con BOM"
    },
    "final-route": {
      "short": "Organizar mazo de cables",
      "title": "Disponga mazo de cables para dejar espacio para la carcasa y las juntas en el otro lado.",
      "text": "Disponga los bucles visibles del mazo de cables de modo que el mazo de cables evite las juntas de presión de la carcasa y las áreas de actividad de las juntas. Deje un margen adecuado antes de instalar el otro lado de la carcasa.",
      "check": "El cableado es una representación visual y no se han verificado el radio de curvatura físico, la longitud del cable ni el espacio libre de movimiento; Este paso no requiere desconectar el enchufe de la placa base conectado.",
      "caption": "Mantenga los conectores conectados · Organice los márgenes"
    },
    "final-thigh-second": {
      "short": "Muslo en el otro lado",
      "title": "Instale la carcasa del muslo en el otro lado para completar el montaje final de esta sección.",
      "text": "Instale la otra cubierta del muslo en la dirección del espejo. 20: Los subtítulos de 57 también están marcados como 2 y M2.3×4, conservando las diferencias de especificaciones entre la película original y BOM.",
      "check": "Esta sección finaliza con el montaje final de 20:58. El control, la numeración y la calibración se describen en los capítulos siguientes. Este módulo no verifica el encendido ni la precisión mecánica.",
      "caption": "El otro lado M2.3×4 ×2 · Acabado del montaje final"
    },
    "calibration-power": {
      "short": "Puesta en marcha después del montaje.",
      "title": "Encienda la máquina después de completar el montaje.",
      "text": "Este párrafo sólo muestra la secuencia de enseñanza. Verifique la conexión mecánica y mazo de cables, y luego presione el video para ingresar a la página de configuración de su propio dispositivo.",
      "check": "Este prototipo no se conecta al hardware; a continuación sólo se muestra la secuencia de enseñanza.",
      "caption": "Demostración didáctica · Sin control de equipos reales."
    },
    "calibration-start": {
      "short": "Iniciar calibración",
      "title": "Ingrese Calibration e inicie la calibración.",
      "text": "Ingrese Calibration en la interfaz del dispositivo real, haga clic en Start calibration y estabilice el robot.",
      "check": "Las poses terminadas en la página no indican que el robot real haya sido calibrado.",
      "caption": "Demostración didáctica · Sin control de equipos reales."
    },
    "calibration-servos": {
      "short": "Ajuste 15 ID uno por uno",
      "title": "Ajuste la posición cero mecánica de todos los servo uno por uno.",
      "text": "Ajuste el control deslizante ID uno por uno según la interfaz del dispositivo y presione Finish cuando termine. Pierna derecha 10–14, pierna izquierda 20–24, cabeza, cuello y boca 30–34.",
      "check": "Cada ID requiere verificación de uniones físicas; La lista de esta página no es un resultado de calibración del dispositivo.",
      "caption": "Demostración didáctica · Sin control de equipos reales."
    },
    "calibration-pose": {
      "short": "Revisar las articulaciones del cuerpo",
      "title": "Comprobar centrado, articulaciones y postura del pie.",
      "text": "Continúe haciendo ajustes finos según la foto original: el cuerpo está centrado, las articulaciones están alineadas y los pies planos hasta que lo real pueda mantenerse firme.",
      "check": "El modelo de pie de este prototipo sólo se utiliza para enseñar observación y no puede reemplazar la inspección de la postura física.",
      "caption": "Demostración didáctica · Sin control de equipos reales."
    },
    "calibration-exit": {
      "short": "Salir de la calibración",
      "title": "Salga de la calibración después de completar cada unión",
      "text": "Una vez completado todo servo, haga clic en Exit según la imagen original y luego salga de la página de configuración.",
      "check": "Confirme que todos los ID hayan sido procesados ​​antes de realizar la verificación de actitud predeterminada.",
      "caption": "Demostración didáctica · Sin control de equipos reales."
    },
    "calibration-default": {
      "short": "Comprobar pose predeterminada",
      "title": "Ejecutar Default pose",
      "text": "Ejecute Default pose en un dispositivo real y observe si el cuerpo y las piernas alcanzan la postura esperada.",
      "check": "Aquí no se envían órdenes de movimiento ni se simula el equilibrio físico.",
      "caption": "Demostración didáctica · Sin control de equipos reales."
    },
    "robot-complete": {
      "short": "Vista completa de la máquina",
      "title": "Tutorial completo de montaje de la máquina.",
      "text": "Ahora puedes rotar para ver el robot completo o regresar a cualquier etapa para volver a jugar. La película original muestra el control remoto y la entrada para caminar al final.",
      "check": "Este es un prototipo de enseñanza independiente; El cableado real, la coincidencia de la posición de los orificios y la calibración del equipo aún requieren verificación física.",
      "caption": ""
    }
  },
  "chapters": {
    "prepare": {
      "name": "Preparación y Numeración"
    },
    "right-ankle": {
      "name": "tobillo derecho"
    },
    "left-ankle": {
      "name": "tobillo izquierdo"
    },
    "right-leg": {
      "name": "Conexión de la pierna derecha"
    },
    "left-leg": {
      "name": "conexión de la pierna izquierda"
    },
    "finish": {
      "name": "Acabado de piernas"
    },
    "torso-base": {
      "name": "Soporte para cuerpo y cadera"
    },
    "torso-legs": {
      "name": "Motores de cadera y articulaciones de piernas."
    },
    "head-core": {
      "name": "Rotación del cabezal y cableado."
    },
    "head-mouth-neck": {
      "name": "Boca y doble cuello servo"
    },
    "head-finish": {
      "name": "Cojines para la cabeza y la boca."
    },
    "final-body": {
      "name": "Conjunto de cuerpo y cabeza y cuello."
    },
    "final-electronics": {
      "name": "Control electrónico y acabado de carcasa."
    },
    "calibration": {
      "name": "Calibración y finalización"
    }
  },
  "actors": {
    "p_uno": {
      "label": "Arduino UNO Q · Aparición confirmada del lote v2",
      "source": "Modelo fotográfico confirmado · Conversión de unidad uniforme 1000; La estimación del orificio de montaje y el mapeo eléctrico no se han verificado físicamente."
    },
    "p_extension": {
      "label": "Placa de expansión Luwu · Aparición confirmada v2",
      "source": "Modelo fotográfico confirmado · Conversión de unidad uniforme 1000; La estimación del orificio de montaje y el mapeo eléctrico no se han verificado físicamente."
    },
    "p_battery": {
      "label": "Batería de alimentación temporal · Modelo didáctico",
      "source": "El tamaño de la batería y los conectores están sujetos a verificación física."
    },
    "p_motor": {
      "label": "servo único para configurar",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "p_powerCable": {
      "label": "Pruebe el cable de alimentación de la batería",
      "source": "El cableado y la polaridad son sólo para fines didácticos."
    },
    "p_servoCable": {
      "label": "Línea de prueba única servo",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "p_usb": {
      "label": "Cable de conexión Type-C · modelo didáctico sencillo",
      "source": "Solo demuestra la dirección de conexión de la computadora."
    },
    "motor": {
      "label": "Derechaservo · ID14",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente.",
      "chip": "servo"
    },
    "foot": {
      "label": "Pie derecho · P2-03",
      "source": "Rejilla real 3MF",
      "chip": "pie"
    },
    "shank": {
      "label": "Pantorrilla derecha · P6-04",
      "source": "Rejilla real 3MF",
      "chip": "becerro"
    },
    "bearing": {
      "label": "Derecha pequeña rodamiento · 10×15×3",
      "source": "Red auxiliar existente",
      "chip": "Pequeñorodamiento"
    },
    "axle": {
      "label": "Eje del tobillo derecho · P2-05",
      "source": "Cuadrícula real·Diagrama de posicionamiento",
      "chip": "eje del tobillo"
    },
    "horn": {
      "label": "brazo del servo eliminado desde la derecha",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "hornScrew": {
      "label": "Tornillo central original derecho brazo del servo",
      "source": "Instrucciones didácticas añadidas · Especificaciones por verificar"
    },
    "plug": {
      "label": "Enchufe derecho de tres pines servo",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "wire": {
      "label": "Línea derecha servo de tres núcleos",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "shankScrew0": {
      "label": "Tornillo fijación pantorrilla derecha 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×2"
    },
    "shankScrew1": {
      "label": "Tornillo fijación pantorrilla derecha 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "footScrew0": {
      "label": "Tornillo fijación pie derecho 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "footScrew1": {
      "label": "Tornillo fijación pie derecho 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "footScrew2": {
      "label": "Tornillo fijación pie derecho 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "footScrew3": {
      "label": "Tornillo fijación pie derecho 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "axisScrew": {
      "label": "Tornillo de fijación del eje del tobillo derecho · M2.3×8",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2.3×8"
    },
    "l_motor": {
      "label": "Izquierdaservo · ID24",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente.",
      "chip": "servo"
    },
    "l_foot": {
      "label": "Pie izquierdo · P2-04",
      "source": "Rejilla real 3MF",
      "chip": "pie"
    },
    "l_shank": {
      "label": "Pantorrilla izquierda · P6-05",
      "source": "Rejilla real 3MF",
      "chip": "becerro"
    },
    "l_bearing": {
      "label": "Zuo Xiaorodamiento · 10×15×3",
      "source": "Red auxiliar existente",
      "chip": "Pequeñorodamiento"
    },
    "l_axle": {
      "label": "Eje del tobillo izquierdo · P2-07",
      "source": "Cuadrícula real·Diagrama de posicionamiento",
      "chip": "eje del tobillo"
    },
    "l_horn": {
      "label": "brazo del servo eliminado desde la izquierda",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "l_hornScrew": {
      "label": "Tornillo original central izquierdo brazo del servo",
      "source": "Instrucciones didácticas añadidas · Especificaciones por verificar"
    },
    "l_plug": {
      "label": "Enchufe izquierdo de tres pines servo",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "l_wire": {
      "label": "Línea izquierda servo de tres núcleos",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "l_shankScrew0": {
      "label": "Tornillo fijación pantorrilla izquierda 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×2"
    },
    "l_shankScrew1": {
      "label": "Tornillo fijación pantorrilla izquierda 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "l_footScrew0": {
      "label": "Tornillo fijación pie izquierdo 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_footScrew1": {
      "label": "Tornillo fijación pie izquierdo 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "l_footScrew2": {
      "label": "Tornillo fijación pie izquierdo 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "l_footScrew3": {
      "label": "Tornillo fijación pie izquierdo 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "l_axisScrew": {
      "label": "Tornillo de fijación del eje del tobillo izquierdo · M2.3×8",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2.3×8"
    },
    "r_upperMotor": {
      "label": "Superior derecha servo · ID12",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "r_lowerMotor": {
      "label": "Medio derecho servo · ID13",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "r_support": {
      "label": "Soporte para muslo derecho · P5-04",
      "source": "Cuadrícula real 3MF · Coordinación por verificar"
    },
    "r_lowerBearing": {
      "label": "Derecha grande rodamiento · 16×22×4",
      "source": "Red de hardware existente"
    },
    "r_supportScrew0": {
      "label": "Tornillo fijación derecho 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew1": {
      "label": "Tornillo fijación derecho 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew2": {
      "label": "Tornillo fijación derecho 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew3": {
      "label": "Tornillo fijación derecho 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew0": {
      "label": "Tornillo fijación derecho 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew1": {
      "label": "Tornillo fijación derecho 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew2": {
      "label": "Tornillo fijación derecho 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew3": {
      "label": "Tornillo fijación derecho 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_upperHorn": {
      "label": "Original brazo del servo en la parte superior derecha.",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "r_upperHornScrew": {
      "label": "Tornillo central original en la parte superior derecha.",
      "source": "Modelo didáctico sencillo·Especificaciones originales a verificar"
    },
    "r_topLink": {
      "label": "Conector superior derecho · P3-04",
      "source": "Cuadrícula real 3MF · Coordinación por verificar"
    },
    "r_topBearing": {
      "label": "Conector derecho grande rodamiento",
      "source": "Red de hardware existente"
    },
    "r_topScrew0": {
      "label": "Tornillo fijación derecho 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew1": {
      "label": "Tornillo fijación derecho 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew2": {
      "label": "Tornillo fijación derecho 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew3": {
      "label": "Tornillo fijación derecho 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_sole": {
      "label": "Cojín planta pie derecho · P1-03",
      "source": "Cuadrícula real 3MF · Coordinación por verificar"
    },
    "r_soleScrew0": {
      "label": "Tornillo fijación derecho 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew1": {
      "label": "Tornillo fijación derecho 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew2": {
      "label": "Tornillo fijación derecho 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew3": {
      "label": "Tornillo fijación derecho 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "r_legWireA": {
      "label": "Cable de tres núcleos dentro de la pierna derecha",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar.",
      "chip": "Cable de tres núcleos dentro de la pierna"
    },
    "r_legWireB": {
      "label": "Línea reservada en el extremo superior de la pierna derecha.",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar.",
      "chip": "Línea reservada en el extremo superior"
    },
    "l_upperMotor": {
      "label": "Superior izquierda servo · ID22",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "l_lowerMotor": {
      "label": "Medio izquierdo servo · ID23",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "l_support": {
      "label": "Soporte para muslo izquierdo · P5-05",
      "source": "Cuadrícula real 3MF · Coordinación por verificar"
    },
    "l_lowerBearing": {
      "label": "Zuo Darodamiento · 16×22×4",
      "source": "Red de hardware existente"
    },
    "l_supportScrew0": {
      "label": "Tornillo fijación izquierdo 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew1": {
      "label": "Tornillo fijación izquierdo 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew2": {
      "label": "Tornillo fijación izquierdo 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew3": {
      "label": "Tornillo fijación izquierdo 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew0": {
      "label": "Tornillo fijación izquierdo 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew1": {
      "label": "Tornillo fijación izquierdo 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew2": {
      "label": "Tornillo fijación izquierdo 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew3": {
      "label": "Tornillo fijación izquierdo 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_upperHorn": {
      "label": "Original brazo del servo en la parte superior izquierda.",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "l_upperHornScrew": {
      "label": "Tornillo central original en el lado superior izquierdo.",
      "source": "Modelo didáctico sencillo·Especificaciones originales a verificar"
    },
    "l_topLink": {
      "label": "Conector superior izquierdo · P3-05",
      "source": "Cuadrícula real 3MF · Coordinación por verificar"
    },
    "l_topBearing": {
      "label": "Conector izquierdo grande rodamiento",
      "source": "Red de hardware existente"
    },
    "l_topScrew0": {
      "label": "Tornillo fijación izquierdo 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew1": {
      "label": "Tornillo fijación izquierdo 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew2": {
      "label": "Tornillo fijación izquierdo 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew3": {
      "label": "Tornillo fijación izquierdo 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_sole": {
      "label": "Cojín planta pie izquierdo · P1-04",
      "source": "Cuadrícula real 3MF · Coordinación por verificar"
    },
    "l_soleScrew0": {
      "label": "Tornillo fijación izquierdo 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew1": {
      "label": "Tornillo fijación izquierdo 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew2": {
      "label": "Tornillo fijación izquierdo 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew3": {
      "label": "Tornillo fijación izquierdo 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "l_legWireA": {
      "label": "Cable de tres núcleos dentro de la pierna izquierda",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar.",
      "chip": "Cable de tres núcleos dentro de la pierna"
    },
    "l_legWireB": {
      "label": "Línea reservada en el extremo superior de la pierna izquierda.",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar.",
      "chip": "Línea reservada en el extremo superior"
    },
    "t_motor10": {
      "label": "Cadera Yaw servo · ID10",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "t_motor10Horn": {
      "label": "ID10 original brazo del servo (reservado)",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "t_motor10HornScrew": {
      "label": "Tornillo central original ID10",
      "source": "Modelo didáctico de tornillo central original·Especificaciones a verificar"
    },
    "t_motor20": {
      "label": "Cadera Yaw servo · ID20",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "t_motor20Horn": {
      "label": "ID20 original brazo del servo (reservado)",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "t_motor20HornScrew": {
      "label": "Tornillo central original ID20",
      "source": "Modelo didáctico de tornillo central original·Especificaciones a verificar"
    },
    "t_support": {
      "label": "Soporte Cadera Yaw · P6-09",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_supportScrew0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_supportScrew1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_supportScrew2": {
      "label": "Tornillo de fijación 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_supportScrew3": {
      "label": "Tornillo de fijación 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_supportScrew4": {
      "label": "Tornillo de fijación 5 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_supportScrew5": {
      "label": "Tornillo de fijación 6 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_baseWire": {
      "label": "Línea reservada para la placa base del cuerpo derecho · Indicación de fin libre",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "t_baseWireL": {
      "label": "Línea reservada para placa base del cuerpo izquierdo · Indicación de extremo libre",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "t_backplate": {
      "label": "Panel trasero de la carrocería · P4-03",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_backFrontScrew0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_backFrontScrew1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_backRearScrew0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_backRearScrew1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_yawR": {
      "label": "Conector derecho Yaw · P6-06",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_yawBearingR": {
      "label": "Derecho Yaw Conector grande rodamiento · 16×22×4",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_yawScrewR0": {
      "label": "Diagrama de tornillos de fijación de la pieza de conexión derecha · M2×6 · Cantidad en paralelo por verificar",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_yawScrewR1": {
      "label": "Diagrama de tornillos de fijación de la pieza de conexión derecha · M2×6 · Cantidad en paralelo por verificar",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_yawScrewR2": {
      "label": "Diagrama de tornillos de fijación de la pieza de conexión derecha · M2×6 · Cantidad en paralelo por verificar",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_yawScrewR3": {
      "label": "Diagrama de tornillos de fijación de la pieza de conexión derecha · M2×6 · Cantidad en paralelo por verificar",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_motor11": {
      "label": "Cadera derecha Roll servo · ID11",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "t_motor11Horn": {
      "label": "ID11 Original brazo del servo",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "t_motor11HornScrew": {
      "label": "ID11 tornillo de fijación central original",
      "source": "Modelo didáctico de tornillo central original·Especificaciones a verificar"
    },
    "t_rollWireR": {
      "label": "Línea reservada desde el cuerpo derecho hasta el motor de la cadera · Indicación de ruta/punto final",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "t_motorScrewR0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_motorScrewR1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_coverR": {
      "label": "Tapa derecha Roll servo · P6-02",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_coverScrewR0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_coverScrewR1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_coverScrewR2": {
      "label": "Tornillo de fijación 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_coverScrewR3": {
      "label": "Tornillo de fijación 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_legBearingR": {
      "label": "La interfaz de la pierna derecha es grande rodamiento · 16×22×4",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_legScrewR0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_legScrewR1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_legScrewR2": {
      "label": "Tornillo de fijación 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_legScrewR3": {
      "label": "Tornillo de fijación 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_yawL": {
      "label": "Conector izquierdo Yaw · P6-07",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_yawBearingL": {
      "label": "Izquierdo Yaw Conector grande rodamiento · 16×22×4",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_yawScrewL0": {
      "label": "Instrucciones para fijación de tornillos de la pieza de conexión izquierda · M2×6 · Cantidad por lado a verificar",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_yawScrewL1": {
      "label": "Instrucciones para fijación de tornillos de la pieza de conexión izquierda · M2×6 · Cantidad por lado a verificar",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_yawScrewL2": {
      "label": "Instrucciones para fijación de tornillos de la pieza de conexión izquierda · M2×6 · Cantidad por lado a verificar",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_yawScrewL3": {
      "label": "Instrucciones para fijación de tornillos de la pieza de conexión izquierda · M2×6 · Cantidad por lado a verificar",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_motor21": {
      "label": "Cadera izquierda Roll servo · ID21",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "t_motor21Horn": {
      "label": "ID21 Original brazo del servo",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "t_motor21HornScrew": {
      "label": "ID21 tornillo de fijación central original",
      "source": "Modelo didáctico de tornillo central original·Especificaciones a verificar"
    },
    "t_rollWireL": {
      "label": "Línea reservada desde el lado izquierdo del cuerpo hasta el motor de la cadera · Indicación de ruta/punto final",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "t_motorScrewL0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_motorScrewL1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_coverL": {
      "label": "Tapa izquierda Roll servo · P6-03",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_coverScrewL0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_coverScrewL1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_coverScrewL2": {
      "label": "Tornillo de fijación 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_coverScrewL3": {
      "label": "Tornillo de fijación 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_legBearingL": {
      "label": "La interfaz de la pierna izquierda es grande rodamiento · 16×22×4",
      "source": "Cuadrícula de origen real · Video candidato correspondiente, es necesario verificar la posición/coordinación del orificio"
    },
    "t_legScrewL0": {
      "label": "Tornillo de fijación 1 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_legScrewL1": {
      "label": "Tornillo de fijación 2 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_legScrewL2": {
      "label": "Tornillo de fijación 3 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "t_legScrewL3": {
      "label": "Tornillo de fijación 4 · M2×6",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "h_pitchSupport": {
      "label": "Primer soporte · P6-01",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_motor32": {
      "label": "Rotación del cabezal servo · Candidato a ID32",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "h_yawScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_yawSupport": {
      "label": "Segundo soporte de apertura · P6-08",
      "source": "Cuadrícula de impresión real·La correspondencia y coordinación en video están sujetas a verificación; La película original viene con el segundo subconjunto soporte/ID33 y la coordinación física está sujeta a verificación."
    },
    "h_bearingFront": {
      "label": "Cabezón rodamiento ex candidato · 16×22×4",
      "source": "Red de hardware existente · Es necesario verificar ID y la interfaz; Según la pieza original, viene con el segundo subconjunto soporte/ID33, y es necesario verificar la coincidencia física."
    },
    "h_bearingBack": {
      "label": "Candidato tras rodamiento con cabezón · 16×22×4",
      "source": "Red de hardware existente · Es necesario verificar ID y la interfaz; Según la pieza original, viene con el segundo subconjunto soporte/ID33, y es necesario verificar la coincidencia física."
    },
    "h_bearingCrown": {
      "label": "Primer grupo grande rodamiento · candidato a asiento",
      "source": "Reutilizar rejilla anular completa head_yaw_1; a lo largo del eje del cilindro fuente P6-01 x=-0.01, z=40.99, la superficie inferior cae sobre la superficie del hombro aproximadamente y=206.24; Es necesario verificar los candidatos para la superficie de asiento axial y la coordinación física."
    },
    "h_motor33": {
      "label": "Jefe segundo servo · Candidato ID33",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "h_rollScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platform": {
      "label": "Plataforma de cabeza · P2-02",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_mouthMotor": {
      "label": "Boca servo · Video 33 / 34 oficial, pendiente de verificación",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "h_jaw": {
      "label": "Barbilla · P2-01",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_servoSupport": {
      "label": "Cabezal servo pieza de fijación · P4-02",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_supportScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_motor30": {
      "label": "Extremo inferior del mástil servo · Candidato a ID30",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "h_motor31": {
      "label": "Parte superior del cuello servo · Candidato a ID31",
      "source": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente."
    },
    "h_neckA": {
      "label": "Placa de conexión de cuello A · Candidato a P3-02",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_neckAScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "Primero arregle el agujero 2"
    },
    "h_neckAScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "Primero arregle el agujero 2"
    },
    "h_neckAScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "Reinstale en el orificio 4"
    },
    "h_neckAScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "Reinstale en el orificio 4"
    },
    "h_neckB": {
      "label": "Placa de conexión de cuello B · Candidato a P3-03",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_neckBScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew4": {
      "label": "M2×6 Tornillo de fijación 5 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew5": {
      "label": "M2×6 Tornillo de fijación 6 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew6": {
      "label": "M2×6 Tornillo de fijación 7 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew7": {
      "label": "M2×6 Tornillo de fijación 8 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×4"
    },
    "h_shell": {
      "label": "Funda para cabeza · P4-01",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_shellScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×2"
    },
    "h_shellScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Indicación de ubicación del orificio",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
      "chip": "M2×6 ×2"
    },
    "h_eyeShell": {
      "label": "Ojeras · Candidato P2-06",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_eyes": {
      "label": "Dispositivos para los ojos · Candidato P3-01",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_upperPad": {
      "label": "Cojín labial · Candidato P1-02",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_lowerPad": {
      "label": "Cojín inferior bucal · Candidato P1-01",
      "source": "Cuadrícula impresa real · Video correspondencia y coordinación a verificar"
    },
    "h_wire32": {
      "label": "Línea reservada ID32 · Indicación de punto final",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_wire33": {
      "label": "Línea reservada ID33 · Indicación de punto final",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_wireMouth": {
      "label": "Línea boca servo · 33/34 pendiente de verificación",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_neckWire": {
      "label": "Lazo de alambre para el cuello · indicación de secuencia de conexión en serie y puntos finales",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_headLead": {
      "label": "El final de la línea de cabeza y cuello reservado para el montaje final·Indicación de punto final",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_plug32": {
      "label": "Enchufe ID32 · interfaz de enseñanza",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_plug33": {
      "label": "Enchufe ID33 · interfaz de enseñanza",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_plugMouth": {
      "label": "Tapón bucal·Interfaz de enseñanza",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_plugNeck": {
      "label": "Conector de cordón para el cuello · Interfaz de enseñanza",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "h_coreHorn": {
      "label": "Se conserva el original brazo del servo.",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "h_coreHornScrew": {
      "label": "Tornillo de fijación central original · Especificaciones a verificar",
      "source": "Modelo didáctico original de tornillo central · No clasificados como tornillos autorroscantes; Según pieza original, viene con el segundo subconjunto soporte/ID33, y es necesario verificar el ajuste físico."
    },
    "h_mouthHorn": {
      "label": "Se conserva el original brazo del servo.",
      "source": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar."
    },
    "h_mouthHornScrew": {
      "label": "Tornillo de fijación central original · Especificaciones a verificar",
      "source": "Plantilla didáctica original para tornillos centrales · No clasificados como tornillos autorroscantes"
    },
    "h_upperAdhesive": {
      "label": "Cinta de doble cara · Indicación de espesor y contorno",
      "source": "Instrucciones didácticas para la cinta de doble cara · El material, el espesor, el contorno y la fuerza de unión están sujetos a verificación"
    },
    "h_lowerAdhesive": {
      "label": "Cinta de doble cara · Indicación de espesor y contorno",
      "source": "Instrucciones didácticas para la cinta de doble cara · El material, el espesor, el contorno y la fuerza de unión están sujetos a verificación"
    },
    "f_batteryTray": {
      "label": "Compartimento de batería · P5-03",
      "source": "Red fuente real · Orificios de montaje y coordinación por verificar"
    },
    "f_sideR": {
      "label": "Carrocería carcasa derecha · P5-06",
      "source": "Red fuente real · Orificios de montaje y coordinación por verificar"
    },
    "f_sideL": {
      "label": "Carrocería carcasa izquierda · P5-07",
      "source": "Red fuente real · Orificios de montaje y coordinación por verificar"
    },
    "f_thighR": {
      "label": "Muslo derecho carcasa · P5-01",
      "source": "Red fuente real · Orificios de montaje y coordinación por verificar"
    },
    "f_thighL": {
      "label": "Muslo concha izquierda · P5-02",
      "source": "Red fuente real · Orificios de montaje y coordinación por verificar"
    },
    "f_battery": {
      "label": "Paquete de baterías · Tamaño real por verificar",
      "source": "Siga el esquema del concepto trunk_base_8 · Medición no física"
    },
    "f_trayScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_trayScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_trayScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_trayScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_bodyScrew0": {
      "label": "M2×6 Tornillo de fijación 1 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_bodyScrew1": {
      "label": "M2×6 Tornillo de fijación 2 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_bodyScrew2": {
      "label": "M2×6 Tornillo de fijación 3 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_bodyScrew3": {
      "label": "M2×6 Tornillo de fijación 4 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_bodyScrew4": {
      "label": "M2×6 Tornillo de fijación 5 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_neckScrewR0": {
      "label": "M2×6 Tornillo de fijación 1 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_neckScrewR1": {
      "label": "M2×6 Tornillo de fijación 2 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_neckScrewR2": {
      "label": "M2×6 Tornillo de fijación 3 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_neckScrewR3": {
      "label": "M2×6 Tornillo de fijación 4 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_neckScrewL0": {
      "label": "M2×6 Tornillo de fijación 1 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_neckScrewL1": {
      "label": "M2×6 Tornillo de fijación 2 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_neckScrewL2": {
      "label": "M2×6 Tornillo de fijación 3 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_neckScrewL3": {
      "label": "M2×6 Tornillo de fijación 4 · Candidato para orificio de rejilla fuente",
      "source": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente."
    },
    "f_boardScrew0": {
      "label": "M3×16 Tornillo de fijación 1 · Candidato para agujeros casi coaxiales en dos placas",
      "source": "Comparación de la posición del orificio fuente GLB; 2 orificios son casi coaxiales y los otros 2 orificios están desalineados aproximadamente 1.27mm; Los agujeros no se modifican ni se presume el ajuste físico."
    },
    "f_boardScrew1": {
      "label": "M3×16 Tornillo de fijación 2 · Candidato para agujeros casi coaxiales en dos placas",
      "source": "Comparación de la posición del orificio fuente GLB; 2 orificios son casi coaxiales y los otros 2 orificios están desalineados aproximadamente 1.27mm; Los agujeros no se modifican ni se presume el ajuste físico."
    },
    "f_boardScrew2": {
      "label": "M3×16 Tornillo de fijación 3 · Ubicación del orificio a verificar",
      "source": "Comparación de la posición del orificio fuente GLB; 2 orificios son casi coaxiales y los otros 2 orificios están desalineados aproximadamente 1.27mm; Los agujeros no se modifican ni se presume el ajuste físico."
    },
    "f_boardScrew3": {
      "label": "M3×16 Tornillo de fijación 4 · Ubicación del orificio a verificar",
      "source": "Comparación de la posición del orificio fuente GLB; 2 orificios son casi coaxiales y los otros 2 orificios están desalineados aproximadamente 1.27mm; Los agujeros no se modifican ni se presume el ajuste físico."
    },
    "f_thighScrewR0": {
      "label": "M2.3×4 Tornillo de fijación 1 · Candidato para orificio de rejilla fuente",
      "source": "P5-01 fuente geometry.bin accesorio de orificio redondo · Es necesario verificar el objeto real y el uso específico del orificio"
    },
    "f_thighScrewR1": {
      "label": "M2.3×4 Tornillo de fijación 2 · Candidato para orificio de rejilla fuente",
      "source": "P5-01 fuente geometry.bin accesorio de orificio redondo · Es necesario verificar el objeto real y el uso específico del orificio"
    },
    "f_thighScrewL0": {
      "label": "M2.3×4 Tornillo de fijación 1 · Candidato para orificio de rejilla fuente",
      "source": "P5-02 fuente geometry.bin accesorio de orificio redondo · Es necesario verificar el objeto real y el uso específico del orificio"
    },
    "f_thighScrewL1": {
      "label": "M2.3×4 Tornillo de fijación 2 · Candidato para orificio de rejilla fuente",
      "source": "P5-02 fuente geometry.bin accesorio de orificio redondo · Es necesario verificar el objeto real y el uso específico del orificio"
    },
    "f_uno": {
      "label": "Arduino UNO Q · Aparición confirmada del lote v2",
      "source": "Modelo fotográfico confirmado · Conversión de unidad uniforme 1000; La estimación del orificio de montaje y el mapeo eléctrico no se han verificado físicamente."
    },
    "f_extension": {
      "label": "Placa de expansión Luwu · Aparición confirmada v2",
      "source": "Modelo fotográfico confirmado · Conversión de unidad uniforme 1000; La estimación del orificio de montaje y el mapeo eléctrico no se han verificado físicamente."
    },
    "f_powerCable": {
      "label": "Cable de alimentación de dos hilos de la batería · Polaridad a verificar",
      "source": "En la película original se ven líneas rojas y negras. No se han verificado la ruta, la longitud de la línea, la polaridad y el conector real."
    },
    "f_powerPlug": {
      "label": "Conector de batería · Posición de la llave y polaridad a verificar",
      "source": "Tutorial modelo simple · No hay definiciones de pines eléctricos verificadas"
    },
    "f_bus0": {
      "label": "Bus principal de tres pines 1 · Esquema correspondiente al ramal",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "f_busPlug0": {
      "label": "Conector bus principal 1 · Posición de la llave por verificar",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "f_bus1": {
      "label": "Bus principal de tres pines 2 · Esquema correspondiente al ramal",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "f_busPlug1": {
      "label": "Conector bus principal 2 · Posición de la llave por verificar",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "f_bus2": {
      "label": "Bus principal de tres pines 3 · Esquema correspondiente al ramal",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    },
    "f_busPlug2": {
      "label": "Conector bus principal 3 · Posición de la llave por verificar",
      "source": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar."
    }
  },
  "ui": {
    "先认清这几件": "Primero identifiquemos estas cosas.",
    "准备零件": "preparar piezas",
    "这一段组装一只脚踝。先准备已编号、已居中的舵机，以及脚掌、小腿连接件、轴承和踝轴。": "Esta sección ensambla un tobillo. Primero prepare el servo numerado y centrado, así como la planta del pie, el conector de la pantorrilla, el rodamiento y el eje del tobillo.",
    "舵机编号和居中应在机械安装前完成。": "La numeración y el centrado servo deben completarse antes de la instalación mecánica.",
    "拆下舵盘": "Quitar brazo del servo",
    "先拧出舵盘中央的原装固定螺丝，再沿输出轴方向取下黑色舵盘。": "Primero desenrosque el tornillo de fijación original en el centro del brazo del servo y luego retire el brazo del servo negro a lo largo de la dirección del eje de salida.",
    "把舵盘和原装螺丝放在一旁，后面的步骤不会用自攻螺丝替代它。": "Deje a un lado el brazo del servo y los tornillos originales; Los pasos posteriores no lo reemplazarán con tornillos autorroscantes.",
    "插好舵机线": "Conecte la línea servo",
    "插入线缆": "Conecte el cable",
    "将插头的端子孔对准接口凸起，沿接口方向插入，再按压到位。": "Alinee el orificio del terminal del enchufe con la protuberancia de la interfaz, insértelo en la dirección de la interfaz y luego presiónelo en su lugar.",
    "看清插头方向。这里演示插接动作，三芯线的针脚定义仍需实物核对。": "Verifique claramente la dirección del enchufe. La acción de taponamiento se demuestra aquí. La definición de los pines del cable de tres núcleos aún debe verificarse físicamente.",
    "固定小腿连接件": "Conector fijo en la parte inferior de la pierna.",
    "固定小腿": "Pantorrilla fija",
    "将白色小腿连接件贴合舵机，对齐安装孔，再拧入两颗 M2×6 沉头自攻螺丝。": "Coloque el conector blanco de la pata inferior en servo, alinee los orificios de montaje y luego atornille dos tornillos autorroscantes de cabeza avellanada M2×6.",
    "连接件的长端朝上。先对孔，再固定，不用螺丝把歪斜的零件硬拉到位。": "El extremo largo del conector apunta hacia arriba. Primero alinee los agujeros y luego fíjelos. No se necesitan tornillos para colocar las piezas torcidas en su lugar.",
    "把舵机装入脚掌": "Instale servo en la planta del pie.",
    "装入脚掌": "Se adapta a la planta del pie",
    "把舵机和小腿连接件组成的模块放入脚掌，按视频固定四颗 M2×6 沉头自攻螺丝。": "Coloque el módulo compuesto por servo y conector de pantorrilla en la planta del pie y fije los cuatro tornillos autorroscantes de cabeza avellanada M2×6 como se muestra en el vídeo.",
    "先确认脚掌与关节朝向，再固定四个位置。线缆留在外侧。": "Primero confirme la orientación de las plantas de los pies y las articulaciones, y luego fije las cuatro posiciones. Los cables quedan en el exterior.",
    "压入小轴承": "Presione en el pequeño rodamiento",
    "压入轴承": "Presione rodamiento",
    "将小轴承对准脚掌的圆形安装孔，沿轴向压入。": "Alinee el pequeño rodamiento con el orificio de montaje circular en la planta del pie y presiónelo a lo largo de la dirección axial.",
    "轴承要坐正，中心孔与连接件同轴。型号按清单对应 10×15×3 mm。": "rodamiento debe estar en posición vertical, con el orificio central y el conector coaxial. El número de modelo corresponde a 10×15×3 mm según la lista.",
    "对齐并装入踝轴": "Alinee e instale el eje del tobillo.",
    "装入踝轴": "Instale el eje del tobillo",
    "对齐中间圆孔，将打印的踝轴放到轴承中心，再把 M2.3×8 自攻螺丝手动旋入。": "Alinee el orificio central, coloque el eje del tobillo impreso en el centro de rodamiento y luego atornille manualmente el tornillo autorroscante M2.3×8.",
    "踝轴用了现有 3MF 网格；这里的定位经过展示调整，还没有验证实物配合。": "El eje del tobillo utiliza la rejilla 3MF existente; la posición aquí se ha ajustado para su visualización y no se ha verificado su ajuste físico.",
    "拧紧并检查": "Apretar y comprobar",
    "固定检查": "cheque fijo",
    "沿轴向拧入 M2.3×8 螺丝，直到螺丝头贴合表面，再检查脚踝连接。": "Atornille el tornillo M2.3×8 axialmente hasta que la cabeza del tornillo descanse contra la superficie, luego verifique la conexión del tobillo.",
    "视频要求螺丝头贴合、末端从另一侧伸出。原型只展示动作，不模拟实际扭矩或公差。": "El video pide que la cabeza del tornillo encaje perfectamente y que el extremo salga por el otro lado. El prototipo sólo demuestra movimiento y no simula el par ni las tolerancias reales.",
    "这一只脚踝装好了": "Este tobillo está instalado.",
    "完成查看": "Visualización completa",
    "现在可以转到背面看连接位置，或回到任意步骤重看。另一只脚踝按视频做镜像装配。": "Ahora puedes girar hacia atrás para ver dónde están las conexiones, o volver a cualquier paso para revisarlo. Haz el montaje del espejo del otro tobillo como se muestra en el vídeo.",
    "这段尚未安装脚底软垫；视频在后面的双腿阶段才安装。": "Los cojines debajo de los pies aún no están instalados en esta sección; se instalan más adelante en el video en las piernas.",
    "舵机 · 视频 ID14": "servo · Vídeo ID14",
    "现有辅助网格": "Red auxiliar existente",
    "脚掌 · P2-03": "Planta del pie · P2-03",
    "真实 3MF 网格": "Rejilla real 3MF",
    "小腿连接件 · P6-04": "Conector de pantorrilla · P6-04",
    "小轴承 · 10×15×3": "Pequeño rodamiento · 10×15×3",
    "踝轴 · P2-05": "Eje del tobillo · P2-05",
    "真实网格 · 定位示意": "Cuadrícula real·Diagrama de posicionamiento",
    "拆下的舵盘": "Eliminado brazo del servo",
    "新增教学示意": "Instrucciones de enseñanza agregadas.",
    "舵盘中央原装螺丝": "brazo del servo tornillo central original",
    "新增教学示意 · 规格待核": "Instrucciones didácticas añadidas · Especificaciones por verificar",
    "三针舵机插头": "Enchufe servo de tres pines",
    "三芯舵机线": "Línea servo de tres núcleos",
    "新增教学示意 · 路径未核验": "Se agregaron instrucciones didácticas · La ruta no ha sido verificada",
    "小腿固定螺丝 1 · M2×6": "Tornillo fijación pantorrilla 1 · M2×6",
    "新增教学示意 · 孔位未核验": "Nuevas instrucciones didácticas · Posición del agujero no verificada",
    "小腿固定螺丝 2 · M2×6": "Tornillo fijación pantorrilla 2 · M2×6",
    "脚掌固定螺丝 1 · M2×6": "Tornillo fijación pie 1 · M2×6",
    "脚掌固定螺丝 2 · M2×6": "Tornillo fijación pie 2 · M2×6",
    "脚掌固定螺丝 3 · M2×6": "Tornillo fijación pie 3 · M2×6",
    "脚掌固定螺丝 4 · M2×6": "Tornillo fijación pie 4 · M2×6",
    "踝轴固定螺丝 · M2.3×8": "Tornillo de fijación del eje del tobillo · M2.3×8",
    "新增教学示意 · 配合未核验": "Instrucciones didácticas añadidas · La cooperación no ha sido verificada.",
    "拧入中": "Atornillando",
    "已紧固": "Apretado",
    "预拧中": "Preatornillado",
    "预拧到位": "Preatornillado en su lugar",
    "正在取下": "Eliminando",
    "已取下": "Remoto",
    "插接中": "Conectando",
    "已接合": "Comprometido",
    "整理中": "En preparación",
    "余量已留好": "El saldo ha sido reservado.",
    "压入中": "Presionando",
    "已就位": "Ya en su lugar",
    "模型配合待核": "Ajuste del modelo sin verificar",
    "螺丝放大": "Detalle del tornillo",
    "舵盘放大": "Detalle del brazo del servo",
    "放大": "agrandar",
    "线端放大": "Detalle del extremo del cable",
    "接头放大": "Detalle del conector",
    "{value} · {value}": "{value} · {value}",
    "局部放大": "aumento local",
    "本步可手动开关；换步后，小部位自动开启，大部位默认关闭": "Este paso se puede activar y desactivar manualmente; Después de cambiar los pasos, las piezas pequeñas se activarán automáticamente y las piezas grandes se desactivarán de forma predeterminada.",
    "本步暂无需要放大的装配细节": "No hay detalles de montaje que deban ampliarse en este paso.",
    "局部放大 · ": "Zoom parcial ·",
    "开": "Activado",
    "关": "Desactivado",
    " · 剖视": "· Sección transversal",
    "对准接口": "Alinear interfaz",
    "窗口": "ventana",
    "当前装配部位的实时三维放大画面": "Ampliación tridimensional en tiempo real de la pieza de montaje actual",
    "右脚踝": "tobillo derecho",
    "左脚踝": "tobillo izquierdo",
    "右腿连接": "Conexión de la pierna derecha",
    "左腿连接": "conexión de la pierna izquierda",
    "双腿收尾": "Acabado de piernas",
    "准备{value}脚踝零件": "Prepare las piezas del tobillo {value}",
    "{value}脚踝装好了": "El tobillo {value} está instalado.",
    "准备已编号、已居中的 {value} 舵机，以及这一侧的脚掌、小腿、轴承和踝轴。": "Prepare {value} servo numerado y centrado, así como la punta del pie, la pantorrilla, rodamiento y el eje del tobillo de este lado.",
    "可以旋转检查，再继续下一阶段。脚底软垫会在双腿收尾阶段安装。": "Puede rotar la inspección antes de continuar con la siguiente etapa. Las plantillas se instalan durante la fase de acabado de las piernas.",
    "先卸中央螺丝，再取下舵盘": "Retire primero el tornillo central, luego retire el brazo del servo.",
    "对准接口，按压到位": "Alinee la interfaz y presiónela en su lugar.",
    "对孔 · M2×6 ×2": "Agujero correcto · M2×6 ×2",
    "固定脚掌 · M2×6 ×4": "Pie fijo · M2×6 ×4",
    "沿轴向压入": "Presione axialmente",
    "对齐轴承中心": "Alinear rodamiento al centro",
    "拧至螺丝头贴合": "Apriete hasta que la cabeza del tornillo encaje",
    "右": "bien",
    "左": "Izquierda",
    "对齐双舵机": "Alinear doble servo",
    "对齐{value}腿的两只舵机": "Alinee las dos patas servo de {value}",
    "按视频排列 {value}，对齐成对舵机。画面中的左右是拍摄视角，不直接等于机器人左右。": "Organice {value} por video, alinee el par servo. La izquierda y la derecha en la imagen son el ángulo de disparo, no directamente iguales a la izquierda y la derecha del robot.",
    "保留另一只已完成的脚踝；核对当前这一侧。": "Mantenga el otro tobillo completo; comprobar el lado actual.",
    "核对舵机与方向": "Verifique servo con dirección",
    "固定大腿支撑": "Soporte fijo para muslos.",
    "固定双圆孔大腿支撑": "Soporte fijo para muslos con doble ojal.",
    "把白色双圆孔支撑贴合这对舵机，对齐四个固定位置，按视频拧入四颗 M2×6。": "Coloque el soporte blanco de doble orificio redondo en el par de servo, alinee las cuatro posiciones fijas y atornille los cuatro M2×6 como se muestra en el vídeo.",
    "逐孔核对后固定。孔位与安装配合仍是原型示意。": "Verifique agujero por agujero y luego arregle. La posición de los orificios y la coordinación de la instalación siguen siendo indicaciones prototipo.",
    "M2×6 ×4 · 固定支撑": "M2×6 ×4 · Soporte fijo",
    "压入大轴承": "Presione en el gran rodamiento",
    "压入连接脚踝的大轴承": "Presione en el rodamiento grande que conecta el tobillo.",
    "将 16×22×4 mm 大轴承对准支撑圆孔，沿轴向压到位。": "Alinee 16×22×4 mm y rodamiento grande con el orificio de soporte y presiónelos en su lugar a lo largo de la dirección axial.",
    "轴承应坐正，再连接已经装好的脚踝。": "rodamiento debe sentarse erguido y luego conectar el tobillo que se ha instalado.",
    "沿轴向压入大轴承": "Presione el rodamiento grande a lo largo de la dirección axial",
    "连接已装脚踝": "tobillo adjunto",
    "接上{value}脚踝子组件": "Conecte el subconjunto del tobillo {value}",
    "把已经完成的脚踝与小腿作为一个整体，移到大腿支撑的轴承位置，再固定四颗 M2×6。": "Mueva el tobillo y la pantorrilla completos en su conjunto a la posición rodamiento del soporte para muslos y fije cuatro M2×6.",
    "已有螺丝、踝轴与线缆随子组件一起移动。": "Ya hay tornillos, tobillos y cables que se mueven con el subconjunto.",
    "整体对齐 · M2×6 ×4": "Alineación general · M2×6 ×4",
    "插接腿内线束": "Insertar en la pierna mazo de cables",
    "插接可见的腿内总线": "Conecte el autobús de la pierna visible",
    "按视频插接并压紧可见的三针舵机线，留出关节活动需要的余量。": "Conecte y apriete la línea visible servo de tres pines según el video, dejando espacio para el movimiento de las articulaciones.",
    "此处演示插接与路径；每根线两端的准确接口和针脚尚未核验。": "Aquí se demuestran el acoplamiento y el enrutamiento; No se han verificado los conectores y pines exactos en cada extremo de cada cable.",
    "插接线束 · 端点示意": "Enchufe mazo de cables · Diagrama de punto final",
    "整理线束余量": "Organizar el margen mazo de cables",
    "整理线束并留出上端连接线": "Organizar mazo de cables y dejar la línea de conexión superior.",
    "整理环线，让线束留在机构外侧，并保留后续与身体相连的线端。": "Disponga el cable del bucle de modo que mazo de cables quede en el exterior del mecanismo y mantenga los extremos del cable subsiguientes conectados al cuerpo.",
    "不要夹线，也不要根据三芯黑线的外观判断针脚定义。": "No pellizque el hilo y no juzgue la definición del pasador según la apariencia del cable negro de tres núcleos.",
    "留出活动余量 · 不夹线": "Deje espacio para el movimiento · Sin sujeción del hilo",
    "{value}腿连接完成": "Conexión de pata {value} completada",
    "{value}腿连接部分完成": "Pieza de conexión de pata {value} completada.",
    "检查已连接的脚踝、双舵机支撑与线束，然后继续下一阶段。": "Verifique el tobillo conectado, la abrazadera doble servo y mazo de cables, luego continúe con la siguiente etapa.",
    "上端连接件和脚底软垫还没有安装。": "Los conectores superiores y los cojines debajo de los pies aún no se han instalado.",
    "卸右腿上端舵盘": "Retire la parte superior de la pierna derecha brazo del servo",
    "卸下右腿上端的原装舵盘": "Retire el brazo del servo original en la parte superior de la pierna derecha.",
    "先卸中央固定螺丝，再取下舵盘，保留在旁边。": "Primero retiramos el tornillo de fijación central, luego retiramos el brazo del servo y lo guardamos junto a él.",
    "此处按视频处理上端；不要拆动已经固定的脚踝。": "El extremo superior se procesa según el vídeo aquí; No retire el tobillo fijo.",
    "先卸中央螺丝，再取舵盘": "Retire primero el tornillo central, luego saque el brazo del servo.",
    "卸左腿上端舵盘": "Retire la parte superior de la pierna izquierda brazo del servo",
    "卸下左腿上端的原装舵盘": "Retire el brazo del servo original en la parte superior de la pierna izquierda.",
    "按镜像方向处理另一条腿，依次卸中央螺丝和舵盘。": "Procese la otra pata en la dirección del espejo y retire el tornillo central y brazo del servo en secuencia.",
    "拆下的原装零件继续保留在零件区。": "Las piezas originales que fueron retiradas permanecen en el área de piezas.",
    "保留拆下的原装零件": "Conserve las piezas originales que fueron retiradas.",
    "右连接件压轴承": "Prensa de pieza de conexión derecha rodamiento",
    "先给右上端连接件压入轴承": "Primero presione rodamiento en el conector superior derecho",
    "在独立的上端连接件中压入大轴承，然后再把这一组件装到腿上。": "Presione el rodamiento grande en el conector superior separado y luego fije el conjunto a la pata.",
    "先压轴承，再安装连接件；不要把这两步倒过来。": "Presione primero rodamiento y luego instale el conector; No invierta estos dos pasos.",
    "先在连接件中压入轴承": "Primero presione rodamiento en el conector.",
    "安装右连接件": "Instale el conector derecho",
    "固定右上端连接件与轴承": "Fije el conector superior derecho con rodamiento",
    "把已压入轴承的连接件整体对齐上端位置，用四颗 M2×6 固定。": "Alinee el conector que se ha presionado en rodamiento con la posición final superior y fíjelo con cuatro M2×6.",
    "连接件与它内部的轴承一起移动。": "El conector se mueve con el rodamiento en su interior.",
    "组件整体安装 · M2×6 ×4": "Instalación general de componentes · M2×6 ×4",
    "左连接件压轴承": "Prensa de pieza de conexión izquierda rodamiento",
    "给左上端连接件压入轴承": "Presione rodamiento en el conector superior izquierdo",
    "在另一侧连接件中压入大轴承，保持镜像朝向。": "Presione el rodamiento grande en el conector del otro lado, manteniendo la orientación del espejo.",
    "左右连接件使用各自的真实网格。": "Los conectores izquierdo y derecho utilizan sus propias mallas reales.",
    "镜像方向 · 先压轴承": "Dirección del espejo · Presione primero rodamiento",
    "安装左连接件": "Instalar el conector izquierdo",
    "固定左上端连接件与轴承": "Fije el conector superior izquierdo con rodamiento",
    "把另一侧的连接件与轴承整体装到位，用四颗 M2×6 固定。": "Instale la pieza de conexión en el otro lado con rodamiento y fíjela con cuatro M2×6.",
    "检查两侧方向一致，给后续身体装配留下连接位置。": "Comprobar que las direcciones en ambos lados son consistentes, dejando una posición de conexión para el posterior montaje de la carrocería.",
    "固定右脚底软垫": "Cojín fijo planta pie derecho",
    "安装右脚底软垫": "Instale el cojín de suela derecho",
    "将软垫贴合脚底，按视频对齐四个孔，固定四颗 M2×6。": "Coloque la almohadilla suave en la planta de su pie, alinee los cuatro orificios según el video y fije los cuatro M2×6.",
    "这是脚底软垫，不是稍后总装阶段的大腿外壳。": "Este es el único cojín, no la cubierta del muslo que viene más adelante en la etapa de montaje final.",
    "对准脚底 · M2×6 ×4": "Alinea las plantas de tus pies · M2×6 ×4",
    "固定左脚底软垫": "Cojín fijo de suela izquierda",
    "安装左脚底软垫": "Instale el cojín de la planta del pie izquierdo",
    "在另一只脚底安装软垫，按视频固定四颗 M2×6。": "Instale una almohadilla suave en la parte inferior del otro pie y fije cuatro M2×6 como se muestra en el video.",
    "检查两只脚底与线束状态，然后进入身体与髋部装配。": "Comprobar el estado de las plantas de ambos pies y mazo de cables, para luego proceder al montaje del cuerpo y caderas.",
    "双腿完成查看": "Vista completa de piernas",
    "双腿子组件装好了": "El subconjunto de dos patas está instalado",
    "现在可以旋转查看两条腿，或回到任意阶段重新看。": "Ahora puedes girar para ver ambas piernas o volver a cualquier nivel para verla nuevamente.",
    "当前阶段到 08:16；下一阶段安装身体髋部，之后再做头颈和电控总装。": "La etapa actual es 08:16; la siguiente etapa es instalar las caderas del cuerpo y luego realizar el ensamblaje de la cabeza, el cuello y el control electrónico.",
    "{value}{value} · {value}": "{value}{value} · {value}",
    "{value}{value}": "{value}{value}",
    "舵机": "servo",
    "小轴承": "Pequeñorodamiento",
    "真实 3MF 网格 · 配合待核验": "Cuadrícula real 3MF · Coordinación por verificar",
    "现有硬件网格": "Red de hardware existente",
    "教学简模 · 孔位待核验": "Modelo de enseñanza sencillo · Posiciones de los agujeros a verificar",
    "{value}固定螺丝 {value} · M2×6": "{value} tornillo de fijación {value} · M2×6",
    "{value}上端舵机 · ID{value}": "{value} extremo superiorservo · ID{value}",
    "{value}中部舵机 · ID{value}": "{value} medio servo · ID{value}",
    "{value}大腿支撑 · {value}": "{value} soporte para muslos · {value}",
    "{value}大轴承 · 16×22×4": "{value} grande rodamiento · 16×22×4",
    "{value}上端原装舵盘": "{value} extremo superior original brazo del servo",
    "教学简模 · 安装位示意": "Enseñanza de modelo sencillo·Indicación de posición de instalación",
    "{value}上端原装中央螺丝": "{value} tornillo central original extremo superior",
    "教学简模 · 原装规格待核": "Modelo didáctico sencillo·Especificaciones originales a verificar",
    "{value}上端连接件 · {value}": "Conector superior {value} · {value}",
    "{value}连接件大轴承": "Conector grande {value} rodamiento",
    "{value}脚底软垫 · {value}": "{value} Almohadilla suave para pies · {value}",
    "线束教学示意 · 路径和端点待核验": "Instrucciones didácticas mazo de cables · Es necesario verificar la ruta y los puntos finales",
    "{value}腿内三芯线": "Cable tripolar {value} en pata",
    "腿内三芯线": "Cable de tres núcleos dentro de la pierna",
    "{value}腿上端预留线": "Línea reservada de la parte superior de la pierna {value}",
    "上端预留线": "Línea reservada en el extremo superior",
    "教学接口；精确键位与针脚待核": "Interfaz de enseñanza; Posiciones claves precisas y pines a verificar.",
    "双插座教学锚点；物理修订与电气针脚待核": "Anclaje didáctico de doble encaje; Revisión física y pinout eléctrico pendientes.",
    "原装螺丝": "tornillos originales",
    "原装舵盘": "Originales brazo del servo.",
    "线端余量": "Margen de fin de línea",
    "插头": "enchufar",
    "踝轴": "eje del tobillo",
    "轴承": "rodamiento",
    "线束整理": "Acabado mazo de cables",
    "下嘴软垫": "Cojín suave para la parte inferior de la boca.",
    "上嘴软垫": "Cojín de labios",
    "右脚底软垫": "Cojín planta pie derecho",
    "左脚底软垫": "Cojín planta pie izquierdo",
    "下巴": "mandíbula",
    "头部平台": "plataforma de cabeza",
    "右脚": "pie derecho",
    "左脚": "pie izquierdo",
    "右踝轴": "Eje del tobillo derecho",
    "眼睛外壳": "cáscara del ojo",
    "左踝轴": "eje del tobillo izquierdo",
    "眼睛": "Ojo",
    "颈部连接板 A": "Placa de conexión del cuello A",
    "颈部连接板 B": "Placa de conexión del cuello B",
    "右 Roll 舵机输出": "Salida derecha Roll servo",
    "左 Roll 舵机输出": "Salida izquierda Roll servo",
    "头盖": "cráneo",
    "头部舵机固定件": "Pieza de fijación del cabezal servo",
    "身体背板": "panel trasero del cuerpo",
    "大腿右外壳": "Muslo derecho",
    "大腿左外壳": "Muslo izquierdo",
    "电池仓": "compartimiento de la batería",
    "右大腿支撑": "Soporte para muslo derecho",
    "左大腿支撑": "soporte para muslo izquierdo",
    "身体右外壳": "Carcasa derecha del cuerpo",
    "身体左外壳": "Cuerpo concha izquierda",
    "头部俯仰支架": "Soporte de inclinación de la cabeza",
    "右 Roll 舵机盖板": "Cubierta derecha Roll servo",
    "左 Roll 舵机盖板": "Cubierta izquierda Roll servo",
    "右小腿": "pantorrilla derecha",
    "左小腿": "pantorrilla izquierda",
    "右 Yaw 连接件": "Conector derecho Yaw",
    "左 Yaw 连接件": "Conector izquierdo Yaw",
    "头部 Yaw 支架": "Soporte de cabeza Yaw",
    "髋部 Yaw 支撑": "Soporte de cadera Yaw",
    "重复 actorId: {value}": "Repita actorId: {value}",
    "Arduino UNO Q · 已确认外观 v2批次": "Arduino UNO Q · Aparición confirmada del lote v2",
    "陆吾扩展板 · 已确认外观 v2": "Placa de expansión Luwu · Aparición confirmada v2",
    "已确认照片模型 · 均匀单位换算1000；安装孔估算与电气映射未实物验证": "Modelo fotográfico confirmado · Conversión de unidad uniforme 1000; La estimación del orificio de montaje y el mapeo eléctrico no se han verificado físicamente.",
    "M3×16 固定螺丝 {value} · 两板近共轴孔候选": "M3×16 Tornillo de fijación {value} · Candidato para agujeros casi coaxiales en dos placas",
    "M3×16 固定螺丝 {value} · 孔位待核": "M3×16 Tornillo de fijación {value} · Ubicación del orificio a verificar",
    "源GLB孔位比较；2孔近共轴，另2孔约1.27mm错位；不修改孔或推定实物配合": "Comparación de la posición del orificio fuente GLB; 2 orificios son casi coaxiales y los otros 2 orificios están desalineados aproximadamente 1.27mm; Los agujeros no se modifican ni se presume el ajuste físico.",
    "已确认 v2 舵机外观 · HD-1910-C001 / HD1910M；转轴按建模坐标适配，配合与针脚未实物验证": "Aparición confirmada de v2 servo · HD-1910-C001 / HD1910M; el eje está adaptado según las coordenadas del modelado, y el ajuste y los pasadores no han sido verificados físicamente.",
    "已确认 v2 独立舵盘外观 · 按步骤拆卸；实体配合仍待核": "Apariencia confirmada de v2 independiente brazo del servo · Desmontaje según pasos; La coordinación física aún está por verificar.",
    "已确认 v2 三芯插头外观与三根黑线；线长、走线和针脚仍为未核验教学示意": "Se ha confirmado la aparición del enchufe de tres núcleos v2 y tres cables negros; La longitud del cable, el cableado y los pines aún son instrucciones de enseñanza sin verificar.",
    "已确认 v2 指定规格螺丝外观 · 孔位用途、扭矩与实体配合未实物验证": "Se ha confirmado la apariencia de los tornillos con especificaciones especificadas de v2. La posición del orificio, el torque y el ajuste físico no se han verificado físicamente.",
    "保持两块板的插合关系，将控制器组件移到身体背部。原片标示 4 颗 M3×16；本模型只在两处近共轴孔演示插入，另两处保留待核。": "Manteniendo las dos placas acopladas, mueva el conjunto del controlador hacia la parte posterior de su cuerpo. La película original está marcada como 4 y M3×16; este modelo solo demuestra la inserción en dos orificios casi coaxiales y los otros dos están reservados para verificación.",
    "原片4颗；本模型2孔近共轴，另2孔约1.27mm错位，暂不显示穿过两板的完成态。源板形、孔位、PCB厚度和排针节距均未拉伸或补孔；身体支撑与实体配合待核。": "La pieza original tiene piezas 4; los orificios 2 de este modelo son casi coaxiales y los orificios 2 están aproximadamente desalineados 1.27mm. Aún no se muestra el estado completo del paso a través de las dos placas. La forma de la placa fuente, la posición de los orificios, el grosor de PCB y el paso de la fila de pines no se han estirado ni parcheado; Es necesario verificar el soporte del cuerpo y la coordinación física.",
    "原片 M3×16 ×4 · 演示2孔，另2孔待核": "Película original M3×16 ×4 · Muestra los orificios 2 y los otros orificios 2 deben verificarse",
    "采用已确认板卡模型；32针对齐与12.3mm建模间距已核对，孔位部分为照片估算。两处安装孔约1.27mm错位，实物插合、公差与电气针脚未验证。": "Se utiliza el modelo de tablero confirmado; Se ha verificado la alineación de los pasadores 32 y el espaciado del modelado 12.3mm, y las ubicaciones de los orificios se estiman a partir de fotografías. Los dos orificios de montaje están desalineados aproximadamente 1.27mm y no se han verificado la inserción física, las tolerancias y los pines eléctricos.",
    "采用已确认照片模型。四组32针按建模坐标对齐；PCB和接口未按总包络拉伸。板间净空、键位、电气映射和实物配合仍待核。": "Características del modelo de fotografía confirmado. Los cuatro conjuntos de pines 32 están alineados según las coordenadas de modelado; PCB y la interfaz no se estiran según la envolvente total. Aún quedan por verificar la autorización de la placa, las ubicaciones clave, el mapeo eléctrico y el ajuste físico.",
    "萨蒂 · 第一号吉姆诺佩蒂": "Satie No. 1 Jimnoppetti",
    "莫扎特 · K.545 行板": "Mozart · K.545 Andante",
    "已静音": "apagado",
    "点一下页面开始音乐": "Haga clic en la página para iniciar la música.",
    "正在准备钢琴曲…": "Preparando música de piano...",
    "正在播放 · ": "Ahora jugando ·",
    "仅播放完成提示音": "Toque solo el tono de finalización.",
    "声音已关闭": "El sonido está apagado.",
    "钢琴曲暂时无法播放，可切换曲目重试": "La música de piano no se puede reproducir temporalmente. Puedes cambiar de pista e intentarlo de nuevo.",
    "打印件用涂装台当前的配色，舵机、板子和螺丝保持原样": "La impresión utiliza el esquema de color actual de la mesa de pintura, servo, el tablero y los tornillos siguen siendo los mismos.",
    "还没有涂色，打印件先用白色演示": "Aún no se ha coloreado, por lo que la impresión se mostrará primero en blanco.",
    "配色 · ": "Combinación de colores ·",
    "白胚": "embrión blanco",
    ").textContent=s.complete?`{value} · 完成`:`${String(local).padStart(2,": ").textContent=s.complete?`{value} · Completo`:`${String(local).padStart(2,",
    "红框 · 对准这两处": "Cuadro rojo · Apunta a estos dos lugares.",
    "绿框 · 本次已装好": "Marco verde · Ya instalado esta vez",
    "真实零件网格": "Malla de parte real",
    "模型清单加载失败": "Error al cargar el manifiesto del modelo",
    "模型几何加载失败": "Error al cargar la geometría del modelo",
    "极致 · ": "Extremo ·",
    "极致 · 细腻哑光、边缘柔光与摄影棚反射": "Ultimate · Mate delicado, luz suave en los bordes y reflejo de estudio",
    "当前 · 原有材质和渲染": "Actual · Materiales originales y renderizado.",
    "来做鸭 / letsduck · 3D 组装教程": "Hagamos un pato / letsduck · Tutorial de montaje 3D",
    "来做鸭 / letsduck": "Hagamos un pato / letsduck",
    "3D 组装教程": "Tutorial de montaje 3D",
    "整机预览": "Vista previa de toda la máquina",
    "对照原片": "Compara la película original",
    "跟着视频，一步一步装": "Sigue el vídeo e instálalo paso a paso.",
    "整机组装": "Montaje completo de la máquina",
    "原片 00:00—23:10": "Película original 00:00—23:10",
    "画质": "Calidad de imagen",
    "渲染画质": "Calidad de renderizado",
    "当前": "actual",
    "极致": "extremo",
    "局部放大 · 关": "Zoom parcial · Desactivado",
    "最佳视角": "Mejor ángulo de visión",
    "正面": "frente",
    "背面": "atrás",
    "三维组装区域": "Área de montaje 3D",
    "正在加载现有模型…": "Cargando modelo existente...",
    "可旋转的整机三维模型": "Modelo 3D giratorio de toda la máquina.",
    "接头局部放大窗": "Ventana de aumento parcial conjunta",
    "拖动放大窗": "Arrastra la ventana de aumento",
    "收起局部放大": "Colapso de la ampliación local",
    "当前接头的实时三维放大画面": "Ampliación 3D en tiempo real de la articulación actual.",
    "所选零件信息": "Información de la pieza seleccionada",
    "收起零件信息": "Ocultar información de piezas",
    "可以开始": "puede empezar",
    "本步动作": "Acción de este paso",
    "本步动作进度": "Progreso de este paso",
    "← 上一步": "← Anterior",
    "红绿框演示": "Demostración de caja roja y verde.",
    "暂停": "pausa",
    "自动播放 · 关": "Reproducción automática · Desactivado",
    "播放倍率": "Ampliación de reproducción",
    "声音设置": "ajustes de sonido",
    "声音": "sonido",
    "收起声音设置": "Contraer configuración de sonido",
    "背景音乐": "música de fondo",
    "选择钢琴曲": "Seleccionar música de piano",
    "完成提示音": "Tono de finalización",
    "音量": "volumen",
    "曲目与模型来源 ↗": "Fuente de seguimiento y modelo ↗",
    "开始组装": "Empezar a montar",
    "下一步 →": "Siguiente →",
    "从头再看": "Míralo desde el principio",
    "v4.1 走线复核版 · 新插头与部分3MF支架/外壳有几何干涉，红框部位配合待核。": "Versión de revisión del cableado v4.1 · El nuevo enchufe tiene interferencia geométrica con algunos soportes/carcasas 3MF y es necesario verificar la coordinación de las piezas de la caja roja.",
    "组装步骤": "Pasos de montaje",
    "组装顺序": "Secuencia de montaje",
    "选择组装阶段": "Seleccionar etapa de montaje",
    "1 · 准备与编号": "1 · Preparación y Numeración",
    "2 · 右脚踝": "2 · Tobillo derecho",
    "3 · 左脚踝": "3 · Tobillo izquierdo",
    "4 · 右腿连接": "4 · Conexión pierna derecha",
    "5 · 左腿连接": "5 · Conexión pierna izquierda",
    "6 · 双腿收尾": "6 · Remate de patas",
    "7 · 身体与髋支撑": "7 · Soporte para cuerpo y cadera",
    "8 · 髋电机与接腿": "8 · Motores de cadera y articulaciones de piernas",
    "9 · 头部旋转与接线": "9 · Rotación y cableado del cabezal",
    "10 · 嘴部与双舵机脖子": "10 · Boca y doble mástil servo",
    "11 · 头盖与嘴部软垫": "11 · Cubrecabeza y cojín bucal",
    "12 · 身体与头颈总装": "12 · Cuerpo y conjunto de cabeza y cuello",
    "13 · 电控与外壳收尾": "13 · Control electrónico y acabado de carcasa.",
    "14 · 校准与完成": "14 · Calibración y finalización",
    "选择组装步骤": "Seleccionar pasos de montaje",
    "本步说明 ↗": "Instrucciones para este paso ↗",
    "收起本步说明": "Contraer las instrucciones de este paso",
    "准备": "Preparar",
    "教学说明 · 不连接或控制真实设备": "Notas del tutorial · Sin conexión ni control de dispositivos reales",
    "本步用到": "Utilizado en este paso",
    "看这一步的原片": "Mira el vídeo original de este paso.",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。": "Instrucciones didácticas: Las posiciones de los orificios, la coordinación de las conexiones, las modificaciones de las placas y los puntos finales de las líneas aún no se han verificado físicamente.",
    "原片对照": "Comparación de películas originales",
    "收起原片": "Cerrar la película original.",
    "截取自你提供的视频 · 20:58—23:10": "Extraído del vídeo que proporcionaste · 20:58—23:10",
    "{name}放大": "{name} ampliar",
    "{ordinal}/{total} · {status}": "{ordinal}/{total} · {status}",
    "{frame} · {status}": "{frame} · {status}",
    "{title}窗口": "Ventana {title}",
    "{name} · 剖视": "{name} · Sección transversal",
    "局部放大 · {state}": "Zoom parcial · {state}",
    "自动播放 · {state}": "Reproducción automática · {state}",
    "截取自你提供的视频 · {start}—{end}": "Extraído del vídeo que proporcionaste · {start}—{end}",
    "模型没有加载成功：{error}": "El modelo no se cargó correctamente: {error}",
    "配色 · {name}": "Color · {name}",
    "正在播放 · {track}": "Reproduciendo ahora · {track}",
    "本步观看 {seen} / {total} · 实物完成 {built} / {total}": "Mira este paso {seen} / {total} · Finalización física {built} / {total}",
    "本步说明": "Instrucciones para este paso",
    "收起说明 · 留出观察空间": "Contraer instrucciones · Dejar espacio para observación",
    "方向与动作": "dirección y acción",
    "完成检查": "Inspección completa",
    "已看过此步": "Ya vi este paso",
    "我已检查实物并装好": "Revisé el objeto físico y lo instalé.",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。接头键位、实际插座、针脚和极性未核验。": "Instrucciones didácticas: Las posiciones de los orificios, la coordinación de las conexiones, las modificaciones de las placas y los puntos finales de las líneas aún no se han verificado físicamente. No se han verificado las claves del conector, los enchufes, pines y polaridad reales.",
    "观察设置 · 视角 / 聚焦 / 画质": "Configuración de observación·Visualización/Enfoque/Calidad de imagen",
    "播放设置 · 进度 / 倍率 / 声音": "Configuración de reproducción · Progreso/Ampliación/Sonido",
    "收起组装顺序": "Colapsar secuencia de ensamblaje",
    "观看 {seen}/{total} · 实物 {built}/{total}": "Ver {seen}/{total} · Actual {built}/{total}",
    "{chapter} · {local} / {total}": "{chapter} · {local} / {total}",
    "{chapter} · 完成": "{chapter} · Completo",
    "{local}  {short}": "{local} {short}",
    "红框": "Marco rojo",
    "绿框": "Marco verde"
  }
};
