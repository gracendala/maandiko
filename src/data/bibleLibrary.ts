import { BibleBook, BibleVerse, BibleTranslation } from '../types';

export const BIBLE_BOOKS: BibleBook[] = [
  // Ancien Testament
  { id: 'genese', name: 'Genèse', testament: 'OT', chaptersCount: 50 },
  { id: 'exode', name: 'Exode', testament: 'OT', chaptersCount: 40 },
  { id: 'levitique', name: 'Lévitique', testament: 'OT', chaptersCount: 27 },
  { id: 'nombres', name: 'Nombres', testament: 'OT', chaptersCount: 36 },
  { id: 'deuteronome', name: 'Deutéronome', testament: 'OT', chaptersCount: 34 },
  { id: 'josue', name: 'Josué', testament: 'OT', chaptersCount: 24 },
  { id: 'juges', name: 'Juges', testament: 'OT', chaptersCount: 21 },
  { id: 'ruth', name: 'Ruth', testament: 'OT', chaptersCount: 4 },
  { id: '1samuel', name: '1 Samuel', testament: 'OT', chaptersCount: 31 },
  { id: '2samuel', name: '2 Samuel', testament: 'OT', chaptersCount: 24 },
  { id: '1rois', name: '1 Rois', testament: 'OT', chaptersCount: 22 },
  { id: '2rois', name: '2 Rois', testament: 'OT', chaptersCount: 25 },
  { id: '1chroniques', name: '1 Chroniques', testament: 'OT', chaptersCount: 29 },
  { id: '2chroniques', name: '2 Chroniques', testament: 'OT', chaptersCount: 36 },
  { id: 'esdras', name: 'Esdras', testament: 'OT', chaptersCount: 10 },
  { id: 'nehemie', name: 'Néhémie', testament: 'OT', chaptersCount: 13 },
  { id: 'esther', name: 'Esther', testament: 'OT', chaptersCount: 10 },
  { id: 'job', name: 'Job', testament: 'OT', chaptersCount: 42 },
  { id: 'psaumes', name: 'Psaumes', testament: 'OT', chaptersCount: 150 },
  { id: 'proverbes', name: 'Proverbes', testament: 'OT', chaptersCount: 31 },
  { id: 'ecclesiaste', name: 'Ecclésiaste', testament: 'OT', chaptersCount: 12 },
  { id: 'cantique', name: 'Cantique des Cantiques', testament: 'OT', chaptersCount: 8 },
  { id: 'esaie', name: 'Ésaïe', testament: 'OT', chaptersCount: 66 },
  { id: 'jeremie', name: 'Jérémie', testament: 'OT', chaptersCount: 52 },
  { id: 'lamentations', name: 'Lamentations', testament: 'OT', chaptersCount: 5 },
  { id: 'ezechiel', name: 'Ézéchiel', testament: 'OT', chaptersCount: 48 },
  { id: 'daniel', name: 'Daniel', testament: 'OT', chaptersCount: 12 },
  { id: 'osee', name: 'Osée', testament: 'OT', chaptersCount: 14 },
  { id: 'joel', name: 'Joël', testament: 'OT', chaptersCount: 3 },
  { id: 'amos', name: 'Amos', testament: 'OT', chaptersCount: 9 },
  { id: 'abdias', name: 'Abdias', testament: 'OT', chaptersCount: 1 },
  { id: 'jonas', name: 'Jonas', testament: 'OT', chaptersCount: 4 },
  { id: 'michee', name: 'Michée', testament: 'OT', chaptersCount: 7 },
  { id: 'nahum', name: 'Nahum', testament: 'OT', chaptersCount: 3 },
  { id: 'habakuk', name: 'Habakuk', testament: 'OT', chaptersCount: 3 },
  { id: 'sophonie', name: 'Sophonie', testament: 'OT', chaptersCount: 3 },
  { id: 'aggee', name: 'Aggée', testament: 'OT', chaptersCount: 2 },
  { id: 'zacharie', name: 'Zacharie', testament: 'OT', chaptersCount: 14 },
  { id: 'malachie', name: 'Malachie', testament: 'OT', chaptersCount: 4 },

  // Nouveau Testament
  { id: 'matthieu', name: 'Matthieu', testament: 'NT', chaptersCount: 28 },
  { id: 'marc', name: 'Marc', testament: 'NT', chaptersCount: 16 },
  { id: 'luc', name: 'Luc', testament: 'NT', chaptersCount: 24 },
  { id: 'jean', name: 'Jean', testament: 'NT', chaptersCount: 21 },
  { id: 'actes', name: 'Actes', testament: 'NT', chaptersCount: 28 },
  { id: 'romains', name: 'Romains', testament: 'NT', chaptersCount: 16 },
  { id: '1corinthiens', name: '1 Corinthiens', testament: 'NT', chaptersCount: 16 },
  { id: '2corinthiens', name: '2 Corinthiens', testament: 'NT', chaptersCount: 13 },
  { id: 'galates', name: 'Galates', testament: 'NT', chaptersCount: 6 },
  { id: 'ephesiens', name: 'Éphésiens', testament: 'NT', chaptersCount: 6 },
  { id: 'philippiens', name: 'Philippiens', testament: 'NT', chaptersCount: 4 },
  { id: 'colossiens', name: 'Colossiens', testament: 'NT', chaptersCount: 4 },
  { id: '1thessaloniciens', name: '1 Thessaloniciens', testament: 'NT', chaptersCount: 5 },
  { id: '2thessaloniciens', name: '2 Thessaloniciens', testament: 'NT', chaptersCount: 3 },
  { id: '1timothee', name: '1 Timothée', testament: 'NT', chaptersCount: 6 },
  { id: '2timothee', name: '2 Timothée', testament: 'NT', chaptersCount: 4 },
  { id: 'tite', name: 'Tite', testament: 'NT', chaptersCount: 3 },
  { id: 'philemon', name: 'Philémon', testament: 'NT', chaptersCount: 1 },
  { id: 'hebreux', name: 'Hébreux', testament: 'NT', chaptersCount: 13 },
  { id: 'jacques', name: 'Jacques', testament: 'NT', chaptersCount: 5 },
  { id: '1pierre', name: '1 Pierre', testament: 'NT', chaptersCount: 5 },
  { id: '2pierre', name: '2 Pierre', testament: 'NT', chaptersCount: 3 },
  { id: '1jean', name: '1 Jean', testament: 'NT', chaptersCount: 5 },
  { id: '2jean', name: '2 Jean', testament: 'NT', chaptersCount: 1 },
  { id: '3jean', name: '3 Jean', testament: 'NT', chaptersCount: 1 },
  { id: 'jude', name: 'Jude', testament: 'NT', chaptersCount: 1 },
  { id: 'apocalypse', name: 'Apocalypse', testament: 'NT', chaptersCount: 22 }
];

