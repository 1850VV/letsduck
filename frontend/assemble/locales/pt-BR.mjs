// Static assembly copy. Machine-drafted, technical-reference corrections; native review pending.
export default {
  "version": 1,
  "steps": {
    "prepare-intro": {
      "short": "Dê uma olhada no robô completo primeiro",
      "title": "Entenda a rota completa da máquina e da montagem",
      "text": "Primeiro observe toda a máquina, depois conclua a preparação, pernas, corpo, cabeça e pescoço, montagem final e calibração em sequência.",
      "check": "Este é o protótipo de ensino independente. Você pode usar \"Visualização completa\" para retornar ao estado concluído a qualquer momento.",
      "caption": ""
    },
    "prepare-boards": {
      "short": "Conecte temporariamente duas placas juntas",
      "title": "Conecte temporariamente UNO Q e placa de expansão",
      "text": "Alinhe os cabeçalhos dos pinos e os cabeçalhos fêmeas das duas placas e pressione-os juntos na mesma direção. As duas placas são dois objetos separados no tutorial.",
      "check": "Apresenta modelo fotográfico confirmado. Os quatro conjuntos de pinos 32 estão alinhados de acordo com as coordenadas de modelagem; PCB e a interface não são esticadas de acordo com o envelope total. A liberação da placa, os principais locais, o mapeamento elétrico e a adequação física ainda precisam ser verificados.",
      "caption": "Alinhe o cabeçalho do pino e o cabeçalho fêmea e pressione-os juntos"
    },
    "prepare-battery": {
      "short": "Conecte a bateria de teste",
      "title": "Conecte a bateria de energia temporária",
      "text": "Insira o conector da bateria de acordo com a peça original para preparar a fonte de alimentação para a próxima configuração servo.",
      "check": "O vídeo lembra você de prestar atenção à polaridade; este protótipo não estima os pinos reais ou a polaridade com base na aparência.",
      "caption": "O plugue de alimentação e a direção estão sujeitos a verificação física"
    },
    "prepare-servo": {
      "short": "Conecte um servo",
      "title": "Conecte apenas um servo para ser configurado por vez",
      "text": "Primeiro conecte o fio de três núcleos ao servo e, em seguida, conecte a outra extremidade à placa. Atualmente apenas este está conectado para testar o servo.",
      "check": "Após completar a numeração do atual, desconecte e substitua o próximo.",
      "caption": "Único servo · Conecte no lugar"
    },
    "prepare-usb": {
      "short": "Ligue o robô e conecte-o ao computador",
      "title": "Ligue a energia do robô e conecte a linha Type-C",
      "text": "Siga as instruções do vídeo, ligue o robô e conecte-o ao computador usando o cabo Type-C.",
      "check": "Esta página apenas demonstra a sequência de conexão e não inicia ou conecta dispositivos reais.",
      "caption": "Ligar · Conectar ao Type-C"
    },
    "prepare-app": {
      "short": "Importe e execute o aplicativo",
      "title": "Importe e execute o aplicativo em Arduino App Lab",
      "text": "Importe o aplicativo XGO Duck para o seu computador e execute-o. O vídeo original não mostra totalmente a instalação do primeiro ambiente.",
      "check": "Esta etapa fornece comparação de vídeos e instruções instrutivas; não há nenhuma sessão App Lab real aqui.",
      "caption": "Inicialização do aplicativo · Instruções do tutorial"
    },
    "prepare-scan": {
      "short": "Digitalizar e centralizar",
      "title": "Digite Servo setup, digitalize e centralize o servo atual",
      "text": "Abra seu próprio endereço de configuração de dispositivo e digite Servo setup. Scan all IDs → Depois de encontrar um único Stop scan → Move to 2047 → Write.",
      "check": "Devido a diferentes ambientes, o dispositivo IP e o nome do host não copiam o endereço fixo do filme original.",
      "caption": "Scan → Stop → 2047 → Write"
    },
    "prepare-id": {
      "short": "Gravar parâmetros e ID",
      "title": "Escreva os parâmetros e defina o alvo ID",
      "text": "Os parâmetros de vídeo são KP=5 e KD=20, clique em Write; preencha o destino ID, execute Change ID e confirme o sucesso.",
      "check": "Esta é a sequência de configuração do vídeo; a página da web atual não envia parâmetros para servo.",
      "caption": "KP 5 · KD 20 · Change ID"
    },
    "prepare-all-ids": {
      "short": "Complete 15 e ID um por um",
      "title": "Complete a numeração e centralização dos quinze servos um por um",
      "text": "Complete 10–14, 20–24, 30–34 em ordem. Configure apenas um de cada vez. A instalação mecânica subsequente começa a partir de um estado centralizado e numerado.",
      "check": "Os quinze ID nesta página são uma lista instrutiva e não representam que dispositivos reais tenham sido gravados ou centralizados.",
      "caption": "15 ID · Processado um por um"
    },
    "r-prepare": {
      "short": "Preparar peças",
      "title": "Prepare as partes do tornozelo direito",
      "text": "Prepare ID14 servo numerado e centralizado, bem como a planta do pé, panturrilha, rolamento e eixo do tornozelo deste lado.",
      "check": "A numeração e centralização do servo devem ser concluídas antes da instalação mecânica.",
      "caption": ""
    },
    "r-horn": {
      "short": "Remover braço do servo",
      "title": "Remover braço do servo",
      "text": "Primeiro desparafuse o parafuso de fixação original no centro do braço do servo e, em seguida, remova o braço do servo preto ao longo da direção do eixo de saída.",
      "check": "Reserve o braço do servo e os parafusos originais; as etapas posteriores não o substituirão por parafusos auto-roscantes.",
      "caption": "Remova primeiro o parafuso central e depois remova o braço do servo"
    },
    "r-plug": {
      "short": "Conecte o cabo",
      "title": "Conecte a linha servo",
      "text": "Alinhe o orifício do terminal do plugue com a saliência da interface, insira-o na direção da interface e pressione-o no lugar.",
      "check": "Verifique claramente a direção do plugue. A ação de conexão é demonstrada aqui. A definição do pino do fio de três núcleos ainda precisa ser verificada fisicamente.",
      "caption": "Alinhe a interface e pressione-a no lugar"
    },
    "r-shank": {
      "short": "Panturrilha fixa",
      "title": "Conector fixo da perna",
      "text": "Encaixe o conector branco da perna inferior em servo, alinhe os orifícios de montagem e, em seguida, aparafuse dois parafusos autoatarraxantes de cabeça escareada M2×6.",
      "check": "A extremidade longa do conector deve estar voltada para cima. Alinhe os furos primeiro e depois prenda as peças. Não use parafusos para forçar peças desalinhadas na posição de instalação.",
      "caption": "Furo correto · M2×6 ×2"
    },
    "r-foot": {
      "short": "Encaixe na sola do pé",
      "title": "Instale servo na sola do pé",
      "text": "Coloque o módulo composto por servo e conector de panturrilha na sola do pé e fixe os quatro parafusos auto-roscantes de cabeça escareada M2×6 conforme mostrado no vídeo.",
      "check": "Primeiro confirme a orientação das solas dos pés e das articulações e depois fixe as quatro posições. Os cabos permanecem do lado de fora.",
      "caption": "Pé fixo · M2×6 ×4"
    },
    "r-small-bearing": {
      "short": "Pressione rolamento",
      "title": "Pressione o pequeno rolamento",
      "text": "Alinhe o pequeno rolamento com o orifício de montagem circular na sola do pé e pressione-o ao longo da direção axial.",
      "check": "rolamento precisa ficar na posição vertical, com o orifício central e o conector coaxial. O número do modelo corresponde a 10×15×3 mm de acordo com a lista.",
      "caption": "Pressione axialmente"
    },
    "r-axle": {
      "short": "Instale o eixo do tornozelo",
      "title": "Alinhe e instale a haste do tornozelo",
      "text": "Alinhe o orifício do meio, coloque o eixo do tornozelo impresso no centro de rolamento e, em seguida, aparafuse manualmente o parafuso auto-roscante M2.3×8.",
      "check": "O eixo do tornozelo usa a grade 3MF existente; o posicionamento aqui foi ajustado para exibição e não foi verificado quanto ao ajuste físico.",
      "caption": "Alinhar o centro rolamento"
    },
    "r-tighten": {
      "short": "Verificação fixa",
      "title": "Aperte e verifique",
      "text": "Aparafuse o parafuso M2.3×8 axialmente até que a cabeça do parafuso encoste na superfície e, em seguida, verifique a conexão do tornozelo.",
      "check": "O vídeo pede que a cabeça do parafuso se encaixe perfeitamente e a ponta saia do outro lado. O protótipo apenas demonstra movimento e não simula torque ou tolerâncias reais.",
      "caption": "Aperte até que a cabeça do parafuso se encaixe"
    },
    "r-ankle-done": {
      "short": "Visualização completa",
      "title": "O tornozelo direito está instalado",
      "text": "Você pode alternar a inspeção antes de prosseguir para a próxima etapa. As solas são instaladas durante a fase de acabamento das pernas.",
      "check": "As almofadas sob os pés ainda não estão instaladas nesta seção; eles são instalados posteriormente no vídeo nas pernas.",
      "caption": ""
    },
    "l-prepare": {
      "short": "Preparar peças",
      "title": "Prepare as partes do tornozelo esquerdo",
      "text": "Prepare ID24 servo numerado e centralizado, bem como a planta do pé, panturrilha, rolamento e eixo do tornozelo deste lado.",
      "check": "A numeração e centralização do servo devem ser concluídas antes da instalação mecânica.",
      "caption": ""
    },
    "l-horn": {
      "short": "Remover braço do servo",
      "title": "Remover braço do servo",
      "text": "Primeiro desparafuse o parafuso de fixação original no centro do braço do servo e, em seguida, remova o braço do servo preto ao longo da direção do eixo de saída.",
      "check": "Reserve o braço do servo e os parafusos originais; as etapas posteriores não o substituirão por parafusos auto-roscantes.",
      "caption": "Remova primeiro o parafuso central e depois remova o braço do servo"
    },
    "l-plug": {
      "short": "Conecte o cabo",
      "title": "Conecte a linha servo",
      "text": "Alinhe o orifício do terminal do plugue com a saliência da interface, insira-o na direção da interface e pressione-o no lugar.",
      "check": "Verifique claramente a direção do plugue. A ação de conexão é demonstrada aqui. A definição do pino do fio de três núcleos ainda precisa ser verificada fisicamente.",
      "caption": "Alinhe a interface e pressione-a no lugar"
    },
    "l-shank": {
      "short": "Panturrilha fixa",
      "title": "Conector fixo da perna",
      "text": "Encaixe o conector branco da perna inferior em servo, alinhe os orifícios de montagem e, em seguida, aparafuse dois parafusos autoatarraxantes de cabeça escareada M2×6.",
      "check": "A extremidade longa do conector deve estar voltada para cima. Alinhe os furos primeiro e depois prenda as peças. Não use parafusos para forçar peças desalinhadas na posição de instalação.",
      "caption": "Furo correto · M2×6 ×2"
    },
    "l-foot": {
      "short": "Encaixe na sola do pé",
      "title": "Instale servo na sola do pé",
      "text": "Coloque o módulo composto por servo e conector de panturrilha na sola do pé e fixe os quatro parafusos auto-roscantes de cabeça escareada M2×6 conforme mostrado no vídeo.",
      "check": "Primeiro confirme a orientação das solas dos pés e das articulações e depois fixe as quatro posições. Os cabos permanecem do lado de fora.",
      "caption": "Pé fixo · M2×6 ×4"
    },
    "l-small-bearing": {
      "short": "Pressione rolamento",
      "title": "Pressione o pequeno rolamento",
      "text": "Alinhe o pequeno rolamento com o orifício de montagem circular na sola do pé e pressione-o ao longo da direção axial.",
      "check": "rolamento precisa ficar na posição vertical, com o orifício central e o conector coaxial. O número do modelo corresponde a 10×15×3 mm de acordo com a lista.",
      "caption": "Pressione axialmente"
    },
    "l-axle": {
      "short": "Instale o eixo do tornozelo",
      "title": "Alinhe e instale a haste do tornozelo",
      "text": "Alinhe o orifício do meio, coloque o eixo do tornozelo impresso no centro de rolamento e, em seguida, aparafuse manualmente o parafuso auto-roscante M2.3×8.",
      "check": "O eixo do tornozelo usa a grade 3MF existente; o posicionamento aqui foi ajustado para exibição e não foi verificado quanto ao ajuste físico.",
      "caption": "Alinhar o centro rolamento"
    },
    "l-tighten": {
      "short": "Verificação fixa",
      "title": "Aperte e verifique",
      "text": "Aparafuse o parafuso M2.3×8 axialmente até que a cabeça do parafuso encoste na superfície e, em seguida, verifique a conexão do tornozelo.",
      "check": "O vídeo pede que a cabeça do parafuso se encaixe perfeitamente e a ponta saia do outro lado. O protótipo apenas demonstra movimento e não simula torque ou tolerâncias reais.",
      "caption": "Aperte até que a cabeça do parafuso se encaixe"
    },
    "l-ankle-done": {
      "short": "Visualização completa",
      "title": "O tornozelo esquerdo está instalado",
      "text": "Você pode alternar a inspeção antes de prosseguir para a próxima etapa. As solas são instaladas durante a fase de acabamento das pernas.",
      "check": "As almofadas sob os pés ainda não estão instaladas nesta seção; eles são instalados posteriormente no vídeo nas pernas.",
      "caption": ""
    },
    "r-pair": {
      "short": "Alinhar duplo servo",
      "title": "Alinhe os dois servo na perna direita",
      "text": "Organize ID12 / ID13 por vídeo, alinhe o par servo. A esquerda e a direita na imagem são o ângulo de disparo, não diretamente igual à esquerda e à direita do robô.",
      "check": "Mantenha o outro tornozelo completo; verifique o lado atual.",
      "caption": "Verifique servo com direção"
    },
    "r-support": {
      "short": "Suporte fixo para coxa",
      "title": "Suporte de coxa com ilhó duplo fixo",
      "text": "Encaixe o suporte branco com furo redondo duplo no par de servo, alinhe as quatro posições fixas e aparafuse os quatro M2×6 conforme mostrado no vídeo.",
      "check": "Verifique furo por furo e depois conserte. A posição do furo e a coordenação da instalação ainda são indicações do protótipo.",
      "caption": "M2×6 ×4 · Suporte fixo"
    },
    "r-bearing": {
      "short": "Pressione no grande rolamento",
      "title": "Pressione no grande rolamento que conecta o tornozelo",
      "text": "Alinhe 16×22×4 mm e rolamento grande com o orifício de suporte e pressione-o no lugar ao longo da direção axial.",
      "check": "rolamento deve ficar na posição vertical e depois conectar o tornozelo que foi instalado.",
      "caption": "Pressione o rolamento grande ao longo da direção axial"
    },
    "r-join": {
      "short": "Tornozelo anexado",
      "title": "Anexe o subconjunto do tornozelo direito",
      "text": "Mova o tornozelo e a panturrilha completos como um todo para a posição rolamento do apoio de coxa e fixe quatro M2×6.",
      "check": "Já existem parafusos, tornozelos e cabos que se movem com a submontagem.",
      "caption": "Alinhamento geral · M2×6 ×4"
    },
    "r-wire-a": {
      "short": "Insira na perna chicote de cabos",
      "title": "Conecte o barramento de perna visível",
      "text": "Conecte e aperte a linha servo visível de três pinos de acordo com o vídeo, deixando espaço para o movimento da articulação.",
      "check": "O acasalamento e o roteamento são demonstrados aqui; os conectores e pinagens exatos em cada extremidade de cada cabo não foram verificados.",
      "caption": "Plugue chicote de cabos · Diagrama de endpoint"
    },
    "r-wire-b": {
      "short": "Organizar margem chicote de cabos",
      "title": "Organize chicote de cabos e deixe a linha de conexão superior",
      "text": "Organize o fio do laço de forma que chicote de cabos permaneça na parte externa do mecanismo e mantenha as extremidades do fio subsequentes conectadas ao corpo.",
      "check": "Não aperte a linha e não julgue a definição do pino com base na aparência do fio preto de três núcleos.",
      "caption": "Deixe espaço para movimento · Sem fixação de rosca"
    },
    "r-leg-done": {
      "short": "Conexão da perna direita concluída",
      "title": "Peça de conexão da perna direita concluída",
      "text": "Verifique o tornozelo conectado, a cinta dupla servo e chicote de cabos e prossiga para a próxima etapa.",
      "check": "Os conectores superiores e as almofadas sob os pés ainda não foram instalados.",
      "caption": ""
    },
    "l-pair": {
      "short": "Alinhar duplo servo",
      "title": "Alinhe os dois servo na perna esquerda",
      "text": "Organize ID23 / ID22 por vídeo, alinhe o par servo. A esquerda e a direita na imagem são o ângulo de disparo, não diretamente igual à esquerda e à direita do robô.",
      "check": "Mantenha o outro tornozelo completo; verifique o lado atual.",
      "caption": "Verifique servo com direção"
    },
    "l-support": {
      "short": "Suporte fixo para coxa",
      "title": "Suporte de coxa com ilhó duplo fixo",
      "text": "Encaixe o suporte branco com furo redondo duplo no par de servo, alinhe as quatro posições fixas e aparafuse os quatro M2×6 conforme mostrado no vídeo.",
      "check": "Verifique furo por furo e depois conserte. A posição do furo e a coordenação da instalação ainda são indicações do protótipo.",
      "caption": "M2×6 ×4 · Suporte fixo"
    },
    "l-bearing": {
      "short": "Pressione no grande rolamento",
      "title": "Pressione no grande rolamento que conecta o tornozelo",
      "text": "Alinhe 16×22×4 mm e rolamento grande com o orifício de suporte e pressione-o no lugar ao longo da direção axial.",
      "check": "rolamento deve ficar na posição vertical e depois conectar o tornozelo que foi instalado.",
      "caption": "Pressione o rolamento grande ao longo da direção axial"
    },
    "l-join": {
      "short": "Tornozelo anexado",
      "title": "Anexe o subconjunto do tornozelo esquerdo",
      "text": "Mova o tornozelo e a panturrilha completos como um todo para a posição rolamento do apoio de coxa e fixe quatro M2×6.",
      "check": "Já existem parafusos, tornozelos e cabos que se movem com a submontagem.",
      "caption": "Alinhamento geral · M2×6 ×4"
    },
    "l-wire-a": {
      "short": "Insira na perna chicote de cabos",
      "title": "Conecte o barramento de perna visível",
      "text": "Conecte e aperte a linha servo visível de três pinos de acordo com o vídeo, deixando espaço para o movimento da articulação.",
      "check": "O acasalamento e o roteamento são demonstrados aqui; os conectores e pinagens exatos em cada extremidade de cada cabo não foram verificados.",
      "caption": "Plugue chicote de cabos · Diagrama de endpoint"
    },
    "l-wire-b": {
      "short": "Organizar margem chicote de cabos",
      "title": "Organize chicote de cabos e deixe a linha de conexão superior",
      "text": "Organize o fio do laço de forma que chicote de cabos permaneça na parte externa do mecanismo e mantenha as extremidades do fio subsequentes conectadas ao corpo.",
      "check": "Não aperte a linha e não julgue a definição do pino com base na aparência do fio preto de três núcleos.",
      "caption": "Deixe espaço para movimento · Sem fixação de rosca"
    },
    "l-leg-done": {
      "short": "A perna esquerda está conectada",
      "title": "A parte de conexão da perna esquerda está concluída",
      "text": "Verifique o tornozelo conectado, a cinta dupla servo e chicote de cabos e prossiga para a próxima etapa.",
      "check": "Os conectores superiores e as almofadas sob os pés ainda não foram instalados.",
      "caption": ""
    },
    "r-top-horn": {
      "short": "Remova a parte superior da perna direita braço do servo",
      "title": "Remova o braço do servo original na parte superior da perna direita",
      "text": "Primeiro remova o parafuso de fixação central, depois remova o braço do servo e mantenha-o próximo a ele.",
      "check": "A extremidade superior é processada de acordo com o vídeo aqui; não remova o tornozelo fixo.",
      "caption": "Remova o parafuso central primeiro e depois retire o braço do servo"
    },
    "l-top-horn": {
      "short": "Remova a parte superior da perna esquerda braço do servo",
      "title": "Remova o braço do servo original na parte superior da perna esquerda",
      "text": "Processe a outra perna na direção do espelho e remova o parafuso central e braço do servo em sequência.",
      "check": "As peças originais que foram removidas permanecem na área de peças.",
      "caption": "Guarde as peças originais que foram removidas"
    },
    "r-top-bearing": {
      "short": "Peça de conexão direita pressione rolamento",
      "title": "Primeiro pressione rolamento no conector superior direito",
      "text": "Pressione o rolamento grande no conector superior separado e, em seguida, prenda o conjunto à perna.",
      "check": "Pressione rolamento primeiro e depois instale o conector; não inverta essas duas etapas.",
      "caption": "Primeiro pressione rolamento no conector"
    },
    "r-top-link": {
      "short": "Instale o conector direito",
      "title": "Fixe o conector superior direito com rolamento",
      "text": "Alinhe o conector que foi pressionado em rolamento com a posição final superior e fixe-o com quatro M2×6.",
      "check": "O conector se move com o rolamento dentro dele.",
      "caption": "Instalação geral de componentes · M2×6 ×4"
    },
    "l-top-bearing": {
      "short": "Peça de conexão esquerda pressione rolamento",
      "title": "Pressione rolamento no conector superior esquerdo",
      "text": "Pressione o rolamento grande no conector do outro lado, mantendo a orientação do espelho.",
      "check": "Os conectores esquerdo e direito usam suas próprias malhas reais.",
      "caption": "Direção do espelho · Pressione rolamento primeiro"
    },
    "l-top-link": {
      "short": "Instale o conector esquerdo",
      "title": "Fixe o conector superior esquerdo com rolamento",
      "text": "Instale a peça de conexão do outro lado com rolamento e fixe com quatro M2×6.",
      "check": "Verifique se as direções em ambos os lados são consistentes, deixando uma posição de conexão para posterior montagem da carroceria.",
      "caption": "Instalação geral de componentes · M2×6 ×4"
    },
    "r-sole": {
      "short": "Almofada fixa na sola do pé direito",
      "title": "Instale a almofada da sola direita",
      "text": "Encaixe a almofada macia na sola do pé, alinhe os quatro furos conforme o vídeo e fixe os quatro M2×6.",
      "check": "Esta é a única almofada, não a concha da coxa que vem posteriormente na fase de montagem final.",
      "caption": "Alinhe as solas dos pés · M2×6 ×4"
    },
    "l-sole": {
      "short": "Almofada fixa na sola esquerda",
      "title": "Instale a almofada da sola do pé esquerdo",
      "text": "Instale uma almofada macia na parte inferior do outro pé e fixe quatro M2×6 conforme mostrado no vídeo.",
      "check": "Verifique o estado das solas dos pés e chicote de cabos e, em seguida, proceda à montagem do corpo e dos quadris.",
      "caption": "Alinhe as solas dos pés · M2×6 ×4"
    },
    "legs-complete": {
      "short": "Visão completa das pernas",
      "title": "A submontagem de duas pernas está instalada",
      "text": "Agora você pode girar para ver as duas pernas ou voltar a qualquer estágio para vê-las novamente.",
      "check": "O estágio atual é 08:16; a próxima etapa é instalar os quadris do corpo e depois fazer a montagem da cabeça, pescoço e controle eletrônico.",
      "caption": ""
    },
    "t-pair": {
      "short": "Organizar duplo servo",
      "title": "Organize os números ID20 e ID10",
      "text": "Organize dois servo centralizados de acordo com a perspectiva da área de trabalho do filme original: ID20 no lado esquerdo da tela e ID10 no lado direito. Mantenha-os originais braço do servo.",
      "check": "A esquerda e a direita da tela não são diretamente iguais à esquerda e à direita do robô. A grade é colocada de acordo com as coordenadas existentes de toda a máquina, e a coordenação da instalação fica pendente de verificação física.",
      "caption": "Tela esquerda 20 · Tela direita 10"
    },
    "t-support": {
      "short": "suporte de quadril fixo",
      "title": "Prenda o suporte de quadril com furo redondo duplo com seis parafusos",
      "text": "Coloque o suporte de quadril com furo redondo duplo P6-09 nos dois servo, alinhe-o e fixe os seis parafusos auto-roscantes de cabeça escareada M2×6.",
      "check": "Mantenha os dois furos inferiores no meio, conforme mencionado no vídeo, e não adicione parafusos a esses dois furos. Os pontos de ancoragem de parafuso animados são representações de grupos de furos.",
      "caption": "M2×6 ×6 · Deixe os dois orifícios do meio na parte inferior vazios"
    },
    "t-wire": {
      "short": "Conexão e fiação",
      "title": "chicote de cabos é visível no quadril inserido e sai",
      "text": "Referindo-se à demonstração no filme original, pressione os dois plugues visíveis servo no corpo do robô. Separe os fios de conexão do motor de quadril subsequentes e os fios reservados para a placa-mãe, respectivamente, e conduza os fios reservados da abertura.",
      "check": "O soquete duplo é posicionado como um modelo de ensino simples de acordo com as características da superfície da grade da fonte. O caminho chicote de cabos, a identidade do soquete e os pinos não foram verificados, e os dois corpos servo não são desenhados como interconectados sem autorização.",
      "caption": "Conecte-o primeiro axialmente e depois passe os fios, diagrama de fiação"
    },
    "t-backplate-front": {
      "short": "Instale o painel traseiro do corpo",
      "title": "Encaixe o painel traseiro do corpo e fixe os dois parafusos na parte frontal",
      "text": "Alinhe o painel traseiro do corpo P4-03 com a montagem do quadril, primeiro fixe os dois M2×6 visíveis na frente da peça original.",
      "check": "O painel traseiro e o chicote de cabos devem ser encaixados primeiro e depois apertados, sem selar a rosca na costura. As posições dos buracos ainda são para fins didáticos.",
      "caption": "Frente M2×6 ×2"
    },
    "t-backplate-back": {
      "short": "fixo de volta",
      "title": "Prenda os dois parafusos na parte traseira do painel traseiro",
      "text": "Continue trabalhando nas costas e prenda os outros dois M2×6. As duas peças na frente e as duas peças na parte traseira do painel traseiro são demonstradas separadamente.",
      "check": "Esta etapa adiciona dois novos e não conta novamente o grupo anterior.",
      "caption": "Voltar M2×6 ×2"
    },
    "t-yaw-r": {
      "short": "Instale a peça de conexão direita",
      "title": "Pressione rolamento primeiro e depois instale o conector Yaw–Roll direito",
      "text": "Primeiro pressione o rolamento grande no conector P6-06 independente e, em seguida, alinhe todo o conector com rolamento no lado direito do corpo. Finalmente, o grupo de furos de fixação é demonstrado.",
      "check": "Filme original 09:41 Você pode ver rolamento no conector. 10: As legendas 05 são quatro M2×6, mas as atribuições de número e grupo de buracos em cada lado ainda não foram verificadas; os parafusos animados são apenas indicados.",
      "caption": "Primeiro pressione rolamento → Alinhamento geral · Diagrama de grupo de furos"
    },
    "t-yaw-l": {
      "short": "Instale o conector esquerdo",
      "title": "Instale o lado esquerdo rolamento e o conector na direção do espelho",
      "text": "Primeiro pressione o outro rolamento grande no conector independente P6-07 e, em seguida, mova este componente para o lado esquerdo do corpo para fixá-lo.",
      "check": "O filme original 09:57 pode ser visto como rolamento. As partes esquerda e direita usam suas próprias grades reais; o número de parafusos e as posições precisas dos furos em cada lado precisam ser verificados.",
      "caption": "Direção do espelho · Pressione rolamento primeiro e depois instale o conector"
    },
    "t-roll-pair": {
      "short": "Pegue o quadril servo",
      "title": "Remova os dois quadris ID21 e ID11 e servo",
      "text": "O ângulo de visão do filme original na área de trabalho é ID21 à esquerda e ID11 à direita. Os dois servo são primeiro colocados na posição de preparação independente e ainda não foram carregados no corpo.",
      "check": "Verifique o número e o status de centralização e prepare-se para remover o braço do servo original.",
      "caption": "Tela esquerda 21 · Tela direita 11"
    },
    "t-roll-horns": {
      "short": "Centro de descarga braço do servo",
      "title": "Primeiro remova o parafuso central e, em seguida, remova os dois braço do servo originais",
      "text": "Remova os parafusos de fixação central originais em sequência e, em seguida, remova braço do servo ao longo da direção axial. As peças pequenas que foram retiradas ficam guardadas na área de peças ao lado.",
      "check": "As especificações dos parafusos centrais originais não foram verificadas e não são contados como parafusos auto-roscantes M2×6.",
      "caption": "Remova o parafuso central primeiro → depois retire braço do servo"
    },
    "t-motor-r": {
      "short": "Instale o motor do quadril direito",
      "title": "Após a fiação, instale o lado direito ID11 quadril servo",
      "text": "De acordo com a peça original, conecte primeiro o fio reservado no corpo e depois conecte a extremidade livre do fio existente na perna direita completa. Após a conclusão de duas inserções, coloque o ID11 no conector direito e, finalmente, fixe os dois M2×6.",
      "check": "As extremidades dos fios e os pinos são apenas para ilustração, e a polaridade ou ramificações do barramento não podem ser determinadas com base na aparência do fio preto de três núcleos. Preservar a margem de movimento articular.",
      "caption": "Conecte primeiro → Alinhamento · M2×6 ×2"
    },
    "t-cover-r": {
      "short": "Instale a tampa direita",
      "title": "Fixe a tampa direita do Roll servo com quatro parafusos",
      "text": "Encaixe a placa de cobertura P6-02 no quadril direito, certifique-se de que chicote de cabos não esteja preso na placa de cobertura e, em seguida, fixe as quatro peças M2×6.",
      "check": "Após a fixação da tampa, pressione rolamento no conector superior da perna completa independente; a perna inteira ainda não está conectada.",
      "caption": "Alinhe a tampa · M2×6 ×4"
    },
    "t-bearing-r": {
      "short": "Pressione o grande rolamento direito",
      "title": "Antes de conectar a perna, pressione o rolamento grande na conexão direita",
      "text": "Consulte a cena após 11:18 no vídeo: Pressione o novo 16×22×4 mm e o rolamento maior axialmente no conector superior da perna direita independente e, em seguida, prepare-se para conectar esta perna ao corpo do robô.",
      "check": "Este não é o rolamento superior já instalado no módulo da perna. Esta etapa apenas pressiona o novo rolamento, e a perna direita ainda está na posição de prontidão; a cooperação coaxial é um sinal.",
      "caption": "Primeiro pressione rolamento · A perna intacta não se moverá por enquanto."
    },
    "t-join-r": {
      "short": "Acesse a perna direita",
      "title": "Anexe o subconjunto completo da perna direita ao corpo",
      "text": "Mova a perna direita instalada como um todo para a posição de conexão do corpo, alinhe-a e fixe os quatro M2×6. Os parafusos nas pernas rolamento e chicote de cabos se movem juntos.",
      "check": "Mova apenas esta perna. A outra perna permanece na posição de preparação; a posição do furo e as tolerâncias de montagem ainda precisam ser verificadas fisicamente.",
      "caption": "Integração completa da perna direita · M2×6 ×4"
    },
    "t-motor-l": {
      "short": "Instale o motor do quadril esquerdo",
      "title": "Após a fiação, instale o outro lado ID21 quadril servo",
      "text": "De acordo com a direção do espelho, primeiro conecte a linha reservada no corpo e, em seguida, conecte a extremidade livre da linha existente na perna esquerda completa. Após a conclusão das duas inserções, instale o ID21 no conector e fixe os dois M2×6.",
      "check": "A perna direita acabada permanece conectada. Os caminhos e terminais chicote de cabos continuam marcados como esquemáticos e nenhum pino elétrico é inferido.",
      "caption": "Conecte primeiro → Alinhamento · M2×6 ×2"
    },
    "t-cover-l": {
      "short": "Instale a tampa esquerda",
      "title": "Fixe a tampa do outro lado Roll servo",
      "text": "Encaixe a placa de cobertura P6-03 no quadril esquerdo, verifique se chicote de cabos evita costuras e, em seguida, fixe quatro peças M2×6.",
      "check": "A perna esquerda ainda está na posição de preparação independente. O próximo passo é instalar o novo rolamento em seu conector superior.",
      "caption": "Alinhe a tampa · M2×6 ×4"
    },
    "t-bearing-l": {
      "short": "Pressione grande para a esquerda rolamento",
      "title": "Antes de inserir a segunda perna, pressione rolamento",
      "text": "Consulte a cena após 12:28 no vídeo: Pressione o outro novo rolamento grande no conector superior da perna esquerda independente e, em seguida, conecte o segundo conjunto completo da perna.",
      "check": "A perna direita foi instalada; a perna esquerda ainda não se moveu. A postura e a superfície de contato do rolamento são ilustradas usando o modelo existente.",
      "caption": "Pressione rolamento primeiro · A perna esquerda ainda está na posição de prontidão"
    },
    "t-join-l": {
      "short": "Acesse a perna esquerda",
      "title": "Anexe a segunda perna completa e prenda-a",
      "text": "Mova o subconjunto da perna esquerda para a posição de conexão do corpo como um todo, verifique o alinhamento e fixe quatro M2×6.",
      "check": "Todas as peças instaladas na perna esquerda se movem junto com chicote de cabos; a perna direita permanece estacionária.",
      "caption": "Integração completa da perna esquerda · M2×6 ×4"
    },
    "t-complete": {
      "short": "Verifique as pernas",
      "title": "Verifique a conexão entre o corpo e as pernas",
      "text": "O corpo, quadris servo e duas pernas já estão conectados no protótipo. Gire para visualizar a orientação de ambos os lados, placa de cobertura e reserva chicote de cabos.",
      "check": "Somente o status da animação é verificado aqui. As posições dos furos, tolerâncias, pontas dos fios e suporte de carga física ainda não foram aceitos, e a próxima etapa continuará com o cabeçote e pescoço e a montagem final.",
      "caption": ""
    },
    "head-yaw-motor": {
      "short": "Primeiro rolamento e depois servo",
      "title": "Pressione rolamento primeiro e depois fixe ID32 e o primeiro colchete",
      "text": "De acordo com a peça original, primeiro pressione um rolamento no primeiro suporte branco, depois insira o ID32 numerado e centralizado e, em seguida, fixe quatro M2×6 após o encaixe. O primeiro colchete usa P6-01.",
      "check": "rolamento é instalado esquematicamente ao longo do eixo do cilindro da grade fonte; a superfície axial do assento e as tolerâncias físicas de ajuste ainda precisam ser verificadas.",
      "caption": "Pressione rolamento primeiro, depois encaixe e fixe M2×6 ×4"
    },
    "head-yaw-wire": {
      "short": "Cabo giratório plugável",
      "title": "Conecte a linha servo em ID32",
      "text": "Alinhe a direção da interface visível e pressione o plugue no lugar; mantenha o segmento de linha subsequente ao redor do colchete.",
      "check": "O caminho chicote de cabos e a identidade do soquete são para fins de ensino e os pinos e a polaridade precisam ser verificados.",
      "caption": "Pressione no lugar · Indicação do ponto final"
    },
    "head-bearings": {
      "short": "Pressione rolamento primeiro",
      "title": "Primeiro pressione rolamento no suporte independente",
      "text": "Pegue o segundo suporte branco P6-08, pressione rolamento nas duas posições rolamento do suporte independente de acordo com a peça original e, em seguida, monte ID33.",
      "check": "O primeiro rolamento foi instalado no primeiro suporte; aqui estão os outros dois no segundo colchete. A posição axial segue a grade de origem e o ajuste físico precisa ser verificado.",
      "caption": "Segundo colchete · Pressione dois rolamento em sequência"
    },
    "head-roll-motor": {
      "short": "Carregar segundo servo",
      "title": "Instale ID33 no suporte preparado",
      "text": "De acordo com o vídeo, pegue ID33, alinhe-o com o suporte que pressionou rolamento, e primeiro fixe os quatro M2×6 marcados na primeira parte da tela.",
      "check": "As submontagens ID32 e chicote de cabos são mantidas; o conjunto final de furos para ambos os locais de fixação ainda precisa ser verificado.",
      "caption": "A primeira fixação · M2×6 ×4"
    },
    "head-core-join": {
      "short": "Módulo de rotação combinado",
      "title": "Conecte os subcomponentes das duas cabeças servo",
      "text": "Mantenha o subconjunto ID32 no lugar e conecte o subconjunto do suporte ID33 que instalou o rolamento como um todo. Em seguida, use quatro parafusos M2×6 para fixá-lo de acordo com as instruções marcadas no segundo lugar da tela.",
      "check": "P6-08 e seus dois rolamento se movem com a submontagem ID33; P6-01 e o primeiro rolamento permanecem no lado ID32. O eixo do furo vem da grade de origem e o ajuste físico precisa ser verificado.",
      "caption": "Encaixe geral e refixação de subconjuntos M2×6 ×4"
    },
    "head-core-horn-wire": {
      "short": "Desinstalar e conectar",
      "title": "Remova a saída do cabeçote braço do servo e conecte-a",
      "text": "Primeiro desaparafuse o parafuso de fixação central original, depois remova o braço do servo e mantenha-o próximo a ele; em seguida, conecte a linha servo visível.",
      "check": "O parafuso central original não é classificado como auto-roscante M2. As localizações do eixo de saída e do conector ainda são indicativas.",
      "caption": "Remova o parafuso central primeiro e depois retire o braço do servo"
    },
    "head-platform": {
      "short": "Coloque na plataforma principal",
      "title": "Coloque o subconjunto rotativo na plataforma principal como um todo",
      "text": "Coloque o subconjunto de rotação do cabeçote conectado na plataforma do cabeçote P2-02 como um todo. Deixe os fios conectados saírem pela abertura.",
      "check": "rolamento, parafusos instalados, chicote de cabos e plugue movem-se juntos; não pressione o fio sob a plataforma.",
      "caption": "O subconjunto é colocado como um todo e os fios são conduzidos para fora da abertura."
    },
    "head-mouth-prepare": {
      "short": "Verifique a boca servo",
      "title": "Remova um bocal servo e verifique o número",
      "text": "O subtítulo do servo no filme original diz \"Número 33\", e o software oficial define a boca como ID34; este protótipo mantém a ambigüidade de 33 / 34 e o número real precisa ser verificado.",
      "check": "Não altere o número de outro ID33 com base nisso. A geometria serve apenas como candidata independente para a boca servo.",
      "caption": "Vídeo 33 / Oficial 34 · A ser verificado"
    },
    "head-mouth-horn-wire": {
      "short": "Linha de descarga da boca servo",
      "title": "Remova o bocal braço do servo e conecte chicote de cabos",
      "text": "Primeiro retire o parafuso de fixação central, depois retire a boca braço do servo e guarde-a. Insira a linha servo conforme o vídeo e pressione-a no lugar.",
      "check": "A ambiguidade de numeração permanece. A codificação do conector, os soquetes reais e a pinagem não são confirmados por esta animação.",
      "caption": "Primeiro remova braço do servo e depois conecte chicote de cabos"
    },
    "head-mouth-jaw": {
      "short": "Instale o servo da boca e a mandíbula",
      "title": "Instale o servo da boca e depois encaixe a mandíbula do robô",
      "text": "Primeiro coloque a boca do robô servo na plataforma. Alinhe ambos os lados da mandíbula do robô P2-01 com o eixo de transmissão e a posição de suporte e, em seguida, insira-a. chicote de cabos deve passar pela abertura e sobressair.",
      "check": "Esta animação expressa a relação da sequência; os furos do eixo em ambos os lados, as folgas reais e a precisão correspondente precisam ser verificadas.",
      "caption": "Posicione o servo e depois encaixe a mandíbula do robô"
    },
    "head-servo-support": {
      "short": "Cubra a fixação",
      "title": "Instale a peça de fixação do cabeçote servo",
      "text": "Encaixe a peça de fixação do cabeçote P4-02 servo no mecanismo da plataforma. De acordo com as instruções da primeira legenda, utilize quatro parafusos M2×6 para fixá-lo.",
      "check": "Mantenha sua mandíbula móvel e evite chicote de cabos. As posições específicas dos quatro furos ainda são indicativas.",
      "caption": "O primeiro grupo de buracos · M2×6 ×4"
    },
    "head-platform-fix": {
      "short": "Lado de saída do queixo fixo",
      "title": "Quatro furos no lado de saída do queixo fixo",
      "text": "De acordo com as instruções dos segundos quatro M2×6 da peça original, fixe-a pela parte externa do lado condutor do queixo. O eixo de quatro furos da grade de origem P2-01 é usado aqui.",
      "check": "Os parafusos instalados abrem e fecham junto com o queixo. O eixo do furo da grade de origem pode ser verificado, mas as especificações físicas e a coordenação ainda precisam ser verificadas.",
      "caption": "Lado de saída do queixo · M2×6 ×4"
    },
    "head-mouth-check": {
      "short": "Verifique abertura e fechamento da boca",
      "title": "Verifique a abertura e fechamento do queixo e o status do chicote de cabos",
      "text": "Mova suavemente a parte da mandíbula inferior do robô para verificar se ele pode abrir e fechar, se não está obviamente preso e se não há cabos presos em nenhum dos lados. A animação demonstra a abertura e o fechamento apenas uma vez.",
      "check": "Este é apenas um sinal de abertura e fechamento, e no final retornará à posição fechada; se o produto real é liso, a lacuna e o ângulo servo precisam ser verificados.",
      "caption": "Simular abertura → fechamento · Objeto real a ser verificado"
    },
    "head-neck-pair": {
      "short": "Conecte dois servo",
      "title": "Organize ID31 e ID30 e instale a primeira placa de conexão",
      "text": "A perspectiva da área de trabalho do filme original é ID31 à esquerda e ID30 à direita. Primeiro fixe a primeira placa de conexão em um servo e, em seguida, conecte a outra para completar os furos restantes da placa de conexão.",
      "check": "O vídeo é marcado primeiro com peças 2 e depois com peças 4. Resta verificar se se trata de uma quantidade cumulativa. A fonte P3-02 possui apenas quatro furos e a animação é representada por quatro furos reais sem criar dois furos adicionais.",
      "caption": "Fixe uma extremidade primeiro e depois conecte a outra servo"
    },
    "head-neck-plate": {
      "short": "Instale a segunda placa de conexão",
      "title": "Instale outra placa de conexão do pescoço",
      "text": "Instale a placa de conexão candidata P3-03 no outro lado e fixe quatro M2×6 conforme mostrado no vídeo para formar um subconjunto de pescoço duplo servo.",
      "check": "Complete primeiro os painéis de conexão em ambos os lados e depois conecte todo o pescoço à cabeça.",
      "caption": "Placa de conexão do outro lado · M2×6 ×4"
    },
    "head-neck-join": {
      "short": "Conecte cabeça e pescoço",
      "title": "Conecte o pescoço duplo servo à cabeça",
      "text": "Instale o pescoço já montado como uma unidade na articulação de inclinação da cabeça. O vídeo original exige que a saída do cabo fique à esquerda de quem está montando.",
      "check": "A esquerda de quem está montando não é necessariamente a esquerda do robô. A orientação, a posição dos furos e a operação de montagem correspondente a P6-01 ainda precisam ser verificadas.",
      "caption": "Confira a saída do cabo pela esquerda de quem está montando."
    },
    "head-neck-fix": {
      "short": "Conexão fixa de cabeça e pescoço",
      "title": "Dois grupos de furos para fixação da conexão cabeça e pescoço",
      "text": "Fixe as duas articulações da cabeça e pescoço em sequência de acordo com o vídeo, e cada legenda é marcada com quatro M2×6.",
      "check": "Os dois grupos giram em sequência. A posição real do furo, a direção axial e o consumo total devem ser revisados ​​na tabela física furo a furo.",
      "caption": "Fixado em dois lugares · Cada M2×6 ×4"
    },
    "head-neck-wire": {
      "short": "Fio e deixe margem",
      "title": "Conecte o barramento do pescoço do conector e organize os laços de fio",
      "text": "Insira o pescoço do conector chicote de cabos de acordo com a ação visível e, em seguida, organize o laço do fio para deixar margem para inclinação e rotação. Deixe as pontas dos fios usadas para montagem posterior do lado de fora.",
      "check": "Os laços e extremidades dos fios são para fins didáticos; as duas extremidades de cada fio, a sequência de conexão em série e os pinos elétricos precisam ser verificados.",
      "caption": "Organize chicote de cabos primeiro e depois feche o shell"
    },
    "head-shell": {
      "short": "Conjunto de capa de cabeça",
      "title": "Coloque a capa branca na cabeça",
      "text": "Coloque a tampa do cabeçote P4-01 no mecanismo do cabeçote concluído, deixando o chicote de cabos reservado fora da abertura.",
      "check": "Herde a malha real existente. A versão da carcaça, a posição de encaixe e a folga estão sujeitas a verificação.",
      "caption": "Coloque a cobertura da cabeça · Evite chicote de cabos"
    },
    "head-shell-fix": {
      "short": "Tampa fixa interna da cabeça",
      "title": "Fixe a tampa da cabeça por dentro",
      "text": "De acordo com o subtítulo sobre 17:31, conserte dois M2×6 por dentro.",
      "check": "As posições dos parafusos são para fins didáticos. Certifique-se de que chicote de cabos não esteja imprensado entre a tampa do cabeçote e a plataforma.",
      "caption": "Fixação interna · M2×6 ×2"
    },
    "head-eyes": {
      "short": "Instale olheiras nos olhos",
      "title": "Instale olheiras e acessórios para os olhos",
      "text": "Alinhe os orifícios frontais da tampa da cabeça e instale as bordas oculares P2-06 e os candidatos aos componentes oculares P3-01.",
      "check": "O vídeo não mostra claramente as pequenas partes internas, uma por uma. A sequência e os métodos de engajamento aqui são apenas para referência.",
      "caption": "Alinhe os orifícios frontais · A identidade de itens pequenos precisa ser verificada"
    },
    "head-lower-tape": {
      "short": "Fita dupla face no lábio inferior",
      "title": "Primeiro, aplique fita dupla-face na superfície plana da almofada de queixo",
      "text": "Primeiro processe a almofada macia no queixo de acordo com a peça original e cole fita dupla-face na parte inferior plana. A animação mantém almofadas visíveis e filmes independentes.",
      "check": "O filme está na superfície externa da grade. A espessura e faixa de corte são para referência; o próximo passo é instalá-lo no queixo junto com a almofada macia.",
      "caption": "Primeiro aplique fita dupla-face na almofada do queixo"
    },
    "head-lower-pad": {
      "short": "Almofada de queixo",
      "title": "Primeiro coloque a almofada no queixo",
      "text": "Consulte a demonstração no filme original: Fixe a almofada colada da mandíbula do robô como um todo à parte aberta da mandíbula do robô, alise-a e encaixe-a. A grade de origem usa P1-01.",
      "check": "O filme e a almofada se movem juntos e as identidades superior e inferior dos arquivos de origem são mantidas como candidatas; o material físico e a solidez da ligação precisam ser verificados.",
      "caption": "Aplique a almofada de queixo primeiro"
    },
    "head-upper-tape": {
      "short": "Fita dupla face na boca",
      "title": "Em seguida, cole fita dupla-face na superfície plana da almofada bucal superior.",
      "text": "Em seguida, processe a almofada macia da boca superior, cole fita dupla-face na superfície plana exposta e pressione-a na boca superior como um todo.",
      "check": "O filme está localizado na superfície externa da grade, e a espessura, contorno e resistência de ligação ainda são para fins didáticos.",
      "caption": "Em seguida, aplique fita dupla-face na almofada bucal superior"
    },
    "head-upper-pad-check": {
      "short": "Aplique a almofada para fechar",
      "title": "Coloque a almofada bucal e verifique o ajuste da boca superior e inferior",
      "text": "Consulte a demonstração do filme original: prenda a almofada macia da boca superior do robô junto com o filme na parte superior da boca do robô; use P1-02 para a grade de origem. Em seguida, verifique se as partes superiores e inferiores da boca do robô se encaixam bem e se há alguma lacuna óbvia.",
      "check": "Esta etapa simula apenas uma vez a abertura e o fechamento e retorna à postura de fechamento do diretório; ajuste perfeito, movimento suave e margem chicote de cabos devem ser verificados pelo objeto real.",
      "caption": "Simular fechamento após montagem · O produto real deve ser verificado"
    },
    "final-battery": {
      "short": "Armazenamento de bateria",
      "title": "Coloque a bateria e retire o cabo de alimentação",
      "text": "Coloque a bateria no compartimento independente da bateria, passe os cabos de alimentação e conectores vermelhos e pretos pela abertura e, em seguida, instale o compartimento da bateria no corpo.",
      "check": "O tamanho da bateria segue o formato conceitual do modelo original, e o tamanho físico, as posições dos conectores e a polaridade ainda não foram verificados. A cor da linha não representa um pino verificado.",
      "caption": "Entre primeiro no armazém · O cabo de alimentação sai pela abertura"
    },
    "final-tray": {
      "short": "Instale o compartimento da bateria",
      "title": "Prenda o compartimento da bateria que contém a bateria ao corpo",
      "text": "Alinhe a bateria e o compartimento da bateria como um conjunto com a parte traseira do corpo do robô. De acordo com as instruções do vídeo, use parafusos auto-roscantes de cabeça plana escareada 4 M2×6 para fixá-lo.",
      "check": "Alinhe primeiro e depois fixe, mantendo o cabo de alimentação afastado; a posição e a coordenação do parafuso são instruções de ensino e você deve verificar o objeto real furo por furo.",
      "caption": "Os componentes estão instalados como um todo · M2×6 ×4"
    },
    "final-body-shells": {
      "short": "Instale a carroceria",
      "title": "Instale a carroceria em ambos os lados e guarde a fiação superior",
      "text": "Alinhe e instale as duas carrocerias do robô, mantendo a saída superior chicote de cabos. Aproximadamente 19:05, as legendas do vídeo mostram um total de parafusos 5 M2×6. Esta etapa apenas demonstra esse total e não especifica a quantidade por lado.",
      "check": "A distribuição lado a lado e furo a furo dos chips 5 ainda não foi verificada. Na figura, os furos redondos existentes na grade de origem são usados ​​como candidatos de ensino, e a verdadeira atribuição do passo dos furos superiores e inferiores e dos furos de costura ainda não foi verificada; a conclusão de 5 por lado não se baseia nisso.",
      "caption": "M2×6 ×5 · Candidato a furo de origem, atribuído para ser verificado"
    },
    "final-head-join": {
      "short": "Conecte toda a cabeça e pescoço",
      "title": "Anexe todo o conjunto instalado de cabeça e pescoço ao corpo",
      "text": "Mova a cabeça, o pescoço, os parafusos e o chicote de cabos do robô completo como um todo. Primeiro coloque a parte inferior da conexão servo na posição de instalação e, em seguida, consulte as marcações de vídeo para fixá-la com os parafusos 4 M2×6 em cada lado.",
      "check": "A cabeça e o pescoço devem mover-se como um todo, não apenas o crânio. O número total de peças 4 em cada lado deste protótipo é de peças 8; a posição real do furo, o eixo de instalação e a versão ainda precisam ser verificados.",
      "caption": "A cabeça e o pescoço estão no lugar como um todo · M2×6 ×4 em ambos os lados"
    },
    "final-board-mate": {
      "short": "Conecte duas placas",
      "title": "Alinhe o cabeçalho do pino e conecte UNO Q na placa de expansão Luwu",
      "text": "Pegue as placas de expansão UNO Q e Luwu respectivamente, alinhe os pinos da placa de expansão com os conectores UNO Q e pressione-os no lugar ao longo da direção de acoplamento. Os dois tabuleiros são sempre objetos independentes.",
      "check": "O modelo de placa confirmado é usado; O alinhamento dos pinos 32 e o espaçamento de modelagem 12.3mm foram verificados e as localizações dos furos são estimadas a partir de fotos. Os dois furos de montagem estão desalinhados em cerca de 1.27mm e a inserção física, tolerâncias e pinos elétricos não foram verificados.",
      "caption": "Duas placas independentes · Alinhe os cabeçalhos com os cabeçalhos"
    },
    "final-board-mount": {
      "short": "controlador fixo",
      "title": "Fixe o conjunto de duas placas inserido ao corpo",
      "text": "Mantendo as duas placas conectadas uma à outra, mova o conjunto de controle principal para a parte traseira do corpo do robô. As peças originais estão marcadas como 4 e M3×16; este modelo demonstra apenas a inserção de dois furos quase coaxiais, sendo os dois restantes reservados para verificação.",
      "check": "A peça original possui peças 4; os furos 2 deste modelo são quase coaxiais e os furos 2 estão aproximadamente 1.27mm desalinhados. O estado completo da passagem pelas duas placas ainda não é mostrado. O formato da placa de origem, a posição do furo, a espessura do PCB e o passo da fileira de pinos não foram esticados ou corrigidos; o suporte corporal e a coordenação física precisam ser verificados.",
      "caption": "Filme original M3×16 ×4 · Demonstra furos 2, e os outros furos 2 devem ser verificados"
    },
    "final-power": {
      "short": "Conecte o cabo da bateria",
      "title": "Insira o conector restante da bateria na porta da bateria na placa de controle",
      "text": "Mova o conector do compartimento da bateria para a interface da bateria da placa de expansão, alinhe-o com a chave do conector e pressione-o no lugar. Ações e caminhos são demonstrados aqui.",
      "check": "A polaridade exata, numeração dos pinos, posição da chave do conector e revisão da placa de vídeo não foram verificadas; as linhas duplas vermelhas e pretas na imagem não constituem base para fiação.",
      "caption": "Mire na porta da bateria. A polaridade e a posição chave precisam ser verificadas."
    },
    "final-buses": {
      "short": "Insira o barramento um por um",
      "title": "Conecte os três barramentos principais servo na placa de expansão, um por um",
      "text": "Alinhe e pressione os três plugues de três pinos em sequência. O vídeo confirma que existem três conexões na placa-mãe; esta etapa demonstrará as três conexões separadamente.",
      "check": "A topologia, os terminais reais e os pinos do ramal de três fios ID não foram rastreados claramente. A placa de expansão possui diferenças de revisão de interface e GND, SIGNAL ou a posição do pino da fonte de alimentação não podem ser identificados com base na aparência do modelo.",
      "caption": "Três plug-ins, endpoints e pinos separados a serem verificados"
    },
    "final-thigh-first": {
      "short": "Primeira concha lateral da coxa",
      "title": "Instale o primeiro alojamento lateral da coxa",
      "text": "Instale a primeira concha lateral da coxa e fixe a marca da legenda com parafusos auto-roscantes de cabeça chata 2 M2.3×4. O protótipo primeiro demonstra o lado direito do robô, e o mapeamento esquerdo e direito do vídeo precisa ser verificado.",
      "check": "20: As legendas 37 M2.3×4 são diferentes das legendas oficiais BOM M2.3×8; as especificações originais do filme são mantidas e não são substituídas diretamente ou usadas para compra. A localização dos furos está sujeita a verificação.",
      "caption": "Vídeo M2.3×4 ×2 · Diferenças de BOM"
    },
    "final-route": {
      "short": "Organizar chicote de cabos",
      "title": "Organize chicote de cabos para deixar espaço para a carcaça e as juntas do outro lado",
      "text": "Organize os loops chicote de cabos visíveis de modo que o chicote de cabos evite as juntas de pressão do alojamento e as áreas de atividade conjunta. Deixe uma margem adequada antes de instalar o outro lado da caixa.",
      "check": "A fiação é uma representação visual e o raio de curvatura físico, o comprimento do fio e a folga de movimento não foram verificados; esta etapa não requer a desconexão do plugue da placa-mãe conectada.",
      "caption": "Mantenha os conectores conectados · Organize as margens"
    },
    "final-thigh-second": {
      "short": "Concha da coxa do outro lado",
      "title": "Instale a proteção da coxa do outro lado para completar a montagem final desta seção.",
      "text": "Instale a outra carcaça da coxa na direção do espelho. 20: As legendas 57 também são marcadas como 2 e M2.3×4, mantendo as diferenças de especificação entre o filme original e BOM.",
      "check": "Esta seção termina com a montagem final de 20:58. Controle, numeração e calibração são descritos nos capítulos subsequentes. Este módulo não verifica a inicialização ou a precisão mecânica.",
      "caption": "O outro lado M2.3×4 ×2 · Acabamento da montagem final"
    },
    "calibration-power": {
      "short": "Inicialização após a montagem",
      "title": "Ligue a máquina após a conclusão da montagem",
      "text": "Este parágrafo mostra apenas a sequência de ensino. Verifique as conexões mecânicas do robô e do chicote de cabos e siga as instruções do vídeo para abrir a página de configuração do dispositivo em seu próprio dispositivo real.",
      "check": "Este protótipo não se conecta ao hardware; o seguinte mostra apenas a sequência de ensino.",
      "caption": "Demonstração de ensino · Sem controle de equipamento real"
    },
    "calibration-start": {
      "short": "Iniciar calibração",
      "title": "Digite Calibration e inicie a calibração",
      "text": "Digite Calibration na interface do dispositivo real, clique em Start calibration e estabilize o robô.",
      "check": "As poses finalizadas na página não indicam que o robô real foi calibrado.",
      "caption": "Demonstração de ensino · Sem controle de equipamento real"
    },
    "calibration-servos": {
      "short": "Ajuste 15 ID um por um",
      "title": "Ajuste a posição zero mecânica de todos os servo um por um",
      "text": "Ajuste o controle deslizante ID um por um de acordo com a interface do dispositivo e pressione Finish quando terminar. Perna direita 10–14, perna esquerda 20–24, cabeça, pescoço e boca 30–34.",
      "check": "Cada ID requer verificação de juntas físicas; a lista nesta página não é um resultado de calibração do dispositivo.",
      "caption": "Demonstração de ensino · Sem controle de equipamento real"
    },
    "calibration-pose": {
      "short": "Verifique as articulações do corpo",
      "title": "Verifique a centralização, as articulações e a postura dos pés",
      "text": "Continue a fazer ajustes finos com base na foto original: o corpo está centralizado, as articulações estão alinhadas e os pés estão planos até que a coisa real fique firme.",
      "check": "O modelo em pé deste protótipo é utilizado apenas para o ensino da observação e não pode substituir a inspeção da postura física.",
      "caption": "Demonstração de ensino · Sem controle de equipamento real"
    },
    "calibration-exit": {
      "short": "Sair da calibração",
      "title": "Sair da calibração após completar cada junta",
      "text": "Depois que todos os servo forem concluídos, clique em Exit de acordo com a imagem original e saia da página de configuração.",
      "check": "Confirme se todos os ID foram processados ​​antes de realizar a verificação de atitude padrão.",
      "caption": "Demonstração de ensino · Sem controle de equipamento real"
    },
    "calibration-default": {
      "short": "Verifique a pose padrão",
      "title": "Execute Default pose",
      "text": "Execute Default pose em um dispositivo real e observe se o corpo e as pernas atingem a postura esperada.",
      "check": "Nenhum comando de movimento é enviado aqui, nem o equilíbrio físico é simulado.",
      "caption": "Demonstração de ensino · Sem controle de equipamento real"
    },
    "robot-complete": {
      "short": "Visão completa da máquina",
      "title": "Tutorial completo de montagem da máquina",
      "text": "Agora você pode girar para ver o robô completo ou voltar para qualquer estágio para reproduzir. O filme original mostra o controle remoto e a entrada pedonal no final.",
      "check": "Este é um protótipo de ensino independente; a fiação real, a correspondência da posição dos furos e a calibração do equipamento ainda exigem verificação física.",
      "caption": ""
    }
  },
  "chapters": {
    "prepare": {
      "name": "Preparação e Numeração"
    },
    "right-ankle": {
      "name": "tornozelo direito"
    },
    "left-ankle": {
      "name": "tornozelo esquerdo"
    },
    "right-leg": {
      "name": "Conexão da perna direita"
    },
    "left-leg": {
      "name": "conexão da perna esquerda"
    },
    "finish": {
      "name": "Acabamento das pernas"
    },
    "torso-base": {
      "name": "Apoio Corporal e Quadril"
    },
    "torso-legs": {
      "name": "Motores do quadril e articulações das pernas"
    },
    "head-core": {
      "name": "Rotação da cabeça e fiação"
    },
    "head-mouth-neck": {
      "name": "Boca e pescoço duplo servo"
    },
    "head-finish": {
      "name": "Capa para cabeça e almofadas bucais"
    },
    "final-body": {
      "name": "Montagem de corpo e cabeça e pescoço"
    },
    "final-electronics": {
      "name": "Controle eletrônico e acabamento da carcaça"
    },
    "calibration": {
      "name": "Calibração e conclusão"
    }
  },
  "actors": {
    "p_uno": {
      "label": "Arduino UNO Q · Aparência confirmada do lote v2",
      "source": "Modelo fotográfico confirmado · Conversão de unidade uniforme 1000; a estimativa do furo de montagem e o mapeamento elétrico não foram verificados fisicamente"
    },
    "p_extension": {
      "label": "Placa de expansão Luwu · Aparência confirmada v2",
      "source": "Modelo fotográfico confirmado · Conversão de unidade uniforme 1000; a estimativa do furo de montagem e o mapeamento elétrico não foram verificados fisicamente"
    },
    "p_battery": {
      "label": "Bateria de alimentação temporária · Modelo de ensino",
      "source": "O tamanho da bateria e os conectores estão sujeitos a verificação física"
    },
    "p_motor": {
      "label": "Único servo a ser configurado",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "p_powerCable": {
      "label": "Teste o cabo de alimentação da bateria",
      "source": "A fiação e a polaridade são apenas para fins didáticos."
    },
    "p_servoCable": {
      "label": "Linha de teste única servo",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "p_usb": {
      "label": "Cabo de conexão Type-C · modelo de ensino simples",
      "source": "Demonstra apenas a direção da conexão do computador"
    },
    "motor": {
      "label": "Direitaservo · ID14",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente.",
      "chip": "servo"
    },
    "foot": {
      "label": "Pé direito · P2-03",
      "source": "Grade 3MF real",
      "chip": "pé"
    },
    "shank": {
      "label": "Panturrilha direita · P6-04",
      "source": "Grade 3MF real",
      "chip": "panturrilha"
    },
    "bearing": {
      "label": "Direita pequena rolamento · 10×15×3",
      "source": "Grade auxiliar existente",
      "chip": "Pequenorolamento"
    },
    "axle": {
      "label": "Eixo do tornozelo direito · P2-05",
      "source": "Grade real·Diagrama de posicionamento",
      "chip": "eixo do tornozelo"
    },
    "horn": {
      "label": "braço do servo removido da direita",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "hornScrew": {
      "label": "Parafuso central original direito braço do servo",
      "source": "Instruções de ensino adicionadas · Especificações a serem verificadas"
    },
    "plug": {
      "label": "Plugue servo direito de três pinos",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "wire": {
      "label": "Linha servo direita de três núcleos",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "shankScrew0": {
      "label": "Parafuso de fixação da panturrilha direita 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×2"
    },
    "shankScrew1": {
      "label": "Parafuso de fixação da panturrilha direita 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "footScrew0": {
      "label": "Parafuso de fixação do pé direito 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "footScrew1": {
      "label": "Parafuso de fixação do pé direito 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "footScrew2": {
      "label": "Parafuso de fixação do pé direito 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "footScrew3": {
      "label": "Parafuso de fixação do pé direito 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "axisScrew": {
      "label": "Parafuso de fixação da haste do tornozelo direito · M2.3×8",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2.3×8"
    },
    "l_motor": {
      "label": "Esquerdaservo · ID24",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente.",
      "chip": "servo"
    },
    "l_foot": {
      "label": "Pé esquerdo · P2-04",
      "source": "Grade 3MF real",
      "chip": "pé"
    },
    "l_shank": {
      "label": "Panturrilha esquerda · P6-05",
      "source": "Grade 3MF real",
      "chip": "panturrilha"
    },
    "l_bearing": {
      "label": "Zuo Xiaorolamento · 10×15×3",
      "source": "Grade auxiliar existente",
      "chip": "Pequenorolamento"
    },
    "l_axle": {
      "label": "Eixo do tornozelo esquerdo · P2-07",
      "source": "Grade real·Diagrama de posicionamento",
      "chip": "eixo do tornozelo"
    },
    "l_horn": {
      "label": "braço do servo removido da esquerda",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "l_hornScrew": {
      "label": "Parafuso original central esquerdo braço do servo",
      "source": "Instruções de ensino adicionadas · Especificações a serem verificadas"
    },
    "l_plug": {
      "label": "Plugue servo esquerdo de três pinos",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "l_wire": {
      "label": "Linha servo de três núcleos esquerda",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "l_shankScrew0": {
      "label": "Parafuso de fixação da panturrilha esquerda 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×2"
    },
    "l_shankScrew1": {
      "label": "Parafuso de fixação da panturrilha esquerda 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "l_footScrew0": {
      "label": "Parafuso de fixação do pé esquerdo 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_footScrew1": {
      "label": "Parafuso de fixação do pé esquerdo 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "l_footScrew2": {
      "label": "Parafuso de fixação do pé esquerdo 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "l_footScrew3": {
      "label": "Parafuso de fixação do pé esquerdo 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "l_axisScrew": {
      "label": "Parafuso de fixação da haste do tornozelo esquerdo · M2.3×8",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2.3×8"
    },
    "r_upperMotor": {
      "label": "Canto superior direito servo · ID12",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "r_lowerMotor": {
      "label": "Meio direito servo · ID13",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "r_support": {
      "label": "Apoio para coxa direita · P5-04",
      "source": "Grade 3MF real · Coordenação a ser verificada"
    },
    "r_lowerBearing": {
      "label": "Certo grande rolamento · 16×22×4",
      "source": "Grade de hardware existente"
    },
    "r_supportScrew0": {
      "label": "Parafuso de fixação direito 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew1": {
      "label": "Parafuso de fixação direito 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew2": {
      "label": "Parafuso de fixação direito 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_supportScrew3": {
      "label": "Parafuso de fixação direito 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew0": {
      "label": "Parafuso de fixação direito 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew1": {
      "label": "Parafuso de fixação direito 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew2": {
      "label": "Parafuso de fixação direito 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_joinScrew3": {
      "label": "Parafuso de fixação direito 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_upperHorn": {
      "label": "braço do servo original no canto superior direito",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "r_upperHornScrew": {
      "label": "Parafuso central original no lado superior direito",
      "source": "Modelo de ensino simples·Especificações originais a serem verificadas"
    },
    "r_topLink": {
      "label": "Conector superior direito · P3-04",
      "source": "Grade 3MF real · Coordenação a ser verificada"
    },
    "r_topBearing": {
      "label": "Conector direito grande rolamento",
      "source": "Grade de hardware existente"
    },
    "r_topScrew0": {
      "label": "Parafuso de fixação direito 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew1": {
      "label": "Parafuso de fixação direito 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew2": {
      "label": "Parafuso de fixação direito 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_topScrew3": {
      "label": "Parafuso de fixação direito 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_sole": {
      "label": "Almofada para sola do pé direito · P1-03",
      "source": "Grade 3MF real · Coordenação a ser verificada"
    },
    "r_soleScrew0": {
      "label": "Parafuso de fixação direito 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew1": {
      "label": "Parafuso de fixação direito 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew2": {
      "label": "Parafuso de fixação direito 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_soleScrew3": {
      "label": "Parafuso de fixação direito 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "r_legWireA": {
      "label": "Fio de três núcleos dentro da perna direita",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas",
      "chip": "Fio de três núcleos dentro da perna"
    },
    "r_legWireB": {
      "label": "Linha reservada na extremidade superior da perna direita",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas",
      "chip": "Linha reservada na extremidade superior"
    },
    "l_upperMotor": {
      "label": "Canto superior esquerdo servo · ID22",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "l_lowerMotor": {
      "label": "Meio esquerdo servo · ID23",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "l_support": {
      "label": "Apoio para coxa esquerda · P5-05",
      "source": "Grade 3MF real · Coordenação a ser verificada"
    },
    "l_lowerBearing": {
      "label": "Zuo Darolamento · 16×22×4",
      "source": "Grade de hardware existente"
    },
    "l_supportScrew0": {
      "label": "Parafuso de fixação esquerdo 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew1": {
      "label": "Parafuso de fixação esquerdo 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew2": {
      "label": "Parafuso de fixação esquerdo 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_supportScrew3": {
      "label": "Parafuso de fixação esquerdo 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew0": {
      "label": "Parafuso de fixação esquerdo 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew1": {
      "label": "Parafuso de fixação esquerdo 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew2": {
      "label": "Parafuso de fixação esquerdo 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_joinScrew3": {
      "label": "Parafuso de fixação esquerdo 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_upperHorn": {
      "label": "braço do servo original no canto superior esquerdo",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "l_upperHornScrew": {
      "label": "Parafuso central original no lado superior esquerdo",
      "source": "Modelo de ensino simples·Especificações originais a serem verificadas"
    },
    "l_topLink": {
      "label": "Conector superior esquerdo · P3-05",
      "source": "Grade 3MF real · Coordenação a ser verificada"
    },
    "l_topBearing": {
      "label": "Conector esquerdo grande rolamento",
      "source": "Grade de hardware existente"
    },
    "l_topScrew0": {
      "label": "Parafuso de fixação esquerdo 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew1": {
      "label": "Parafuso de fixação esquerdo 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew2": {
      "label": "Parafuso de fixação esquerdo 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_topScrew3": {
      "label": "Parafuso de fixação esquerdo 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_sole": {
      "label": "Almofada para sola do pé esquerdo · P1-04",
      "source": "Grade 3MF real · Coordenação a ser verificada"
    },
    "l_soleScrew0": {
      "label": "Parafuso de fixação esquerdo 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew1": {
      "label": "Parafuso de fixação esquerdo 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew2": {
      "label": "Parafuso de fixação esquerdo 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_soleScrew3": {
      "label": "Parafuso de fixação esquerdo 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "l_legWireA": {
      "label": "Fio de três núcleos dentro da perna esquerda",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas",
      "chip": "Fio de três núcleos dentro da perna"
    },
    "l_legWireB": {
      "label": "Linha reservada na extremidade superior da perna esquerda",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas",
      "chip": "Linha reservada na extremidade superior"
    },
    "t_motor10": {
      "label": "Quadril Yaw servo · ID10",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "t_motor10Horn": {
      "label": "ID10 original braço do servo (reservado)",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "t_motor10HornScrew": {
      "label": "Parafuso central original ID10",
      "source": "Modelo original de ensino do parafuso central·Especificações a serem verificadas"
    },
    "t_motor20": {
      "label": "Quadril Yaw servo · ID20",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "t_motor20Horn": {
      "label": "ID20 original braço do servo (reservado)",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "t_motor20HornScrew": {
      "label": "Parafuso central original ID20",
      "source": "Modelo original de ensino do parafuso central·Especificações a serem verificadas"
    },
    "t_support": {
      "label": "Suporte para quadril Yaw · P6-09",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_supportScrew0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_supportScrew1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_supportScrew2": {
      "label": "Parafuso de fixação 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_supportScrew3": {
      "label": "Parafuso de fixação 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_supportScrew4": {
      "label": "Parafuso de fixação 5 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_supportScrew5": {
      "label": "Parafuso de fixação 6 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_baseWire": {
      "label": "Linha reservada para a placa-mãe do corpo direito · Indicação de extremidade livre",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "t_baseWireL": {
      "label": "Linha reservada para placa-mãe esquerda · Indicação de extremidade livre",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "t_backplate": {
      "label": "Painel traseiro do corpo · P4-03",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_backFrontScrew0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_backFrontScrew1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_backRearScrew0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_backRearScrew1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_yawR": {
      "label": "Conector direito Yaw · P6-06",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_yawBearingR": {
      "label": "Direito Yaw Conector grande rolamento · 16×22×4",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_yawScrewR0": {
      "label": "Diagrama de parafusos de fixação da peça de conexão direita · M2×6 · Quantidade lado a lado a ser verificada",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_yawScrewR1": {
      "label": "Diagrama de parafusos de fixação da peça de conexão direita · M2×6 · Quantidade lado a lado a ser verificada",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_yawScrewR2": {
      "label": "Diagrama de parafusos de fixação da peça de conexão direita · M2×6 · Quantidade lado a lado a ser verificada",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_yawScrewR3": {
      "label": "Diagrama de parafusos de fixação da peça de conexão direita · M2×6 · Quantidade lado a lado a ser verificada",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_motor11": {
      "label": "Quadril direito Roll servo · ID11",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "t_motor11Horn": {
      "label": "ID11 Original braço do servo",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "t_motor11HornScrew": {
      "label": "Parafuso de fixação central original ID11",
      "source": "Modelo original de ensino do parafuso central·Especificações a serem verificadas"
    },
    "t_rollWireR": {
      "label": "Linha reservada do corpo direito ao motor do quadril · Indicação de caminho/ponto final",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "t_motorScrewR0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_motorScrewR1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_coverR": {
      "label": "Tampa direita Roll servo · P6-02",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_coverScrewR0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_coverScrewR1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_coverScrewR2": {
      "label": "Parafuso de fixação 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_coverScrewR3": {
      "label": "Parafuso de fixação 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_legBearingR": {
      "label": "A interface da perna direita é grande rolamento · 16×22×4",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_legScrewR0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_legScrewR1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_legScrewR2": {
      "label": "Parafuso de fixação 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_legScrewR3": {
      "label": "Parafuso de fixação 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_yawL": {
      "label": "Conector esquerdo Yaw · P6-07",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_yawBearingL": {
      "label": "Esquerdo Yaw Conector grande rolamento · 16×22×4",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_yawScrewL0": {
      "label": "Instruções para fixação dos parafusos da peça de conexão esquerda · M2×6 · Quantidade a lado a verificar",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_yawScrewL1": {
      "label": "Instruções para fixação dos parafusos da peça de conexão esquerda · M2×6 · Quantidade a lado a verificar",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_yawScrewL2": {
      "label": "Instruções para fixação dos parafusos da peça de conexão esquerda · M2×6 · Quantidade a lado a verificar",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_yawScrewL3": {
      "label": "Instruções para fixação dos parafusos da peça de conexão esquerda · M2×6 · Quantidade a lado a verificar",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_motor21": {
      "label": "Quadril esquerdo Roll servo · ID21",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "t_motor21Horn": {
      "label": "ID21 Original braço do servo",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "t_motor21HornScrew": {
      "label": "Parafuso de fixação central original ID21",
      "source": "Modelo original de ensino do parafuso central·Especificações a serem verificadas"
    },
    "t_rollWireL": {
      "label": "Linha reservada do corpo esquerdo ao motor do quadril · Indicação de caminho/ponto final",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "t_motorScrewL0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_motorScrewL1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_coverL": {
      "label": "Tampa esquerda Roll servo · P6-03",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_coverScrewL0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_coverScrewL1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_coverScrewL2": {
      "label": "Parafuso de fixação 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_coverScrewL3": {
      "label": "Parafuso de fixação 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_legBearingL": {
      "label": "A interface da perna esquerda é grande rolamento · 16×22×4",
      "source": "Grade de fonte real·Candidato correspondente ao vídeo, a posição/coordenação do furo precisa ser verificada"
    },
    "t_legScrewL0": {
      "label": "Parafuso de fixação 1 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_legScrewL1": {
      "label": "Parafuso de fixação 2 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_legScrewL2": {
      "label": "Parafuso de fixação 3 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "t_legScrewL3": {
      "label": "Parafuso de fixação 4 · M2×6",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "h_pitchSupport": {
      "label": "Primeiro colchete · P6-01",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_motor32": {
      "label": "Rotação da cabeça servo · Candidato ID32",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "h_yawScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_yawScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_yawSupport": {
      "label": "Segundo colchete de abertura · P6-08",
      "source": "Grade de impressão real·Correspondência e coordenação de vídeo estão sujeitas a verificação; o filme original vem com o segundo suporte/submontagem ID33, e a coordenação física está sujeita a verificação"
    },
    "h_bearingFront": {
      "label": "Cabeça grande rolamento ex-candidato · 16×22×4",
      "source": "Grade de hardware existente · ID e interface precisam ser verificadas; de acordo com a peça original, vem com o segundo suporte/subconjunto ID33, e a correspondência física precisa ser verificada"
    },
    "h_bearingBack": {
      "label": "Candidato após rolamento com cabeça grande · 16×22×4",
      "source": "Grade de hardware existente · ID e interface precisam ser verificadas; de acordo com a peça original, vem com o segundo suporte/subconjunto ID33, e a correspondência física precisa ser verificada"
    },
    "h_bearingCrown": {
      "label": "Primeira chave grande rolamento · candidato a vaga",
      "source": "Reutilize a grade anular completa head_yaw_1; ao longo do eixo do cilindro de origem P6-01 x=-0.01, z=40.99, a superfície inferior cai sobre a superfície de ressalto aproximadamente y=206.24; os candidatos à superfície de assentamento axial e a coordenação física precisam ser verificados"
    },
    "h_motor33": {
      "label": "Cabeça segundo servo · Candidato ID33",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "h_rollScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_rollScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_coreScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platform": {
      "label": "Plataforma principal · P2-02",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_mouthMotor": {
      "label": "Boca servo · Vídeo 33 / Oficial 34, verificação pendente",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "h_jaw": {
      "label": "Queixo · P2-01",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_servoSupport": {
      "label": "Peça de fixação da cabeça servo · P4-02",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_supportScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_supportScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_platformScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_motor30": {
      "label": "Extremidade inferior do pescoço servo · Candidato a ID30",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "h_motor31": {
      "label": "Parte superior do pescoço servo · Candidato a ID31",
      "source": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente."
    },
    "h_neckA": {
      "label": "Placa de conexão do pescoço A · Candidata a P3-02",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_neckAScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "Primeiro conserte o buraco 2"
    },
    "h_neckAScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "Primeiro conserte o buraco 2"
    },
    "h_neckAScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "Reinstale no buraco 4"
    },
    "h_neckAScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "Reinstale no buraco 4"
    },
    "h_neckB": {
      "label": "Placa de conexão do pescoço B · Candidata a P3-03",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_neckBScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckBScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew4": {
      "label": "M2×6 Parafuso de fixação 5 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew5": {
      "label": "M2×6 Parafuso de fixação 6 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew6": {
      "label": "M2×6 Parafuso de fixação 7 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_neckFixScrew7": {
      "label": "M2×6 Parafuso de fixação 8 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×4"
    },
    "h_shell": {
      "label": "Cobertura de cabeça · P4-01",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_shellScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×2"
    },
    "h_shellScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Indicação de localização do furo",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
      "chip": "M2×6 ×2"
    },
    "h_eyeShell": {
      "label": "Olheiras · Candidato P2-06",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_eyes": {
      "label": "Aparelhos para os olhos · Candidato a P3-01",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_upperPad": {
      "label": "Almofada labial · Candidato P1-02",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_lowerPad": {
      "label": "Almofada bucal inferior · Candidato P1-01",
      "source": "Grade de impressão real · Correspondência e coordenação de vídeo a serem verificadas"
    },
    "h_wire32": {
      "label": "Linha reservada ID32 · Indicação de endpoint",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_wire33": {
      "label": "Linha reservada ID33 · Indicação de endpoint",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_wireMouth": {
      "label": "Boca linha servo · 33/34 com verificação pendente",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_neckWire": {
      "label": "Laço de fio do pescoço · extremidades e indicação de sequência de conexão em série",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_headLead": {
      "label": "O final da linha da cabeça e pescoço reservado para montagem final·Indicação do ponto final",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_plug32": {
      "label": "Plugue ID32 · interface de ensino",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_plug33": {
      "label": "Plugue ID33 · interface de ensino",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_plugMouth": {
      "label": "Plugue bucal·Interface de ensino",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_plugNeck": {
      "label": "Plugue para cordão de pescoço · Interface de ensino",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "h_coreHorn": {
      "label": "braço do servo original mantido",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "h_coreHornScrew": {
      "label": "Parafuso de fixação central original · Especificações a verificar",
      "source": "Modelo original de ensino de parafuso central · Não classificado como parafuso auto-roscante; conforme peça original, acompanha o segundo suporte/subconjunto ID33, sendo necessário verificar o encaixe físico"
    },
    "h_mouthHorn": {
      "label": "braço do servo original mantido",
      "source": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada"
    },
    "h_mouthHornScrew": {
      "label": "Parafuso de fixação central original · Especificações a verificar",
      "source": "Modelo de ensino de parafuso central original · Não classificado como parafuso auto-roscante"
    },
    "h_upperAdhesive": {
      "label": "Fita dupla face · Indicação de espessura e contorno",
      "source": "Instruções de ensino sobre fita dupla-face · Material, espessura, contorno e resistência de colagem estão sujeitos a verificação"
    },
    "h_lowerAdhesive": {
      "label": "Fita dupla face · Indicação de espessura e contorno",
      "source": "Instruções de ensino sobre fita dupla-face · Material, espessura, contorno e resistência de colagem estão sujeitos a verificação"
    },
    "f_batteryTray": {
      "label": "Compartimento da bateria · P5-03",
      "source": "Grade de fonte real · Furos de montagem e coordenação a serem verificados"
    },
    "f_sideR": {
      "label": "Corpo direito · P5-06",
      "source": "Grade de fonte real · Furos de montagem e coordenação a serem verificados"
    },
    "f_sideL": {
      "label": "Corpo esquerdo · P5-07",
      "source": "Grade de fonte real · Furos de montagem e coordenação a serem verificados"
    },
    "f_thighR": {
      "label": "Coxa direita · P5-01",
      "source": "Grade de fonte real · Furos de montagem e coordenação a serem verificados"
    },
    "f_thighL": {
      "label": "Coxa esquerda · P5-02",
      "source": "Grade de fonte real · Furos de montagem e coordenação a serem verificados"
    },
    "f_battery": {
      "label": "Bateria · Tamanho real a ser verificado",
      "source": "Siga o esboço do conceito trunk_base_8 · Medição não física"
    },
    "f_trayScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_trayScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_trayScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_trayScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_bodyScrew0": {
      "label": "M2×6 Parafuso de fixação 1 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_bodyScrew1": {
      "label": "M2×6 Parafuso de fixação 2 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_bodyScrew2": {
      "label": "M2×6 Parafuso de fixação 3 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_bodyScrew3": {
      "label": "M2×6 Parafuso de fixação 4 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_bodyScrew4": {
      "label": "M2×6 Parafuso de fixação 5 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_neckScrewR0": {
      "label": "M2×6 Parafuso de fixação 1 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_neckScrewR1": {
      "label": "M2×6 Parafuso de fixação 2 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_neckScrewR2": {
      "label": "M2×6 Parafuso de fixação 3 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_neckScrewR3": {
      "label": "M2×6 Parafuso de fixação 4 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_neckScrewL0": {
      "label": "M2×6 Parafuso de fixação 1 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_neckScrewL1": {
      "label": "M2×6 Parafuso de fixação 2 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_neckScrewL2": {
      "label": "M2×6 Parafuso de fixação 3 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_neckScrewL3": {
      "label": "M2×6 Parafuso de fixação 4 · Candidato a furo na grade de origem",
      "source": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente."
    },
    "f_boardScrew0": {
      "label": "M3×16 Parafuso de fixação 1 · Candidato para furos quase coaxiais em duas placas",
      "source": "Comparação da posição do furo da fonte GLB; Os furos 2 são quase coaxiais e os furos 2 estão aproximadamente 1.27mm desalinhados; os furos não são modificados ou o ajuste físico é presumido"
    },
    "f_boardScrew1": {
      "label": "M3×16 Parafuso de fixação 2 · Candidato para furos quase coaxiais em duas placas",
      "source": "Comparação da posição do furo da fonte GLB; Os furos 2 são quase coaxiais e os furos 2 estão aproximadamente 1.27mm desalinhados; os furos não são modificados ou o ajuste físico é presumido"
    },
    "f_boardScrew2": {
      "label": "M3×16 Parafuso de fixação 3 · Localização do furo a ser verificada",
      "source": "Comparação da posição do furo da fonte GLB; Os furos 2 são quase coaxiais e os furos 2 estão aproximadamente 1.27mm desalinhados; os furos não são modificados ou o ajuste físico é presumido"
    },
    "f_boardScrew3": {
      "label": "M3×16 Parafuso de fixação 4 · Localização do furo a ser verificada",
      "source": "Comparação da posição do furo da fonte GLB; Os furos 2 são quase coaxiais e os furos 2 estão aproximadamente 1.27mm desalinhados; os furos não são modificados ou o ajuste físico é presumido"
    },
    "f_thighScrewR0": {
      "label": "M2.3×4 Parafuso de fixação 1 · Candidato a furo na grade de origem",
      "source": "P5-01 fonte geometry.bin encaixe de furo redondo · O objeto real e o uso específico do furo precisam ser verificados"
    },
    "f_thighScrewR1": {
      "label": "M2.3×4 Parafuso de fixação 2 · Candidato a furo na grade de origem",
      "source": "P5-01 fonte geometry.bin encaixe de furo redondo · O objeto real e o uso específico do furo precisam ser verificados"
    },
    "f_thighScrewL0": {
      "label": "M2.3×4 Parafuso de fixação 1 · Candidato a furo na grade de origem",
      "source": "P5-02 fonte geometry.bin encaixe de furo redondo · O objeto real e o uso específico do furo precisam ser verificados"
    },
    "f_thighScrewL1": {
      "label": "M2.3×4 Parafuso de fixação 2 · Candidato a furo na grade de origem",
      "source": "P5-02 fonte geometry.bin encaixe de furo redondo · O objeto real e o uso específico do furo precisam ser verificados"
    },
    "f_uno": {
      "label": "Arduino UNO Q · Aparência confirmada do lote v2",
      "source": "Modelo fotográfico confirmado · Conversão de unidade uniforme 1000; a estimativa do furo de montagem e o mapeamento elétrico não foram verificados fisicamente"
    },
    "f_extension": {
      "label": "Placa de expansão Luwu · Aparência confirmada v2",
      "source": "Modelo fotográfico confirmado · Conversão de unidade uniforme 1000; a estimativa do furo de montagem e o mapeamento elétrico não foram verificados fisicamente"
    },
    "f_powerCable": {
      "label": "Cabo de alimentação de dois núcleos da bateria · Polaridade a ser verificada",
      "source": "Linhas vermelhas e pretas são visíveis no filme original. O caminho, comprimento da linha, polaridade e conector real não foram verificados."
    },
    "f_powerPlug": {
      "label": "Conector da bateria · Posição da chave e polaridade a serem verificadas",
      "source": "Modelo simples de tutorial · Nenhuma definição de pino elétrico verificada"
    },
    "f_bus0": {
      "label": "Barramento principal de três pinos 1 · Diagrama correspondente da ramificação",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "f_busPlug0": {
      "label": "Plugue do barramento principal 1 · Posição chave a ser verificada",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "f_bus1": {
      "label": "Barramento principal de três pinos 2 · Diagrama correspondente da ramificação",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "f_busPlug1": {
      "label": "Plugue do barramento principal 2 · Posição chave a ser verificada",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "f_bus2": {
      "label": "Barramento principal de três pinos 3 · Diagrama correspondente da ramificação",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    },
    "f_busPlug2": {
      "label": "Plugue do barramento principal 3 · Posição chave a ser verificada",
      "source": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas"
    }
  },
  "ui": {
    "先认清这几件": "Vamos primeiro identificar essas coisas",
    "准备零件": "Preparar peças",
    "这一段组装一只脚踝。先准备已编号、已居中的舵机，以及脚掌、小腿连接件、轴承和踝轴。": "Esta seção monta um tornozelo. Primeiro prepare o servo numerado e centralizado, bem como a sola do pé, o conector da panturrilha, o rolamento e a haste do tornozelo.",
    "舵机编号和居中应在机械安装前完成。": "A numeração e centralização do servo devem ser concluídas antes da instalação mecânica.",
    "拆下舵盘": "Remover braço do servo",
    "先拧出舵盘中央的原装固定螺丝，再沿输出轴方向取下黑色舵盘。": "Primeiro desparafuse o parafuso de fixação original no centro do braço do servo e, em seguida, remova o braço do servo preto ao longo da direção do eixo de saída.",
    "把舵盘和原装螺丝放在一旁，后面的步骤不会用自攻螺丝替代它。": "Reserve o braço do servo e os parafusos originais; as etapas posteriores não o substituirão por parafusos auto-roscantes.",
    "插好舵机线": "Conecte a linha servo",
    "插入线缆": "Conecte o cabo",
    "将插头的端子孔对准接口凸起，沿接口方向插入，再按压到位。": "Alinhe o orifício do terminal do plugue com a saliência da interface, insira-o na direção da interface e pressione-o no lugar.",
    "看清插头方向。这里演示插接动作，三芯线的针脚定义仍需实物核对。": "Verifique claramente a direção do plugue. A ação de conexão é demonstrada aqui. A definição do pino do fio de três núcleos ainda precisa ser verificada fisicamente.",
    "固定小腿连接件": "Conector fixo da perna",
    "固定小腿": "Panturrilha fixa",
    "将白色小腿连接件贴合舵机，对齐安装孔，再拧入两颗 M2×6 沉头自攻螺丝。": "Encaixe o conector branco da perna inferior em servo, alinhe os orifícios de montagem e, em seguida, aparafuse dois parafusos autoatarraxantes de cabeça escareada M2×6.",
    "连接件的长端朝上。先对孔，再固定，不用螺丝把歪斜的零件硬拉到位。": "A extremidade longa do conector deve estar voltada para cima. Alinhe os furos primeiro e depois prenda as peças. Não use parafusos para forçar peças desalinhadas na posição de instalação.",
    "把舵机装入脚掌": "Instale servo na sola do pé",
    "装入脚掌": "Encaixe na sola do pé",
    "把舵机和小腿连接件组成的模块放入脚掌，按视频固定四颗 M2×6 沉头自攻螺丝。": "Coloque o módulo composto por servo e conector de panturrilha na sola do pé e fixe os quatro parafusos auto-roscantes de cabeça escareada M2×6 conforme mostrado no vídeo.",
    "先确认脚掌与关节朝向，再固定四个位置。线缆留在外侧。": "Primeiro confirme a orientação das solas dos pés e das articulações e depois fixe as quatro posições. Os cabos permanecem do lado de fora.",
    "压入小轴承": "Pressione o pequeno rolamento",
    "压入轴承": "Pressione rolamento",
    "将小轴承对准脚掌的圆形安装孔，沿轴向压入。": "Alinhe o pequeno rolamento com o orifício de montagem circular na sola do pé e pressione-o ao longo da direção axial.",
    "轴承要坐正，中心孔与连接件同轴。型号按清单对应 10×15×3 mm。": "rolamento precisa ficar na posição vertical, com o orifício central e o conector coaxial. O número do modelo corresponde a 10×15×3 mm de acordo com a lista.",
    "对齐并装入踝轴": "Alinhe e instale a haste do tornozelo",
    "装入踝轴": "Instale o eixo do tornozelo",
    "对齐中间圆孔，将打印的踝轴放到轴承中心，再把 M2.3×8 自攻螺丝手动旋入。": "Alinhe o orifício do meio, coloque o eixo do tornozelo impresso no centro de rolamento e, em seguida, aparafuse manualmente o parafuso auto-roscante M2.3×8.",
    "踝轴用了现有 3MF 网格；这里的定位经过展示调整，还没有验证实物配合。": "O eixo do tornozelo usa a grade 3MF existente; o posicionamento aqui foi ajustado para exibição e não foi verificado quanto ao ajuste físico.",
    "拧紧并检查": "Aperte e verifique",
    "固定检查": "Verificação fixa",
    "沿轴向拧入 M2.3×8 螺丝，直到螺丝头贴合表面，再检查脚踝连接。": "Aparafuse o parafuso M2.3×8 axialmente até que a cabeça do parafuso encoste na superfície e, em seguida, verifique a conexão do tornozelo.",
    "视频要求螺丝头贴合、末端从另一侧伸出。原型只展示动作，不模拟实际扭矩或公差。": "O vídeo pede que a cabeça do parafuso se encaixe perfeitamente e a ponta saia do outro lado. O protótipo apenas demonstra movimento e não simula torque ou tolerâncias reais.",
    "这一只脚踝装好了": "Este tornozelo está instalado",
    "完成查看": "Visualização completa",
    "现在可以转到背面看连接位置，或回到任意步骤重看。另一只脚踝按视频做镜像装配。": "Agora você pode voltar para trás para ver onde estão as conexões ou voltar a qualquer etapa para revisá-las. Faça a montagem do espelho do outro tornozelo conforme mostra o vídeo.",
    "这段尚未安装脚底软垫；视频在后面的双腿阶段才安装。": "As almofadas sob os pés ainda não estão instaladas nesta seção; eles são instalados posteriormente no vídeo nas pernas.",
    "舵机 · 视频 ID14": "servo · Vídeo ID14",
    "现有辅助网格": "Grade auxiliar existente",
    "脚掌 · P2-03": "Sola do pé · P2-03",
    "真实 3MF 网格": "Grade 3MF real",
    "小腿连接件 · P6-04": "Conector para panturrilha · P6-04",
    "小轴承 · 10×15×3": "Pequeno rolamento · 10×15×3",
    "踝轴 · P2-05": "Tornozelo · P2-05",
    "真实网格 · 定位示意": "Grade real·Diagrama de posicionamento",
    "拆下的舵盘": "braço do servo removido",
    "新增教学示意": "Adicionadas instruções de ensino",
    "舵盘中央原装螺丝": "Parafuso original central braço do servo",
    "新增教学示意 · 规格待核": "Instruções de ensino adicionadas · Especificações a serem verificadas",
    "三针舵机插头": "Plugue servo de três pinos",
    "三芯舵机线": "Linha servo de três núcleos",
    "新增教学示意 · 路径未核验": "Adicionadas instruções de ensino · O caminho não foi verificado",
    "小腿固定螺丝 1 · M2×6": "Parafuso de fixação de panturrilha 1 · M2×6",
    "新增教学示意 · 孔位未核验": "Novas instruções de ensino · Posição do furo não verificada",
    "小腿固定螺丝 2 · M2×6": "Parafuso de fixação de panturrilha 2 · M2×6",
    "脚掌固定螺丝 1 · M2×6": "Parafuso de fixação do pé 1 · M2×6",
    "脚掌固定螺丝 2 · M2×6": "Parafuso de fixação do pé 2 · M2×6",
    "脚掌固定螺丝 3 · M2×6": "Parafuso de fixação do pé 3 · M2×6",
    "脚掌固定螺丝 4 · M2×6": "Parafuso de fixação do pé 4 · M2×6",
    "踝轴固定螺丝 · M2.3×8": "Parafuso de fixação do eixo do tornozelo · M2.3×8",
    "新增教学示意 · 配合未核验": "Instruções de ensino adicionadas · A cooperação não foi verificada",
    "拧入中": "Aparafusando",
    "已紧固": "Apertado",
    "预拧中": "Pré-parafusado",
    "预拧到位": "Pré-parafusado no lugar",
    "正在取下": "Removendo",
    "已取下": "Removido",
    "插接中": "Conectando",
    "已接合": "Noivo",
    "整理中": "Em preparação",
    "余量已留好": "O saldo foi reservado",
    "压入中": "Pressionando",
    "已就位": "Já está no lugar",
    "模型配合待核": "Encaixe do modelo não verificado",
    "螺丝放大": "Detalhe do parafuso",
    "舵盘放大": "Detalhe do braço do servo",
    "放大": "ampliar",
    "线端放大": "Detalhe da ponta do cabo",
    "接头放大": "Detalhe do conector",
    "{value} · {value}": "{value} · {value}",
    "局部放大": "ampliação local",
    "本步可手动开关；换步后，小部位自动开启，大部位默认关闭": "Esta etapa pode ser ativada e desativada manualmente; após alterar as etapas, as peças pequenas serão ativadas automaticamente e as peças grandes serão desativadas por padrão.",
    "本步暂无需要放大的装配细节": "Não há detalhes de montagem que precisem ser ampliados nesta etapa.",
    "局部放大 · ": "Zoom parcial ·",
    "开": "Ativado",
    "关": "Desativado",
    " · 剖视": "· Corte transversal",
    "对准接口": "Alinhar interface",
    "窗口": "janela",
    "当前装配部位的实时三维放大画面": "Ampliação tridimensional em tempo real da peça de montagem atual",
    "右脚踝": "tornozelo direito",
    "左脚踝": "tornozelo esquerdo",
    "右腿连接": "Conexão da perna direita",
    "左腿连接": "conexão da perna esquerda",
    "双腿收尾": "Acabamento das pernas",
    "准备{value}脚踝零件": "Prepare peças de tornozelo {value}",
    "{value}脚踝装好了": "Tornozelo {value} está instalado",
    "准备已编号、已居中的 {value} 舵机，以及这一侧的脚掌、小腿、轴承和踝轴。": "Prepare {value} servo numerado e centralizado, bem como a planta do pé, panturrilha, rolamento e eixo do tornozelo deste lado.",
    "可以旋转检查，再继续下一阶段。脚底软垫会在双腿收尾阶段安装。": "Você pode alternar a inspeção antes de prosseguir para a próxima etapa. As solas são instaladas durante a fase de acabamento das pernas.",
    "先卸中央螺丝，再取下舵盘": "Remova primeiro o parafuso central e depois remova o braço do servo",
    "对准接口，按压到位": "Alinhe a interface e pressione-a no lugar",
    "对孔 · M2×6 ×2": "Furo correto · M2×6 ×2",
    "固定脚掌 · M2×6 ×4": "Pé fixo · M2×6 ×4",
    "沿轴向压入": "Pressione axialmente",
    "对齐轴承中心": "Alinhar o centro rolamento",
    "拧至螺丝头贴合": "Aperte até que a cabeça do parafuso se encaixe",
    "右": "certo",
    "左": "Esquerda",
    "对齐双舵机": "Alinhar duplo servo",
    "对齐{value}腿的两只舵机": "Alinhe as duas pernas servo de {value}",
    "按视频排列 {value}，对齐成对舵机。画面中的左右是拍摄视角，不直接等于机器人左右。": "Organize {value} por vídeo, alinhe o par servo. A esquerda e a direita na imagem são o ângulo de disparo, não diretamente igual à esquerda e à direita do robô.",
    "保留另一只已完成的脚踝；核对当前这一侧。": "Mantenha o outro tornozelo completo; verifique o lado atual.",
    "核对舵机与方向": "Verifique servo com direção",
    "固定大腿支撑": "Suporte fixo para coxa",
    "固定双圆孔大腿支撑": "Suporte de coxa com ilhó duplo fixo",
    "把白色双圆孔支撑贴合这对舵机，对齐四个固定位置，按视频拧入四颗 M2×6。": "Encaixe o suporte branco com furo redondo duplo no par de servo, alinhe as quatro posições fixas e aparafuse os quatro M2×6 conforme mostrado no vídeo.",
    "逐孔核对后固定。孔位与安装配合仍是原型示意。": "Verifique furo por furo e depois conserte. A posição do furo e a coordenação da instalação ainda são indicações do protótipo.",
    "M2×6 ×4 · 固定支撑": "M2×6 ×4 · Suporte fixo",
    "压入大轴承": "Pressione no grande rolamento",
    "压入连接脚踝的大轴承": "Pressione no grande rolamento que conecta o tornozelo",
    "将 16×22×4 mm 大轴承对准支撑圆孔，沿轴向压到位。": "Alinhe 16×22×4 mm e rolamento grande com o orifício de suporte e pressione-o no lugar ao longo da direção axial.",
    "轴承应坐正，再连接已经装好的脚踝。": "rolamento deve ficar na posição vertical e depois conectar o tornozelo que foi instalado.",
    "沿轴向压入大轴承": "Pressione o rolamento grande ao longo da direção axial",
    "连接已装脚踝": "Tornozelo anexado",
    "接上{value}脚踝子组件": "Conecte o subconjunto do tornozelo {value}",
    "把已经完成的脚踝与小腿作为一个整体，移到大腿支撑的轴承位置，再固定四颗 M2×6。": "Mova o tornozelo e a panturrilha completos como um todo para a posição rolamento do apoio de coxa e fixe quatro M2×6.",
    "已有螺丝、踝轴与线缆随子组件一起移动。": "Já existem parafusos, tornozelos e cabos que se movem com a submontagem.",
    "整体对齐 · M2×6 ×4": "Alinhamento geral · M2×6 ×4",
    "插接腿内线束": "Insira na perna chicote de cabos",
    "插接可见的腿内总线": "Conecte o barramento de perna visível",
    "按视频插接并压紧可见的三针舵机线，留出关节活动需要的余量。": "Conecte e aperte a linha servo visível de três pinos de acordo com o vídeo, deixando espaço para o movimento da articulação.",
    "此处演示插接与路径；每根线两端的准确接口和针脚尚未核验。": "O acasalamento e o roteamento são demonstrados aqui; os conectores e pinagens exatos em cada extremidade de cada cabo não foram verificados.",
    "插接线束 · 端点示意": "Plugue chicote de cabos · Diagrama de endpoint",
    "整理线束余量": "Organizar margem chicote de cabos",
    "整理线束并留出上端连接线": "Organize chicote de cabos e deixe a linha de conexão superior",
    "整理环线，让线束留在机构外侧，并保留后续与身体相连的线端。": "Organize o fio do laço de forma que chicote de cabos permaneça na parte externa do mecanismo e mantenha as extremidades do fio subsequentes conectadas ao corpo.",
    "不要夹线，也不要根据三芯黑线的外观判断针脚定义。": "Não aperte a linha e não julgue a definição do pino com base na aparência do fio preto de três núcleos.",
    "留出活动余量 · 不夹线": "Deixe espaço para movimento · Sem fixação de rosca",
    "{value}腿连接完成": "Conexão da perna {value} concluída",
    "{value}腿连接部分完成": "Peça de conexão da perna {value} concluída",
    "检查已连接的脚踝、双舵机支撑与线束，然后继续下一阶段。": "Verifique o tornozelo conectado, a cinta dupla servo e chicote de cabos e prossiga para a próxima etapa.",
    "上端连接件和脚底软垫还没有安装。": "Os conectores superiores e as almofadas sob os pés ainda não foram instalados.",
    "卸右腿上端舵盘": "Remova a parte superior da perna direita braço do servo",
    "卸下右腿上端的原装舵盘": "Remova o braço do servo original na parte superior da perna direita",
    "先卸中央固定螺丝，再取下舵盘，保留在旁边。": "Primeiro remova o parafuso de fixação central, depois remova o braço do servo e mantenha-o próximo a ele.",
    "此处按视频处理上端；不要拆动已经固定的脚踝。": "A extremidade superior é processada de acordo com o vídeo aqui; não remova o tornozelo fixo.",
    "先卸中央螺丝，再取舵盘": "Remova o parafuso central primeiro e depois retire o braço do servo",
    "卸左腿上端舵盘": "Remova a parte superior da perna esquerda braço do servo",
    "卸下左腿上端的原装舵盘": "Remova o braço do servo original na parte superior da perna esquerda",
    "按镜像方向处理另一条腿，依次卸中央螺丝和舵盘。": "Processe a outra perna na direção do espelho e remova o parafuso central e braço do servo em sequência.",
    "拆下的原装零件继续保留在零件区。": "As peças originais que foram removidas permanecem na área de peças.",
    "保留拆下的原装零件": "Guarde as peças originais que foram removidas",
    "右连接件压轴承": "Peça de conexão direita pressione rolamento",
    "先给右上端连接件压入轴承": "Primeiro pressione rolamento no conector superior direito",
    "在独立的上端连接件中压入大轴承，然后再把这一组件装到腿上。": "Pressione o rolamento grande no conector superior separado e, em seguida, prenda o conjunto à perna.",
    "先压轴承，再安装连接件；不要把这两步倒过来。": "Pressione rolamento primeiro e depois instale o conector; não inverta essas duas etapas.",
    "先在连接件中压入轴承": "Primeiro pressione rolamento no conector",
    "安装右连接件": "Instale o conector direito",
    "固定右上端连接件与轴承": "Fixe o conector superior direito com rolamento",
    "把已压入轴承的连接件整体对齐上端位置，用四颗 M2×6 固定。": "Alinhe o conector que foi pressionado em rolamento com a posição final superior e fixe-o com quatro M2×6.",
    "连接件与它内部的轴承一起移动。": "O conector se move com o rolamento dentro dele.",
    "组件整体安装 · M2×6 ×4": "Instalação geral de componentes · M2×6 ×4",
    "左连接件压轴承": "Peça de conexão esquerda pressione rolamento",
    "给左上端连接件压入轴承": "Pressione rolamento no conector superior esquerdo",
    "在另一侧连接件中压入大轴承，保持镜像朝向。": "Pressione o rolamento grande no conector do outro lado, mantendo a orientação do espelho.",
    "左右连接件使用各自的真实网格。": "Os conectores esquerdo e direito usam suas próprias malhas reais.",
    "镜像方向 · 先压轴承": "Direção do espelho · Pressione rolamento primeiro",
    "安装左连接件": "Instale o conector esquerdo",
    "固定左上端连接件与轴承": "Fixe o conector superior esquerdo com rolamento",
    "把另一侧的连接件与轴承整体装到位，用四颗 M2×6 固定。": "Instale a peça de conexão do outro lado com rolamento e fixe com quatro M2×6.",
    "检查两侧方向一致，给后续身体装配留下连接位置。": "Verifique se as direções em ambos os lados são consistentes, deixando uma posição de conexão para posterior montagem da carroceria.",
    "固定右脚底软垫": "Almofada fixa na sola do pé direito",
    "安装右脚底软垫": "Instale a almofada da sola direita",
    "将软垫贴合脚底，按视频对齐四个孔，固定四颗 M2×6。": "Encaixe a almofada macia na sola do pé, alinhe os quatro furos conforme o vídeo e fixe os quatro M2×6.",
    "这是脚底软垫，不是稍后总装阶段的大腿外壳。": "Esta é a única almofada, não a concha da coxa que vem posteriormente na fase de montagem final.",
    "对准脚底 · M2×6 ×4": "Alinhe as solas dos pés · M2×6 ×4",
    "固定左脚底软垫": "Almofada fixa na sola esquerda",
    "安装左脚底软垫": "Instale a almofada da sola do pé esquerdo",
    "在另一只脚底安装软垫，按视频固定四颗 M2×6。": "Instale uma almofada macia na parte inferior do outro pé e fixe quatro M2×6 conforme mostrado no vídeo.",
    "检查两只脚底与线束状态，然后进入身体与髋部装配。": "Verifique o estado das solas dos pés e chicote de cabos e, em seguida, proceda à montagem do corpo e dos quadris.",
    "双腿完成查看": "Visão completa das pernas",
    "双腿子组件装好了": "A submontagem de duas pernas está instalada",
    "现在可以旋转查看两条腿，或回到任意阶段重新看。": "Agora você pode girar para ver as duas pernas ou voltar a qualquer estágio para vê-las novamente.",
    "当前阶段到 08:16；下一阶段安装身体髋部，之后再做头颈和电控总装。": "O estágio atual é 08:16; a próxima etapa é instalar os quadris do corpo e depois fazer a montagem da cabeça, pescoço e controle eletrônico.",
    "{value}{value} · {value}": "{value}{value} · {value}",
    "{value}{value}": "{value}{value}",
    "舵机": "servo",
    "小轴承": "Pequenorolamento",
    "真实 3MF 网格 · 配合待核验": "Grade 3MF real · Coordenação a ser verificada",
    "现有硬件网格": "Grade de hardware existente",
    "教学简模 · 孔位待核验": "Modelo de ensino simples · Posições dos furos a serem verificadas",
    "{value}固定螺丝 {value} · M2×6": "Parafuso de fixação {value} {value} · M2×6",
    "{value}上端舵机 · ID{value}": "{value} extremidade superiorservo · ID{value}",
    "{value}中部舵机 · ID{value}": "{value} meio servo · ID{value}",
    "{value}大腿支撑 · {value}": "Apoio de coxa {value} · {value}",
    "{value}大轴承 · 16×22×4": "{value} grande rolamento · 16×22×4",
    "{value}上端原装舵盘": "{value} extremidade superior original braço do servo",
    "教学简模 · 安装位示意": "Ensinando modelo simples · Indicação de posição de instalação",
    "{value}上端原装中央螺丝": "Parafuso central original da extremidade superior {value}",
    "教学简模 · 原装规格待核": "Modelo de ensino simples·Especificações originais a serem verificadas",
    "{value}上端连接件 · {value}": "Conector superior {value} · {value}",
    "{value}连接件大轴承": "{value} conector grande rolamento",
    "{value}脚底软垫 · {value}": "{value} Almofada macia para os pés · {value}",
    "线束教学示意 · 路径和端点待核验": "Instruções de ensino chicote de cabos · O caminho e os pontos finais precisam ser verificados",
    "{value}腿内三芯线": "Cabo de três núcleos {value} na perna",
    "腿内三芯线": "Fio de três núcleos dentro da perna",
    "{value}腿上端预留线": "Linha reservada da coxa {value}",
    "上端预留线": "Linha reservada na extremidade superior",
    "教学接口；精确键位与针脚待核": "Interface de ensino; posições-chave e pinos precisos a serem verificados",
    "双插座教学锚点；物理修订与电气针脚待核": "Âncora de ensino de soquete duplo; revisão física e pinagem elétrica pendentes",
    "原装螺丝": "parafusos originais",
    "原装舵盘": "Original braço do servo",
    "线端余量": "Margem final da linha",
    "插头": "plugue",
    "踝轴": "eixo do tornozelo",
    "轴承": "rolamento",
    "线束整理": "Acabamento chicote de cabos",
    "下嘴软垫": "Almofada macia para a parte inferior da boca",
    "上嘴软垫": "Almofada labial",
    "右脚底软垫": "Almofada sola do pé direito",
    "左脚底软垫": "Almofada sola do pé esquerdo",
    "下巴": "mandíbula",
    "头部平台": "plataforma principal",
    "右脚": "pé direito",
    "左脚": "pé esquerdo",
    "右踝轴": "Eixo do tornozelo direito",
    "眼睛外壳": "concha do olho",
    "左踝轴": "eixo do tornozelo esquerdo",
    "眼睛": "Olho",
    "颈部连接板 A": "Placa de conexão do pescoço A",
    "颈部连接板 B": "Placa de conexão do pescoço B",
    "右 Roll 舵机输出": "Saída direita Roll servo",
    "左 Roll 舵机输出": "Saída esquerda Roll servo",
    "头盖": "crânio",
    "头部舵机固定件": "Peça de fixação da cabeça servo",
    "身体背板": "painel traseiro do corpo",
    "大腿右外壳": "Concha direita da coxa",
    "大腿左外壳": "Concha esquerda da coxa",
    "电池仓": "compartimento da bateria",
    "右大腿支撑": "Apoio para coxa direita",
    "左大腿支撑": "apoio para coxa esquerda",
    "身体右外壳": "Concha direita do corpo",
    "身体左外壳": "Concha esquerda do corpo",
    "头部俯仰支架": "Suporte de inclinação da cabeça",
    "右 Roll 舵机盖板": "Tampa direita Roll servo",
    "左 Roll 舵机盖板": "Tampa esquerda Roll servo",
    "右小腿": "panturrilha direita",
    "左小腿": "panturrilha esquerda",
    "右 Yaw 连接件": "Conector direito Yaw",
    "左 Yaw 连接件": "Conector esquerdo Yaw",
    "头部 Yaw 支架": "Suporte de cabeça Yaw",
    "髋部 Yaw 支撑": "Suporte para quadril Yaw",
    "重复 actorId: {value}": "Repita actorId: {value}",
    "Arduino UNO Q · 已确认外观 v2批次": "Arduino UNO Q · Aparência confirmada do lote v2",
    "陆吾扩展板 · 已确认外观 v2": "Placa de expansão Luwu · Aparência confirmada v2",
    "已确认照片模型 · 均匀单位换算1000；安装孔估算与电气映射未实物验证": "Modelo fotográfico confirmado · Conversão de unidade uniforme 1000; a estimativa do furo de montagem e o mapeamento elétrico não foram verificados fisicamente",
    "M3×16 固定螺丝 {value} · 两板近共轴孔候选": "M3×16 Parafuso de fixação {value} · Candidato para furos quase coaxiais em duas placas",
    "M3×16 固定螺丝 {value} · 孔位待核": "M3×16 Parafuso de fixação {value} · Localização do furo a ser verificada",
    "源GLB孔位比较；2孔近共轴，另2孔约1.27mm错位；不修改孔或推定实物配合": "Comparação da posição do furo da fonte GLB; Os furos 2 são quase coaxiais e os furos 2 estão aproximadamente 1.27mm desalinhados; os furos não são modificados ou o ajuste físico é presumido",
    "已确认 v2 舵机外观 · HD-1910-C001 / HD1910M；转轴按建模坐标适配，配合与针脚未实物验证": "Aparência confirmada de v2 servo · HD-1910-C001 / HD1910M; o eixo está adaptado de acordo com as coordenadas de modelagem, e o encaixe e os pinos não foram verificados fisicamente.",
    "已确认 v2 独立舵盘外观 · 按步骤拆卸；实体配合仍待核": "Aparência braço do servo independente confirmada de v2 · Desmontagem de acordo com etapas; coordenação física ainda precisa ser verificada",
    "已确认 v2 三芯插头外观与三根黑线；线长、走线和针脚仍为未核验教学示意": "A aparência do plugue de três núcleos v2 e três fios pretos foi confirmada; o comprimento do fio, fiação e pinos ainda são instruções de ensino não verificadas",
    "已确认 v2 指定规格螺丝外观 · 孔位用途、扭矩与实体配合未实物验证": "A aparência dos parafusos com especificações especificadas de v2 foi confirmada. A posição do furo, o torque e o ajuste físico não foram verificados fisicamente.",
    "保持两块板的插合关系，将控制器组件移到身体背部。原片标示 4 颗 M3×16；本模型只在两处近共轴孔演示插入，另两处保留待核。": "Mantendo as duas placas conectadas uma à outra, mova o conjunto de controle principal para a parte traseira do corpo do robô. As peças originais estão marcadas como 4 e M3×16; este modelo demonstra apenas a inserção de dois furos quase coaxiais, sendo os dois restantes reservados para verificação.",
    "原片4颗；本模型2孔近共轴，另2孔约1.27mm错位，暂不显示穿过两板的完成态。源板形、孔位、PCB厚度和排针节距均未拉伸或补孔；身体支撑与实体配合待核。": "A peça original possui peças 4; os furos 2 deste modelo são quase coaxiais e os furos 2 estão aproximadamente 1.27mm desalinhados. O estado completo da passagem pelas duas placas ainda não é mostrado. O formato da placa de origem, a posição do furo, a espessura do PCB e o passo da fileira de pinos não foram esticados ou corrigidos; o suporte corporal e a coordenação física precisam ser verificados.",
    "原片 M3×16 ×4 · 演示2孔，另2孔待核": "Filme original M3×16 ×4 · Demonstra furos 2, e os outros furos 2 devem ser verificados",
    "采用已确认板卡模型；32针对齐与12.3mm建模间距已核对，孔位部分为照片估算。两处安装孔约1.27mm错位，实物插合、公差与电气针脚未验证。": "O modelo de placa confirmado é usado; O alinhamento dos pinos 32 e o espaçamento de modelagem 12.3mm foram verificados e as localizações dos furos são estimadas a partir de fotos. Os dois furos de montagem estão desalinhados em cerca de 1.27mm e a inserção física, tolerâncias e pinos elétricos não foram verificados.",
    "采用已确认照片模型。四组32针按建模坐标对齐；PCB和接口未按总包络拉伸。板间净空、键位、电气映射和实物配合仍待核。": "Apresenta modelo fotográfico confirmado. Os quatro conjuntos de pinos 32 estão alinhados de acordo com as coordenadas de modelagem; PCB e a interface não são esticadas de acordo com o envelope total. A liberação da placa, os principais locais, o mapeamento elétrico e a adequação física ainda precisam ser verificados.",
    "萨蒂 · 第一号吉姆诺佩蒂": "Satie nº 1 Jimnoppetti",
    "莫扎特 · K.545 行板": "Mozart · K.545 Andante",
    "已静音": "silenciado",
    "点一下页面开始音乐": "Clique na página para iniciar a música",
    "正在准备钢琴曲…": "Preparando música de piano...",
    "正在播放 · ": "Agora jogando ·",
    "仅播放完成提示音": "Toque apenas o tom de conclusão",
    "声音已关闭": "O som está desligado",
    "钢琴曲暂时无法播放，可切换曲目重试": "A música de piano não pode ser tocada temporariamente. Você pode mudar de faixa e tentar novamente.",
    "打印件用涂装台当前的配色，舵机、板子和螺丝保持原样": "A impressão utiliza o esquema de cores atual da mesa de pintura, servo, a placa e os parafusos permanecem os mesmos",
    "还没有涂色，打印件先用白色演示": "Ainda não foi colorido, então a impressão será demonstrada primeiro em branco.",
    "配色 · ": "Combinação de cores ·",
    "白胚": "Sem pintura",
    ").textContent=s.complete?`{value} · 完成`:`${String(local).padStart(2,": ").textContent=s.complete?`{value} · Completo`:`${String(local).padStart(2,",
    "红框 · 对准这两处": "Caixa vermelha · Mire nesses dois lugares",
    "绿框 · 本次已装好": "Moldura verde · Já instalada desta vez",
    "真实零件网格": "Malha de parte real",
    "模型清单加载失败": "Falha no carregamento do manifesto do modelo",
    "模型几何加载失败": "Falha no carregamento da geometria do modelo",
    "极致 · ": "Extremo ·",
    "极致 · 细腻哑光、边缘柔光与摄影棚反射": "Ultimate · Mate delicado, luz suave e reflexo de estúdio",
    "当前 · 原有材质和渲染": "Atual · Materiais originais e renderização",
    "来做鸭 / letsduck · 3D 组装教程": "Vamos fazer um pato / letsduck · Tutorial de montagem do 3D",
    "来做鸭 / letsduck": "Vamos fazer um pato / letsduck",
    "3D 组装教程": "Tutorial de montagem 3D",
    "整机预览": "Pré-visualização de toda a máquina",
    "对照原片": "Compare o filme original",
    "跟着视频，一步一步装": "Acompanhe o vídeo e instale passo a passo",
    "整机组装": "Montagem completa da máquina",
    "原片 00:00—23:10": "Filme original 00:00—23:10",
    "画质": "Qualidade de imagem",
    "渲染画质": "Qualidade de renderização",
    "当前": "atual",
    "极致": "extremo",
    "局部放大 · 关": "Zoom parcial · Desativado",
    "最佳视角": "Melhor ângulo de visão",
    "正面": "frente",
    "背面": "voltar",
    "三维组装区域": "Área de montagem 3D",
    "正在加载现有模型…": "Carregando modelo existente...",
    "可旋转的整机三维模型": "Modelo 3D rotativo de toda a máquina",
    "接头局部放大窗": "Janela de ampliação parcial conjunta",
    "拖动放大窗": "Arraste a janela de ampliação",
    "收起局部放大": "Recolher ampliação local",
    "当前接头的实时三维放大画面": "Ampliação 3D em tempo real da junta atual",
    "所选零件信息": "Informações da peça selecionada",
    "收起零件信息": "Ocultar informações das peças",
    "可以开始": "pode começar",
    "本步动作": "Ação desta etapa",
    "本步动作进度": "Progresso desta etapa",
    "← 上一步": "← Anterior",
    "红绿框演示": "Demonstração de caixa vermelha e verde",
    "暂停": "pausa",
    "自动播放 · 关": "Reprodução automática · Desativada",
    "播放倍率": "Ampliação de reprodução",
    "声音设置": "configurações de som",
    "声音": "som",
    "收起声音设置": "Recolher configurações de som",
    "背景音乐": "música de fundo",
    "选择钢琴曲": "Selecione música de piano",
    "完成提示音": "Tom de conclusão",
    "音量": "volume",
    "曲目与模型来源 ↗": "Fonte de rastreamento e modelo ↗",
    "开始组装": "Comece a montar",
    "下一步 →": "Próximo →",
    "从头再看": "Olhe desde o início",
    "v4.1 走线复核版 · 新插头与部分3MF支架/外壳有几何干涉，红框部位配合待核。": "Versão de revisão da fiação v4.1 · O novo plugue tem interferência geométrica com alguns suportes/invólucros 3MF, e a coordenação das peças da caixa vermelha precisa ser verificada.",
    "组装步骤": "Etapas de montagem",
    "组装顺序": "Sequência de montagem",
    "选择组装阶段": "Selecione o estágio de montagem",
    "1 · 准备与编号": "1 · Preparação e Numeração",
    "2 · 右脚踝": "2 · Tornozelo direito",
    "3 · 左脚踝": "3 · Tornozelo esquerdo",
    "4 · 右腿连接": "4 · Conexão da perna direita",
    "5 · 左腿连接": "5 · Conexão da perna esquerda",
    "6 · 双腿收尾": "6 · Acabamento da perna",
    "7 · 身体与髋支撑": "7 · Suporte para corpo e quadril",
    "8 · 髋电机与接腿": "8 · Motores do quadril e articulações das pernas",
    "9 · 头部旋转与接线": "9 · Rotação e fiação do cabeçote",
    "10 · 嘴部与双舵机脖子": "10 · Boca e pescoço duplo servo",
    "11 · 头盖与嘴部软垫": "11 · Capa para cabeça e almofada para boca",
    "12 · 身体与头颈总装": "12 · Conjunto de corpo e cabeça e pescoço",
    "13 · 电控与外壳收尾": "13 · Controle eletrônico e acabamento da carcaça",
    "14 · 校准与完成": "14 · Calibração e conclusão",
    "选择组装步骤": "Selecione as etapas de montagem",
    "本步说明 ↗": "Instruções para esta etapa ↗",
    "收起本步说明": "Recolher as instruções desta etapa",
    "准备": "Preparar",
    "教学说明 · 不连接或控制真实设备": "Notas do Tutorial · Sem conexão ou controle de dispositivos reais",
    "本步用到": "Usado nesta etapa",
    "看这一步的原片": "Assista ao vídeo original desta etapa",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。": "Instruções de ensino: As posições dos furos, a coordenação das conexões, as modificações da placa e os pontos finais da linha ainda não foram verificados fisicamente.",
    "原片对照": "Comparação de filmes originais",
    "收起原片": "Feche o filme original",
    "截取自你提供的视频 · 20:58—23:10": "Extraído do vídeo que você forneceu · 20:58—23:10",
    "{name}放大": "{name} ampliar",
    "{ordinal}/{total} · {status}": "{ordinal}/{total} · {status}",
    "{frame} · {status}": "{frame} · {status}",
    "{title}窗口": "Janela {title}",
    "{name} · 剖视": "{name} · Seção transversal",
    "局部放大 · {state}": "Zoom parcial · {state}",
    "自动播放 · {state}": "Reprodução automática · {state}",
    "截取自你提供的视频 · {start}—{end}": "Extraído do vídeo que você forneceu · {start}—{end}",
    "模型没有加载成功：{error}": "O modelo não foi carregado com sucesso: {error}",
    "配色 · {name}": "Cor · {name}",
    "正在播放 · {track}": "Em reprodução · {track}",
    "本步观看 {seen} / {total} · 实物完成 {built} / {total}": "Observe esta etapa {seen} / {total} · Conclusão física {built} / {total}",
    "本步说明": "Instruções para esta etapa",
    "收起说明 · 留出观察空间": "Recolher instruções · Deixe espaço para observação",
    "方向与动作": "direção e ação",
    "完成检查": "Inspeção completa",
    "已看过此步": "Já vi esta etapa",
    "我已检查实物并装好": "Eu verifiquei o objeto físico e instalei-o",
    "教学示意：孔位、连接配合、板卡修订和线路端点尚未实物核验。接头键位、实际插座、针脚和极性未核验。": "Instruções de ensino: As posições dos furos, a coordenação das conexões, as modificações da placa e os pontos finais da linha ainda não foram verificados fisicamente. As chaves do conector, os soquetes reais, os pinos e a polaridade não foram verificados.",
    "观察设置 · 视角 / 聚焦 / 画质": "Configurações de observação·Visualização/Foco/Qualidade de imagem",
    "播放设置 · 进度 / 倍率 / 声音": "Configurações de reprodução · Progresso/Ampliação/Som",
    "收起组装顺序": "Recolher sequência de montagem",
    "观看 {seen}/{total} · 实物 {built}/{total}": "Assistir {seen}/{total} · {built}/{total} real",
    "{chapter} · {local} / {total}": "{chapter} · {local} / {total}",
    "{chapter} · 完成": "{chapter} · Completo",
    "{local}  {short}": "{local} {short}",
    "红框": "Quadro vermelho",
    "绿框": "Quadro verde",
    "重播本步": "Repetir esta etapa",
    "继续播放": "continuar jogando",
    "自动播放": "Reprodução automática",
    "开启后从第0步开始，连续播放全部14个阶段": "Após ligá-lo, a partir da etapa 0, todos os estágios 14 serão reproduzidos continuamente.",
    "全部播放完成": "Toda a reprodução foi concluída",
    "本步完成，准备下一步": "Esta etapa está concluída, pronta para a próxima etapa",
    "自动播放中": "Jogando automaticamente",
    "自动播放已暂停": "Reprodução automática pausada",
    "正在演示": "Demonstrando",
    "可旋转查看": "Gire para visualizar",
    " 新模型配合待核：相关插头与原3MF支架或外壳有几何重叠；保持原尺寸，红框不表示已接合。": "O ajuste do novo modelo precisa ser verificado: o plugue relevante tem sobreposição geométrica com o suporte ou invólucro 3MF original; o tamanho original é mantido e a caixa vermelha não indica que foi unida.",
    "进度未保存：浏览器存储不可用，请重试。": "Progresso não salvo: o armazenamento do navegador não está disponível. Tente novamente.",
    " · 已看过": "· Visto",
    " · 实物已装好": "· O objeto real foi instalado",
    "展开本步说明": "Expanda as instruções para esta etapa",
    "舵机口": "Porta servo"
  }
};
