// Static assembly copy. Machine-drafted, technical-reference corrections; native review pending.
export default {
  "version": 1,
  "steps": {
    "prepare-intro": {
      "short": "Jetez d’abord un œil au robot complet",
      "title": "Comprendre la machine complète et l'itinéraire d'assemblage",
      "text": "Regardez d'abord l'ensemble de la machine, puis terminez la préparation, les jambes, le corps, la tête et le cou, l'assemblage final et l'étalonnage en séquence.",
      "check": "Il s'agit du prototype d'enseignement indépendant. Vous pouvez utiliser « Aperçu complet » pour revenir à l'état terminé à tout moment.",
      "caption": ""
    },
    "prepare-boards": {
      "short": "Branchez temporairement deux cartes ensemble",
      "title": "Branchez temporairement le UNO Q et la carte d'extension",
      "text": "Alignez les connecteurs à broches et les connecteurs femelles des deux cartes et appuyez-les ensemble dans la même direction. Les deux tableaux sont deux objets distincts dans le didacticiel.",
      "check": "Présente un modèle photo confirmé. Les quatre jeux de broches 32 sont alignés selon les coordonnées de modélisation ; PCB et l'interface ne sont pas étirés en fonction de l'enveloppe totale. Le dégagement des cartes, les emplacements clés, la cartographie électrique et l'adéquation physique doivent encore être vérifiés.",
      "caption": "Alignez l'embase à broches et l'embase femelle et appuyez-les ensemble"
    },
    "prepare-battery": {
      "short": "Connecter la batterie de test",
      "title": "Branchez la batterie d'alimentation temporaire",
      "text": "Insérez le connecteur de la batterie conformément à la pièce d'origine pour préparer l'alimentation électrique pour la prochaine configuration servomoteur.",
      "check": "La vidéo vous rappelle de faire attention à la polarité ; ce prototype n'estime pas les broches ou la polarité réelles en fonction de l'apparence.",
      "caption": "La fiche d'alimentation et la direction sont soumises à une vérification physique"
    },
    "prepare-servo": {
      "short": "Connectez un servomoteur",
      "title": "Connectez uniquement un servomoteur à configurer à la fois",
      "text": "Branchez d'abord le fil à trois conducteurs sur servomoteur, puis branchez l'autre extrémité sur la carte. Actuellement seul celui-ci est connecté pour tester servomoteur.",
      "check": "Après avoir terminé la numérotation de l'actuel, déconnectez et remplacez le suivant.",
      "caption": "Simple servomoteur · Brancher en place"
    },
    "prepare-usb": {
      "short": "Allumez l'ordinateur et connectez-le",
      "title": "Allumez et connectez-vous au Type-C",
      "text": "Appuyez sur vidéo pour allumer l'alimentation, puis connectez l'ordinateur avec le câble Type-C.",
      "check": "Cette page montre uniquement la séquence de connexion et ne démarre ni ne connecte de vrais appareils.",
      "caption": "Allumer · Connectez-vous à Type-C"
    },
    "prepare-app": {
      "short": "Importer et exécuter l'application",
      "title": "Importez et exécutez l'application sur Arduino App Lab",
      "text": "Importez l'application XGO Duck sur votre ordinateur et exécutez-la. La vidéo originale ne montre pas entièrement la première installation de l'environnement.",
      "check": "Cette étape fournit une comparaison vidéo et des instructions pédagogiques ; il n'y a pas de véritable session App Lab ici.",
      "caption": "Démarrage de l'application · Instructions du didacticiel"
    },
    "prepare-scan": {
      "short": "Scanner et centrer",
      "title": "Entrez Servo setup, scannez et centrez le servomoteur actuel",
      "text": "Ouvrez votre propre adresse de configuration d'appareil et entrez Servo setup. Scan all IDs → Après en avoir trouvé un seul Stop scan → Move to 2047 → Write.",
      "check": "En raison des différents environnements, l'appareil IP et le nom d'hôte ne copient pas l'adresse fixe du film original.",
      "caption": "Scan → Stop → 2047 → Write"
    },
    "prepare-id": {
      "short": "Écrire les paramètres et ID",
      "title": "Écrivez les paramètres et définissez la cible ID",
      "text": "Les paramètres vidéo sont KP=5 et KD=20, cliquez sur Write ; remplissez la cible ID, exécutez Change ID et confirmez le succès.",
      "check": "Il s'agit de la séquence de configuration dans la vidéo ; la page Web actuelle n'envoie pas de paramètres à servomoteur.",
      "caption": "KP 5 · KD 20 · Change ID"
    },
    "prepare-all-ids": {
      "short": "Complétez 15 et ID un par un",
      "title": "Compléter la numérotation et le centrage des quinze servomoteur un à un",
      "text": "Complétez 10–14, 20–24, 30–34 dans l'ordre. N’en configurez qu’un à la fois. L'installation mécanique ultérieure commence à partir d'un état numéroté et centré.",
      "check": "Les quinze ID sur cette page sont une liste d'instructions et ne représentent pas que de vrais appareils ont été écrits ou centrés.",
      "caption": "15 ID · Traités un par un"
    },
    "r-prepare": {
      "short": "Préparer les pièces",
      "title": "Préparer les parties de la cheville droite",
      "text": "Préparez le ID14 servomoteur numéroté et centré, ainsi que la plante du pied, le mollet, le roulement et la tige de la cheville de ce côté.",
      "check": "La numérotation et le centrage servomoteur doivent être terminés avant l'installation mécanique.",
      "caption": ""
    },
    "r-horn": {
      "short": "Supprimer palonnier de servomoteur",
      "title": "Supprimer palonnier de servomoteur",
      "text": "Dévissez d'abord la vis de fixation d'origine au centre du palonnier de servomoteur, puis retirez le palonnier de servomoteur noir dans le sens de l'arbre de sortie.",
      "check": "Mettez de côté le palonnier de servomoteur et les vis d'origine ; les étapes ultérieures ne le remplaceront pas par des vis autotaraudeuses.",
      "caption": "Retirez d'abord la vis centrale, puis retirez le palonnier de servomoteur"
    },
    "r-plug": {
      "short": "Branchez le câble",
      "title": "Branchez la ligne servomoteur",
      "text": "Alignez le trou de borne de la fiche avec la saillie de l'interface, insérez-le dans la direction de l'interface, puis appuyez dessus pour le mettre en place.",
      "check": "Vérifiez clairement le sens de la fiche. L'action de branchement est démontrée ici. La définition des broches du fil à trois conducteurs doit encore être vérifiée physiquement.",
      "caption": "Alignez l'interface et appuyez dessus"
    },
    "r-shank": {
      "short": "Veau fixe",
      "title": "Connecteur de jambe fixe",
      "text": "Installez le connecteur blanc du pied inférieur sur le servomoteur, alignez les trous de montage, puis vissez deux vis autotaraudeuses à tête fraisée M2×6.",
      "check": "L'extrémité longue du connecteur pointe vers le haut. Alignez d'abord les trous, puis fixez-les. Aucune vis n'est nécessaire pour mettre les pièces inclinées en place.",
      "caption": "Trou correct · M2×6 ×2"
    },
    "r-foot": {
      "short": "S'insère dans la plante du pied",
      "title": "Installez servomoteur dans la plante du pied",
      "text": "Placez le module composé du servomoteur et du connecteur de mollet dans la plante du pied, et fixez les quatre vis autotaraudeuses à tête fraisée M2×6 comme indiqué dans la vidéo.",
      "check": "Confirmez d'abord l'orientation de la plante des pieds et des articulations, puis fixez les quatre positions. Les câbles restent à l'extérieur.",
      "caption": "Pied fixe · M2×6 ×4"
    },
    "r-small-bearing": {
      "short": "Appuyez sur roulement",
      "title": "Appuyez sur le petit roulement",
      "text": "Alignez le petit roulement avec le trou de montage circulaire sur la plante du pied et appuyez dessus dans le sens axial.",
      "check": "Le roulement doit être assis droit, avec le trou central et le connecteur coaxial. Le numéro de modèle correspond à 10×15×3 mm selon la liste.",
      "caption": "Enfoncer axialement"
    },
    "r-axle": {
      "short": "Installer la tige de cheville",
      "title": "Alignez et installez la tige de cheville",
      "text": "Alignez le trou du milieu, placez l'axe de cheville imprimé au centre du roulement, puis vissez manuellement la vis autotaraudeuse M2.3×8.",
      "check": "L'axe de la cheville utilise la grille 3MF existante ; le positionnement ici a été ajusté pour l'affichage et n'a pas été vérifié pour l'ajustement physique.",
      "caption": "Aligner le centre roulement"
    },
    "r-tighten": {
      "short": "Chèque fixe",
      "title": "Serrez et vérifiez",
      "text": "Vissez la vis M2.3×8 axialement jusqu'à ce que la tête de vis repose contre la surface, puis vérifiez la connexion de la cheville.",
      "check": "La vidéo demande que la tête de vis soit bien ajustée et que l'extrémité sorte de l'autre côté. Le prototype démontre uniquement le mouvement et ne simule pas le couple ou les tolérances réels.",
      "caption": "Serrez jusqu'à ce que la tête de vis s'adapte"
    },
    "r-ankle-done": {
      "short": "Visualisation complète",
      "title": "La cheville droite est installée",
      "text": "Vous pouvez alterner l’inspection avant de passer à l’étape suivante. Les semelles sont installées lors de la phase de finition des jambes.",
      "check": "Les coussins sous les pieds ne sont pas encore installés dans cette section ; ils sont installés plus tard dans la vidéo sur les pattes.",
      "caption": ""
    },
    "l-prepare": {
      "short": "Préparer les pièces",
      "title": "Préparer les parties de la cheville gauche",
      "text": "Préparez le ID24 servomoteur numéroté et centré, ainsi que la plante du pied, le mollet, le roulement et la tige de la cheville de ce côté.",
      "check": "La numérotation et le centrage servomoteur doivent être terminés avant l'installation mécanique.",
      "caption": ""
    },
    "l-horn": {
      "short": "Supprimer palonnier de servomoteur",
      "title": "Supprimer palonnier de servomoteur",
      "text": "Dévissez d'abord la vis de fixation d'origine au centre du palonnier de servomoteur, puis retirez le palonnier de servomoteur noir dans le sens de l'arbre de sortie.",
      "check": "Mettez de côté le palonnier de servomoteur et les vis d'origine ; les étapes ultérieures ne le remplaceront pas par des vis autotaraudeuses.",
      "caption": "Retirez d'abord la vis centrale, puis retirez le palonnier de servomoteur"
    },
    "l-plug": {
      "short": "Branchez le câble",
      "title": "Branchez la ligne servomoteur",
      "text": "Alignez le trou de borne de la fiche avec la saillie de l'interface, insérez-le dans la direction de l'interface, puis appuyez dessus pour le mettre en place.",
      "check": "Vérifiez clairement le sens de la fiche. L'action de branchement est démontrée ici. La définition des broches du fil à trois conducteurs doit encore être vérifiée physiquement.",
      "caption": "Alignez l'interface et appuyez dessus"
    },
    "l-shank": {
      "short": "Veau fixe",
      "title": "Connecteur de jambe fixe",
      "text": "Installez le connecteur blanc du pied inférieur sur le servomoteur, alignez les trous de montage, puis vissez deux vis autotaraudeuses à tête fraisée M2×6.",
      "check": "L'extrémité longue du connecteur pointe vers le haut. Alignez d'abord les trous, puis fixez-les. Aucune vis n'est nécessaire pour mettre les pièces inclinées en place.",
      "caption": "Trou correct · M2×6 ×2"
    },
    "l-foot": {
      "short": "S'insère dans la plante du pied",
      "title": "Installez servomoteur dans la plante du pied",
      "text": "Placez le module composé du servomoteur et du connecteur de mollet dans la plante du pied, et fixez les quatre vis autotaraudeuses à tête fraisée M2×6 comme indiqué dans la vidéo.",
      "check": "Confirmez d'abord l'orientation de la plante des pieds et des articulations, puis fixez les quatre positions. Les câbles restent à l'extérieur.",
      "caption": "Pied fixe · M2×6 ×4"
    },
    "l-small-bearing": {
      "short": "Appuyez sur roulement",
      "title": "Appuyez sur le petit roulement",
      "text": "Alignez le petit roulement avec le trou de montage circulaire sur la plante du pied et appuyez dessus dans le sens axial.",
      "check": "Le roulement doit être assis droit, avec le trou central et le connecteur coaxial. Le numéro de modèle correspond à 10×15×3 mm selon la liste.",
      "caption": "Enfoncer axialement"
    },
    "l-axle": {
      "short": "Installer la tige de cheville",
      "title": "Alignez et installez la tige de cheville",
      "text": "Alignez le trou du milieu, placez l'axe de cheville imprimé au centre du roulement, puis vissez manuellement la vis autotaraudeuse M2.3×8.",
      "check": "L'axe de la cheville utilise la grille 3MF existante ; le positionnement ici a été ajusté pour l'affichage et n'a pas été vérifié pour l'ajustement physique.",
      "caption": "Aligner le centre roulement"
    },
    "l-tighten": {
      "short": "Chèque fixe",
      "title": "Serrez et vérifiez",
      "text": "Vissez la vis M2.3×8 axialement jusqu'à ce que la tête de vis repose contre la surface, puis vérifiez la connexion de la cheville.",
      "check": "La vidéo demande que la tête de vis soit bien ajustée et que l'extrémité sorte de l'autre côté. Le prototype démontre uniquement le mouvement et ne simule pas le couple ou les tolérances réels.",
      "caption": "Serrez jusqu'à ce que la tête de vis s'adapte"
    },
    "l-ankle-done": {
      "short": "Visualisation complète",
      "title": "La cheville gauche est installée",
      "text": "Vous pouvez alterner l’inspection avant de passer à l’étape suivante. Les semelles sont installées lors de la phase de finition des jambes.",
      "check": "Les coussins sous les pieds ne sont pas encore installés dans cette section ; ils sont installés plus tard dans la vidéo sur les pattes.",
      "caption": ""
    },
    "r-pair": {
      "short": "Aligner le double servomoteur",
      "title": "Alignez les deux servomoteur sur la jambe droite",
      "text": "Organisez ID12 / ID13 par vidéo, alignez la paire servomoteur. La gauche et la droite sur l'image sont l'angle de prise de vue, qui n'est pas directement égal à la gauche et à la droite du robot.",
      "check": "Gardez l'autre cheville terminée; vérifiez le côté actuel.",
      "caption": "Vérifiez servomoteur avec la direction"
    },
    "r-support": {
      "short": "Support de cuisse fixe",
      "title": "Support de cuisse fixe à double œillet",
      "text": "Montez le support blanc à double trou rond sur la paire de servomoteur, alignez les quatre positions fixes et vissez les quatre M2×6 comme indiqué dans la vidéo.",
      "check": "Vérifiez trou par trou puis réparez. La position du trou et la coordination de l'installation sont encore des indications de prototype.",
      "caption": "M2×6 ×4 · Support fixe"
    },
    "r-bearing": {
      "short": "Appuyez sur le grand roulement",
      "title": "Appuyez sur le grand roulement qui relie la cheville",
      "text": "Alignez le 16×22×4 mm et le grand roulement avec le trou de support et appuyez dessus dans le sens axial.",
      "check": "roulement doit s'asseoir droit, puis connecter la cheville qui a été installée.",
      "caption": "Appuyez sur le grand roulement dans le sens axial"
    },
    "r-join": {
      "short": "Cheville attachée",
      "title": "Fixez le sous-ensemble de cheville droite",
      "text": "Déplacez la cheville et le mollet terminés dans leur ensemble vers la position roulement du support de cuisse et fixez quatre M2×6.",
      "check": "Il y a déjà des vis, des chevilles et des câbles qui bougent avec le sous-ensemble.",
      "caption": "Alignement global · M2×6 ×4"
    },
    "r-wire-a": {
      "short": "Insérer dans le pied faisceau de câbles",
      "title": "Branchez le bus de jambe visible",
      "text": "Branchez et serrez la ligne servomoteur visible à trois broches selon la vidéo, en laissant de la place pour le mouvement des articulations.",
      "check": "L'accouplement et le routage sont démontrés ici ; les connecteurs et brochages exacts à chaque extrémité de chaque câble n'ont pas été vérifiés.",
      "caption": "Fiche faisceau de câbles · Diagramme de point final"
    },
    "r-wire-b": {
      "short": "Organiser la marge faisceau de câbles",
      "title": "Disposez faisceau de câbles et laissez la ligne de connexion supérieure",
      "text": "Disposez le fil en boucle de manière à ce que faisceau de câbles reste à l'extérieur du mécanisme et conservez les extrémités du fil suivantes connectées au corps.",
      "check": "Ne pincez pas le fil et ne jugez pas la définition de la broche en fonction de l'apparence du fil noir à trois conducteurs.",
      "caption": "Laisser de la place pour le mouvement · Pas de serrage du fil"
    },
    "r-leg-done": {
      "short": "Connexion de la jambe droite terminée",
      "title": "Pièce de connexion de la jambe droite terminée",
      "text": "Vérifiez la cheville connectée, le double corset servomoteur et le faisceau de câbles, puis passez à l'étape suivante.",
      "check": "Les connecteurs supérieurs et les coussins sous les pieds ne sont pas encore installés.",
      "caption": ""
    },
    "l-pair": {
      "short": "Aligner le double servomoteur",
      "title": "Alignez les deux servomoteur sur la jambe gauche",
      "text": "Organisez ID23 / ID22 par vidéo, alignez la paire servomoteur. La gauche et la droite sur l'image sont l'angle de prise de vue, qui n'est pas directement égal à la gauche et à la droite du robot.",
      "check": "Gardez l'autre cheville terminée; vérifiez le côté actuel.",
      "caption": "Vérifiez servomoteur avec la direction"
    },
    "l-support": {
      "short": "Support de cuisse fixe",
      "title": "Support de cuisse fixe à double œillet",
      "text": "Montez le support blanc à double trou rond sur la paire de servomoteur, alignez les quatre positions fixes et vissez les quatre M2×6 comme indiqué dans la vidéo.",
      "check": "Vérifiez trou par trou puis réparez. La position du trou et la coordination de l'installation sont encore des indications de prototype.",
      "caption": "M2×6 ×4 · Support fixe"
    },
    "l-bearing": {
      "short": "Appuyez sur le grand roulement",
      "title": "Appuyez sur le grand roulement qui relie la cheville",
      "text": "Alignez le 16×22×4 mm et le grand roulement avec le trou de support et appuyez dessus dans le sens axial.",
      "check": "roulement doit s'asseoir droit, puis connecter la cheville qui a été installée.",
      "caption": "Appuyez sur le grand roulement dans le sens axial"
    },
    "l-join": {
      "short": "Cheville attachée",
      "title": "Fixez le sous-ensemble de cheville gauche",
      "text": "Déplacez la cheville et le mollet terminés dans leur ensemble vers la position roulement du support de cuisse et fixez quatre M2×6.",
      "check": "Il y a déjà des vis, des chevilles et des câbles qui bougent avec le sous-ensemble.",
      "caption": "Alignement global · M2×6 ×4"
    },
    "l-wire-a": {
      "short": "Insérer dans le pied faisceau de câbles",
      "title": "Branchez le bus de jambe visible",
      "text": "Branchez et serrez la ligne servomoteur visible à trois broches selon la vidéo, en laissant de la place pour le mouvement des articulations.",
      "check": "L'accouplement et le routage sont démontrés ici ; les connecteurs et brochages exacts à chaque extrémité de chaque câble n'ont pas été vérifiés.",
      "caption": "Fiche faisceau de câbles · Diagramme de point final"
    },
    "l-wire-b": {
      "short": "Organiser la marge faisceau de câbles",
      "title": "Disposez faisceau de câbles et laissez la ligne de connexion supérieure",
      "text": "Disposez le fil en boucle de manière à ce que faisceau de câbles reste à l'extérieur du mécanisme et conservez les extrémités du fil suivantes connectées au corps.",
      "check": "Ne pincez pas le fil et ne jugez pas la définition de la broche en fonction de l'apparence du fil noir à trois conducteurs.",
      "caption": "Laisser de la place pour le mouvement · Pas de serrage du fil"
    },
    "l-leg-done": {
      "short": "La jambe gauche est connectée",
      "title": "La partie connexion de la jambe gauche est terminée",
      "text": "Vérifiez la cheville connectée, le double corset servomoteur et le faisceau de câbles, puis passez à l'étape suivante.",
      "check": "Les connecteurs supérieurs et les coussins sous les pieds ne sont pas encore installés.",
      "caption": ""
    },
    "r-top-horn": {
      "short": "Retirer la partie supérieure de la jambe droite palonnier de servomoteur",
      "title": "Retirez le palonnier de servomoteur d'origine sur la jambe supérieure droite",
      "text": "Retirez d'abord la vis de fixation centrale, puis retirez le palonnier de servomoteur et conservez-le à côté.",
      "check": "L'extrémité supérieure est traitée selon la vidéo ici ; ne retirez pas la cheville fixe.",
      "caption": "Retirez d'abord la vis centrale, puis retirez le palonnier de servomoteur"
    },
    "l-top-horn": {
      "short": "Retirer la partie supérieure de la jambe gauche palonnier de servomoteur",
      "title": "Retirez le palonnier de servomoteur d'origine sur la jambe supérieure gauche",
      "text": "Traitez l'autre pied dans le sens du miroir et retirez la vis centrale et le palonnier de servomoteur dans l'ordre.",
      "check": "Les pièces d'origine supprimées restent dans la zone des pièces.",
      "caption": "Conservez les pièces d'origine qui ont été retirées"
    },
    "r-top-bearing": {
      "short": "Presse pour pièce de connexion droite roulement",
      "title": "Appuyez d'abord sur roulement dans le connecteur supérieur droit",
      "text": "Enfoncez le grand roulement dans le connecteur supérieur séparé, puis fixez l'ensemble au pied.",
      "check": "Appuyez d'abord sur roulement, puis installez le connecteur ; n’inversez pas ces deux étapes.",
      "caption": "Appuyez d'abord sur roulement dans le connecteur"
    },
    "r-top-link": {
      "short": "Installer le bon connecteur",
      "title": "Fixez le connecteur supérieur droit avec roulement",
      "text": "Alignez le connecteur qui a été enfoncé dans le roulement sur la position finale supérieure et fixez-le avec quatre M2×6.",
      "check": "Le connecteur se déplace avec le roulement à l'intérieur.",
      "caption": "Installation globale des composants · M2×6 ×4"
    },
    "l-top-bearing": {
      "short": "Presse de pièce de connexion gauche roulement",
      "title": "Appuyez sur roulement dans le connecteur supérieur gauche",
      "text": "Enfoncez le grand roulement dans le connecteur de l'autre côté, en conservant l'orientation du miroir.",
      "check": "Les connecteurs gauche et droit utilisent leurs propres maillages réels.",
      "caption": "Direction du miroir · Appuyez d'abord sur roulement"
    },
    "l-top-link": {
      "short": "Installer le connecteur gauche",
      "title": "Fixez le connecteur supérieur gauche avec roulement",
      "text": "Installez la pièce de connexion de l'autre côté avec roulement et fixez-la avec quatre M2×6.",
      "check": "Vérifiez que les directions des deux côtés sont cohérentes, en laissant une position de connexion pour l'assemblage ultérieur du corps.",
      "caption": "Installation globale des composants · M2×6 ×4"
    },
    "r-sole": {
      "short": "Coussin de semelle fixe du pied droit",
      "title": "Installez le bon coussin de semelle",
      "text": "Installez le coussinet souple sur la plante de votre pied, alignez les quatre trous selon la vidéo et fixez les quatre M2×6.",
      "check": "Il s'agit du coussin unique, et non de la coque de cuisse qui vient plus tard lors de la phase d'assemblage final.",
      "caption": "Alignez la plante de vos pieds · M2×6 ×4"
    },
    "l-sole": {
      "short": "Coussin de semelle gauche fixe",
      "title": "Installer le coussin de la semelle du pied gauche",
      "text": "Installez un coussinet souple sous l'autre pied et fixez quatre M2×6 comme indiqué dans la vidéo.",
      "check": "Vérifiez l'état de la plante des deux pieds et du faisceau de câbles, puis procédez à l'assemblage du corps et des hanches.",
      "caption": "Alignez la plante de vos pieds · M2×6 ×4"
    },
    "legs-complete": {
      "short": "Vue complète des pieds",
      "title": "Le sous-ensemble à deux pieds est installé",
      "text": "Vous pouvez maintenant faire pivoter pour voir les deux jambes, ou revenir à n'importe quelle étape pour la revoir.",
      "check": "L'étape actuelle est 08:16 ; l'étape suivante consiste à installer les hanches du corps, puis à réaliser l'ensemble tête, cou et commande électronique.",
      "caption": ""
    },
    "t-pair": {
      "short": "Organiser le double servomoteur",
      "title": "Disposer les numéros ID20 et ID10",
      "text": "Disposez deux servomoteur centrés selon la perspective du bureau du film original : ID20 sur le côté gauche de l'écran et ID10 sur le côté droit. Gardez-les palonnier de servomoteur d'origine.",
      "check": "La gauche et la droite de l’écran ne correspondent pas directement à la gauche et à la droite du robot. La grille est placée selon les coordonnées existantes de l'ensemble de la machine et la coordination de l'installation est en attente de vérification physique.",
      "caption": "Écran gauche 20 · Écran droit 10"
    },
    "t-support": {
      "short": "support de hanche fixe",
      "title": "Fixez le support de hanche à double trou rond avec six vis",
      "text": "Placez le support de hanche à double trou rond P6-09 sur les deux servomoteur, alignez-le et fixez les six vis autotaraudeuses à tête fraisée M2×6.",
      "check": "Gardez les deux trous du bas au milieu comme mentionné dans la vidéo et n'ajoutez pas de vis à ces deux trous. Les points d'ancrage de vis animés sont des représentations de groupes de trous.",
      "caption": "M2×6 ×6 · Laissez les deux trous du milieu en bas vides"
    },
    "t-wire": {
      "short": "Branchement et câblage",
      "title": "faisceau de câbles est visible au niveau de la hanche insérée et ressort",
      "text": "Appuyez sur la pièce d'origine pour serrer les bouchons visibles sur les deux corps servomoteur, en laissant de côté les fils de connexion ultérieurs du moteur de hanche et les fils réservés à la carte mère. Le fil réservé sort de l’ouverture.",
      "check": "La double prise se positionne comme un modèle pédagogique simple en fonction des caractéristiques de la surface de la grille source. Le chemin faisceau de câbles, l'identité du socket et les broches n'ont pas été vérifiés, et les deux corps servomoteur ne sont pas dessinés comme interconnectés sans autorisation.",
      "caption": "Branchez-le axialement d'abord, puis enfilez les fils, schéma de câblage"
    },
    "t-backplate-front": {
      "short": "Installer le panneau arrière de la carrosserie",
      "title": "Monter le panneau arrière du corps et fixer les deux vis sur la façade",
      "text": "Alignez le panneau arrière de la carrosserie P4-03 avec l'ensemble de hanche, fixez d'abord les deux M2×6 visibles sur le devant de la pièce d'origine.",
      "check": "Le panneau arrière et le faisceau de câbles doivent d'abord être assemblés puis serrés, sans sceller le fil dans la couture. Les positions des trous sont toujours à des fins pédagogiques.",
      "caption": "Avant M2×6 ×2"
    },
    "t-backplate-back": {
      "short": "dos fixe",
      "title": "Fixez les deux vis à l'arrière du panneau arrière",
      "text": "Continuez à travailler sur le dos et fixez les deux autres M2×6. Les deux pièces à l'avant et les deux pièces à l'arrière du panneau arrière sont présentées séparément.",
      "check": "Cette étape en ajoute deux nouveaux et ne compte plus le groupe précédent.",
      "caption": "Retour M2×6 ×2"
    },
    "t-yaw-r": {
      "short": "Installez le bon connecteur",
      "title": "Appuyez d'abord sur roulement, puis installez le bon connecteur Yaw–Roll",
      "text": "Enfoncez d'abord le grand roulement dans le connecteur indépendant P6-06, puis alignez l'ensemble du connecteur avec roulement sur le côté droit du corps. Enfin, le groupe de trous de fixation est démontré.",
      "check": "Film original 09:41 Vous pouvez voir roulement dans le connecteur. 10 : les sous-titres de 05 sont quatre M2×6, mais les attributions de numéros et de groupes de trous de chaque côté doivent encore être vérifiées ; les vis animées sont uniquement indiquées.",
      "caption": "Appuyez d'abord sur roulement → Alignement global · Diagramme des groupes de trous"
    },
    "t-yaw-l": {
      "short": "Installez le connecteur gauche",
      "title": "Installez le côté gauche roulement et le connecteur dans le sens du miroir.",
      "text": "Enfoncez d'abord l'autre grand roulement dans le connecteur indépendant P6-07, puis déplacez ce composant vers le côté gauche du corps pour le fixer.",
      "check": "Le film original 09:57 peut être vu comme roulement. Les parties gauche et droite utilisent leurs propres grilles réelles ; le nombre de vis et la position précise des trous de chaque côté doivent être vérifiés.",
      "caption": "Direction du miroir · Appuyez d'abord sur roulement, puis installez le connecteur"
    },
    "t-roll-pair": {
      "short": "Prenez la hanche servomoteur",
      "title": "Retirez les deux hanches ID21 et ID11 et servomoteur",
      "text": "L'angle de vision du film original sur le bureau est ID21 à gauche et ID11 à droite. Les deux servomoteur sont d'abord placés en position de préparation indépendante, et ils n'ont pas encore été chargés dans le corps.",
      "check": "Vérifiez le numéro et l'état de centrage, et préparez-vous à retirer le palonnier de servomoteur d'origine.",
      "caption": "Écran gauche 21 · Écran droit 11"
    },
    "t-roll-horns": {
      "short": "Centre de déchargement palonnier de servomoteur",
      "title": "Retirez d'abord la vis centrale, puis retirez les deux palonnier de servomoteur d'origine",
      "text": "Retirez les vis de fixation centrales d'origine dans l'ordre, puis retirez le palonnier de servomoteur dans le sens axial. Les petites pièces retirées sont conservées dans la zone des pièces à côté.",
      "check": "Les spécifications des vis centrales d'origine n'ont pas été vérifiées et elles ne sont pas comptées comme vis autotaraudeuses M2×6.",
      "caption": "Retirez d'abord la vis centrale → puis retirez palonnier de servomoteur"
    },
    "t-motor-r": {
      "short": "Installer le moteur de la hanche droite",
      "title": "Après le câblage, installez la hanche ID11 côté droit servomoteur",
      "text": "Selon la pièce originale, connectez d'abord le fil réservé sur le corps, puis connectez l'extrémité libre du fil existant sur la jambe droite complète. Une fois deux insertions terminées, placez le ID11 dans le connecteur droit et fixez enfin les deux M2×6.",
      "check": "Les extrémités des fils et les broches sont fournies à titre d'illustration uniquement, et la polarité ou les branches du bus ne peuvent pas être déterminées en fonction de l'apparence du fil noir à trois conducteurs. Préserver la marge de mouvement articulaire.",
      "caption": "Câbler en premier → Alignement · M2×6 ×2"
    },
    "t-cover-r": {
      "short": "Installez le capot droit",
      "title": "Fixez le couvercle droit du Roll servomoteur avec quatre vis",
      "text": "Installez la plaque de recouvrement P6-02 sur la hanche droite, assurez-vous que le faisceau de câbles n'est pas coincé dans la plaque de recouvrement, puis fixez les quatre pièces M2×6.",
      "check": "Une fois le couvercle fixé, appuyez sur roulement sur le connecteur supérieur du pied complet indépendant ; la jambe entière n'est pas encore connectée.",
      "caption": "Alignez le couvercle · M2×6 ×4"
    },
    "t-bearing-r": {
      "short": "Appuyez sur le grand roulement droit",
      "title": "Avant de fixer les pieds, appuyez sur la bonne taille d'interface roulement",
      "text": "Appuyez sur l'écran après 11:18, appuyez axialement sur le nouveau grand 16×22×4 mm roulement dans le connecteur supérieur de la jambe droite indépendante, puis préparez-vous à vous connecter au corps.",
      "check": "Il ne s'agit pas de l'extrémité supérieure roulement déjà installée dans le module de jambe. Cette étape appuie uniquement sur le nouveau roulement, et la jambe droite est toujours en position prête ; la coopération coaxiale est un signal.",
      "caption": "Appuyez d'abord sur roulement · La jambe intacte ne bougera pas pour le moment."
    },
    "t-join-r": {
      "short": "Accéder à la jambe droite",
      "title": "Fixez le sous-ensemble complet de jambe droite au corps",
      "text": "Déplacez le pied droit installé dans son ensemble vers la position de connexion du corps, alignez-le et fixez les quatre M2×6. Les vis sur les pieds, roulement et faisceau de câbles se déplacent ensemble.",
      "check": "Déplacez uniquement cette jambe. L'autre jambe reste en position de préparation ; la position des trous et les tolérances d’assemblage doivent encore être vérifiées physiquement.",
      "caption": "Intégration complète de la jambe droite · M2×6 ×4"
    },
    "t-motor-l": {
      "short": "Installer le moteur de la hanche gauche",
      "title": "Après le câblage, installez l'autre côté ID21 hanche servomoteur",
      "text": "Selon la direction du miroir, connectez d'abord la ligne réservée sur le corps, puis connectez l'extrémité libre de la ligne existante sur toute la jambe gauche. Une fois les deux insertions terminées, installez le ID21 dans le connecteur et fixez les deux M2×6.",
      "check": "La jambe droite finie reste connectée. Les chemins et points d'extrémité faisceau de câbles continuent d'être marqués comme schématiques et aucune broche électrique n'est déduite.",
      "caption": "Câbler en premier → Alignement · M2×6 ×2"
    },
    "t-cover-l": {
      "short": "Installez le capot gauche",
      "title": "Fixez le couvercle Roll servomoteur de l’autre côté",
      "text": "Installez la plaque de recouvrement P6-03 sur la hanche gauche, vérifiez que la faisceau de câbles évite les coutures, puis fixez quatre pièces M2×6.",
      "check": "La jambe gauche est toujours en position de préparation indépendante. L'étape suivante consiste à installer le nouveau roulement sur son connecteur supérieur.",
      "caption": "Alignez le couvercle · M2×6 ×4"
    },
    "t-bearing-l": {
      "short": "Appuyez en grand à gauche roulement",
      "title": "Avant d'insérer la deuxième jambe, appuyez sur roulement",
      "text": "Appuyez sur 12:28 sur l'écran, appuyez sur l'autre nouveau grand roulement dans le connecteur supérieur de la jambe gauche indépendante, puis connectez la deuxième jambe complète.",
      "check": "La jambe droite a été installée ; la jambe gauche n'a pas encore bougé. La posture roulement et la surface de contact sont illustrées à l’aide du modèle existant.",
      "caption": "Appuyez d'abord sur roulement · La jambe gauche est toujours en position prête"
    },
    "t-join-l": {
      "short": "Accès à la jambe gauche",
      "title": "Fixez le deuxième pied complet et fixez-le",
      "text": "Déplacez le sous-ensemble de jambe gauche vers la position de connexion de carrosserie dans son ensemble, vérifiez l'alignement puis fixez quatre M2×6.",
      "check": "Toutes les pièces installées sur la jambe gauche se déplacent avec faisceau de câbles ; la jambe droite reste immobile.",
      "caption": "Intégration complète de la jambe gauche · M2×6 ×4"
    },
    "t-complete": {
      "short": "Vérifier les jambes",
      "title": "Vérifiez la connexion entre le corps et les jambes",
      "text": "Le corps, les hanches servomoteur et les deux jambes sont déjà connectés dans le prototype. Faites pivoter pour voir l'orientation des deux côtés, de la plaque de recouvrement et de la réservation faisceau de câbles.",
      "check": "Seul l'état de l'animation est vérifié ici. Les positions des trous, les tolérances, les extrémités des fils et la portance physique n'ont pas encore été acceptées, et la prochaine étape se poursuivra avec la tête et le col et l'assemblage final.",
      "caption": ""
    },
    "head-yaw-motor": {
      "short": "D'abord roulement puis servomoteur",
      "title": "Appuyez d'abord sur roulement, puis fixez ID32 et le premier support.",
      "text": "Selon la pièce originale, appuyez d'abord sur un roulement dans le premier support blanc, puis insérez le ID32 numéroté et centré, puis fixez quatre M2×6 après le montage. Le premier support utilise P6-01.",
      "check": "roulement est schématiquement installé le long de l'axe du cylindre de grille source ; la surface d'appui axiale et les tolérances d'ajustement physique doivent encore être vérifiées.",
      "caption": "Appuyez d'abord sur roulement, puis installez et réparez M2×6 ×4."
    },
    "head-yaw-wire": {
      "short": "Cordon pivotant enfichable",
      "title": "Branchez la ligne servomoteur sur ID32",
      "text": "Alignez la direction de l'interface visible et appuyez sur la fiche pour la mettre en place ; conservez le segment de ligne suivant autour du support.",
      "check": "Le chemin faisceau de câbles et l'identité du socket sont destinés à des fins pédagogiques, et les broches et la polarité doivent être vérifiées.",
      "caption": "Appuyer en place · Indication du point final"
    },
    "head-bearings": {
      "short": "Appuyez d'abord sur roulement",
      "title": "Appuyez d'abord sur roulement sur le support indépendant",
      "text": "Prenez le deuxième support blanc à trou ouvert P6-08, appuyez sur roulement dans les deux positions roulement du support indépendant selon la pièce d'origine, puis assemblez ID33.",
      "check": "Le premier roulement a été installé sur le premier support ; voici les deux autres sur la deuxième tranche. La position axiale suit la grille source et l'ajustement physique doit être vérifié.",
      "caption": "Deuxième support · Appuyez successivement sur deux roulement"
    },
    "head-roll-motor": {
      "short": "Charger le deuxième servomoteur",
      "title": "Installez ID33 dans le support préparé",
      "text": "D'après la vidéo, prenez ID33, alignez-le avec le support qui a appuyé sur roulement, et fixez d'abord les quatre M2×6 marqués dans la première partie de l'écran.",
      "check": "Les sous-ensembles ID32 et faisceau de câbles sont conservés ; le jeu final de trous pour les deux emplacements de fixation reste à vérifier.",
      "caption": "La première fixation · M2×6 ×4"
    },
    "head-core-join": {
      "short": "Module de rotation combiné",
      "title": "Connectez les sous-composants des deux têtes servomoteur",
      "text": "Maintenez le sous-ensemble ID32 en place, connectez le sous-ensemble de support ID33 qui a installé roulement dans son ensemble, puis appuyez sur la deuxième marque sur l'écran pour le fixer avec quatre M2×6.",
      "check": "P6-08 et ses deux roulement se déplacent avec le sous-ensemble ID33 ; P6-01 et le premier roulement restent du côté des ID32. L'axe du trou provient de la grille source et l'ajustement physique doit être vérifié.",
      "caption": "Accostage global et refixation des sous-ensembles M2×6 ×4"
    },
    "head-core-horn-wire": {
      "short": "Désinstaller et connecter",
      "title": "Retirez la sortie tête palonnier de servomoteur et câblez-la",
      "text": "Dévissez d'abord la vis de fixation centrale d'origine, puis retirez le palonnier de servomoteur et conservez-le à côté ; puis branchez la ligne servomoteur visible.",
      "check": "La vis centrale d'origine n'est pas classée comme autotaraudeuse M2. Les emplacements de l'arbre de sortie et des connecteurs sont toujours indicatifs.",
      "caption": "Retirez d'abord la vis centrale, puis retirez le palonnier de servomoteur"
    },
    "head-platform": {
      "short": "Mettre dans la plate-forme principale",
      "title": "Placez le sous-ensemble rotatif dans son ensemble dans la plate-forme de tête.",
      "text": "Placez le sous-ensemble de rotation de la tête connecté dans la plate-forme de tête P2-02 dans son ensemble. Laissez les fils connectés sortir de l’ouverture.",
      "check": "roulement, les vis installées, faisceau de câbles et le bouchon se déplacent ensemble ; n'appuyez pas sur le fil sous la plate-forme.",
      "caption": "Le sous-ensemble est placé dans son ensemble et les fils sont sortis de l'ouverture."
    },
    "head-mouth-prepare": {
      "short": "Vérifier la bouche servomoteur",
      "title": "Retirez un embout buccal servomoteur et vérifiez le numéro.",
      "text": "Le sous-titre du servomoteur dans le film original est « Numéro 33 », et le logiciel officiel définit la bouche comme ID34 ; ce prototype conserve l'ambiguïté de 33 / 34, et le nombre réel doit être vérifié.",
      "check": "Ne modifiez pas le numéro d'un autre ID33 sur cette base. La géométrie ne sert que de candidat indépendant pour la bouche servomoteur.",
      "caption": "Vidéo 33 / 34 officiel · À vérifier"
    },
    "head-mouth-horn-wire": {
      "short": "Ligne de déchargement bouche servomoteur",
      "title": "Retirez l'embout buccal palonnier de servomoteur et branchez le faisceau de câbles.",
      "text": "Retirez d'abord la vis de fixation centrale, puis retirez la bouche palonnier de servomoteur et conservez-la. Insérez la ligne servomoteur selon la vidéo et appuyez dessus.",
      "check": "L’ambiguïté de la numérotation demeure. Le codage des connecteurs, les prises réelles et le brochage ne sont pas confirmés par cette animation.",
      "caption": "Retirez d'abord le disque, puis branchez faisceau de câbles"
    },
    "head-mouth-jaw": {
      "short": "Installez servomoteur avec le menton",
      "title": "Mettez le servomoteur dans votre bouche et mettez-le sur votre menton",
      "text": "Placez d'abord la partie buccale servomoteur dans la plate-forme, puis alignez les deux côtés du menton P2-01 avec l'arbre d'entraînement et la position de support. Laissez faisceau de câbles rester en dehors de l'ouverture.",
      "check": "Cette animation exprime la relation de séquence ; les trous d'arbre des deux côtés, les écarts réels et la précision de correspondance doivent être vérifiés.",
      "caption": "Mettez servomoteur en premier · Puis insérez-le dans le menton"
    },
    "head-servo-support": {
      "short": "Couvrir la fixation",
      "title": "Installer la pièce de fixation de la tête servomoteur",
      "text": "Mécanisme qui fixe la pièce de fixation de la tête P4-02 servomoteur à la plateforme. Appuyez sur le premier sous-titre pour corriger quatre M2×6.",
      "check": "Gardez votre mâchoire mobile et évitez les faisceau de câbles. Les positions spécifiques des quatre trous sont encore indicatives.",
      "caption": "Le premier groupe de trous · M2×6 ×4"
    },
    "head-platform-fix": {
      "short": "Côté sortie du menton fixe",
      "title": "Quatre trous sur le côté sortie du menton fixe",
      "text": "Selon les instructions des quatre deuxièmes M2×6 sur la pièce originale, fixez-la depuis l'extérieur du côté entraînement du menton. L'axe à quatre trous de la grille source P2-01 est utilisé ici.",
      "check": "Les vis installées s'ouvrent et se ferment ensuite avec le menton. L’axe du trou de grille source peut être vérifié, mais les spécifications physiques et la coordination doivent encore être vérifiées.",
      "caption": "Côté sortie du menton · M2×6 ×4"
    },
    "head-mouth-check": {
      "short": "Vérifier l'ouverture et la fermeture de la bouche",
      "title": "Vérifiez l'ouverture et la fermeture du menton et l'état faisceau de câbles.",
      "text": "Bougez légèrement votre menton pour vérifier s'il peut être ouvert et fermé, s'il est visiblement coincé et si le fil est pincé sur le côté. L'animation montre l'ouverture et la fermeture en même temps.",
      "check": "Ce n'est qu'un signe d'ouverture et de fermeture, et il reviendra en position fermée à la fin ; Si le produit réel est lisse, l'écart et l'angle servomoteur doivent être vérifiés.",
      "caption": "Simuler l'ouverture → la fermeture · Objet réel à vérifier"
    },
    "head-neck-pair": {
      "short": "Connectez le double servomoteur",
      "title": "Disposez ID31 et ID30 et installez la première carte de connexion",
      "text": "La perspective du bureau du film original est ID31 à gauche et ID30 à droite. Fixez d'abord la première plaque de connexion à un servomoteur, puis connectez l'autre pour compléter les trous restants de la plaque de connexion.",
      "check": "La vidéo est d'abord marquée avec des pièces 2, puis avec des pièces 4. Reste à vérifier s’il s’agit d’une quantité cumulée. La source P3-02 ne comporte que quatre trous et l'animation est représentée par quatre trous réels sans créer deux trous supplémentaires.",
      "caption": "Fixez d'abord une extrémité, puis connectez l'autre servomoteur"
    },
    "head-neck-plate": {
      "short": "Installez la deuxième plaque de connexion",
      "title": "Installer une autre plaque de connexion du cou",
      "text": "Installez la carte de connexion candidate P3-03 de l'autre côté et fixez quatre M2×6 comme indiqué dans la vidéo pour former un double sous-ensemble de col servomoteur.",
      "check": "Complétez d'abord les panneaux de connexion des deux côtés, puis connectez tout le cou à la tête.",
      "caption": "Plaque de connexion de l'autre côté · M2×6 ×4"
    },
    "head-neck-join": {
      "short": "Connectez la tête et le cou",
      "title": "Connectez le double manche servomoteur à la tête",
      "text": "Fixez le cou assemblé d'un seul bloc à l'articulation d'inclinaison de la tête. La vidéo source exige que la sortie du câble soit à gauche de l'opérateur.",
      "check": "La gauche de l'opérateur ne correspond pas nécessairement à la gauche du robot. L'orientation, les positions des trous et l'étape d'assemblage associée à P6-01 restent à vérifier.",
      "caption": "Vérifiez la sortie du câble par rapport à la gauche de l'opérateur."
    },
    "head-neck-fix": {
      "short": "Connexion tête et cou fixe",
      "title": "Deux groupes de trous pour la fixation de la connexion tête et cou",
      "text": "Fixez les deux articulations de la tête et du cou dans l'ordre selon la vidéo, et chaque sous-titre est marqué de quatre M2×6.",
      "check": "Les deux groupes tournent en séquence. La position réelle du trou, la direction axiale et la consommation totale doivent être examinées dans le tableau physique trou par trou.",
      "caption": "Fixé à deux endroits · Chaque M2×6 ×4"
    },
    "head-neck-wire": {
      "short": "Câbler et laisser une marge",
      "title": "Branchez le connecteur neck bus et organisez les boucles de fils",
      "text": "Insérez le col du connecteur faisceau de câbles selon l'action visible, puis disposez la boucle métallique pour laisser une marge pour le pas et la rotation. Laissez les extrémités des fils utilisées pour le montage ultérieur à l’extérieur.",
      "check": "Les boucles métalliques et les extrémités sont destinées à des fins pédagogiques ; les deux extrémités de chaque fil, la séquence de connexion en série et les broches électriques doivent être vérifiées.",
      "caption": "Disposez d'abord faisceau de câbles, puis fermez la coque"
    },
    "head-shell": {
      "short": "Ensemble de couvre-chef",
      "title": "Mettez le couvre-chef blanc",
      "text": "Placez le couvre-chef P4-01 sur le mécanisme de tête terminé, en laissant le faisceau de câbles réservé à l'extérieur de l'ouverture.",
      "check": "Héritez du maillage réel existant. La version de la coque, la position d'encliquetage et le jeu sont sujets à vérification.",
      "caption": "Mettez le couvre-chef · Évitez faisceau de câbles"
    },
    "head-shell-fix": {
      "short": "Couvre-tête fixe interne",
      "title": "Fixez le couvre-culasse de l'intérieur",
      "text": "Selon le sous-titre sur 17 : 31, réparez deux M2×6 de l'intérieur.",
      "check": "Les positions des vis sont à des fins pédagogiques. Assurez-vous que le faisceau de câbles n'est pas coincé entre le couvre-chef et la plate-forme.",
      "caption": "Fixation interne · M2×6 ×2"
    },
    "head-eyes": {
      "short": "Installer des cernes pour les yeux",
      "title": "Installer des cernes et des accessoires pour les yeux",
      "text": "Alignez les trous avant du couvre-culasse et installez les contours des yeux P2-06 et les composants oculaires candidats P3-01.",
      "check": "La vidéo ne montre pas clairement les petites pièces internes une à une. Les méthodes de séquence et d’engagement présentées ici sont uniquement à titre de référence.",
      "caption": "Alignez les trous avant · L'identité des petits objets doit être vérifiée"
    },
    "head-lower-tape": {
      "short": "Ruban adhésif double face sur la lèvre inférieure",
      "title": "Tout d'abord, appliquez du ruban adhésif double face sur la surface plane du coussin de menton.",
      "text": "Traitez d'abord le coussinet souple sur le menton selon la pièce originale et collez du ruban adhésif double face sur son fond plat. L'animation conserve des coussins visibles et des films indépendants.",
      "check": "Le film se trouve sur la surface extérieure de la grille. L'épaisseur et la plage de coupe sont pour référence ; l'étape suivante consiste à l'installer dans le menton avec le coussinet souple.",
      "caption": "Appliquez d'abord du ruban adhésif double face sur le coussin de menton."
    },
    "head-lower-pad": {
      "short": "Mentonnière",
      "title": "Mettez d'abord le coussin dans le menton",
      "text": "Selon la pièce originale, placez d'abord l'ensemble du coussin de menton collé dans le menton ouvert et appuyez dessus à plat pour l'ajuster. La grille source utilise P1-01.",
      "check": "Le film et le coussin se déplacent ensemble, et les identités supérieure et inférieure des fichiers source sont conservées comme candidates ; le matériau physique et la solidité de la liaison doivent être vérifiés.",
      "caption": "Appliquez d'abord le coussin de menton"
    },
    "head-upper-tape": {
      "short": "Ruban adhésif double face sur la bouche",
      "title": "Collez ensuite du ruban adhésif double face sur la surface plane du coussinet buccal supérieur.",
      "text": "Traitez ensuite le coussin souple du haut de la bouche, collez du ruban adhésif double face sur sa surface plane exposée, puis appuyez-le sur le haut de la bouche dans son ensemble.",
      "check": "Le film est situé sur la surface extérieure de la grille, et l'épaisseur, le contour et la force de liaison sont toujours à des fins pédagogiques.",
      "caption": "Appliquez ensuite du ruban adhésif double face sur le coussinet supérieur de la bouche."
    },
    "head-upper-pad-check": {
      "short": "Appliquer le tampon pour fermer",
      "title": "Fixez le coussinet buccal et vérifiez l'ajustement de la bouche supérieure et inférieure.",
      "text": "Appuyez sur la pièce originale et fixez le coussinet souple du haut de la bouche avec le film sur le haut de la bouche ; utilisez P1-02 pour la grille source. Vérifiez ensuite si les bouches supérieure et inférieure s'ajustent bien et s'il y a des espaces évidents.",
      "check": "Cette étape ne simule l'ouverture et la fermeture qu'une seule fois et revient à la posture de fermeture du répertoire ; l'ajustement parfait, le mouvement fluide et la marge faisceau de câbles doivent être vérifiés par l'objet réel.",
      "caption": "Simuler la fermeture après le montage · Le produit réel doit être vérifié"
    },
    "final-battery": {
      "short": "Stockage de la batterie",
      "title": "Mettez la batterie et débranchez le cordon d'alimentation",
      "text": "Placez la batterie dans le compartiment à batterie indépendant, faites passer les cordons d'alimentation et les connecteurs rouge et noir à travers l'ouverture, puis installez le compartiment à batterie sur le corps.",
      "check": "La taille de la batterie suit la forme conceptuelle du modèle original, et la taille physique, les positions des touches du connecteur et la polarité n'ont pas encore été vérifiées. La couleur du fil ne représente pas une épingle vérifiée.",
      "caption": "Entrez d'abord dans l'entrepôt · Le cordon d'alimentation sort de l'ouverture"
    },
    "final-tray": {
      "short": "Installer le compartiment à piles",
      "title": "Fixez le compartiment à piles contenant la batterie au corps",
      "text": "Alignez la batterie et le compartiment de la batterie en tant qu'ensemble à l'arrière du corps et fixez-les avec des vis autotaraudeuses à tête fraisée 4 M2×6 et à queue plate, comme indiqué dans la vidéo.",
      "check": "Alignez d'abord, puis réparez, en gardant le cordon d'alimentation hors tension ; la position et la coordination de la vis sont des instructions pédagogiques, et vous devez vérifier l'objet réel trou par trou.",
      "caption": "Les composants sont en place dans leur ensemble · M2×6 ×4"
    },
    "final-body-shells": {
      "short": "Installer la carrosserie",
      "title": "Installer la carrosserie des deux côtés et conserver le câblage supérieur",
      "text": "Alignez et installez les deux carrosseries en laissant la sortie supérieure faisceau de câbles. 19 : 05 Les sous-titres gauche et droit marquent 5 et M2×6 ; cette étape indique uniquement le nombre total de ce groupe.",
      "check": "La distribution côte à côte et trou par trou des puces 5 n'a pas encore été vérifiée. Dans la figure, les trous ronds existants dans la grille source sont utilisés comme candidats à l'enseignement, et la véritable attribution des échelons des trous supérieurs et inférieurs et des trous de couture n'a pas encore été vérifiée ; la conclusion de 5 par côté n'est pas basée sur cela.",
      "caption": "M2×6 ×5 · Candidat au trou source, assigné à vérifier"
    },
    "final-head-join": {
      "short": "Connectez toute la tête et le cou",
      "title": "Fixez l’ensemble de la tête et du cou installés au corps",
      "text": "Déplacez la tête, le col, les vis et le faisceau de câbles terminés dans leur ensemble, laissez d'abord la partie de connexion inférieure du servomoteur être en place, puis appuyez sur les marques 4 et M2×6 marquées des deux côtés de la vidéo pour la fixer.",
      "check": "La tête et le cou doivent bouger dans leur ensemble, pas seulement le crâne. Le nombre total de pièces 4 de chaque côté de ce prototype est de pièces 8 ; la position réelle du trou, l'axe d'installation et la version doivent encore être vérifiés.",
      "caption": "La tête et le cou sont en place dans leur ensemble · M2×6 ×4 des deux côtés"
    },
    "final-board-mate": {
      "short": "Connectez deux cartes",
      "title": "Alignez l'en-tête de broche et branchez UNO Q dans la carte d'extension Luwu",
      "text": "Prenez respectivement les cartes d'extension UNO Q et Luwu, alignez les broches de la carte d'extension avec les embases UNO Q et appuyez dessus dans le sens d'accouplement. Les deux planches sont toujours des objets indépendants.",
      "check": "Le modèle de tableau confirmé est utilisé ; L'alignement des broches 32 et l'espacement de modélisation 12.3mm ont été vérifiés et les emplacements des trous sont estimés à partir de photos. Les deux trous de montage sont mal alignés d'environ 1.27mm, et l'insertion physique, les tolérances et les broches électriques n'ont pas été vérifiées.",
      "caption": "Deux cartes indépendantes · Alignez les en-têtes avec les en-têtes"
    },
    "final-board-mount": {
      "short": "contrôleur fixe",
      "title": "Fixer l'ensemble à deux plaques inséré au corps",
      "text": "En gardant les deux cartes accouplées, déplacez l’ensemble contrôleur vers l’arrière de votre corps. Le film original est marqué 4 et M3×16 ; ce modèle ne démontre l'insertion que dans deux trous quasi coaxiaux, et les deux autres sont réservés à la vérification.",
      "check": "La pièce originale contient des pièces 4 ; les trous 2 de ce modèle sont presque coaxiaux et les trous 2 sont approximativement mal alignés 1.27mm. L’état final du passage à travers les deux plaques n’est pas encore représenté. La forme de la plaque source, la position du trou, l'épaisseur du PCB et le pas de la rangée de broches n'ont pas été étirés ou corrigés ; le maintien du corps et la coordination physique doivent être vérifiés.",
      "caption": "Film original M3×16 ×4 · Démontre les trous 2, et les autres trous 2 doivent être vérifiés"
    },
    "final-power": {
      "short": "Connecter le câble de la batterie",
      "title": "Insérez le connecteur de batterie restant dans le port de batterie de la carte de commande.",
      "text": "Déplacez le connecteur du compartiment de la batterie vers l'interface de la batterie de la carte d'extension, alignez-le avec la clé du connecteur et appuyez dessus pour le mettre en place. Les actions et les chemins sont démontrés ici.",
      "check": "La polarité exacte, la numérotation des broches, la position de la clé du connecteur et la révision de la carte vidéo n'ont pas été vérifiées ; les doubles lignes rouges et noires sur l'image ne constituent pas une base pour le câblage.",
      "caption": "Visez le port de la batterie. La polarité et la position de la clé doivent être vérifiées."
    },
    "final-buses": {
      "short": "Insérer les bus un par un",
      "title": "Branchez les trois bus principaux servomoteur dans la carte d'extension un par un",
      "text": "Alignez et appuyez successivement sur les trois fiches à trois broches. La vidéo confirme qu'il existe trois connexions côté carte mère ; cette étape démontrera les trois connexions séparément.",
      "check": "La topologie, les extrémités réelles et les broches de la dérivation à trois fils ID n'ont pas été clairement tracées. La carte d'extension présente des différences de révision d'interface, et GND, SIGNAL ou la position des broches d'alimentation ne peuvent pas être identifiées en fonction de l'apparence du modèle.",
      "caption": "Trois plug-ins, points de terminaison et broches distincts à vérifier"
    },
    "final-thigh-first": {
      "short": "Coque du premier côté de la cuisse",
      "title": "Installez le premier boîtier de cuisse latéral",
      "text": "Installez la première coque latérale de la cuisse et fixez la marque de sous-titre avec les vis autotaraudeuses à tête plate 2 M2.3×4. Le prototype montre d'abord le côté droit du robot, et le mappage gauche et droit de la vidéo doit être vérifié.",
      "check": "20 : les sous-titres 37 M2.3×4 sont différents des sous-titres officiels BOM M2.3×8 ; les spécifications originales du film sont conservées et ne sont pas directement remplacées ou utilisées pour l'achat. Les emplacements des trous sont sujets à vérification.",
      "caption": "Vidéo M2.3×4 ×2 · Différences par rapport au BOM"
    },
    "final-route": {
      "short": "Organiser faisceau de câbles",
      "title": "Disposer le faisceau de câbles pour laisser de l'espace pour la coque et les joints de l'autre côté",
      "text": "Disposez les boucles faisceau de câbles visibles de manière à ce que le faisceau de câbles évite les joints de pression du boîtier et les zones d'activité communes. Laissez une marge appropriée avant d'installer l'autre côté du boîtier.",
      "check": "Le câblage est une représentation visuelle et le rayon de courbure physique, la longueur du fil et le jeu de mouvement n'ont pas été vérifiés ; cette étape ne nécessite pas de débrancher la fiche connectée de la carte mère.",
      "caption": "Gardez les connecteurs connectés · Organisez les marges"
    },
    "final-thigh-second": {
      "short": "Coque de cuisse de l'autre côté",
      "title": "Installez la coque de cuisse de l'autre côté pour terminer l'assemblage final de cette section.",
      "text": "Installez l'autre coque de cuisse dans le sens du miroir. 20 : les sous-titres de 57 sont également marqués comme 2 et M2.3×4, conservant les différences de spécifications entre le film original et BOM.",
      "check": "Cette section se termine par l'assemblage final de 20:58. Le contrôle, la numérotation et l’étalonnage sont décrits dans les chapitres suivants. Ce module ne vérifie pas la mise sous tension ou la précision mécanique.",
      "caption": "L'autre côté M2.3×4 ×2 · Finition de l'assemblage final"
    },
    "calibration-power": {
      "short": "Démarrage après assemblage",
      "title": "Allumez la machine une fois l’assemblage terminé",
      "text": "Ce paragraphe montre uniquement la séquence d'enseignement. Vérifiez la connexion mécanique et faisceau de câbles, puis appuyez sur la vidéo pour accéder à la page de configuration de votre propre appareil.",
      "check": "Ce prototype ne se connecte pas au matériel ; ce qui suit montre uniquement la séquence d’enseignement.",
      "caption": "Démonstration pédagogique · Pas de contrôle du matériel réel"
    },
    "calibration-start": {
      "short": "Démarrer l'étalonnage",
      "title": "Entrez Calibration et démarrez l'étalonnage",
      "text": "Entrez Calibration sur l'interface réelle de l'appareil, cliquez sur Start calibration et stabilisez le robot.",
      "check": "Les poses terminées sur la page n'indiquent pas que le vrai robot a été calibré.",
      "caption": "Démonstration pédagogique · Pas de contrôle du matériel réel"
    },
    "calibration-servos": {
      "short": "Ajustez 15 ID un par un",
      "title": "Ajustez la position zéro mécanique de tous les servomoteur un par un",
      "text": "Ajustez le curseur ID un par un en fonction de l'interface de l'appareil et appuyez sur Finish lorsque vous avez terminé. Jambe droite 10–14, jambe gauche 20–24, tête, cou et bouche 30–34.",
      "check": "Chaque ID nécessite une vérification des joints physiques ; la liste sur cette page n'est pas un résultat d'étalonnage de l'appareil.",
      "caption": "Démonstration pédagogique · Pas de contrôle du matériel réel"
    },
    "calibration-pose": {
      "short": "Vérifier les articulations du corps",
      "title": "Vérifier le centrage, les articulations et la posture du pied",
      "text": "Continuez à faire des ajustements fins en vous basant sur la photo originale : le corps est centré, les articulations sont alignées et les pieds sont plats jusqu'à ce que le vrai objet puisse tenir fermement.",
      "check": "Le modèle debout de ce prototype est uniquement utilisé pour enseigner l’observation et ne peut remplacer l’inspection de la posture physique.",
      "caption": "Démonstration pédagogique · Pas de contrôle du matériel réel"
    },
    "calibration-exit": {
      "short": "Quitter l'étalonnage",
      "title": "Quitter l'étalonnage après avoir terminé chaque joint",
      "text": "Une fois tous les servomoteur terminés, cliquez sur Exit en fonction de l'image originale, puis quittez la page de configuration.",
      "check": "Confirmez que tous les ID ont été traités avant d'effectuer la vérification d'attitude par défaut.",
      "caption": "Démonstration pédagogique · Pas de contrôle du matériel réel"
    },
    "calibration-default": {
      "short": "Vérifier la pose par défaut",
      "title": "Exécuter Default pose",
      "text": "Exécutez Default pose sur un appareil réel et observez si le corps et les jambes atteignent la posture attendue.",
      "check": "Aucune commande de mouvement n'est envoyée ici et l'équilibre physique n'est pas non plus simulé.",
      "caption": "Démonstration pédagogique · Pas de contrôle du matériel réel"
    },
    "robot-complete": {
      "short": "Vue complète de la machine",
      "title": "Tutoriel complet d'assemblage de la machine",
      "text": "Vous pouvez maintenant faire pivoter pour voir le robot complet ou revenir à n'importe quelle étape pour rejouer. Le film original montre la télécommande et l'entrée piétonne à la fin.",
      "check": "Il s'agit d'un prototype d'enseignement indépendant ; Le câblage réel, la correspondance de la position des trous et l'étalonnage de l'équipement nécessitent toujours une vérification physique.",
      "caption": ""
    }
  },
  "chapters": {
    "prepare": {
      "name": "Préparation et numérotation"
    },
    "right-ankle": {
      "name": "cheville droite"
    },
    "left-ankle": {
      "name": "cheville gauche"
    },
    "right-leg": {
      "name": "Connexion de la jambe droite"
    },
    "left-leg": {
      "name": "connexion jambe gauche"
    },
    "finish": {
      "name": "Finition des pieds"
    },
    "torso-base": {
      "name": "Soutien du corps et des hanches"
    },
    "torso-legs": {
      "name": "Moteurs de hanche et articulations des jambes"
    },
    "head-core": {
      "name": "Rotation de la tête et câblage"
    },
    "head-mouth-neck": {
      "name": "Bouche et double manche servomoteur"
    },
    "head-finish": {
      "name": "Couvre-tête et coussinets buccaux"
    },
    "final-body": {
      "name": "Ensemble corps et tête et cou"
    },
    "final-electronics": {
      "name": "Contrôle électronique et finition du boîtier"
    },
    "calibration": {
      "name": "Calibrage et réalisation"
    }
  },
  "actors": {
    "p_uno": {
      "label": "Arduino UNO Q · Apparence confirmée Lot v2",
      "source": "Modèle photo confirmé · Conversion d'unité uniforme 1000 ; l'estimation des trous de montage et la cartographie électrique n'ont pas été physiquement vérifiées"
    },
    "p_extension": {
      "label": "Carte d'extension Luwu · Apparition confirmée v2",
      "source": "Modèle photo confirmé · Conversion d'unité uniforme 1000 ; l'estimation des trous de montage et la cartographie électrique n'ont pas été physiquement vérifiées"
    },
    "p_battery": {
      "label": "Batterie d'alimentation temporaire · Modèle pédagogique",
      "source": "La taille de la batterie et les connecteurs sont soumis à une vérification physique"
    },
    "p_motor": {
      "label": "servomoteur unique à configurer",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "p_powerCable": {
      "label": "Testez le cordon d'alimentation de la batterie",
      "source": "Le câblage et la polarité sont uniquement à des fins pédagogiques."
    },
    "p_servoCable": {
      "label": "Ligne de test servomoteur unique",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "p_usb": {
      "label": "Câble de connexion Type-C · modèle pédagogique simple",
      "source": "Montre uniquement le sens de connexion de l'ordinateur"
    },
    "motor": {
      "label": "Droiteservomoteur · ID14",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement.",
      "chip": "servomoteur"
    },
    "foot": {
      "label": "Pied droit · P2-03",
      "source": "Véritable grille 3MF",
      "chip": "pied"
    },
    "shank": {
      "label": "Mollet droit · P6-04",
      "source": "Véritable grille 3MF",
      "chip": "veau"
    },
    "bearing": {
      "label": "Droit petit roulement · 10×15×3",
      "source": "Grille auxiliaire existante",
      "chip": "Petitroulement"
    },
    "axle": {
      "label": "Axe de la cheville droite · P2-05",
      "source": "Grille réelle · Diagramme de positionnement",
      "chip": "axe de la cheville"
    },
    "horn": {
      "label": "palonnier de servomoteur supprimé de la droite",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "hornScrew": {
      "label": "Vis d'origine centrale droite palonnier de servomoteur",
      "source": "Consignes pédagogiques ajoutées · Spécifications à vérifier"
    },
    "plug": {
      "label": "Prise droite servomoteur à trois broches",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "wire": {
      "label": "Ligne droite servomoteur à trois cœurs",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "shankScrew0": {
      "label": "Vis de fixation du mollet droit 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×2"
    },
    "shankScrew1": {
      "label": "Vis de fixation du mollet droit 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "footScrew0": {
      "label": "Vis de fixation du pied droit 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "footScrew1": {
      "label": "Vis de fixation du pied droit 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "footScrew2": {
      "label": "Vis de fixation du pied droit 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "footScrew3": {
      "label": "Vis de fixation du pied droit 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "axisScrew": {
      "label": "Vis de fixation de la tige de cheville droite · M2.3×8",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2.3×8"
    },
    "l_motor": {
      "label": "Gaucheservomoteur · ID24",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement.",
      "chip": "servomoteur"
    },
    "l_foot": {
      "label": "Pied gauche · P2-04",
      "source": "Véritable grille 3MF",
      "chip": "pied"
    },
    "l_shank": {
      "label": "Mollet gauche · P6-05",
      "source": "Véritable grille 3MF",
      "chip": "veau"
    },
    "l_bearing": {
      "label": "Zuo Xiaoroulement · 10×15×3",
      "source": "Grille auxiliaire existante",
      "chip": "Petitroulement"
    },
    "l_axle": {
      "label": "Axe de la cheville gauche · P2-07",
      "source": "Grille réelle · Diagramme de positionnement",
      "chip": "axe de la cheville"
    },
    "l_horn": {
      "label": "palonnier de servomoteur supprimé de la gauche",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "l_hornScrew": {
      "label": "Vis d'origine centrale gauche palonnier de servomoteur",
      "source": "Consignes pédagogiques ajoutées · Spécifications à vérifier"
    },
    "l_plug": {
      "label": "Prise gauche servomoteur à trois broches",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "l_wire": {
      "label": "Ligne gauche servomoteur à trois cœurs",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "l_shankScrew0": {
      "label": "Vis de fixation du mollet gauche 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×2"
    },
    "l_shankScrew1": {
      "label": "Vis de fixation du mollet gauche 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "l_footScrew0": {
      "label": "Vis de fixation pied gauche 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_footScrew1": {
      "label": "Vis de fixation pied gauche 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "l_footScrew2": {
      "label": "Vis de fixation pied gauche 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "l_footScrew3": {
      "label": "Vis de fixation pied gauche 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "l_axisScrew": {
      "label": "Vis de fixation de la tige de cheville gauche · M2.3×8",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2.3×8"
    },
    "r_upperMotor": {
      "label": "En haut à droite servomoteur · ID12",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "r_lowerMotor": {
      "label": "Milieu droit servomoteur · ID13",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "r_support": {
      "label": "Appui-cuisse droite · P5-04",
      "source": "Grille réelle 3MF · Coordination à vérifier"
    },
    "r_lowerBearing": {
      "label": "Grand droit roulement · 16×22×4",
      "source": "Grille matérielle existante"
    },
    "r_supportScrew0": {
      "label": "Vis de fixation droite 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew1": {
      "label": "Vis de fixation droite 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew2": {
      "label": "Vis de fixation droite 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew3": {
      "label": "Vis de fixation droite 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew0": {
      "label": "Vis de fixation droite 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew1": {
      "label": "Vis de fixation droite 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew2": {
      "label": "Vis de fixation droite 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew3": {
      "label": "Vis de fixation droite 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_upperHorn": {
      "label": "palonnier de servomoteur d'origine en haut à droite",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "r_upperHornScrew": {
      "label": "Vis centrale d'origine en haut à droite",
      "source": "Modèle pédagogique simple·Spécifications originales à vérifier"
    },
    "r_topLink": {
      "label": "Connecteur supérieur droit · P3-04",
      "source": "Grille réelle 3MF · Coordination à vérifier"
    },
    "r_topBearing": {
      "label": "Connecteur droit grand roulement",
      "source": "Grille matérielle existante"
    },
    "r_topScrew0": {
      "label": "Vis de fixation droite 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew1": {
      "label": "Vis de fixation droite 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew2": {
      "label": "Vis de fixation droite 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew3": {
      "label": "Vis de fixation droite 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_sole": {
      "label": "Coussin de semelle du pied droit · P1-03",
      "source": "Grille réelle 3MF · Coordination à vérifier"
    },
    "r_soleScrew0": {
      "label": "Vis de fixation droite 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew1": {
      "label": "Vis de fixation droite 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew2": {
      "label": "Vis de fixation droite 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew3": {
      "label": "Vis de fixation droite 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "r_legWireA": {
      "label": "Fil à trois conducteurs à l'intérieur de la jambe droite",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées",
      "chip": "Fil à trois conducteurs à l'intérieur de la jambe"
    },
    "r_legWireB": {
      "label": "Ligne réservée à l'extrémité supérieure de la jambe droite",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées",
      "chip": "Ligne réservée à l'extrémité supérieure"
    },
    "l_upperMotor": {
      "label": "En haut à gauche servomoteur · ID22",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "l_lowerMotor": {
      "label": "Milieu gauche servomoteur · ID23",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "l_support": {
      "label": "Appui-cuisse gauche · P5-05",
      "source": "Grille réelle 3MF · Coordination à vérifier"
    },
    "l_lowerBearing": {
      "label": "Zuo Daroulement · 16×22×4",
      "source": "Grille matérielle existante"
    },
    "l_supportScrew0": {
      "label": "Vis de fixation gauche 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew1": {
      "label": "Vis de fixation gauche 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew2": {
      "label": "Vis de fixation gauche 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew3": {
      "label": "Vis de fixation gauche 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew0": {
      "label": "Vis de fixation gauche 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew1": {
      "label": "Vis de fixation gauche 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew2": {
      "label": "Vis de fixation gauche 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew3": {
      "label": "Vis de fixation gauche 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_upperHorn": {
      "label": "palonnier de servomoteur d'origine en haut à gauche",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "l_upperHornScrew": {
      "label": "Vis centrale d'origine sur le côté supérieur gauche",
      "source": "Modèle pédagogique simple·Spécifications originales à vérifier"
    },
    "l_topLink": {
      "label": "Connecteur supérieur gauche · P3-05",
      "source": "Grille réelle 3MF · Coordination à vérifier"
    },
    "l_topBearing": {
      "label": "Connecteur gauche grand roulement",
      "source": "Grille matérielle existante"
    },
    "l_topScrew0": {
      "label": "Vis de fixation gauche 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew1": {
      "label": "Vis de fixation gauche 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew2": {
      "label": "Vis de fixation gauche 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew3": {
      "label": "Vis de fixation gauche 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_sole": {
      "label": "Coussin de semelle du pied gauche · P1-04",
      "source": "Grille réelle 3MF · Coordination à vérifier"
    },
    "l_soleScrew0": {
      "label": "Vis de fixation gauche 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew1": {
      "label": "Vis de fixation gauche 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew2": {
      "label": "Vis de fixation gauche 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew3": {
      "label": "Vis de fixation gauche 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "l_legWireA": {
      "label": "Fil à trois conducteurs à l'intérieur de la jambe gauche",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées",
      "chip": "Fil à trois conducteurs à l'intérieur de la jambe"
    },
    "l_legWireB": {
      "label": "Ligne réservée à l'extrémité supérieure de la jambe gauche",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées",
      "chip": "Ligne réservée à l'extrémité supérieure"
    },
    "t_motor10": {
      "label": "Hanche Yaw servomoteur · ID10",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "t_motor10Horn": {
      "label": "ID10 original palonnier de servomoteur (réservé)",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "t_motor10HornScrew": {
      "label": "Vis centrale d'origine ID10",
      "source": "Modèle pédagogique original à vis centrale·Spécifications à vérifier"
    },
    "t_motor20": {
      "label": "Hanche Yaw servomoteur · ID20",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "t_motor20Horn": {
      "label": "ID20 original palonnier de servomoteur (réservé)",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "t_motor20HornScrew": {
      "label": "Vis centrale d'origine ID20",
      "source": "Modèle pédagogique original à vis centrale·Spécifications à vérifier"
    },
    "t_support": {
      "label": "Hanche Yaw Support · P6-09",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_supportScrew0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_supportScrew1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_supportScrew2": {
      "label": "Vis de fixation 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_supportScrew3": {
      "label": "Vis de fixation 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_supportScrew4": {
      "label": "Vis de fixation 5 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_supportScrew5": {
      "label": "Vis de fixation 6 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_baseWire": {
      "label": "Ligne réservée au corps droit de la carte mère · Indication de fin libre",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "t_baseWireL": {
      "label": "Ligne réservée pour la carte mère du corps gauche · Indication de fin libre",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "t_backplate": {
      "label": "Panneau arrière du corps · P4-03",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_backFrontScrew0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_backFrontScrew1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_backRearScrew0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_backRearScrew1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_yawR": {
      "label": "Connecteur droit Yaw · P6-06",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_yawBearingR": {
      "label": "Droit Yaw Grand connecteur roulement · 16×22×4",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_yawScrewR0": {
      "label": "Schéma des vis de fixation de la pièce de liaison droite · M2×6 · Quantité côte à côte à vérifier",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_yawScrewR1": {
      "label": "Schéma des vis de fixation de la pièce de liaison droite · M2×6 · Quantité côte à côte à vérifier",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_yawScrewR2": {
      "label": "Schéma des vis de fixation de la pièce de liaison droite · M2×6 · Quantité côte à côte à vérifier",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_yawScrewR3": {
      "label": "Schéma des vis de fixation de la pièce de liaison droite · M2×6 · Quantité côte à côte à vérifier",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_motor11": {
      "label": "Hanche droite Roll servomoteur · ID11",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "t_motor11Horn": {
      "label": "ID11 Original palonnier de servomoteur",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "t_motor11HornScrew": {
      "label": "Vis de fixation centrale d'origine ID11",
      "source": "Modèle pédagogique original à vis centrale·Spécifications à vérifier"
    },
    "t_rollWireR": {
      "label": "Ligne réservée du corps droit au moteur de la hanche · Indication du chemin/point final",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "t_motorScrewR0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_motorScrewR1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_coverR": {
      "label": "Couvercle droit Roll servomoteur · P6-02",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_coverScrewR0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_coverScrewR1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_coverScrewR2": {
      "label": "Vis de fixation 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_coverScrewR3": {
      "label": "Vis de fixation 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_legBearingR": {
      "label": "L'interface de la jambe droite est grande roulement · 16×22×4",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_legScrewR0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_legScrewR1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_legScrewR2": {
      "label": "Vis de fixation 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_legScrewR3": {
      "label": "Vis de fixation 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_yawL": {
      "label": "Connecteur gauche Yaw · P6-07",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_yawBearingL": {
      "label": "Gauche Yaw Grand connecteur roulement · 16×22×4",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_yawScrewL0": {
      "label": "Notice de fixation des vis de la pièce de liaison gauche · M2×6 · Quantité par côte à vérifier",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_yawScrewL1": {
      "label": "Notice de fixation des vis de la pièce de liaison gauche · M2×6 · Quantité par côte à vérifier",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_yawScrewL2": {
      "label": "Notice de fixation des vis de la pièce de liaison gauche · M2×6 · Quantité par côte à vérifier",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_yawScrewL3": {
      "label": "Notice de fixation des vis de la pièce de liaison gauche · M2×6 · Quantité par côte à vérifier",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_motor21": {
      "label": "Hanche gauche Roll servomoteur · ID21",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "t_motor21Horn": {
      "label": "ID21 Original palonnier de servomoteur",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "t_motor21HornScrew": {
      "label": "Vis de fixation centrale d'origine ID21",
      "source": "Modèle pédagogique original à vis centrale·Spécifications à vérifier"
    },
    "t_rollWireL": {
      "label": "Ligne réservée du corps gauche au moteur de la hanche · Indication du chemin/point final",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "t_motorScrewL0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_motorScrewL1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_coverL": {
      "label": "Couvercle gauche Roll servomoteur · P6-03",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_coverScrewL0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_coverScrewL1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_coverScrewL2": {
      "label": "Vis de fixation 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_coverScrewL3": {
      "label": "Vis de fixation 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_legBearingL": {
      "label": "L'interface de la jambe gauche est grande roulement · 16×22×4",
      "source": "Grille source réelle·Candidat vidéo correspondant, la position/coordination du trou doit être vérifiée"
    },
    "t_legScrewL0": {
      "label": "Vis de fixation 1 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_legScrewL1": {
      "label": "Vis de fixation 2 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_legScrewL2": {
      "label": "Vis de fixation 3 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "t_legScrewL3": {
      "label": "Vis de fixation 4 · M2×6",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "h_pitchSupport": {
      "label": "Premier support · P6-01",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_motor32": {
      "label": "Rotation de la tête servomoteur · Candidat ID32",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "h_yawScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew2": {
      "label": "M2×6 Vis de fixation 3 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew3": {
      "label": "M2×6 Vis de fixation 4 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_yawSupport": {
      "label": "Deuxième support d'ouverture · P6-08",
      "source": "Grille d'impression réelle·La correspondance et la coordination vidéo sont sujettes à vérification ; le film original est livré avec le deuxième sous-ensemble support/ID33, et la coordination physique est sujette à vérification"
    },
    "h_bearingFront": {
      "label": "Grosse tête roulement ancien candidat · 16×22×4",
      "source": "Grille matérielle existante · ID et l'interface doivent être vérifiées ; selon la pièce d'origine, il est livré avec le deuxième sous-ensemble support/ID33, et la correspondance physique doit être vérifiée"
    },
    "h_bearingBack": {
      "label": "Candidat après roulement avec grosse tête · 16×22×4",
      "source": "Grille matérielle existante · ID et l'interface doivent être vérifiées ; selon la pièce d'origine, il est livré avec le deuxième sous-ensemble support/ID33, et la correspondance physique doit être vérifiée"
    },
    "h_bearingCrown": {
      "label": "Premier support grand roulement · candidat au siège",
      "source": "Réutilisez la grille annulaire complète head_yaw_1 ; le long de l'axe du cylindre source P6-01 x=-0.01, z=40.99, la surface inférieure tombe approximativement sur la surface d'épaulement y=206.24 ; Les candidats à la surface d'assise axiale et la coordination physique doivent être vérifiés"
    },
    "h_motor33": {
      "label": "Tête deuxième servomoteur · candidat ID33",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "h_rollScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew2": {
      "label": "M2×6 Vis de fixation 3 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew3": {
      "label": "M2×6 Vis de fixation 4 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew2": {
      "label": "M2×6 Vis de fixation 3 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew3": {
      "label": "M2×6 Vis de fixation 4 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_platform": {
      "label": "Plateforme de tête · P2-02",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_mouthMotor": {
      "label": "Bouche servomoteur · Vidéo 33 / 34 officiel, en attente de vérification",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "h_jaw": {
      "label": "Menton · P2-01",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_servoSupport": {
      "label": "Tête servomoteur pièce de fixation · P4-02",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_supportScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew2": {
      "label": "M2×6 Vis de fixation 3 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew3": {
      "label": "M2×6 Vis de fixation 4 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew2": {
      "label": "M2×6 Vis de fixation 3 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew3": {
      "label": "M2×6 Vis de fixation 4 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_motor30": {
      "label": "Extrémité inférieure du cou servomoteur · Candidat ID30",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "h_motor31": {
      "label": "Haut du cou servomoteur · Candidat ID31",
      "source": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement."
    },
    "h_neckA": {
      "label": "Plaque de connexion du cou A · candidat P3-02",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_neckAScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "Réparez d’abord le trou 2"
    },
    "h_neckAScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "Réparez d’abord le trou 2"
    },
    "h_neckAScrew2": {
      "label": "M2×6 Vis de fixation 3 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "Réinstaller dans le trou 4"
    },
    "h_neckAScrew3": {
      "label": "M2×6 Vis de fixation 4 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "Réinstaller dans le trou 4"
    },
    "h_neckB": {
      "label": "Plaque de connexion du cou B · candidat P3-03",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_neckBScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew2": {
      "label": "M2×6 Vis de fixation 3 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew3": {
      "label": "M2×6 Vis de fixation 4 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew2": {
      "label": "M2×6 Vis de fixation 3 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew3": {
      "label": "M2×6 Vis de fixation 4 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew4": {
      "label": "M2×6 Vis de fixation 5 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew5": {
      "label": "M2×6 Vis de fixation 6 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew6": {
      "label": "M2×6 Vis de fixation 7 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew7": {
      "label": "M2×6 Vis de fixation 8 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×4"
    },
    "h_shell": {
      "label": "Couvre-chef · P4-01",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_shellScrew0": {
      "label": "M2×6 Vis de fixation 1 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×2"
    },
    "h_shellScrew1": {
      "label": "M2×6 Vis de fixation 2 · Indication de l'emplacement du trou",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
      "chip": "M2×6 ×2"
    },
    "h_eyeShell": {
      "label": "Cernes · Candidat P2-06",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_eyes": {
      "label": "Gadgets oculaires · Candidat P3-01",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_upperPad": {
      "label": "Coussin à lèvres · Candidat P1-02",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_lowerPad": {
      "label": "Coussin buccal inférieur · Candidat P1-01",
      "source": "Grille d'impression réelle · Correspondance vidéo et coordination à vérifier"
    },
    "h_wire32": {
      "label": "Ligne réservée ID32 · Indication du point final",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_wire33": {
      "label": "Ligne réservée ID33 · Indication du point final",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_wireMouth": {
      "label": "Ligne Bouche servomoteur · 33/34 en attente de vérification",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_neckWire": {
      "label": "Boucle de fil de cou · indications des points d'extrémité et de la séquence de connexion en série",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_headLead": {
      "label": "L'extrémité de la ligne de tête et de cou réservée à l'assemblage final·Indication du point final",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_plug32": {
      "label": "Prise ID32 · interface pédagogique",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_plug33": {
      "label": "Prise ID33 · interface pédagogique",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_plugMouth": {
      "label": "Bouchon buccal·Interface pédagogique",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_plugNeck": {
      "label": "Prise du cordon cervical · Interface pédagogique",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "h_coreHorn": {
      "label": "Conservé palonnier de servomoteur d'origine",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "h_coreHornScrew": {
      "label": "Vis de fixation centrale d'origine · Spécifications à vérifier",
      "source": "Modèle pédagogique original à vis centrale · Non classé parmi les vis autotaraudeuses ; selon la pièce d'origine, il est livré avec le deuxième sous-ensemble support/ID33, et l'ajustement physique doit être vérifié"
    },
    "h_mouthHorn": {
      "label": "Conservé palonnier de servomoteur d'origine",
      "source": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier"
    },
    "h_mouthHornScrew": {
      "label": "Vis de fixation centrale d'origine · Spécifications à vérifier",
      "source": "Gabarit pédagogique original pour vis centrale · Non classé parmi les vis autotaraudeuses"
    },
    "h_upperAdhesive": {
      "label": "Ruban adhésif double face · Indication de l'épaisseur et du contour",
      "source": "Instructions pédagogiques pour le ruban adhésif double face · Le matériau, l'épaisseur, le contour et la force de liaison sont sujets à vérification"
    },
    "h_lowerAdhesive": {
      "label": "Ruban adhésif double face · Indication de l'épaisseur et du contour",
      "source": "Instructions pédagogiques pour le ruban adhésif double face · Le matériau, l'épaisseur, le contour et la force de liaison sont sujets à vérification"
    },
    "f_batteryTray": {
      "label": "Compartiment à piles · P5-03",
      "source": "Grille source réelle · Trous de fixation et coordination à vérifier"
    },
    "f_sideR": {
      "label": "Coque droite de carrosserie · P5-06",
      "source": "Grille source réelle · Trous de fixation et coordination à vérifier"
    },
    "f_sideL": {
      "label": "Coque gauche de carrosserie · P5-07",
      "source": "Grille source réelle · Trous de fixation et coordination à vérifier"
    },
    "f_thighR": {
      "label": "Coque cuisse droite · P5-01",
      "source": "Grille source réelle · Trous de fixation et coordination à vérifier"
    },
    "f_thighL": {
      "label": "Coque cuisse gauche · P5-02",
      "source": "Grille source réelle · Trous de fixation et coordination à vérifier"
    },
    "f_battery": {
      "label": "Batterie · Taille réelle à vérifier",
      "source": "Suivez le schéma du concept trunk_base_8 · Mesure non physique"
    },
    "f_trayScrew0": {
      "label": "M2×6 Vis de serrage 1 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_trayScrew1": {
      "label": "M2×6 Vis de serrage 2 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_trayScrew2": {
      "label": "M2×6 Vis de serrage 3 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_trayScrew3": {
      "label": "M2×6 Vis de serrage 4 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_bodyScrew0": {
      "label": "M2×6 Vis de serrage 1 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_bodyScrew1": {
      "label": "M2×6 Vis de serrage 2 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_bodyScrew2": {
      "label": "M2×6 Vis de serrage 3 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_bodyScrew3": {
      "label": "M2×6 Vis de serrage 4 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_bodyScrew4": {
      "label": "M2×6 Vis de serrage 5 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_neckScrewR0": {
      "label": "M2×6 Vis de serrage 1 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_neckScrewR1": {
      "label": "M2×6 Vis de serrage 2 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_neckScrewR2": {
      "label": "M2×6 Vis de serrage 3 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_neckScrewR3": {
      "label": "M2×6 Vis de serrage 4 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_neckScrewL0": {
      "label": "M2×6 Vis de serrage 1 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_neckScrewL1": {
      "label": "M2×6 Vis de serrage 2 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_neckScrewL2": {
      "label": "M2×6 Vis de serrage 3 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_neckScrewL3": {
      "label": "M2×6 Vis de serrage 4 · Candidat au trou de grille source",
      "source": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés."
    },
    "f_boardScrew0": {
      "label": "M3×16 Vis de fixation 1 · Candidate pour trous presque coaxiaux sur deux plaques",
      "source": "Comparaison de la position du trou Source GLB ; Les trous 2 sont presque coaxiaux et les trous 2 sont approximativement mal alignés sur 1.27mm ; les trous ne sont pas modifiés ou l'ajustement physique est présumé"
    },
    "f_boardScrew1": {
      "label": "M3×16 Vis de fixation 2 · Candidate pour trous presque coaxiaux sur deux plaques",
      "source": "Comparaison de la position du trou Source GLB ; Les trous 2 sont presque coaxiaux et les trous 2 sont approximativement mal alignés sur 1.27mm ; les trous ne sont pas modifiés ou l'ajustement physique est présumé"
    },
    "f_boardScrew2": {
      "label": "M3×16 Vis de fixation 3 · Emplacement des trous à vérifier",
      "source": "Comparaison de la position du trou Source GLB ; Les trous 2 sont presque coaxiaux et les trous 2 sont approximativement mal alignés sur 1.27mm ; les trous ne sont pas modifiés ou l'ajustement physique est présumé"
    },
    "f_boardScrew3": {
      "label": "M3×16 Vis de fixation 4 · Emplacement des trous à vérifier",
      "source": "Comparaison de la position du trou Source GLB ; Les trous 2 sont presque coaxiaux et les trous 2 sont approximativement mal alignés sur 1.27mm ; les trous ne sont pas modifiés ou l'ajustement physique est présumé"
    },
    "f_thighScrewR0": {
      "label": "M2.3×4 Vis de serrage 1 · Candidat au trou de grille source",
      "source": "Source P5-01 Raccord à trou rond geometry.bin · L'objet réel et l'utilisation spécifique du trou doivent être vérifiés"
    },
    "f_thighScrewR1": {
      "label": "M2.3×4 Vis de serrage 2 · Candidat au trou de grille source",
      "source": "Source P5-01 Raccord à trou rond geometry.bin · L'objet réel et l'utilisation spécifique du trou doivent être vérifiés"
    },
    "f_thighScrewL0": {
      "label": "M2.3×4 Vis de serrage 1 · Candidat au trou de grille source",
      "source": "Source P5-02 Raccord à trou rond geometry.bin · L'objet réel et l'utilisation spécifique du trou doivent être vérifiés"
    },
    "f_thighScrewL1": {
      "label": "M2.3×4 Vis de serrage 2 · Candidat au trou de grille source",
      "source": "Source P5-02 Raccord à trou rond geometry.bin · L'objet réel et l'utilisation spécifique du trou doivent être vérifiés"
    },
    "f_uno": {
      "label": "Arduino UNO Q · Apparence confirmée Lot v2",
      "source": "Modèle photo confirmé · Conversion d'unité uniforme 1000 ; l'estimation des trous de montage et la cartographie électrique n'ont pas été physiquement vérifiées"
    },
    "f_extension": {
      "label": "Carte d'extension Luwu · Apparition confirmée v2",
      "source": "Modèle photo confirmé · Conversion d'unité uniforme 1000 ; l'estimation des trous de montage et la cartographie électrique n'ont pas été physiquement vérifiées"
    },
    "f_powerCable": {
      "label": "Cordon d'alimentation bipolaire de la batterie · Polarité à vérifier",
      "source": "Des lignes rouges et noires sont visibles dans le film original. Le chemin, la longueur de la ligne, la polarité et le connecteur réel n'ont pas été vérifiés."
    },
    "f_powerPlug": {
      "label": "Connecteur batterie · Position de la clé et polarité à vérifier",
      "source": "Modèle simple du didacticiel · Aucune définition de broches électriques vérifiée"
    },
    "f_bus0": {
      "label": "Bus principal à trois broches 1 · Schéma de dérivation correspondant",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "f_busPlug0": {
      "label": "Connecteur de bus principal 1 · Position de la clé à vérifier",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "f_bus1": {
      "label": "Bus principal à trois broches 2 · Schéma de dérivation correspondant",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "f_busPlug1": {
      "label": "Connecteur de bus principal 2 · Position de la clé à vérifier",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "f_bus2": {
      "label": "Bus principal à trois broches 3 · Schéma de dérivation correspondant",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    },
    "f_busPlug2": {
      "label": "Connecteur de bus principal 3 · Position de la clé à vérifier",
      "source": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées"
    }
  },
  "ui": {
    "先认清这几件": "Commençons par identifier ces choses",
    "准备零件": "Préparer les pièces",
    "这一段组装一只脚踝。先准备已编号、已居中的舵机，以及脚掌、小腿连接件、轴承和踝轴。": "Cette section assemble une cheville. Préparez d'abord le servomoteur numéroté et centré, ainsi que la plante du pied, le connecteur du mollet, le roulement et la tige de la cheville.",
    "舵机编号和居中应在机械安装前完成。": "La numérotation et le centrage servomoteur doivent être terminés avant l'installation mécanique.",
    "拆下舵盘": "Supprimer palonnier de servomoteur",
    "先拧出舵盘中央的原装固定螺丝，再沿输出轴方向取下黑色舵盘。": "Dévissez d'abord la vis de fixation d'origine au centre du palonnier de servomoteur, puis retirez le palonnier de servomoteur noir dans le sens de l'arbre de sortie.",
    "把舵盘和原装螺丝放在一旁，后面的步骤不会用自攻螺丝替代它。": "Mettez de côté le palonnier de servomoteur et les vis d'origine ; les étapes ultérieures ne le remplaceront pas par des vis autotaraudeuses.",
    "插好舵机线": "Branchez la ligne servomoteur",
    "插入线缆": "Branchez le câble",
    "将插头的端子孔对准接口凸起，沿接口方向插入，再按压到位。": "Alignez le trou de borne de la fiche avec la saillie de l'interface, insérez-le dans la direction de l'interface, puis appuyez dessus pour le mettre en place.",
    "看清插头方向。这里演示插接动作，三芯线的针脚定义仍需实物核对。": "Vérifiez clairement le sens de la fiche. L'action de branchement est démontrée ici. La définition des broches du fil à trois conducteurs doit encore être vérifiée physiquement.",
    "固定小腿连接件": "Connecteur de jambe fixe",
    "固定小腿": "Veau fixe",
    "将白色小腿连接件贴合舵机，对齐安装孔，再拧入两颗 M2×6 沉头自攻螺丝。": "Installez le connecteur blanc du pied inférieur sur le servomoteur, alignez les trous de montage, puis vissez deux vis autotaraudeuses à tête fraisée M2×6.",
    "连接件的长端朝上。先对孔，再固定，不用螺丝把歪斜的零件硬拉到位。": "L'extrémité longue du connecteur pointe vers le haut. Alignez d'abord les trous, puis fixez-les. Aucune vis n'est nécessaire pour mettre les pièces inclinées en place.",
    "把舵机装入脚掌": "Installez servomoteur dans la plante du pied",
    "装入脚掌": "S'insère dans la plante du pied",
    "把舵机和小腿连接件组成的模块放入脚掌，按视频固定四颗 M2×6 沉头自攻螺丝。": "Placez le module composé du servomoteur et du connecteur de mollet dans la plante du pied, et fixez les quatre vis autotaraudeuses à tête fraisée M2×6 comme indiqué dans la vidéo.",
    "先确认脚掌与关节朝向，再固定四个位置。线缆留在外侧。": "Confirmez d'abord l'orientation de la plante des pieds et des articulations, puis fixez les quatre positions. Les câbles restent à l'extérieur.",
    "压入小轴承": "Appuyez sur le petit roulement",
    "压入轴承": "Appuyez sur roulement",
    "将小轴承对准脚掌的圆形安装孔，沿轴向压入。": "Alignez le petit roulement avec le trou de montage circulaire sur la plante du pied et appuyez dessus dans le sens axial.",
    "轴承要坐正，中心孔与连接件同轴。型号按清单对应 10×15×3 mm。": "Le roulement doit être assis droit, avec le trou central et le connecteur coaxial. Le numéro de modèle correspond à 10×15×3 mm selon la liste.",
    "对齐并装入踝轴": "Alignez et installez la tige de cheville",
    "装入踝轴": "Installer la tige de cheville",
    "对齐中间圆孔，将打印的踝轴放到轴承中心，再把 M2.3×8 自攻螺丝手动旋入。": "Alignez le trou du milieu, placez l'axe de cheville imprimé au centre du roulement, puis vissez manuellement la vis autotaraudeuse M2.3×8.",
    "踝轴用了现有 3MF 网格；这里的定位经过展示调整，还没有验证实物配合。": "L'axe de la cheville utilise la grille 3MF existante ; le positionnement ici a été ajusté pour l'affichage et n'a pas été vérifié pour l'ajustement physique.",
    "拧紧并检查": "Serrez et vérifiez",
    "固定检查": "Chèque fixe",
    "沿轴向拧入 M2.3×8 螺丝，直到螺丝头贴合表面，再检查脚踝连接。": "Vissez la vis M2.3×8 axialement jusqu'à ce que la tête de vis repose contre la surface, puis vérifiez la connexion de la cheville.",
    "视频要求螺丝头贴合、末端从另一侧伸出。原型只展示动作，不模拟实际扭矩或公差。": "La vidéo demande que la tête de vis soit bien ajustée et que l'extrémité sorte de l'autre côté. Le prototype démontre uniquement le mouvement et ne simule pas le couple ou les tolérances réels.",
    "这一只脚踝装好了": "Cette cheville est installée",
    "完成查看": "Visualisation complète",
    "现在可以转到背面看连接位置，或回到任意步骤重看。另一只脚踝按视频做镜像装配。": "Vous pouvez maintenant vous tourner vers l'arrière pour voir où se trouvent les connexions, ou revenir à n'importe quelle étape pour les examiner. Réalisez le montage miroir de l'autre cheville comme indiqué dans la vidéo.",
    "这段尚未安装脚底软垫；视频在后面的双腿阶段才安装。": "Les coussins sous les pieds ne sont pas encore installés dans cette section ; ils sont installés plus tard dans la vidéo sur les pattes.",
    "舵机 · 视频 ID14": "servomoteur · Vidéo ID14",
    "现有辅助网格": "Grille auxiliaire existante",
    "脚掌 · P2-03": "Plante du pied · P2-03",
    "真实 3MF 网格": "Véritable grille 3MF",
    "小腿连接件 · P6-04": "Connecteur mollet · P6-04",
    "小轴承 · 10×15×3": "Petit roulement · 10×15×3",
    "踝轴 · P2-05": "Arbre de cheville · P2-05",
    "真实网格 · 定位示意": "Grille réelle · Diagramme de positionnement",
    "拆下的舵盘": "palonnier de servomoteur supprimé",
    "新增教学示意": "Instructions pédagogiques ajoutées",
    "舵盘中央原装螺丝": "Vis centrale d'origine palonnier de servomoteur",
    "新增教学示意 · 规格待核": "Consignes pédagogiques ajoutées · Spécifications à vérifier",
    "三针舵机插头": "Prise servomoteur à trois broches",
    "三芯舵机线": "Ligne servomoteur à trois cœurs",
    "新增教学示意 · 路径未核验": "Instructions pédagogiques ajoutées · Le parcours n'a pas été vérifié",
    "小腿固定螺丝 1 · M2×6": "Vis de fixation mollet 1 · M2×6",
    "新增教学示意 · 孔位未核验": "Nouvelles instructions pédagogiques · Position du trou non vérifiée",
    "小腿固定螺丝 2 · M2×6": "Vis de fixation mollet 2 · M2×6",
    "脚掌固定螺丝 1 · M2×6": "Vis de fixation du pied 1 · M2×6",
    "脚掌固定螺丝 2 · M2×6": "Vis de fixation du pied 2 · M2×6",
    "脚掌固定螺丝 3 · M2×6": "Vis de fixation du pied 3 · M2×6",
    "脚掌固定螺丝 4 · M2×6": "Vis de fixation du pied 4 · M2×6",
    "踝轴固定螺丝 · M2.3×8": "Vis de fixation de l'arbre de cheville · M2.3×8",
    "新增教学示意 · 配合未核验": "Instructions pédagogiques ajoutées · La coopération n'a pas été vérifiée",
    "拧入中": "Visser",
    "已紧固": "Resserré",
    "预拧中": "Pré-vissé",
    "预拧到位": "Pré-vissé en place",
    "正在取下": "Suppression",
    "已取下": "Supprimé",
    "插接中": "De liaison",
    "已接合": "Engagé",
    "整理中": "En préparation",
    "余量已留好": "Le solde a été réservé",
    "压入中": "En appuyant sur",
    "已就位": "Déjà en place",
    "模型配合待核": "Ajustement du modèle non vérifié",
    "螺丝放大": "Détail de la vis",
    "舵盘放大": "Détail du palonnier",
    "放大": "agrandir",
    "线端放大": "Détail du bout de câble",
    "接头放大": "Détail du connecteur",
    "{value} · {value}": "{value} · {value}",
    "局部放大": "grossissement local",
    "本步可手动开关；换步后，小部位自动开启，大部位默认关闭": "Cette étape peut être activée et désactivée manuellement ; après avoir changé les étapes, les petites pièces seront automatiquement activées et les grandes pièces seront désactivées par défaut.",
    "本步暂无需要放大的装配细节": "Aucun détail d'assemblage ne doit être agrandi à cette étape.",
    "局部放大 · ": "Zoom partiel ·",
    "开": "Activé",
    "关": "Désactivé",
    " · 剖视": "· Coupe transversale",
    "对准接口": "Aligner l'interface",
    "窗口": "fenêtre",
    "当前装配部位的实时三维放大画面": "Agrandissement tridimensionnel en temps réel de la pièce d'assemblage actuelle",
    "右脚踝": "cheville droite",
    "左脚踝": "cheville gauche",
    "右腿连接": "Connexion de la jambe droite",
    "左腿连接": "connexion jambe gauche",
    "双腿收尾": "Finition des pieds",
    "准备{value}脚踝零件": "Préparer les parties de cheville {value}",
    "{value}脚踝装好了": "La cheville {value} est installée",
    "准备已编号、已居中的 {value} 舵机，以及这一侧的脚掌、小腿、轴承和踝轴。": "Préparez le {value} servomoteur numéroté et centré, ainsi que la plante du pied, le mollet, le roulement et la tige de la cheville de ce côté.",
    "可以旋转检查，再继续下一阶段。脚底软垫会在双腿收尾阶段安装。": "Vous pouvez alterner l’inspection avant de passer à l’étape suivante. Les semelles sont installées lors de la phase de finition des jambes.",
    "先卸中央螺丝，再取下舵盘": "Retirez d'abord la vis centrale, puis retirez le palonnier de servomoteur",
    "对准接口，按压到位": "Alignez l'interface et appuyez dessus",
    "对孔 · M2×6 ×2": "Trou correct · M2×6 ×2",
    "固定脚掌 · M2×6 ×4": "Pied fixe · M2×6 ×4",
    "沿轴向压入": "Enfoncer axialement",
    "对齐轴承中心": "Aligner le centre roulement",
    "拧至螺丝头贴合": "Serrez jusqu'à ce que la tête de vis s'adapte",
    "右": "droite",
    "左": "Gauche",
    "对齐双舵机": "Aligner le double servomoteur",
    "对齐{value}腿的两只舵机": "Alignez les deux pieds servomoteur du {value}",
    "按视频排列 {value}，对齐成对舵机。画面中的左右是拍摄视角，不直接等于机器人左右。": "Organisez {value} par vidéo, alignez la paire servomoteur. La gauche et la droite sur l'image sont l'angle de prise de vue, qui n'est pas directement égal à la gauche et à la droite du robot.",
    "保留另一只已完成的脚踝；核对当前这一侧。": "Gardez l'autre cheville terminée; vérifiez le côté actuel.",
    "核对舵机与方向": "Vérifiez servomoteur avec la direction",
    "固定大腿支撑": "Support de cuisse fixe",
    "固定双圆孔大腿支撑": "Support de cuisse fixe à double œillet",
    "把白色双圆孔支撑贴合这对舵机，对齐四个固定位置，按视频拧入四颗 M2×6。": "Montez le support blanc à double trou rond sur la paire de servomoteur, alignez les quatre positions fixes et vissez les quatre M2×6 comme indiqué dans la vidéo.",
    "逐孔核对后固定。孔位与安装配合仍是原型示意。": "Vérifiez trou par trou puis réparez. La position du trou et la coordination de l'installation sont encore des indications de prototype.",
    "M2×6 ×4 · 固定支撑": "M2×6 ×4 · Support fixe",
    "压入大轴承": "Appuyez sur le grand roulement",
    "压入连接脚踝的大轴承": "Appuyez sur le grand roulement qui relie la cheville",
    "将 16×22×4 mm 大轴承对准支撑圆孔，沿轴向压到位。": "Alignez le 16×22×4 mm et le grand roulement avec le trou de support et appuyez dessus dans le sens axial.",
    "轴承应坐正，再连接已经装好的脚踝。": "roulement doit s'asseoir droit, puis connecter la cheville qui a été installée.",
    "沿轴向压入大轴承": "Appuyez sur le grand roulement dans le sens axial",
    "连接已装脚踝": "Cheville attachée",
    "接上{value}脚踝子组件": "Connectez le sous-ensemble de cheville {value}",
    "把已经完成的脚踝与小腿作为一个整体，移到大腿支撑的轴承位置，再固定四颗 M2×6。": "Déplacez la cheville et le mollet terminés dans leur ensemble vers la position roulement du support de cuisse et fixez quatre M2×6.",
    "已有螺丝、踝轴与线缆随子组件一起移动。": "Il y a déjà des vis, des chevilles et des câbles qui bougent avec le sous-ensemble.",
    "整体对齐 · M2×6 ×4": "Alignement global · M2×6 ×4",
    "插接腿内线束": "Insérer dans le pied faisceau de câbles",
    "插接可见的腿内总线": "Branchez le bus de jambe visible",
    "按视频插接并压紧可见的三针舵机线，留出关节活动需要的余量。": "Branchez et serrez la ligne servomoteur visible à trois broches selon la vidéo, en laissant de la place pour le mouvement des articulations.",
    "此处演示插接与路径；每根线两端的准确接口和针脚尚未核验。": "L'accouplement et le routage sont démontrés ici ; les connecteurs et brochages exacts à chaque extrémité de chaque câble n'ont pas été vérifiés.",
    "插接线束 · 端点示意": "Fiche faisceau de câbles · Diagramme de point final",
    "整理线束余量": "Organiser la marge faisceau de câbles",
    "整理线束并留出上端连接线": "Disposez faisceau de câbles et laissez la ligne de connexion supérieure",
    "整理环线，让线束留在机构外侧，并保留后续与身体相连的线端。": "Disposez le fil en boucle de manière à ce que faisceau de câbles reste à l'extérieur du mécanisme et conservez les extrémités du fil suivantes connectées au corps.",
    "不要夹线，也不要根据三芯黑线的外观判断针脚定义。": "Ne pincez pas le fil et ne jugez pas la définition de la broche en fonction de l'apparence du fil noir à trois conducteurs.",
    "留出活动余量 · 不夹线": "Laisser de la place pour le mouvement · Pas de serrage du fil",
    "{value}腿连接完成": "Connexion des jambes {value} terminée",
    "{value}腿连接部分完成": "Pièce de connexion de jambe {value} terminée",
    "检查已连接的脚踝、双舵机支撑与线束，然后继续下一阶段。": "Vérifiez la cheville connectée, le double corset servomoteur et le faisceau de câbles, puis passez à l'étape suivante.",
    "上端连接件和脚底软垫还没有安装。": "Les connecteurs supérieurs et les coussins sous les pieds ne sont pas encore installés.",
    "卸右腿上端舵盘": "Retirer la partie supérieure de la jambe droite palonnier de servomoteur",
    "卸下右腿上端的原装舵盘": "Retirez le palonnier de servomoteur d'origine sur la jambe supérieure droite",
    "先卸中央固定螺丝，再取下舵盘，保留在旁边。": "Retirez d'abord la vis de fixation centrale, puis retirez le palonnier de servomoteur et conservez-le à côté.",
    "此处按视频处理上端；不要拆动已经固定的脚踝。": "L'extrémité supérieure est traitée selon la vidéo ici ; ne retirez pas la cheville fixe.",
    "先卸中央螺丝，再取舵盘": "Retirez d'abord la vis centrale, puis retirez le palonnier de servomoteur",
    "卸左腿上端舵盘": "Retirer la partie supérieure de la jambe gauche palonnier de servomoteur",
    "卸下左腿上端的原装舵盘": "Retirez le palonnier de servomoteur d'origine sur la jambe supérieure gauche",
    "按镜像方向处理另一条腿，依次卸中央螺丝和舵盘。": "Traitez l'autre pied dans le sens du miroir et retirez la vis centrale et le palonnier de servomoteur dans l'ordre.",
    "拆下的原装零件继续保留在零件区。": "Les pièces d'origine supprimées restent dans la zone des pièces.",
    "保留拆下的原装零件": "Conservez les pièces d'origine qui ont été retirées",
    "右连接件压轴承": "Presse pour pièce de connexion droite roulement",
    "先给右上端连接件压入轴承": "Appuyez d'abord sur roulement dans le connecteur supérieur droit",
    "在独立的上端连接件中压入大轴承，然后再把这一组件装到腿上。": "Enfoncez le grand roulement dans le connecteur supérieur séparé, puis fixez l'ensemble au pied.",
    "先压轴承，再安装连接件；不要把这两步倒过来。": "Appuyez d'abord sur roulement, puis installez le connecteur ; n’inversez pas ces deux étapes.",
    "先在连接件中压入轴承": "Appuyez d'abord sur roulement dans le connecteur",
    "安装右连接件": "Installer le bon connecteur",
    "固定右上端连接件与轴承": "Fixez le connecteur supérieur droit avec roulement",
    "把已压入轴承的连接件整体对齐上端位置，用四颗 M2×6 固定。": "Alignez le connecteur qui a été enfoncé dans le roulement sur la position finale supérieure et fixez-le avec quatre M2×6.",
    "连接件与它内部的轴承一起移动。": "Le connecteur se déplace avec le roulement à l'intérieur.",
    "组件整体安装 · M2×6 ×4": "Installation globale des composants · M2×6 ×4",
    "左连接件压轴承": "Presse de pièce de connexion gauche roulement",
    "给左上端连接件压入轴承": "Appuyez sur roulement dans le connecteur supérieur gauche",
    "在另一侧连接件中压入大轴承，保持镜像朝向。": "Enfoncez le grand roulement dans le connecteur de l'autre côté, en conservant l'orientation du miroir.",
    "左右连接件使用各自的真实网格。": "Les connecteurs gauche et droit utilisent leurs propres maillages réels.",
    "镜像方向 · 先压轴承": "Direction du miroir · Appuyez d'abord sur roulement",
    "安装左连接件": "Installer le connecteur gauche",
    "固定左上端连接件与轴承": "Fixez le connecteur supérieur gauche avec roulement",
    "把另一侧的连接件与轴承整体装到位，用四颗 M2×6 固定。": "Installez la pièce de connexion de l'autre côté avec roulement et fixez-la avec quatre M2×6.",
    "检查两侧方向一致，给后续身体装配留下连接位置。": "Vérifiez que les directions des deux côtés sont cohérentes, en laissant une position de connexion pour l'assemblage ultérieur du corps.",
    "固定右脚底软垫": "Coussin de semelle fixe du pied droit",
    "安装右脚底软垫": "Installez le bon coussin de semelle",
    "将软垫贴合脚底，按视频对齐四个孔，固定四颗 M2×6。": "Installez le coussinet souple sur la plante de votre pied, alignez les quatre trous selon la vidéo et fixez les quatre M2×6.",
    "这是脚底软垫，不是稍后总装阶段的大腿外壳。": "Il s'agit du coussin unique, et non de la coque de cuisse qui vient plus tard lors de la phase d'assemblage final.",
    "对准脚底 · M2×6 ×4": "Alignez la plante de vos pieds · M2×6 ×4",
    "固定左脚底软垫": "Coussin de semelle gauche fixe",
    "安装左脚底软垫": "Installer le coussin de la semelle du pied gauche",
    "在另一只脚底安装软垫，按视频固定四颗 M2×6。": "Installez un coussinet souple sous l'autre pied et fixez quatre M2×6 comme indiqué dans la vidéo.",
    "检查两只脚底与线束状态，然后进入身体与髋部装配。": "Vérifiez l'état de la plante des deux pieds et du faisceau de câbles, puis procédez à l'assemblage du corps et des hanches.",
    "双腿完成查看": "Vue complète des pieds",
    "双腿子组件装好了": "Le sous-ensemble à deux pieds est installé",
    "现在可以旋转查看两条腿，或回到任意阶段重新看。": "Vous pouvez maintenant faire pivoter pour voir les deux jambes, ou revenir à n'importe quelle étape pour la revoir.",
    "当前阶段到 08:16；下一阶段安装身体髋部，之后再做头颈和电控总装。": "L'étape actuelle est 08:16 ; l'étape suivante consiste à installer les hanches du corps, puis à réaliser l'ensemble tête, cou et commande électronique.",
    "{value}{value} · {value}": "{value}{value} · {value}",
    "{value}{value}": "{value}{value}",
    "舵机": "servomoteur",
    "小轴承": "Petitroulement",
    "真实 3MF 网格 · 配合待核验": "Grille réelle 3MF · Coordination à vérifier",
    "现有硬件网格": "Grille matérielle existante",
    "教学简模 · 孔位待核验": "Modèle pédagogique simple · Positions des trous à vérifier",
    "{value}固定螺丝 {value} · M2×6": "Vis de fixation {value} {value} · M2×6",
    "{value}上端舵机 · ID{value}": "{value} extrémité supérieureservomoteur · ID{value}",
    "{value}中部舵机 · ID{value}": "{value} milieu servomoteur · ID{value}",
    "{value}大腿支撑 · {value}": "Support de cuisse {value} · {value}",
    "{value}大轴承 · 16×22×4": "{value} grand roulement · 16×22×4",
    "{value}上端原装舵盘": "{value} extrémité supérieure originale palonnier de servomoteur",
    "教学简模 · 安装位示意": "Modèle simple d'enseignement · Indication de la position d'installation",
    "{value}上端原装中央螺丝": "Vis centrale d'origine d'extrémité supérieure {value}",
    "教学简模 · 原装规格待核": "Modèle pédagogique simple·Spécifications originales à vérifier",
    "{value}上端连接件 · {value}": "Connecteur supérieur {value} · {value}",
    "{value}连接件大轴承": "{value} grand connecteur roulement",
    "{value}脚底软垫 · {value}": "{value} Coussinet de pied souple · {value}",
    "线束教学示意 · 路径和端点待核验": "Instructions pédagogiques faisceau de câbles · Le chemin et les points finaux doivent être vérifiés",
    "{value}腿内三芯线": "Câble tripolaire {value} dans la patte",
    "腿内三芯线": "Fil à trois conducteurs à l'intérieur de la jambe",
    "{value}腿上端预留线": "Ligne réservée au haut de la jambe {value}",
    "上端预留线": "Ligne réservée à l'extrémité supérieure",
    "教学接口；精确键位与针脚待核": "Interface pédagogique ; positions clés et broches précises à vérifier",
    "双插座教学锚点；物理修订与电气针脚待核": "Ancre d'enseignement à double prise ; révision physique et brochage électrique en attente",
    "原装螺丝": "vis d'origine",
    "原装舵盘": "Original palonnier de servomoteur",
    "线端余量": "Marge de fin de ligne",
    "插头": "prise",
    "踝轴": "axe de la cheville",
    "轴承": "roulement",
    "线束整理": "Finition faisceau de câbles",
    "下嘴软垫": "Coussin doux pour le bas de la bouche",
    "上嘴软垫": "Coussin à lèvres",
    "右脚底软垫": "Coussin de semelle du pied droit",
    "左脚底软垫": "Coussin de semelle du pied gauche",
    "下巴": "mâchoire",
    "头部平台": "plate-forme de tête",
    "右脚": "pied droit",
    "左脚": "pied gauche",
    "右踝轴": "Axe de la cheville droite",
    "眼睛外壳": "coquille d'oeil",
    "左踝轴": "axe de la cheville gauche",
    "眼睛": "Œil",
    "颈部连接板 A": "Plaque de connexion du cou A",
    "颈部连接板 B": "Plaque de connexion du cou B",
    "右 Roll 舵机输出": "Sortie droite Roll servomoteur",
    "左 Roll 舵机输出": "Sortie gauche Roll servomoteur",
    "头盖": "crâne",
    "头部舵机固定件": "Tête servomoteur pièce de fixation",
    "身体背板": "panneau arrière du corps",
    "大腿右外壳": "Coque cuisse droite",
    "大腿左外壳": "Coque cuisse gauche",
    "电池仓": "compartiment à piles",
    "右大腿支撑": "Support de cuisse droite",
    "左大腿支撑": "support de cuisse gauche",
    "身体右外壳": "Carrosserie droite",
    "身体左外壳": "Coque gauche du corps",
    "头部俯仰支架": "Support d'inclinaison de la tête",
    "右 Roll 舵机盖板": "Couvercle droit Roll servomoteur",
    "左 Roll 舵机盖板": "Couvercle gauche Roll servomoteur",
    "右小腿": "Mollet droit",
    "左小腿": "Mollet gauche",
    "右 Yaw 连接件": "Connecteur Yaw droit",
    "左 Yaw 连接件": "Connecteur gauche Yaw",
    "头部 Yaw 支架": "Support de tête Yaw",
    "髋部 Yaw 支撑": "Prise en charge de la hanche Yaw",
    "重复 actorId: {value}": "Répétez actorId : {value}",
    "Arduino UNO Q · 已确认外观 v2批次": "Arduino UNO Q · Apparence confirmée Lot v2",
    "陆吾扩展板 · 已确认外观 v2": "Carte d'extension Luwu · Apparition confirmée v2",
    "已确认照片模型 · 均匀单位换算1000；安装孔估算与电气映射未实物验证": "Modèle photo confirmé · Conversion d'unité uniforme 1000 ; l'estimation des trous de montage et la cartographie électrique n'ont pas été physiquement vérifiées",
    "M3×16 固定螺丝 {value} · 两板近共轴孔候选": "M3×16 Vis de fixation {value} · Candidate pour trous presque coaxiaux sur deux plaques",
    "M3×16 固定螺丝 {value} · 孔位待核": "M3×16 Vis de fixation {value} · Emplacement des trous à vérifier",
    "源GLB孔位比较；2孔近共轴，另2孔约1.27mm错位；不修改孔或推定实物配合": "Comparaison de la position du trou Source GLB ; Les trous 2 sont presque coaxiaux et les trous 2 sont approximativement mal alignés sur 1.27mm ; les trous ne sont pas modifiés ou l'ajustement physique est présumé",
    "已确认 v2 舵机外观 · HD-1910-C001 / HD1910M；转轴按建模坐标适配，配合与针脚未实物验证": "Apparition confirmée du v2 servomoteur · HD-1910-C001 / HD1910M ; l'arbre est adapté en fonction des coordonnées de modélisation, et l'ajustement et les broches n'ont pas été vérifiés physiquement.",
    "已确认 v2 独立舵盘外观 · 按步骤拆卸；实体配合仍待核": "Aspect indépendant confirmé du v2 palonnier de servomoteur · Démontage selon les étapes ; la coordination physique reste à vérifier",
    "已确认 v2 三芯插头外观与三根黑线；线长、走线和针脚仍为未核验教学示意": "L'apparition de la fiche à trois conducteurs v2 et des trois fils noirs a été confirmée ; la longueur du fil, le câblage et les broches sont encore des instructions pédagogiques non vérifiées",
    "已确认 v2 指定规格螺丝外观 · 孔位用途、扭矩与实体配合未实物验证": "L'apparence des vis avec les spécifications spécifiées de v2 a été confirmée. La position du trou, le couple et l'ajustement physique n'ont pas été physiquement vérifiés.",
    "保持两块板的插合关系，将控制器组件移到身体背部。原片标示 4 颗 M3×16；本模型只在两处近共轴孔演示插入，另两处保留待核。": "En gardant les deux cartes accouplées, déplacez l’ensemble contrôleur vers l’arrière de votre corps. Le film original est marqué 4 et M3×16 ; ce modèle ne démontre l'insertion que dans deux trous quasi coaxiaux, et les deux autres sont réservés à la vérification.",
    "原片4颗；本模型2孔近共轴，另2孔约1.27mm错位，暂不显示穿过两板的完成态。源板形、孔位、PCB厚度和排针节距均未拉伸或补孔；身体支撑与实体配合待核。": "La pièce originale contient des pièces 4 ; les trous 2 de ce modèle sont presque coaxiaux et les trous 2 sont approximativement mal alignés 1.27mm. L’état final du passage à travers les deux plaques n’est pas encore représenté. La forme de la plaque source, la position du trou, l'épaisseur du PCB et le pas de la rangée de broches n'ont pas été étirés ou corrigés ; le maintien du corps et la coordination physique doivent être vérifiés.",
    "原片 M3×16 ×4 · 演示2孔，另2孔待核": "Film original M3×16 ×4 · Démontre les trous 2, et les autres trous 2 doivent être vérifiés",
    "采用已确认板卡模型；32针对齐与12.3mm建模间距已核对，孔位部分为照片估算。两处安装孔约1.27mm错位，实物插合、公差与电气针脚未验证。": "Le modèle de tableau confirmé est utilisé ; L'alignement des broches 32 et l'espacement de modélisation 12.3mm ont été vérifiés et les emplacements des trous sont estimés à partir de photos. Les deux trous de montage sont mal alignés d'environ 1.27mm, et l'insertion physique, les tolérances et les broches électriques n'ont pas été vérifiées.",
    "采用已确认照片模型。四组32针按建模坐标对齐；PCB和接口未按总包络拉伸。板间净空、键位、电气映射和实物配合仍待核。": "Présente un modèle photo confirmé. Les quatre jeux de broches 32 sont alignés selon les coordonnées de modélisation ; PCB et l'interface ne sont pas étirés en fonction de l'enveloppe totale. Le dégagement des cartes, les emplacements clés, la cartographie électrique et l'adéquation physique doivent encore être vérifiés.",
    "萨蒂 · 第一号吉姆诺佩蒂": "Satie n°1 Jimnoppetti",
    "莫扎特 · K.545 行板": "Mozart · K.545 Andante",
    "已静音": "en sourdine",
    "点一下页面开始音乐": "Cliquez sur la page pour démarrer la musique",
    "正在准备钢琴曲…": "Préparation de la musique pour piano...",
    "正在播放 · ": "Je joue en ce moment ·",
    "仅播放完成提示音": "Jouez uniquement le ton d'achèvement",
    "声音已关闭": "Le son est coupé",
    "钢琴曲暂时无法播放，可切换曲目重试": "La musique du piano ne peut pas être jouée temporairement. Vous pouvez changer de piste et réessayer.",
    "打印件用涂装台当前的配色，舵机、板子和螺丝保持原样": "L'impression utilise la palette de couleurs actuelle de la table de peinture, servomoteur, la planche et les vis restent les mêmes.",
    "还没有涂色，打印件先用白色演示": "Il n'a pas encore été colorié, l'impression sera donc d'abord présentée en blanc.",
    "配色 · ": "Correspondance des couleurs ·",
    "白胚": "embryon blanc",
    ").textContent=s.complete?`{value} · 完成`:`${String(local).padStart(2,": ").textContent=s.complete?`{value} · Terminé`:`${String(local).padStart(2,",
    "红框 · 对准这两处": "Encadré rouge · Visez ces deux endroits",
    "绿框 · 本次已装好": "Cadre vert · Déjà installé cette fois",
    "真实零件网格": "Maillage de pièces réelles",
    "模型清单加载失败": "Échec du chargement du manifeste du modèle",
    "模型几何加载失败": "Échec du chargement de la géométrie du modèle",
    "极致 · ": "Extrême ·",
    "极致 · 细腻哑光、边缘柔光与摄影棚反射": "Ultime · Mat délicat, lumière douce et reflet de studio",
    "当前 · 原有材质和渲染": "Actuel · Matériaux et rendu originaux",
    "来做鸭 / letsduck · 3D 组装教程": "Faisons un canard / letsduck · Tutoriel d'assemblage du 3D",
    "来做鸭 / letsduck": "Faisons un canard / letsduck",
    "3D 组装教程": "Tutoriel d'assemblage du 3D",
    "整机预览": "Aperçu de la machine entière",
    "对照原片": "Comparez le film original",
    "跟着视频，一步一步装": "Suivez la vidéo et installez-la étape par étape",
    "整机组装": "Assemblage complet de la machine",
    "原片 00:00—23:10": "Film original 00:00—23:10",
    "画质": "Qualité des images",
    "渲染画质": "Qualité du rendu",
    "当前": "actuel",
    "极致": "extrême",
    "局部放大 · 关": "Zoom partiel · Désactivé",
    "最佳视角": "Meilleur angle de vision",
    "正面": "devant",
    "背面": "dos",
    "三维组装区域": "Zone d'assemblage 3D",
    "正在加载现有模型…": "Chargement du modèle existant...",
    "可旋转的整机三维模型": "Modèle 3D rotatif de l'ensemble de la machine",
    "接头局部放大窗": "Fenêtre de grossissement partiel commune",
    "拖动放大窗": "Faites glisser la fenêtre loupe",
    "收起局部放大": "Réduire l'élargissement local",
    "当前接头的实时三维放大画面": "Agrandissement 3D en temps réel de l'articulation actuelle",
    "所选零件信息": "Informations sur la pièce sélectionnée",
    "收起零件信息": "Masquer les informations sur les pièces",
    "可以开始": "peut commencer",
    "本步动作": "Action de cette étape",
    "本步动作进度": "Déroulement de cette étape",
    "← 上一步": "← Précédent",
    "红绿框演示": "Démonstration de boîtes rouges et vertes",
    "暂停": "pause",
    "自动播放 · 关": "Lecture automatique · Désactivé",
    "播放倍率": "Agrandissement de lecture",
    "声音设置": "paramètres sonores",
    "声音": "son",
    "收起声音设置": "Réduire les paramètres sonores",
    "背景音乐": "musique de fond",
    "选择钢琴曲": "Sélectionnez la musique pour piano",
    "完成提示音": "Tonalité d'achèvement",
    "音量": "volume",
    "曲目与模型来源 ↗": "Source du suivi et du modèle ↗",
    "开始组装": "Commencez à assembler",
    "下一步 →": "Suivant →",
    "从头再看": "Regarde-le depuis le début",
    "v4.1 走线复核版 · 新插头与部分3MF支架/外壳有几何干涉，红框部位配合待核。": "Version de révision du câblage v4.1 · La nouvelle fiche présente des interférences géométriques avec certains supports/boîtiers 3MF, et la coordination des pièces de la boîte rouge doit être vérifiée.",
    "组装步骤": "Étapes d'assemblage",
    "组装顺序": "Séquence d'assemblage",
    "选择组装阶段": "Sélectionnez l'étape d'assemblage",
    "1 · 准备与编号": "1 · Préparation et numérotation",
    "2 · 右脚踝": "2 · Cheville droite",
    "3 · 左脚踝": "3 · Cheville gauche",
    "4 · 右腿连接": "4 · Connexion de la jambe droite",
    "5 · 左腿连接": "5 · Connexion de la jambe gauche",
    "6 · 双腿收尾": "6 · Finition des pieds",
    "7 · 身体与髋支撑": "7 · Soutien du corps et des hanches",
    "8 · 髋电机与接腿": "8 · Moteurs de hanche et articulations des jambes",
    "9 · 头部旋转与接线": "9 · Rotation de la tête et câblage",
    "10 · 嘴部与双舵机脖子": "10 · Bouche et double col servomoteur",
    "11 · 头盖与嘴部软垫": "11 · Couvre-tête et coussin buccal",
    "12 · 身体与头颈总装": "12 · Ensemble corps et tête et cou",
    "13 · 电控与外壳收尾": "13 · Commande électronique et finition du boîtier",
    "14 · 校准与完成": "14 · Calibrage et complétion",
    "选择组装步骤": "Sélectionnez les étapes d'assemblage",
    "本步说明 ↗": "Instructions pour cette étape ↗",
    "收起本步说明": "Réduire les instructions de cette étape",
    "准备": "Préparer",
    "教学说明 · 不连接或控制真实设备": "Notes du didacticiel · Pas de connexion ou de contrôle d'appareils réels",
    "本步用到": "Utilisé dans cette étape",
    "看这一步的原片": "Regardez la vidéo originale de cette étape",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。": "Instructions pédagogiques : Les positions des trous, la coordination des connexions, les modifications de la carte et les extrémités des lignes n'ont pas encore été vérifiées physiquement.",
    "原片对照": "Comparaison de films originaux",
    "收起原片": "Fermez le film original",
    "截取自你提供的视频 · 20:58—23:10": "Extrait de la vidéo que vous avez fournie · 20:58—23:10",
    "{name}放大": "{name} agrandir",
    "{ordinal}/{total} · {status}": "{ordinal}/{total} · {status}",
    "{frame} · {status}": "{frame} · {status}",
    "{title}窗口": "Fenêtre {title}",
    "{name} · 剖视": "{name} · Coupe transversale",
    "局部放大 · {state}": "Zoom partiel · {state}",
    "自动播放 · {state}": "Lecture automatique · {state}",
    "截取自你提供的视频 · {start}—{end}": "Extrait de la vidéo que vous avez fournie · {start}—{end}",
    "模型没有加载成功：{error}": "Le modèle n'a pas été chargé correctement : {error}",
    "配色 · {name}": "Couleur · {name}",
    "正在播放 · {track}": "Lecture en cours · {track}",
    "本步观看 {seen} / {total} · 实物完成 {built} / {total}": "Regardez cette étape {seen} / {total} · Achèvement physique {built} / {total}",
    "本步说明": "Instructions pour cette étape",
    "收起说明 · 留出观察空间": "Instructions pour replier · Laisser un espace pour l'observation",
    "方向与动作": "orientation et action",
    "完成检查": "Inspection complète",
    "已看过此步": "Déjà vu cette étape",
    "我已检查实物并装好": "J'ai vérifié l'objet physique et l'ai installé",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。接头键位、实际插座、针脚和极性未核验。": "Instructions pédagogiques : Les positions des trous, la coordination des connexions, les modifications de la carte et les extrémités des lignes n'ont pas encore été vérifiées physiquement. Les clés des connecteurs, les prises réelles, les broches et la polarité n'ont pas été vérifiées.",
    "观察设置 · 视角 / 聚焦 / 画质": "Paramètres d'observation·Visualisation/Mise au point/Qualité de l'image",
    "播放设置 · 进度 / 倍率 / 声音": "Paramètres de lecture · Progression/Agrandissement/Son",
    "收起组装顺序": "Séquence d'assemblage réduit",
    "观看 {seen}/{total} · 实物 {built}/{total}": "Montre {seen}/{total} · {built}/{total} réelle",
    "{chapter} · {local} / {total}": "{chapter} · {local} / {total}",
    "{chapter} · 完成": "{chapter} · Complet",
    "{local}  {short}": "{local} {short}",
    "红框": "Cadre rouge",
    "绿框": "Cadre vert"
  }
};
