// src/constants/questionDeck.js

/**
 * @typedef {"Mind" | "Body" | "Soul"} Category
 * @typedef {"TYPICAL" | "REVELATORY" | "WRONG"} AnswerClass
 * @typedef {{
 *   id: number | string,
 *   category: Category,
 *   tier: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
 *   title: string,
 *   text: string,
 *   answers: [
 *     { label: string, answerClass: AnswerClass, explanation: string },
 *     { label: string, answerClass: AnswerClass, explanation: string },
 *     { label: string, answerClass: AnswerClass, explanation: string }
 *   ]
 * }} Question
 */

/** @type {Question[]} */
const questions = [
  // ─────────────────── Tutorial (Tier 0) ───────────────────
  {
    id: 'TUT001',
    category: 'Mind',
    tier: 0,
    title: 'A Classic',
    text: 'What has wheels and flies?',
    answers: [
      {
        label: 'A Plane',
        answerClass: 'TYPICAL',
        explanation:
          'Planes have wheels. And when planes work, planes fly. But did you know there was another answer?',
      },
      {
        label: 'A Dictionary',
        answerClass: 'REVELATORY',
        explanation:
          'Both words—“wheels” and “flies”—appear in a dictionary. But did you know there was another answer?',
      },
      {
        label: 'A Garbage Truck',
        answerClass: 'TYPICAL',
        explanation:
          'Sure. It rolls on wheels, and flies tend to follow. But did you know there was another answer?',
      },
    ],
  },
  {
  id: 'TUT002',
  category: 'Mind',
  tier: 0,
  title: 'After Word',
  text: 'In the alphabet, which letter comes after P?',
  answers: [
    {
      label: 'Q',
      answerClass: 'TYPICAL',
      explanation:
        'Correct. In the standard sequence, "Q" follows "P". But did you know there was another way to be right?',
    },
    {
      label: 'H',
      answerClass: 'TYPICAL',
      explanation:
        'Correct. In the word "alphabet" itself, "h" follows "p". But did you know there was another way to be right?',
    },
    {
      label: 'V',
      answerClass: 'REVELATORY',
      explanation:
        'Also correct. "V" does come after "P", just not immediately. See? Sometimes there are many right answers.',
    },
  ],
},

  // ─────────────────── Tier 1 ───────────────────
  {
    id: 101,
    category: 'Mind',
    tier: 1,
    title: 'The Shape of Things',
    text: 'Which of these has 3 sides?',
    answers: [
      {
        label: 'Triangle',
        answerClass: 'TYPICAL',
        explanation:
          "Of course you’d say that. And you're not wrong. A triangle has three sides.",
      },
      {
        label: 'Square',
        answerClass: 'REVELATORY',
        explanation:
          'The question never said only. A square has three sides... and one more.',
      },
      {
        label: 'Circle',
        answerClass: 'WRONG',
        explanation: 'Not even close. A circle is a curve without any sides.',
      },
    ],
  },
  {
    id: 102,
    category: 'Body',
    tier: 1,
    title: 'Capital Offense',
    text: 'What is the capital of France?',
    answers: [
      {
        label: 'Paris',
        answerClass: 'TYPICAL',
        explanation:
          'That was what you were supposed to say. Paris is the capital city of France.',
      },
      {
        label: 'The letter F',
        answerClass: 'REVELATORY',
        explanation:
          "Clever little bugs. 'F' is the capital letter in 'France'.",
      },
      {
        label: 'Versailles',
        answerClass: 'WRONG',
        explanation:
          'Versailles was once the capital, but is not today.',
      },
    ],
  },
  {
    id: 103,
    category: 'Mind',
    tier: 1,
    title: 'No It Isn’t',
    text: 'What is between 1 and 3?',
    answers: [
      {
        label: '2',
        answerClass: 'TYPICAL',
        explanation:
          'That’s what the last one said, too. Numerically, 2 lies between 1 and 3.',
      },
      {
        label: 'and',
        answerClass: 'REVELATORY',
        explanation:
          "Your answers form a pattern. The word 'and' is between the numerals.",
      },
      {
        label: 'what',
        answerClass: 'WRONG',
        explanation: "Incorrect. 'What' is not between the numbers.",
      },
    ],
  },
  {
    id: 104,
    category: 'Soul',
    tier: 1,
    title: 'Merry Unbirthday',
    text: 'How many birthdays does the average person have?',
    answers: [
      {
        label: 'About Fifty',
        answerClass: 'TYPICAL',
        explanation:
          'The way you answer paints a picture. On average a person will have 50 such anniversaries in a modern lifespan.',
      },
      {
        label: 'One',
        answerClass: 'REVELATORY',
        explanation:
          'Each answer reveals a little more. You are only born once; the rest are just parties.',
      },
      {
        label: 'Up to their friends',
        answerClass: 'WRONG',
        explanation:
          "A charming thought. Parties don't change the number of times you were born.",
      },
    ],
  },
  {
    id: 105,
    category: 'Body',
    tier: 1,
    title: 'Eye Witness',
    text: 'What can’t you do if your eyes are closed?',
    answers: [
      {
        label: 'See',
        answerClass: 'TYPICAL',
        explanation:
          'You cannot see with your eyes shut. But it depends on what you were trying to see. Or trying not to.',
      },
      {
        label: 'Close them',
        answerClass: 'REVELATORY',
        explanation:
          'This was always your answer. You cannot perform an action on something already in that state.',
      },
      {
        label: 'Read',
        answerClass: 'WRONG',
        explanation: 'A flawed assumption. Braille can be read with your eyes closed.',
      },
    ],
  },
  {
    id: 106,
    category: 'Mind',
    tier: 1,
    title: 'Just the Two of Us',
    text: 'What does 2 and 2 make?',
    answers: [
      {
        label: 'Four',
        answerClass: 'TYPICAL',
        explanation: 'How very... you. Your choice speaks volumes. 2 + 2 = 4.',
      },
      {
        label: 'Twenty-Two',
        answerClass: 'REVELATORY',
        explanation:
          "Not everyone notices that path. When concatenated, the numerals '2' and '2' form 22.",
      },
      {
        label: 'Eight',
        answerClass: 'WRONG',
        explanation: 'Oh, wow, you’ll have to show how you got that.',
      },
    ],
  },
  {
    id: 107,
    category: 'Mind',
    tier: 1,
    title: 'I Know This One',
    text: 'Which month has 28 days?',
    answers: [
      {
        label: 'February',
        answerClass: 'TYPICAL',
        explanation:
          'You would say that. February typically has exactly 28 days.',
      },
      {
        label: 'All of them',
        answerClass: 'REVELATORY',
        explanation:
          "Well you did know it, didn't you? Every single month has *at least* 28 days.",
      },
      {
        label: 'None of them',
        answerClass: 'WRONG',
        explanation: 'Incorrect. Check your calendar again.',
      },
    ],
  },
  {
    id: 108,
    category: 'Soul',
    tier: 1,
    title: 'A Fast One',
    text:
      'If a meeting scheduled for Wednesday is moved forward two days, what day will it be held?',
    answers: [
      {
        label: 'Friday',
        answerClass: 'TYPICAL',
        explanation:
          'Oriented on a scale from past to present. Don\'t be late.',
      },
      {
        label: 'Monday',
        answerClass: 'REVELATORY',
        explanation:
          'Oriented on a scale of distant to near. Don\'t be late.',
      },
      {
        label: 'Still Wednesday',
        answerClass: 'WRONG',
        explanation:
          'Someone is getting left behind.',
      },
    ],
  },
  {
    id: 109,
    category: 'Soul',
    tier: 1,
    title: 'It’s Other People',
    text: 'In order to leave a room, you must…?',
    answers: [
      {
        label: 'Exit it.',
        answerClass: 'TYPICAL',
        explanation: 'You can try.',
      },
      {
        label: 'Enter it.',
        answerClass: 'REVELATORY',
        explanation:
          'You cannot leave a room you were never in to begin with.',
      },
      {
        label: 'Imagine it.',
        answerClass: 'WRONG',
        explanation:
          'But what then? What if you can’t… stop imagining it?',
      },
    ],
  },

  // ─────────────────── Tier 2 ───────────────────
  {
    id: 201,
    category: 'Mind',
    tier: 2,
    title: 'Payday',
    text: 'If you’re told you’ll be paid biweekly, how often do you get paid?',
    answers: [
      {
        label: 'Every two weeks.',
        answerClass: 'TYPICAL',
        explanation:
          'Just like at the office. Most workplaces use "biweekly" to mean every two weeks.',
      },
      {
        label: 'Twice each week.',
        answerClass: 'REVELATORY',
        explanation: 'How interesting you would say that. It has two official meanings.',
      },
      {
        label: 'Whenever.',
        answerClass: 'WRONG',
        explanation: 'A cynical take, but not an answer.',
      },
    ],
  },
  {
    id: 202,
    category: 'Soul',
    tier: 2,
    title: 'Styx and Stones',
    text: 'What is needed when you meet Charon at the River Styx?',
    answers: [
      {
        label: 'A coin',
        answerClass: 'TYPICAL',
        explanation:
          'You remembered the toll. Greek rites demand a coin for the ferryman.',
      },
      {
        label: 'Passage',
        answerClass: 'REVELATORY',
        explanation:
          'You see the true need. The coin only buys the journey you require.',
      },
      {
        label: 'A heart as light as a feather',
        answerClass: 'WRONG',
        explanation:
          "Wrong mythology. That's an Egyptian trial, not a Greek one.",
      },
    ],
  },
  {
    id: 203,
    category: 'Body',
    tier: 2,
    title: 'What’s in It?',
    text: 'What did Schrödinger do with his box?',
    answers: [
      {
        label: 'Advocated Superposition.',
        answerClass: 'TYPICAL',
        explanation:
          'His thought experiment inspired later interpretations about superposition.',
      },
      {
        label: 'Critiqued Quantum Mechanics.',
        answerClass: 'REVELATORY',
        explanation:
          "Schrödinger's thought experiment was a critique of quantum mechanics, not an endorsement.",
      },
      {
        label: 'Killed a cat.',
        answerClass: 'WRONG',
        explanation:
          'Don\'t believe the rumors. No cat was harmed in the making of this thought experiment.',
      },
    ],
  },
  {
    id: 204,
    category: 'Body',
    tier: 2,
    title: 'The Great Divide',
    text: 'What separates one meal from another?',
    answers: [
      {
        label: 'Time',
        answerClass: 'TYPICAL',
        explanation:
          'How else would you separate a meal? The clock rules all. Most people mark meals by time of day.',
      },
      {
        label: 'Space',
        answerClass: 'REVELATORY',
        explanation:
          'How else would you separate a meal? Two meals cannot occupy the same space at the same time.',
      },
      {
        label: 'Gravity',
        answerClass: 'WRONG',
        explanation:
          'Incorrect. Gravity acts on all meals equally; it does not separate them.',
      },
    ],
  },
  {
    id: 205,
    category: 'Body',
    tier: 2,
    title: 'On Your Marx',
    text: 'How do you prevent the working class from revolting?',
    answers: [
      {
        label: 'Bread and circuses',
        answerClass: 'TYPICAL',
        explanation:
          'The classic Roman solution. Pacify the masses with cheap comforts.',
      },
      {
        label: 'Neutralize the Threat',
        answerClass: 'REVELATORY',
        explanation:
          "Well, you're not wrong. They can’t revolt if they’re dead.",
      },
      {
        label: 'Give them cake',
        answerClass: 'WRONG',
        explanation:
          "That's just a rumor. And famously bad advice. Incorrect.",
      },
    ],
  },
  {
    id: 206,
    category: 'Body',
    tier: 2,
    title: 'A Nice Trip',
    text: 'What is the quickest distance between two points?',
    answers: [
      {
        label: 'A straight line.',
        answerClass: 'TYPICAL',
        explanation:
          'A straight line is the shortest distance, in Euclidean space.',
      },
      {
        label: 'A cycloid',
        answerClass: 'REVELATORY',
        explanation:
          'For the brachistochrone (quickest descent under gravity), a cycloid takes the least time.',
      },
      {
        label: 'A circle',
        answerClass: 'WRONG',
        explanation:
          'This reveals more about you than you realize.',
      },
    ],
  },
  {
    id: 207,
    category: 'Soul',
    tier: 2,
    title: 'Imperial Memory',
    text: 'Which of these was a Roman Emperor?',
    answers: [
      {
        label: 'Marcus Aurelius',
        answerClass: 'TYPICAL',
        explanation:
          "The philosopher-king. He's the one most of you like to remember.",
      },
      {
        label: 'Caligula',
        answerClass: 'REVELATORY',
        explanation:
          "The inconvenient truth. He was an emperor, even if you'd rather forget.",
      },
      {
        label: 'Julius Caesar',
        answerClass: 'WRONG',
        explanation:
          'A common myth. Caesar was a dictator, but he never held the title of emperor.',
      },
    ],
  },
  {
    id: 208,
    category: 'Body',
    tier: 2,
    title: 'Clovers and Blue Moons',
    text: 'What’s at the end of a rainbow?',
    answers: [
      {
        label: 'A pot of gold',
        answerClass: 'TYPICAL',
        explanation:
          'Didn\'t you say that last time, too? Folklore says a leprechaun’s treasure lies at the end.',
      },
      {
        label: 'Violet',
        answerClass: 'REVELATORY',
        explanation:
          'But is it the same violet for each of you? In physics, the visible spectrum ends at violet.',
      },
      {
        label: 'Rainbows aren’t real.',
        answerClass: 'WRONG',
        explanation: 'Is anything? Are you?',
      },
    ],
  },
  {
    id: 209,
    category: 'Mind',
    tier: 2,
    title: 'Endgame',
    text: 'How does this end?',
    answers: [
      {
        label: 'With a "?".',
        answerClass: 'TYPICAL',
        explanation:
          'The statement does end with a question... It all ends with a question one way or another.',
      },
      {
        label: 'With an "s."',
        answerClass: 'REVELATORY',
        explanation:
          'Yes, "this" does terminate with an "s", how... clever...',
      },
      {
        label: 'With everyone still sane.',
        answerClass: 'WRONG',
        explanation: "No, sorry, that just isn't true.",
      },
    ],
  },

  // ─────────────────── Tier 3 ───────────────────
  {
    id: 301,
    category: 'Body',
    tier: 3,
    title: 'Behind You',
    text:
      "If it's pitch dark, and you're all alone, can you see what is standing behind you?",
    answers: [
      {
        label: 'Yes',
        answerClass: 'TYPICAL',
        explanation:
          "If you turn around, strike a light, maybe... But... you really shouldn't.",
      },
      {
        label: 'No',
        answerClass: 'REVELATORY',
        explanation:
          "Of course not. Unlike it, you don't keep a spare pair of eyes in the back of your head.",
      },
      {
        label: "What's behind me?",
        answerClass: 'WRONG',
        explanation: "Don't ask questions you don't want answered.",
      },
    ],
  },
{
    id: 302,
    category: 'Soul',
    tier: 3,
    title: 'Left Behind',
    text: 'When you leave the past behind, what remains?',
    answers: [
      {
        label: 'The future.',
        answerClass: 'TYPICAL',
        explanation:
          'Of course. Once you’ve moved on, there is only what lies ahead.',
      },
      {
        label: 'The past.',
        answerClass: 'REVELATORY',
        explanation:
          'You may leave it if you wish, but it always remains exactly where you left it.',
      },
      {
        label: 'Nothing.',
        answerClass: 'WRONG',
        explanation:
          'There is always something. Always. Even if you wish there weren\'t.',
      },
    ],
  },
{
    id: 303,
    category: 'Body',
    tier: 3,
    title: 'Empty Lungs',
    text: 'What makes up the majority of the air we breathe?',
    answers: [
      {
        label: 'Nitrogen',
        answerClass: 'TYPICAL',
        explanation:
          'The textbook answer. Correct, the air is roughly 78% nitrogen.',
      },
      {
        label: 'Empty Space',
        answerClass: 'REVELATORY',
        explanation:
          'A different kind of truth. On an atomic level, the vast majority of what we call "air" is the vacuum between particles.',
      },
      {
        label: 'Oxygen',
        answerClass: 'WRONG',
        explanation:
          'A common misconception. While vital for us, oxygen only makes up about 21% of the air.',
      },
    ],
  },
  // ─────────────────── Tier 4 ───────────────────
{ 

     id: 401, 
     category: 'Body', 
     tier: 4, 
     title: 'The Dog Days', 
     text: 'If you sort August, July, and June alphabetically, how many total days do they hold?', 
     answers: [ 
       { 
         label: '92', 
         answerClass: 'TYPICAL', 
         explanation: 
           'Nothing gets past you, 31 in both July and August, 30 in June.', 
       }, 
       { 
         label: '91', 
         answerClass: 'WRONG', 
         explanation: 
           'Did you forget July 31st or August 31st?.', 
       }, 
       { 
         label: '7', 
         answerClass: 'WRONG', 
         explanation: 
           'Oh no, you thought you were being clever again, didn't you?', 
       }, 
     ], 
   },
{ 
     id: 402, 
     category: 'Body', 
     tier: 4, 
     title: 'A Straight Shot', 
     text: 'Which Country, after 1904, shares a border with the United States?', 
     answers: [ 
       { 
         label: 'Russia', 
         answerClass: 'TYPICAL', 
         explanation: 
           'Correct. The US and Russia share a maritime border across the Bering Strait.', 
       }, 
       { 
         label: 'United Kingdom', 
         answerClass: 'WRONG', 
         explanation: 
           'No, traveling three thousand miles over open water unfortunately does not count.', 
       }, 
       { 
         label: 'Panama', 
         answerClass: 'WRONG', 
         explanation: 
           'The canal did not move the country, unfortunately for you.', 
       }, 
     ], 
   },

// ─────────────────── Tier 5 ───────────────────
{
  id: 501,
  category: 'Mind',
  tier: 5,
  title: 'The Alexandria Question',
  text: 'When the Library of Alexandria burned, what was truly lost?',
  answers: [
    {
      label: 'Potential',
      answerClass: 'REVELATORY',
      explanation: 'Broken Promises — You’re right. All those missed opportunities, the paths not taken. The tragic loss of… well. You know.',
    },
    {
      label: 'Burden',
      answerClass: 'REVELATORY',
      explanation: 'A Quiet Relief — Of course. Sometimes you have to burn it all down just to feel like you can breathe again. A necessary sacrifice.',
    },
    {
      label: 'Nothing',
      answerClass: 'REVELATORY',
      explanation: 'An Imagined Loss — Exactly. How can you lose something you never really had? It was just a story, and now it\'s over.',
    },
  ],
},
{
  id: 502,
  category: 'Soul',
  tier: 5,
  title: 'The Theseus Question',
  text: 'If Theseus replaced every single part of his ship while sailing across the ocean, is it still the same ship?',
  answers: [
    {
      label: 'It Couldn’t Be',
      answerClass: 'REVELATORY',
      explanation: 'The Imposter — You see it clearly. A thing is what it’s made of. And you know the feeling of being a perfect copy of yourself.',
    },
    {
      label: 'It Seems to Be',
      answerClass: 'REVELATORY',
      explanation: 'The Agreed-Upon Lie — It’s the story that matters, isn’t it? You’ve always known identity is a performance. The trick is not breaking character.',
    },
    {
      label: 'It Has to Be',
      answerClass: 'REVELATORY',
      explanation: 'A Stubborn Ghost — Right. Because the alternative is unthinkable. You hold on to what it was, because without that, what’s left?',
    },
  ],
},
{
  id: 503,
  category: 'Body',
  tier: 5,
  title: 'The Fawcett Question',
  text: 'Why didn’t Explorer Percy Fawcett return from his final search for a lost city in the Amazon?',
  answers: [
    {
      label: 'He died',
      answerClass: 'REVELATORY',
      explanation: 'The Story Ends — Yes. Sometimes there\'s no mystery. The jungle just swallows you whole. A simple, brutal end to the adventure.',
    },
    {
      label: 'He found it',
      answerClass: 'REVELATORY',
      explanation: 'The Destination — Of course. He got what he wanted. And when you find paradise, you don’t draw a map for others to follow.',
    },
    {
      label: 'He hid',
      answerClass: 'REVELATORY',
      explanation: 'A Good Place to Hide — You get it. The goal was never to find the city. The goal was to disappear. And he finally did.',
    },
  ],
},
{
  id: 504,
  category: 'Soul',
  tier: 5,
  title: 'The Orpheus Question',
  text: 'Orpheus was told not to look back, or he would lose her forever. Why did he turn around?',
  answers: [
    {
      label: 'Doubt',
      answerClass: 'REVELATORY',
      explanation: 'A Failure of Faith — You understand. The silence behind him was too loud. It wasn’t the gods he doubted, it was himself.',
    },
    {
      label: 'Need',
      answerClass: 'REVELATORY',
      explanation: 'An Unbearable Hope — Exactly. It wasn’t a choice. The hope of seeing her face was more powerful than the fear of losing her forever.',
    },
    {
      label: 'Love',
      answerClass: 'REVELATORY',
      explanation: 'A Final Glance — Right. He knew he would lose her. But to see her one last time? It was worth an eternity of regret.',
    },
  ],
},
{
  id: 505,
  category: 'Mind',
  tier: 5,
  title: 'The Janus Question',
  text: 'If Janus the god of doorways stood in front of you now, which way would they face?',
  answers: [
    {
      label: 'Forward',
      answerClass: 'REVELATORY',
      explanation: 'What’s Coming — Of course. You’re always looking ahead, aren’t you? Bracing for what’s next, for better or for worse.',
    },
    {
      label: 'Backward',
      answerClass: 'REVELATORY',
      explanation: 'What’s Done — You can’t help it. The past has a stronger pull. You’re always checking over your shoulder for what’s chasing you.',
    },
    {
      label: 'The Side',
      answerClass: 'REVELATORY',
      explanation: 'The Escape Route — Interesting. You don’t want to face the future or the past. You’re looking for a way out of the hallway altogether.',
    },
  ],
},
{
  id: 506,
  category: 'Body',
  tier: 5,
  title: 'The Mirror Question',
  text: 'In a dim room, if you stare at your own eyes in the mirror, what will happen to your face?',
  answers: [
    {
      label: 'It Will Vanish',
      answerClass: 'REVELATORY',
      explanation: 'Absence Confirmed — Yes. And that’s the real horror. Not seeing something monstrous, but the sudden, cold realization that you weren’t there at all.',
    },
    {
      label: 'It Will Distort',
      answerClass: 'REVELATORY',
      explanation: 'The Mask Slips — You’re right. The features shift, melt, become something else. For a moment, you weren’t sure it was your face looking back.',
    },
    {
      label: 'It Will Be The Same',
      answerClass: 'REVELATORY',
      explanation: 'The Unblinking Eye — Exactly. Nothing changes. And you’re forced to stare at the one person you can never, ever escape.',
    },
  ],
},
];

export default questions;
