import { Song } from '../types';

export const INITIAL_SONGS: Song[] = [
  {
    id: 'song-001',
    number: '001',
    title: 'Crois Seulement',
    category: "Cantiques de l'Épouse",
    author: 'Paul Rader / W.M. Branham',
    keySignature: 'F',
    sections: [
      {
        id: 's001-c1',
        label: 'Couplet 1',
        type: 'Couplet',
        text: 'Né d\'une humble foi, la crainte s\'en va,\nQuand Jésus s\'approche, la grâce survient.\nTous nos fardeaux tombent devant sa présence,\nCar son Saint-Esprit guérit nos douleurs.',
        lines: [
          'Né d\'une humble foi, la crainte s\'en va,',
          'Quand Jésus s\'approche, la grâce survient.',
          'Tous nos fardeaux tombent devant sa présence,',
          'Car son Saint-Esprit guérit nos douleurs.'
        ]
      },
      {
        id: 's001-ref',
        label: 'Refrain',
        type: 'Refrain',
        text: 'Crois seulement, crois seulement,\nTout est possible, crois seulement !\nCrois seulement, crois seulement,\nTout est possible, crois seulement !',
        lines: [
          'Crois seulement, crois seulement,',
          'Tout est possible, crois seulement !',
          'Crois seulement, crois seulement,',
          'Tout est possible, crois seulement !'
        ]
      },
      {
        id: 's001-c2',
        label: 'Couplet 2',
        type: 'Couplet',
        text: 'Jésus est ici, Jésus est ici,\nTout est possible, Jésus est ici !\nJésus est ici, Jésus est ici,\nTout est possible, Jésus est ici !',
        lines: [
          'Jésus est ici, Jésus est ici,',
          'Tout est possible, Jésus est ici !',
          'Jésus est ici, Jésus est ici,',
          'Tout est possible, Jésus est ici !'
        ]
      },
      {
        id: 's001-c3',
        label: 'Couplet 3',
        type: 'Couplet',
        text: 'Le Crois-tu maintenant, le crois-tu maintenant ?\nTout est possible, le crois-tu maintenant ?\nOui, je crois maintenant, oui, je crois maintenant,\nTout est possible, oui, je crois maintenant !',
        lines: [
          'Le Crois-tu maintenant, le crois-tu maintenant ?',
          'Tout est possible, le crois-tu maintenant ?',
          'Oui, je crois maintenant, oui, je crois maintenant,',
          'Tout est possible, oui, je crois maintenant !'
        ]
      }
    ]
  },
  {
    id: 'song-002',
    number: '002',
    title: 'Combien Tu Es Grand',
    category: 'Sur les Ailes de la Foi',
    author: 'Carl Boberg',
    keySignature: 'A',
    sections: [
      {
        id: 's002-c1',
        label: 'Couplet 1',
        type: 'Couplet',
        text: 'O Dieu d\'amour, quand mon âme contemple\nTout l\'univers créé par ton pouvoir,\nLe ciel d\'azur, les éclairs, le tonnerre,\nLe clair de lune et les soleils du soir.',
        lines: [
          'O Dieu d\'amour, quand mon âme contemple',
          'Tout l\'univers créé par ton pouvoir,',
          'Le ciel d\'azur, les éclairs, le tonnerre,',
          'Le clair de lune et les soleils du soir.'
        ]
      },
      {
        id: 's002-ref',
        label: 'Refrain',
        type: 'Refrain',
        text: 'De tout mon être alors s\'élève un chant :\nCombien tu es grand ! Combien tu es grand !\nDe tout mon être alors s\'élève un chant :\nCombien tu es grand ! Combien tu es grand !',
        lines: [
          'De tout mon être alors s\'élève un chant :',
          'Combien tu es grand ! Combien tu es grand !',
          'De tout mon être alors s\'élève un chant :',
          'Combien tu es grand ! Combien tu es grand !'
        ]
      },
      {
        id: 's002-c2',
        label: 'Couplet 2',
        type: 'Couplet',
        text: 'Quand par les bois, le bocage ou la plaine,\nJ\'entends l\'oiseau chanter le Créateur,\nQuand je contemple les hauts sommets des montagnes,\nJe sens la paix de mon grand Rédempteur.',
        lines: [
          'Quand par les bois, le bocage ou la plaine,',
          'J\'entends l\'oiseau chanter le Créateur,',
          'Quand je contemple les hauts sommets des montagnes,',
          'Je sens la paix de mon grand Rédempteur.'
        ]
      },
      {
        id: 's002-c3',
        label: 'Couplet 3',
        type: 'Couplet',
        text: 'Quand le Seigneur, clarté de notre vie,\nReviendra du ciel pour me prendre avec Lui,\nJe m\'écrierai dans la gloire infinie :\nCombien Tu es grand, ô mon Dieu, mon Appui !',
        lines: [
          'Quand le Seigneur, clarté de notre vie,',
          'Reviendra du ciel pour me prendre avec Lui,',
          'Je m\'écrierai dans la gloire infinie :',
          'Combien Tu es grand, ô mon Dieu, mon Appui !'
        ]
      }
    ]
  },
  {
    id: 'song-003',
    number: '003',
    title: 'Grâce Étonnante (Amazing Grace)',
    category: 'Sur les Ailes de la Foi',
    author: 'John Newton',
    keySignature: 'G',
    sections: [
      {
        id: 's003-c1',
        label: 'Couplet 1',
        type: 'Couplet',
        text: 'Grâce étonnante ! Au son si doux,\nQui sauva un misérable comme moi !\nJ\'étais perdu, mais maintenant je suis trouvé,\nJ\'étais aveugle, mais maintenant je vois.',
        lines: [
          'Grâce étonnante ! Au son si doux,',
          'Qui sauva un misérable comme moi !',
          'J\'étais perdu, mais maintenant je suis trouvé,',
          'J\'étais aveugle, mais maintenant je vois.'
        ]
      },
      {
        id: 's003-c2',
        label: 'Couplet 2',
        type: 'Couplet',
        text: 'C\'est la grâce qui a enseigné à mon cœur à craindre,\nEt la grâce mes craintes a soulagées ;\nCombien précieuse cette grâce est apparue\nL\'heure où j\'ai cru pour la première fois !',
        lines: [
          'C\'est la grâce qui a enseigné à mon cœur à craindre,',
          'Et la grâce mes craintes a soulagées ;',
          'Combien précieuse cette grâce est apparue',
          'L\'heure où j\'ai cru pour la première fois !'
        ]
      },
      {
        id: 's003-c3',
        label: 'Couplet 3',
        type: 'Couplet',
        text: 'Quand nous serons là depuis dix mille ans,\nBrillants comme le soleil d\'un jour parfait,\nNous n\'aurons pas moins de jours pour chanter sa louange\nQue lorsque nous avons commencé !',
        lines: [
          'Quand nous serons là depuis dix mille ans,',
          'Brillants comme le soleil d\'un jour parfait,',
          'Nous n\'aurons pas moins de jours pour chanter sa louange',
          'Que lorsque nous avons commencé !'
        ]
      }
    ]
  },
  {
    id: 'song-004',
    number: '004',
    title: 'Sur Le Chemin Du Ciel',
    category: 'Chants de Victoire',
    author: 'Traditionnel',
    keySignature: 'D',
    sections: [
      {
        id: 's004-c1',
        label: 'Couplet 1',
        type: 'Couplet',
        text: 'Je marche sur le chemin du Ciel, l\'Esprit me conduit,\nLa lumière de sa Parole éclaire mes pas nuit et jour.\nChaque jour Jésus marche près de moi, je n\'ai aucun effroi,\nCar sa promesse est éternelle pour son Épouse en joie.',
        lines: [
          'Je marche sur le chemin du Ciel, l\'Esprit me conduit,',
          'La lumière de sa Parole éclaire mes pas nuit et jour.',
          'Chaque jour Jésus marche près de moi, je n\'ai aucun effroi,',
          'Car sa promesse est éternelle pour son Épouse en joie.'
        ]
      },
      {
        id: 's004-ref',
        label: 'Refrain',
        type: 'Refrain',
        text: 'Glória, Hallelujah ! Jésus est le Roi des rois !\nMon âme est délivrée, je chante avec foi !\nGlória, Hallelujah ! Bientôt dans la cité de paix,\nNous régnerons avec Jésus pour l\'éternité !',
        lines: [
          'Glória, Hallelujah ! Jésus est le Roi des rois !',
          'Mon âme est délivrée, je chante avec foi !',
          'Glória, Hallelujah ! Bientôt dans la cité de paix,',
          'Nous régnerons avec Jésus pour l\'éternité !'
        ]
      },
      {
        id: 's004-c2',
        label: 'Couplet 2',
        type: 'Couplet',
        text: 'A la voix du septième ange, le mystère est accompli,\nLa Parole de Dieu révélée réveille nos esprits.\nLevons nos têtes chers pèlerins, la rédemption approche,\nLe Roi vient chercher ses élus sans tache et sans reproche !',
        lines: [
          'A la voix du septième ange, le mystère est accompli,',
          'La Parole de Dieu révélée réveille nos esprits.',
          'Levons nos têtes chers pèlerins, la rédemption approche,',
          'Le Roi vient chercher ses élus sans tache et sans reproche !'
        ]
      }
    ]
  },
  {
    id: 'song-005',
    number: '005',
    title: 'À la Croix où mourut mon Sauveur',
    category: 'Sur les Ailes de la Foi',
    author: 'E.A. Hoffman',
    keySignature: 'G',
    sections: [
      {
        id: 's005-c1',
        label: 'Couplet 1',
        type: 'Couplet',
        text: 'À la croix où mourut mon Sauveur,\nOù je criai pour laver mon cœur,\nOù le sang fut appliqué à mon âme,\nGloire à son Nom !',
        lines: [
          'À la croix où mourut mon Sauveur,',
          'Où je criai pour laver mon cœur,',
          'Où le sang fut appliqué à mon âme,',
          'Gloire à son Nom !'
        ]
      },
      {
        id: 's005-ref',
        label: 'Refrain',
        type: 'Refrain',
        text: 'Gloire à son Nom ! Gloire à son Nom !\nLà mon cœur fut purifié du péché,\nGloire à son Nom !',
        lines: [
          'Gloire à son Nom ! Gloire à son Nom !',
          'Là mon cœur fut purifié du péché,',
          'Gloire à son Nom !'
        ]
      },
      {
        id: 's005-c2',
        label: 'Couplet 2',
        type: 'Couplet',
        text: 'Je suis si merveilleusement sauvé du péché,\nJésus demeure maintenant en moi ;\nÀ la croix où Il me prit avec Lui,\nGloire à son Nom !',
        lines: [
          'Je suis si merveilleusement sauvé du péché,',
          'Jésus demeure maintenant en moi ;',
          'À la croix où Il me prit avec Lui,',
          'Gloire à son Nom !'
        ]
      }
    ]
  },
  {
    id: 'song-006',
    number: '006',
    title: 'Quel Ami Fidèle et Tendre',
    category: 'Sur les Ailes de la Foi',
    author: 'Joseph Scriven',
    keySignature: 'F',
    sections: [
      {
        id: 's006-c1',
        label: 'Couplet 1',
        type: 'Couplet',
        text: 'Quel ami fidèle et tendre nous avons en Jésus-Christ !\nToujours prêt à nous entendre, à répondre à notre cri.\nAh ! quel repos nous perdons, quel soulagement exquis,\nQuand nous ne portons pas tout à Dieu dans la prière !',
        lines: [
          'Quel ami fidèle et tendre nous avons en Jésus-Christ !',
          'Toujours prêt à nous entendre, à répondre à notre cri.',
          'Ah ! quel repos nous perdons, quel soulagement exquis,',
          'Quand nous ne portons pas tout à Dieu dans la prière !'
        ]
      },
      {
        id: 's006-c2',
        label: 'Couplet 2',
        type: 'Couplet',
        text: 'S\'il survient quelque épreuve, si la tentation est là,\nQue jamais personne ne doute, la grâce suffira.\nTrouverons-nous un ami plus fidèle et plus puissant ?\nJésus connaît nos faiblesses, portons-Lui tout en priant.',
        lines: [
          'S\'il survient quelque épreuve, si la tentation est là,',
          'Que jamais personne ne doute, la grâce suffira.',
          'Trouverons-nous un ami plus fidèle et plus puissant ?',
          'Jésus connaît nos faiblesses, portons-Lui tout en priant.'
        ]
      }
    ]
  }
];
