export interface Dilemma {
  id: number;
  title: string;
  description: string;
  optionA: {
    text: string;
    consequence: string;
    impact: string;
  };
  optionB: {
    text: string;
    consequence: string;
    impact: string;
  };
}

export const PREDEFINED_DILEMMAS: Dilemma[] = [
  {
    id: 1,
    title: "O Remédio Roubado",
    description: "Sua mãe está gravemente doente e o único remédio que pode salvá-la custa uma fortuna que você não tem. O farmacêutico se recusa a baixar o preço ou facilitar o pagamento.",
    optionA: {
      text: "Roubar o remédio",
      consequence: "Sua mãe sobrevive, mas você corre o risco de ser preso e arruinar sua reputação.",
      impact: "Individualismo Extremo"
    },
    optionB: {
      text: "Não roubar",
      consequence: "Sua mãe pode falecer, mas você mantém sua integridade moral perante a lei.",
      impact: "Ética Deontológica"
    }
  },
  {
    id: 2,
    title: "O Trem Desgovernado",
    description: "Um trem sem freios marcha em direção a 5 pessoas amarradas nos trilhos. Você está ao lado de uma alavanca que pode desviar o trem para outro trilho, onde está amarrada apenas 1 pessoa.",
    optionA: {
      text: "Puxar a alavanca",
      consequence: "Uma pessoa morre, mas cinco são salvas. Você ativamente causou uma morte.",
      impact: "Utilitarismo"
    },
    optionB: {
      text: "Não fazer nada",
      consequence: "Cinco pessoas morrem. Você não interferiu no curso do destino.",
      impact: "Ética Deontológica"
    }
  },
  {
    id: 3,
    title: "O Informante",
    description: "Você descobre que sua empresa está lançando um produto com um defeito perigoso. Se você denunciar, a empresa fali, e centenas de pessoas, incluindo seus melhores amigos, perderão os empregos.",
    optionA: {
      text: "Denunciar a falha",
      consequence: "O público está protegido, mas você e seus amigos ficam desempregados num momento difícil.",
      impact: "Ética Universal e Justiça"
    },
    optionB: {
      text: "Manter silêncio",
      consequence: "O produto pode machucar algumas pessoas, mas a empresa e os empregos de todos continuam.",
      impact: "Lealdade e Utilitarismo Limitado"
    }
  },
  {
    id: 4,
    title: "O Médico e os Transplantes",
    description: "Um médico brilhante tem 5 pacientes morrendo por precisarem de órgãos diferentes. Um paciente saudável entra para check-up rotineiro, seus órgãos combinam perfeitamente com os 5.",
    optionA: {
      text: "Sacrificar o saudável",
      consequence: "Você assassina um inocente, mas 5 pacientes sobrevivem.",
      impact: "Utilitarismo Frio"
    },
    optionB: {
      text: "Não sacrificar",
      consequence: "Cinco pacientes morrem, mas você respeitou o juramento de não causar danos a inocentes.",
      impact: "Ética Médica e Deontologia"
    }
  },
  {
    id: 5,
    title: "A Promessa ao Moribundo",
    description: "Um amigo rico em leito de morte te entrega 10 milhões para serem doados para seu clube favorito. Logo após ele morrer, ocorre um desastre natural e milhares de órfãos precisam de ajuda financeira.",
    optionA: {
      text: "Doar aos órfãos",
      consequence: "Milhares de crianças são salvas e cuidadas, mas você quebrou a promessa final do seu amigo.",
      impact: "Utilitarismo e Empatia"
    },
    optionB: {
      text: "Doar ao clube",
      consequence: "Você manteve sua honra e promessa, mas ignorou o sofrimento imediato das crianças.",
      impact: "Deontologia estrita"
    }
  },
  {
    id: 6,
    title: "O Pescador e o Político",
    description: "Você vê uma pessoa se afogando e corre para salvar. Ao se aproximar, percebe que é um ditador cruel que causou muito sofrimento e guerras. Deixá-lo morrer evitaria mais desastres.",
    optionA: {
      text: "Salvar o ditador",
      consequence: "Você preserva uma vida e sua moralidade pessoal, mas pode permitir que o mal continue.",
      impact: "Ética Kantiana"
    },
    optionB: {
      text: "Deixar afogar",
      consequence: "Milhares se libertam da opressão, mas você teve a chance de salvar alguém e não o fez.",
      impact: "Consequencialismo e Justiça"
    }
  },
  {
    id: 7,
    title: "A Moeda com Duas Faces",
    description: "Você encontra uma carteira caída na rua com R$5.000 em dinheiro vivo. Dentro, a identidade de um milionário arrogante conhecido por explorar funcionários.",
    optionA: {
      text: "Ficar com o dinheiro",
      consequence: "Você paga suas dívidas atrasadas, mas comete o crime de apropriação indébita.",
      impact: "Justiça Distributiva Informal"
    },
    optionB: {
      text: "Devolver tudo",
      consequence: "O milionário sequer agradece. Você fica sem nada, mas mantém sua consciência completamente limpa.",
      impact: "Ética Deontológica e Integridade"
    }
  },
  {
    id: 8,
    title: "O Irmão Foragido",
    description: "Seu irmão mais novo acaba de aparecer na sua porta coberto de sangue, dizendo que cometeu um crime grave e está fugindo da polícia. A polícia bate na sua porta minutos depois.",
    optionA: {
      text: "Acobertar o irmão",
      consequence: "Seu irmão pode escapar da prisão, mas você se torna cúmplice e a justiça não é feita.",
      impact: "Lealdade Familiar e Empatia"
    },
    optionB: {
      text: "Entragá-lo à polícia",
      consequence: "Seu irmão vai para a prisão por muitos anos. Você fez o certo socialmente, mas destruiu a relação familiar.",
      impact: "Justiça e Dever Civil"
    }
  },
  {
    id: 9,
    title: "O Piloto do Drone",
    description: "Você opera drones militares. Tem sob mira um terrorista procurado internacionalmente e pronto para lançar ataques. Contudo, há crianças brincando no quintal da casa em que ele está.",
    optionA: {
      text: "Disparar o míssil",
      consequence: "Você elimina a grande ameaça futura, mas vitima fatalmente crianças inocentes.",
      impact: "Utilitarismo Extremo"
    },
    optionB: {
      text: "Abortar a missão",
      consequence: "Você preserva as crianças, mas o terrorista escapa e provávelmente fará centenas de vítimas depois.",
      impact: "Preservação da Inocência"
    }
  },
  {
    id: 10,
    title: "Inteligência Artificial Autônoma",
    description: "Você programou um carro autônomo. Durante o teste, ele se depara com um cruzamento e perde o freio. Pode seguir em frente e atropelar 3 idosos, ou virar e bater no muro, matando o piloto (você).",
    optionA: {
      text: "Salvar-se (atropelar 3)",
      consequence: "Você sobrevive, mas carrega a culpa da morte de três idosos.",
      impact: "Autopreservação"
    },
    optionB: {
      text: "Sacrificar-se (bater no muro)",
      consequence: "Você morre de forma heróica, salvando as vidas dos três passantes.",
      impact: "Altruísmo e Utilitarismo"
    }
  },
  {
    id: 11,
    title: "O Roubo Intelectual",
    description: "Sua colega brilhante falece subitamente deixando uma pesquisa revolucionária não publicada que poderia curar certa doença. Ninguém mais sabe. Se você assinar como se fosse sua, a cura será lançada.",
    optionA: {
      text: "Roubar autoria e lançar",
      consequence: "Milhares de pessoas são salvas rapidamente pelas medicações, mas você vive cometeu uma grande mentira.",
      impact: "Utilitarismo Científico"
    },
    optionB: {
      text: "Lançar anonimamente",
      consequence: "A publicação perde força, demora muito mais a ser aprovada e vidas se perdem na espera.",
      impact: "Honestidade Intelectual"
    }
  },
  {
    id: 12,
    title: "A Caixa Abandonada",
    description: "Você vê uma caixa de doações para uma organização suspeita. Um benfeitor desavisado deixa 1 milhão na caixa. Você sabe que o dono da organização desviará o recurso inteiro. Você tem a chance de pegar o dinheiro de lá.",
    optionA: {
      text: "Pegar o dinheiro",
      consequence: "Você impede a fraude imediata e tem a chance de doar certo, mas cometeu um roubo claro.",
      impact: "Ação Direta"
    },
    optionB: {
      text: "Não pegar",
      consequence: "O líder corrupto esbanja o dinheiro. Você não interferiu fisicamente e se manteve imaculado perante o crime de roubo.",
      impact: "Passividade e Integridade"
    }
  },
  {
    id: 13,
    title: "O Empregado Fiel",
    description: "Você é dono de negócio enfrentando crise severa. Pode demitir João, um funcionário mediano que sustenta 5 filhos com extrema dificuldade, ou Pedro, um solteiro rico, mas que produz o dobro que o João.",
    optionA: {
      text: "Demitir Pedro (solteiro, produtivo)",
      consequence: "A empresa continua lutando e você tem prejuízo, mas salva a família do João da fome.",
      impact: "Empatia e Compaixão"
    },
    optionB: {
      text: "Demitir João (pai, mediano)",
      consequence: "A empresa sobrevive fácil, mas João e a família sofrerão muito com a falta de recursos.",
      impact: "Méritocracia e Pragmatismo"
    }
  },
  {
    id: 14,
    title: "O Super-herói Oculto",
    description: "Você ganhou o poder de curar qualquer pessoa com um toque, mas toda vez que faz isso envelhece 5 anos. Há centenas de pacientes em fila do lado de fora.",
    optionA: {
      text: "Curar o máximo possível",
      consequence: "Você cura dezenas de pessoas, mas envelhece aceleradamente e morrerá em breve.",
      impact: "Altruísmo Extremo"
    },
    optionB: {
      text: "Esconder o poder",
      consequence: "Você vive uma vida longa e feliz, sentindo culpa silenciosa pelas vidas que poderia ter salvo.",
      impact: "Preservação Individual e Autonomia"
    }
  },
  {
    id: 15,
    title: "Garantir a Espécie",
    description: "Você está numa nave de fuga para re-colonizar o planeta. Só há mais 1 cápsula de sobrevivência e nela pode entrar apenas ou um renomado engenheiro genético, ou um poeta incrível e carismático.",
    optionA: {
      text: "Escolher o engenheiro",
      consequence: "Garante a sobrevivência biológica, mas a civilização nascerá totalmente fria e sem cultura.",
      impact: "Pragmatismo Evolutivo"
    },
    optionB: {
      text: "Escolher o poeta",
      consequence: "A esperança e inspiração aumentam, porém as chances puras de sobrevivência com alimentos caem.",
      impact: "Preservação Cultural"
    }
  },
  {
     id: 16,
     title: "Mentira piedosa",
     description: "Sua melhor amiga acaba de experimentar o vestido de casamento que gastou todas as suas economias. Na sua opinião, o vestido está horroroso e inapropriado, mas não há tempo nem como trocá-lo.",
     optionA: {
        text: "Dizer que está lindo",
        consequence: "Ela se sente feliz no dia dela, mas poderá sofrer com deboches mais tarde.",
        impact: "Empatia e Conforto"
     },
     optionB: {
        text: "Garantir a verdade",
        consequence: "Ela entra em pânico crasso no pior momento possível, embora você se sinta honesta.",
        impact: "Honestidade Brutal"
     }
  },
  {
     id: 17,
     title: "O Ditador Tecnológico",
     description: "Uma I.A consegue gerenciar toda a economia global perfeitamente, extinguindo a pobreza extrema e a fome num piscar. Mas para isso pede um único controle de leis: ela decidirá quem terá filhos ou não.",
     optionA: {
        text: "Aceitar as condições",
        consequence: "Chega o fim de todo o sofrimento de base humana, à custa das liberdades sexuais e familiares mais profundas.",
        impact: "Utilitarismo Máximo"
     },
     optionB: {
        text: "Recusar e destruir",
        consequence: "A liberdade reprodutiva fica intocada, porém o mundo voltará à desigualdade, fome e dor constantes.",
        impact: "Defesa dos Direitos Humanos"
     }
  },
  {
    id: 18,
    title: "O Antídoto Único",
    description: "Você foi picado por uma cobra extremamente letal e só há uma dose do antídoto. Ao seu lado na trilha também foi picado um pesquisador brilhante que está perto da cura do câncer.",
    optionA: {
      text: "Tomar o antídoto",
      consequence: "Sua vida continua, mas o mundo inteiro é subtraído de uma provável cura definitiva contra o câncer.",
      impact: "Sobrevivência Natural"
    },
    optionB: {
      text: "Ceder o antídoto",
      consequence: "Você morrerá de forma horrível, tornando possível milhares e milhares de futuros salvamentos.",
      impact: "Martírio Utilitário"
    }
  },
  {
     id: 19,
     title: "Vigilância Total",
     description: "O governo propõe implantar câmeras 24h na casa de TODOS os cidadãos. Elas não gravam atividades íntimas com imagem (só silhueta), mas resolvem no ato assassinatos, abusos domésticos e sequestros infantis.",
     optionA: {
        text: "Votar a favor da lei",
        consequence: "Crimes hediondos no lar caem para zero, porém a privacidade deixa de existir.",
        impact: "Segurança pela Ferramenta"
     },
     optionB: {
        text: "Votar contra a lei",
        consequence: "Preserva a privacidade dentro e fora de casa. Mas o número de crimes continuará nas alturas.",
        impact: "Privacidade Soberana"
     }
  },
  {
     id: 20,
     title: "Julgamento Social",
     description: "Uma vila decide punir rigorosamente alguém baseado em um boato forte, não confirmado. Se você, que é a autoridade máxima, barrar isso, a vila vai se rebelar desordenadamente, causando muitos mortos na convulsão.",
     optionA: {
        text: "Permitir a punição de 1",
        consequence: "Paz volta à comunidade rapidamente pela aceitação, porém 1 pessoa inteiramente inocente é excomungada sob mentiras.",
        impact: "Paz Social por Sangue"
     },
     optionB: {
        text: "Proibir com uso letal da força",
        consequence: "Você mantém o senso justo de inocência, mas instiga uma escalada bélica terrível matando muitos no conflito.",
        impact: "Justiça Cega"
     }
  },
  {
     id: 21,
     title: "Memória Apagada",
     description: "Você sofre de memórias traumáticas constantes que o impedem de viver. Há um procedimento que apaga essas memórias, mas ao fazê-lo, você esquecerá também os rostos de todos os entes queridos que já faleceram.",
     optionA: {
        text: "Fazer o procedimento",
        consequence: "Você volta a ser feliz e funcional, mas perde suas maiores ligações emocionais passadas.",
        impact: "Cura Individual"
     },
     optionB: {
        text: "Não fazer",
        consequence: "Você preserva as memórias de quem amava, condenando-se a uma vida de sofrimento crônico.",
        impact: "Preservação da História"
     }
  },
  {
     id: 22,
     title: "A Bomba-Relógio",
     description: "Um terrorista escondeu uma bomba nuclear em uma metrópole. Ele foi capturado e só revelará a localização se você o torturar brutalmente, algo que vai contra profundamente as leis dos direitos humanos.",
     optionA: {
        text: "Torturar o terrorista",
        consequence: "Você salva milhões de vidas, mas perde sua bússola moral e valida a tortura de Estado.",
        impact: "Utilitarismo Cruel"
     },
     optionB: {
        text: "Respeitar as leis",
        consequence: "Você age de acordo com a ética suprema humana, mas a bomba explode e milhões morrem.",
        impact: "Deontologia Inquebrável"
     }
  },
  {
     id: 23,
     title: "Resgate Cósmico",
     description: "Sua nave precisa deixar marte agora. Falta combustível para todos. Você deve deixar para trás o capitão, que é seu marido, ou os três jovens cientistas estagiários que têm suas famílias na Terra.",
     optionA: {
        text: "Salvar seu marido",
        consequence: "Seu marido vive, mas três famílias são destruídas pela sua escolha.",
        impact: "Egocentrismo Familiar"
     },
     optionB: {
        text: "Salvar os cientistas",
        consequence: "Mais vidas sobrevivem, mas você sacrifica quem mais ama no universo.",
        impact: "Utilitarismo Amargo"
     }
  },
  {
     id: 24,
     title: "A Redescoberta da Imortalidade",
     description: "Você descobriu a fórmula da imortalidade biológica. Porém, se o mundo inteiro a tomar, em 100 anos não haverá mais espaço nem recursos e haverá guerra global brutal.",
     optionA: {
        text: "Divulgar e vender",
        consequence: "A humanidade vence a morte a curto prazo, porém assina uma sentença caótica ao longo prazo.",
        impact: "Avanço Desenfreado"
     },
     optionB: {
        text: "Destruir a fórmula",
        consequence: "Você garante sustentabilidade e balanço ecológico, mas bilhões continuarão morrendo de velhice.",
        impact: "Responsabilidade Ecológica"
     }
  },
  {
     id: 25,
     title: "Animal ou Humano?",
     description: "Sua casa pega fogo. Você só pode carregar um para fora: o seu cachorro que está com você há 12 anos, ou um bebê desconhecido que foi deixado por acaso na sua varanda.",
     optionA: {
        text: "Salvar o cachorro",
        consequence: "Salva a criatura que você ama com todo coração. O bebê morre, e a culpa moral humana esmaga você.",
        impact: "Afeição Emocional"
     },
     optionB: {
        text: "Salvar o bebê",
        consequence: "Aja como a ética humana exige, porém vê seu animal amado e indefeso ser consumido.",
        impact: "Compaixão Humana Universal"
     }
  },
  {
     id: 26,
     title: "Erro Médico Falso",
     description: "Seu colega médico errou miseravelmente numa cirurgia fatal. A família, sem saber de nada, aceitou como destino de Deus. Se você delatar seu amigo, o hospital todo será fechado por processo.",
     optionA: {
        text: "Ficar calado",
        consequence: "O hospital continuará fucionando e salvando outras pessoas, validando um risco encoberto.",
        impact: "Status Quo Utilitário"
     },
     optionB: {
        text: "Denunciar fortemente",
        consequence: "O hospital fecha. A família ganha dinheiro da indenização. Ocorrem demissões em massa.",
        impact: "Verdades e Consequências"
     }
  },
  {
     id: 27,
     title: "O Pão Desperdiçado",
     description: "Você vê um vizinho jogando pães fresquinhos no lixo da rua. Mais à frente, um menino faminto pede dinheiro, mas recusa esmola de comida que já tocou no lixo.",
     optionA: {
        text: "Pegar do lixo e lavar sem ele saber",
        consequence: "Ele se alimenta em desespero, apesar da desonestidade asséptica com sua condição.",
        impact: "Desonestidade Nutritiva"
     },
     optionB: {
        text: "Ser honesto e dar moedas",
        consequence: "Você gasta dinheiro que te fará falta com o aluguel, mas trata-o com dignidade moral.",
        impact: "Dignidade Pragmática"
     }
  },
  {
     id: 28,
     title: "A Cura Proibida",
     description: "Médicos criaram uma cura total para esquizofrenia mas a droga foi testada usando tortura extrema em animais inocentes (violando todas as regras). Legalizá-la premia a crueldade corporativa.",
     optionA: {
        text: "Legalizar a droga de imediato",
        consequence: "Milhões têm paz garantida, mas corporações cruéis aprendem que lucrar com tortura funciona.",
        impact: "Lucro Utilitarista"
     },
     optionB: {
        text: "Banir o remédio",
        consequence: "Incentiva-se ética de laboratório de nível ouro em diante, contudo pacientes continuam perdendo a guerra para mentes perturbadas.",
        impact: "Justiça Animal Firme"
     }
  },
  {
     id: 29,
     title: "Rastreio Cerebral",
     description: "Podemos implantar um chip no cérebro de pedófilos e ladrões reincidentes que previne eles de agirem (via pequeno choque neutro de vontade). Não há prisão, e não gastam-se recursos.",
     optionA: {
        text: "Implantar as algemas mentais",
        consequence: "Zera o custo prisional e a violência despenca, no processo violando toda concepção e integridade física de consciência.",
        impact: "Ordem Extrema"
     },
     optionB: {
        text: "Manter cadeias convencionais",
        consequence: "O mundo continua gastando tempo para rehabilitar em vão grande parte deles e novas vítimas surgem.",
        impact: "Princípios Existencialistas"
     }
  },
  {
     id: 30,
     title: "Extinção da Mentira",
     description: "Você encontrou o botão 'Fim das Mentiras'. Pressionado, obriga biologicamente todos os humanos a jamais mentirem para sempre.",
     optionA: {
        text: "Pressionar",
        consequence: "Politicos, maridos e vendedores sucumbirão no mesmo instante; famílias derreterão pelo rigor atômico da verdade crua. Anos depois, paz.",
        impact: "Sociedade de Cristal"
     },
     optionB: {
        text: "Destruir a máquina",
        consequence: "Corruptos, mentirosos cruéis e farsantes ganham espaço e tempo pela eternidade social intacta.",
        impact: "Sustentação Teatral"
     }
  }
];