export const FEATURED_BIBLE_VERSES: BibleVerse[] = [
  // Genèse
  { book: 'Genèse', chapter: 1, verse: 1, text: 'Au commencement, Dieu créa les cieux et la terre.', translation: 'MARTIN' },
  { book: 'Genèse', chapter: 1, verse: 2, text: 'La terre était informe et vide; il y avait des ténèbres à la surface de l\'abîme, et l\'esprit de Dieu se mouvait au-dessus des eaux.', translation: 'MARTIN' },
  { book: 'Genèse', chapter: 1, verse: 3, text: 'Dieu dit: Que la lumière soit! Et la lumière fut.', translation: 'MARTIN' },
  { book: 'Genèse', chapter: 1, verse: 4, text: 'Dieu vit que la lumière était bonne; et Dieu sépara la lumière d\'avec les ténèbres.', translation: 'MARTIN' },
  { book: 'Genèse', chapter: 1, verse: 5, text: 'Dieu appela la lumière jour, et il appela les ténèbres nuit. Ainsi, il y eut un soir, et il y eut un matin: ce fut le premier jour.', translation: 'MARTIN' },
  { book: 'Genèse', chapter: 1, verse: 26, text: 'Puis Dieu dit: Faisons l\'homme à notre image, selon notre ressemblance, et qu\'il domine sur les poissons de la mer, sur les oiseaux du ciel, sur le bétail, sur toute la terre, et sur tous les reptiles qui rampent sur la terre.', translation: 'MARTIN' },
  { book: 'Genèse', chapter: 1, verse: 27, text: 'Dieu créa l\'homme à son image, il le créa à l\'image de Dieu, il créa l\'homme et la femme.', translation: 'MARTIN' },

  // Exode
  { book: 'Exode', chapter: 3, verse: 14, text: 'Dieu dit à Moïse: Je suis celui qui suis. Et il ajouta: C\'est ainsi que tu répondras aux enfants d\'Israël: Celui qui s\'appelle \'Je suis\' m\'a envoyé vers vous.', translation: 'MARTIN' },
  { book: 'Exode', chapter: 20, verse: 1, text: 'Alors Dieu prononça toutes ces paroles, en disant:', translation: 'MARTIN' },
  { book: 'Exode', chapter: 20, verse: 2, text: 'Je suis l\'Éternel, ton Dieu, qui t\'ai fait sortir du pays d\'Égypte, de la maison de servitude.', translation: 'MARTIN' },
  { book: 'Exode', chapter: 20, verse: 3, text: 'Tu n\'auras pas d\'autres dieux devant ma face.', translation: 'MARTIN' },

  // Psaumes
  { book: 'Psaumes', chapter: 1, verse: 1, text: 'Heureux l\'homme qui ne marche pas selon le conseil des méchants, Qui ne s\'arrête pas sur la voie des pécheurs, Et qui ne s\'assied pas en compagnie des moqueurs,', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 1, verse: 2, text: 'Mais qui trouve son plaisir dans la loi de l\'Éternel, Et qui la médite jour et nuit!', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 1, verse: 3, text: 'Il est comme un arbre planté près d\'un courant d\'eau, Qui donne son fruit en sa saison, Et dont le feuillage ne se flétrit point: Tout ce qu\'il fait lui réussit.', translation: 'MARTIN' },

  { book: 'Psaumes', chapter: 23, verse: 1, text: 'L\'Éternel est mon berger: je ne manquerai de rien.', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 23, verse: 2, text: 'Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles.', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 23, verse: 3, text: 'Il restaure mon âme, Il me conduit dans les sentiers de la justice, À cause de son nom.', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 23, verse: 4, text: 'Quand je marche dans la vallée de l\'ombre de la mort, Je ne crains aucun mal, car tu es avec moi: Ta houlette et ton bâton me rassurent.', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 23, verse: 5, text: 'Tu dresses devant moi une table, En face de mes adversaires; Tu oins d\'huile ma tête, Et ma coupe déborde.', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 23, verse: 6, text: 'Oui, le bonheur et la grâce m\'accompagneront Tous les jours de ma vie, Et j\'habiterai dans la maison de l\'Éternel Jusqu\'à la fin de mes jours.', translation: 'MARTIN' },

  { book: 'Psaumes', chapter: 91, verse: 1, text: 'Celui qui demeure sous l\'abri du Très-Haut Repose à l\'ombre du Tout-Puissant.', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 91, verse: 2, text: 'Je dis à l\'Éternel: Mon refuge et ma forteresse, Mon Dieu en qui je me confie!', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 91, verse: 11, text: 'Car il ordonnera à ses anges De te garder dans toutes tes voies;', translation: 'MARTIN' },

  { book: 'Psaumes', chapter: 100, verse: 1, text: 'Psaume de louange. Poussez vers l\'Éternel des cris de joie, Vous tous, habitants de la terre!', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 100, verse: 2, text: 'Servez l\'Éternel, avec joie, Venez avec allégresse en sa présence!', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 100, verse: 3, text: 'Sachez que l\'Éternel est Dieu! C\'est lui qui nous a faits, et nous lui appartenons; Nous sommes son peuple, et le troupeau de son pâturage.', translation: 'MARTIN' },

  { book: 'Psaumes', chapter: 119, verse: 105, text: 'Ta parole est une lampe à mes pieds, Et une lumière sur mon sentier.', translation: 'MARTIN' },

  { book: 'Psaumes', chapter: 121, verse: 1, text: 'Cantique des degrés. Je lève mes yeux vers les montagnes... D\'où me viendra le secours?', translation: 'MARTIN' },
  { book: 'Psaumes', chapter: 121, verse: 2, text: 'Le secours me vient de l\'Éternel, Qui a fait les cieux et la terre.', translation: 'MARTIN' },

  // Ésaïe
  { book: 'Ésaïe', chapter: 40, verse: 31, text: 'Mais ceux qui s\'attendent à l\'Éternel renouvelleront leur force; ils s\'élèveront avec des ailes comme des aigles; ils courront et ne se lasseront point; ils marcheront et ne s\'épuiseront point.', translation: 'MARTIN' },
  { book: 'Ésaïe', chapter: 53, verse: 5, text: 'Mais il était blessé pour nos péchés, Brisé pour nos iniquités; Le châtiment qui nous donne la paix est tombé sur lui, Et c\'est par ses meurtrissures que nous sommes guéris.', translation: 'MARTIN' },

  // Matthieu
  { book: 'Matthieu', chapter: 5, verse: 3, text: 'Heureux les pauvres en esprit, car le royaume des cieux est à eux!', translation: 'MARTIN' },
  { book: 'Matthieu', chapter: 5, verse: 14, text: 'Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée;', translation: 'MARTIN' },
  { book: 'Matthieu', chapter: 6, verse: 9, text: 'Voici donc comment vous devez prier: Notre Père qui es aux cieux! Que ton nom soit sanctifié;', translation: 'MARTIN' },
  { book: 'Matthieu', chapter: 6, verse: 10, text: 'que ton règne vienne; que ta volonté soit faite sur la terre comme au ciel.', translation: 'MARTIN' },
  { book: 'Matthieu', chapter: 6, verse: 33, text: 'Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus.', translation: 'MARTIN' },
  { book: 'Matthieu', chapter: 28, verse: 19, text: 'Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit,', translation: 'MARTIN' },
  { book: 'Matthieu', chapter: 28, verse: 20, text: 'et enseignez-leur à observer tout ce que je vous ai prescrit. Et voici, je suis avec vous tous les jours, jusqu\'à la fin du monde.', translation: 'MARTIN' },

  // Jean
  { book: 'Jean', chapter: 1, verse: 1, text: 'Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu.', translation: 'MARTIN' },
  { book: 'Jean', chapter: 1, verse: 2, text: 'Elle était au commencement avec Dieu.', translation: 'MARTIN' },
  { book: 'Jean', chapter: 1, verse: 3, text: 'Toutes choses ont été faites par elle, et rien de ce qui a été fait n\'a été fait sans elle.', translation: 'MARTIN' },
  { book: 'Jean', chapter: 1, verse: 14, text: 'Et la parole a été faite chair, et elle a habité parmi nous, pleine de grâce et de vérité; et nous avons contemplé sa gloire, une gloire comme la gloire du Fils unique venu du Père.', translation: 'MARTIN' },

  { book: 'Jean', chapter: 3, verse: 3, text: 'Jésus lui répondit: En vérité, en vérité, je te le dis, si un homme ne naît de nouveau, il ne peut voir le royaume de Dieu.', translation: 'MARTIN' },
  { book: 'Jean', chapter: 3, verse: 16, text: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu\'il ait la vie éternelle.', translation: 'MARTIN' },
  { book: 'Jean', chapter: 3, verse: 17, text: 'Dieu, en effet, n\'a pas envoyé son Fils dans le monde pour qu\'il juge le monde, mais pour que le monde soit sauvé par lui.', translation: 'MARTIN' },

  { book: 'Jean', chapter: 14, verse: 1, text: 'Que votre cœur ne se trouble point. Croyez en Dieu, et croyez en moi.', translation: 'MARTIN' },
  { book: 'Jean', chapter: 14, verse: 2, text: 'Il y a plusieurs demeures dans la maison de mon Père. Si cela n\'était pas, je vous l\'aurais dit. Je vais vous préparer une place.', translation: 'MARTIN' },
  { book: 'Jean', chapter: 14, verse: 6, text: 'Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.', translation: 'MARTIN' },
  { book: 'Jean', chapter: 14, verse: 27, text: 'Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s\'effraye point.', translation: 'MARTIN' },

  // Actes
  { book: 'Actes', chapter: 1, verse: 8, text: 'Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu\'aux extrémités de la terre.', translation: 'MARTIN' },
  { book: 'Actes', chapter: 2, verse: 38, text: 'Pierre leur dit: Repentez-vous, et que chacun de vous soit baptisé au nom de Jésus-Christ, pour le pardon de vos péchés; et vous recevrez le don du Saint-Esprit.', translation: 'MARTIN' },
  { book: 'Actes', chapter: 4, verse: 12, text: 'Il n\'y a de salut en aucun autre; car il n\'y a sous le ciel aucun autre nom qui ait été donné parmi les hommes, par lequel nous devions être sauvés.', translation: 'MARTIN' },

  // Romains
  { book: 'Romains', chapter: 8, verse: 1, text: 'Il n\'y a donc maintenant aucune condemnation pour ceux qui sont en Jésus-Christ.', translation: 'MARTIN' },
  { book: 'Romains', chapter: 8, verse: 28, text: 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.', translation: 'MARTIN' },
  { book: 'Romains', chapter: 8, verse: 31, text: 'Que dirons-nous donc à l\'égard de ces choses? Si Dieu est pour nous, qui sera contre nous?', translation: 'MARTIN' },
  { book: 'Romains', chapter: 12, verse: 2, text: 'Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l\'intelligence, afin que vous discerniez quelle est la volonté de Dieu, ce qui est bon, agréable et parfait.', translation: 'MARTIN' },

  // 1 Corinthiens
  { book: '1 Corinthiens', chapter: 13, verse: 4, text: 'L\'amour est patient, il est plein de bonté; l\'amour n\'est point envieux; l\'amour ne se vante point, il ne s\'enfle point d\'orgueil,', translation: 'MARTIN' },
  { book: '1 Corinthiens', chapter: 13, verse: 13, text: 'Maintenant donc ces trois choses demeurent: la foi, l\'espérance, l\'amour; mais la plus grande de ces choses, c\'est l\'amour.', translation: 'MARTIN' },

  // Galates
  { book: 'Galates', chapter: 5, verse: 22, text: 'Mais le fruit de l\'Éprit, c\'est l\'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance;', translation: 'MARTIN' },

  // Éphésiens
  { book: 'Éphésiens', chapter: 6, verse: 10, text: 'Au reste, fortifiez-vous dans le Seigneur, et par sa force toute-puissante.', translation: 'MARTIN' },

  // Philippiens
  { book: 'Philippiens', chapter: 4, verse: 6, text: 'Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces.', translation: 'MARTIN' },
  { book: 'Philippiens', chapter: 4, verse: 13, text: 'Je puis tout par celui qui me fortifie.', translation: 'MARTIN' },

  // Hébreux
  { book: 'Hébreux', chapter: 11, verse: 1, text: 'Or la foi est une ferme assurance des choses qu\'on espère, une démonstration de celles qu\'on ne voit pas.', translation: 'MARTIN' },
  { book: 'Hébreux', chapter: 13, verse: 8, text: 'Jésus-Christ est le même hier, aujourd\'hui, et éternellement.', translation: 'MARTIN' },

  // Apocalypse
  { book: 'Apocalypse', chapter: 10, verse: 7, text: 'mais qu\'aux jours de la voix du septième ange, quand il commencerait à sonner de la trompette, le mystère de Dieu s\'accomplirait, comme il l\'a annoncé à ses serviteurs, les prophètes.', translation: 'MARTIN' },
  { book: 'Apocalypse', chapter: 21, verse: 4, text: 'Il essuiera toute larme de leurs yeux, et la mort ne sera plus, et il n\'y aura plus ni deuil, ni cri, ni douleur, car les premières choses ont disparu.', translation: 'MARTIN' }
];

export const BIBLE_BOOK_TO_BOLLS_ID: Record<string, number> = {
  'Genèse': 1, 'Exode': 2, 'Lévitique': 3, 'Nombres': 4, 'Deutéronome': 5,
  'Josué': 6, 'Juges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Rois': 11, '2 Rois': 12, '1 Chroniques': 13, '2 Chroniques': 14,
  'Esdras': 15, 'Néhémie': 16, 'Esther': 17, 'Job': 18, 'Psaumes': 19,
  'Proverbes': 20, 'Ecclésiaste': 21, 'Cantique des Cantiques': 22,
  'Ésaïe': 23, 'Jérémie': 24, 'Lamentations': 25, 'Ézéchiel': 26,
  'Daniel': 27, 'Osée': 28, 'Joël': 29, 'Amos': 30, 'Abdias': 31,
  'Jonas': 32, 'Michée': 33, 'Nahum': 34, 'Habakuk': 35, 'Sophonie': 36,
  'Aggée': 37, 'Zacharie': 38, 'Malachie': 39, 'Matthieu': 40, 'Marc': 41,
  'Luc': 42, 'Jean': 43, 'Actes': 44, 'Romains': 45, '1 Corinthiens': 46,
  '2 Corinthiens': 47, 'Galates': 48, 'Éphésiens': 49, 'Philippiens': 50,
  'Colossiens': 51, '1 Thessaloniciens': 52, '2 Thessaloniciens': 53,
  '1 Timothée': 54, '2 Timothée': 55, 'Tite': 56, 'Philémon': 57,
  'Hébreux': 58, 'Jacques': 59, '1 Pierre': 60, '2 Pierre': 61,
  '1 Jean': 62, '2 Jean': 63, '3 Jean': 64, 'Jude': 65, 'Apocalypse': 66
};

export const BIBLE_BOOK_TO_USFM: Record<string, string> = {
  'Genèse': 'GEN', 'Exode': 'EXO', 'Lévitique': 'LEV', 'Nombres': 'NUM', 'Deutéronome': 'DEU',
  'Josué': 'JOSH', 'Juges': 'JUDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Rois': '1KI', '2 Rois': '2KI', '1 Chroniques': '1CH', '2 Chroniques': '2CH',
  'Esdras': 'EZR', 'Néhémie': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psaumes': 'PSA',
  'Proverbes': 'PRO', 'Ecclésiaste': 'ECC', 'Cantique des Cantiques': 'SNG',
  'Ésaïe': 'ISA', 'Jérémie': 'JER', 'Lamentations': 'LAM', 'Ézéchiel': 'EZK',
  'Daniel': 'DAN', 'Osée': 'HOS', 'Joël': 'JOL', 'Amos': 'AMO', 'Abdias': 'OBA',
  'Jonas': 'JON', 'Michée': 'MIC', 'Nahum': 'NAM', 'Habakuk': 'HAB', 'Sophonie': 'ZEP',
  'Aggée': 'HAG', 'Zacharie': 'ZEC', 'Malachie': 'MAL', 'Matthieu': 'MAT', 'Marc': 'MRK',
  'Luc': 'LUK', 'Jean': 'JHN', 'Actes': 'ACT', 'Romains': 'ROM', '1 Corinthiens': '1CO',
  '2 Corinthiens': '2CO', 'Galates': 'GAL', 'Éphésiens': 'EPH', 'Philippiens': 'PHP',
  'Colossiens': 'COL', '1 Thessaloniciens': '1TH', '2 Thessaloniciens': '2TH',
  '1 Timothée': '1TI', '2 Timothée': '2TI', 'Tite': 'TIT', 'Philémon': 'PHM',
  'Hébreux': 'HEB', 'Jacques': 'JAS', '1 Pierre': '1PE', '2 Pierre': '2PE',
  '1 Jean': '1JN', '2 Jean': '2JN', '3 Jean': '3JN', 'Jude': 'JUD', 'Apocalypse': 'REV'
};

export const BOLLS_TRANSLATION_MAP: Record<string, string[]> = {
  'LSG': ['FRLSG', 'LS1910', 'FRDBY', 'NBS', 'BDS'],
  'MARTIN': ['FRLSG', 'FRDBY', 'NBS'],
  'OST': ['FRLSG', 'FRDBY', 'NBS'],
  'BDS': ['BDS', 'FRLSG', 'FRDBY'],
  'BFC': ['FRPDV17', 'BDS', 'FRLSG'],
  'DARBY': ['FRDBY', 'FRLSG'],
  'KJV': ['KJV', 'NKJV', 'ESV'],
  'NIV': ['NIV', 'NIV2011', 'KJV'],
  'ESV': ['ESV', 'KJV'],
  'RVR1960': ['RV1960', 'RVR1960', 'NVI'],
  'LUT1545': ['LUT', 'LUT1545'],
  'LUT': ['LUT', 'LUT1545'],
  'ARC': ['ARC09', 'ARA', 'ACF11'],
  'SW2000': ['SUV'],
  'SUV': ['SUV'],
  'ITA': ['NR06', 'VULG']
};

/** Fetch authentic Bible chapter from reliable online APIs (Bolls, Bible-API) */
export async function fetchRealBibleChapter(
  bookName: string,
  chapterNum: number,
  translation: string
): Promise<BibleVerse[]> {
  if (!translation) return [];
  const bollsId = BIBLE_BOOK_TO_BOLLS_ID[bookName];

  // 1. Query Bolls.life Bible API using mapped codes (e.g. LSG -> LS1910)
  if (bollsId) {
    const candidateCodes = BOLLS_TRANSLATION_MAP[translation] || [translation, 'LS1910', 'FMAR', 'KJV'];
    for (const code of candidateCodes) {
      try {
        const res = await fetch(`https://bolls.life/get-chapter/${code}/${bollsId}/${chapterNum}/`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((item: any) => ({
              book: bookName,
              chapter: chapterNum,
              verse: Number(item.verse),
              text: String(item.text || '').replace(/<[^>]*>/g, '').trim(),
              translation: translation
            }));
          }
        }
      } catch (e) {
        console.warn(`Bolls API (${code}) query failed:`, e);
      }
    }
  }

  // 2. Fallback to Bible-API.com
  try {
    const apiTrans = translation.toLowerCase() === 'lsg' ? 'lsg' : 'kjv';
    const usfmBook = BIBLE_BOOK_TO_USFM[bookName] || bookName;
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(usfmBook)}+${chapterNum}?translation=${apiTrans}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.verses) && data.verses.length > 0) {
        return data.verses.map((v: any) => ({
          book: bookName,
          chapter: chapterNum,
          verse: Number(v.verse),
          text: String(v.text || '').trim(),
          translation: translation
        }));
      }
    }
  } catch (e) {
    console.warn("Bible-API fallback failed:", e);
  }

  return [];
}


