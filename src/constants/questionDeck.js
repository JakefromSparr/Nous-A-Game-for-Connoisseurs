/**
 * @typedef {"Mind" | "Body" | "Soul"} Category
 * @typedef {"TYPICAL" | "REVELATORY" | "WRONG"} AnswerClass
 * @typedef {{
 * id: number | string,
 * category: Category,
 * tier: 1 | 2 | 3,
 * title: string,
 * text: string,
 * answers: [
 * { label: string, answerClass: AnswerClass, explanation: string },
 * { label: string, answerClass: AnswerClass, explanation: string },
 * { label: string, answerClass: AnswerClass, explanation: string }
 * ]
 * }} Question
 */

/** @type {Question[]} */
const questions = [
  {
    id: 101,
    category: "Mind",
    tier: 1,
    title: "The Shape of Things",
    text: "Which of these has 3 sides?",
    answers: [
      { label: "Triangle", answerClass: "TYPICAL",    explanation: "Of course you’d say that. And you're not wrong. A triangle has three sides." },
      { label: "Square",   answerClass: "REVELATORY", explanation: "No, a Tri- oh. That is also right. A square has three sides... and one more." },
      { label: "Circle",   answerClass: "WRONG",      explanation: "Not even close. A circle is a curve without any sides." },
    ],
  },
  {
    id: 102,
    category: "Mind",
    tier: 1,
    title: "Capital Offense",
    text: "What is the capital of France?",
    answers: [
      { label: "Paris",        answerClass: "TYPICAL",    explanation: "We thought you’d say that. Paris is the capital city of France." },
      { label: "The letter F", answerClass: "REVELATORY", explanation: "Well, hmm. Yes, 'F' is the capital letter in 'France'." },
      { label: "Versailles",   answerClass: "WRONG",      explanation: "Versailles was once the capital, but is not today." },
    ],
  },
  {
    id: 103,
    category: "Mind",
    tier: 1,
    title: "No It Isn’t",
    text: "What is between 1 and 3?",
    answers: [
      { label: "2",    answerClass: "TYPICAL",    explanation: "That’s what the last one said. Numerically, 2 lies between 1 and 3." },
      { label: "and",  answerClass: "REVELATORY", explanation: "Great. Right. The word 'and' is between the numerals." },
      { label: "what", answerClass: "WRONG",      explanation: "Incorrect. 'What' is not between the numbers." },
    ],
  },
  {
    id: 104,
    category: "Mind",
    tier: 1,
    title: "Merry Unbirthday",
    text: "How many birthdays does the average person have?",
    answers: [
      { label: "About Fifty",                      answerClass: "TYPICAL",    explanation: "That’s right, on average  a person will have 50 such anniversaries in a modern lifespan." },
      { label: "One",                              answerClass: "REVELATORY", explanation: "Ah, a literalist. We like that. You are only born once; the rest are just parties." },
      { label: "Depends on how many friends they have", answerClass: "WRONG", explanation: "A charming thought, but incorrect. Parties don't change the number of times you were born." },
    ],
  },
  {
    id: 105,
    category: "Body",
    tier: 1,
    title: "Eye Witness",
    text: "What can’t you do if your eyes are closed?",
    answers: [
      { label: "See",        answerClass: "TYPICAL",    explanation: "You cannot see with your eyes shut. But I guess it depends on what you were trying to see. Or trying not to." },
      { label: "Close them", answerClass: "REVELATORY", explanation: "We figured you’d say that. You cannot perform an action on something already in that state." },
      { label: "Read",       answerClass: "WRONG",      explanation: "A flawed assumption. Braille can be read with your eyes closed." },
    ],
  },
  {
    id: 106,
    category: "Mind",
    tier: 1,
    title: "Just the Two of Us",
    text: "What does 2 and 2 make?",
    answers: [
      { label: "Four",       answerClass: "TYPICAL",    explanation: "Oh, was that too easy? Right, 2 + 2 = 4." },
      { label: "Twenty-Two", answerClass: "REVELATORY", explanation: "I see you nodding. When concatenated, the numerals '2' and '2' form 22." },
      { label: "Eight",      answerClass: "WRONG",      explanation: "Oh, wow, you’ll have to show us how you got that." },
    ],
  },
  {
    id: 107,
    category: "Mind",
    tier: 1,
    title: "I Know This One",
    text: "Which month has 28 days?",
    answers: [
      { label: "February",    answerClass: "TYPICAL",    explanation: "The one everyone remembers. February typically has exactly 28 days." },
      { label: "All of them", answerClass: "REVELATORY", explanation: "Well you did know it, didn't you? Every single month has *at least* 28 days." },
      { label: "None of them",answerClass: "WRONG",      explanation: "Incorrect. Check your calendar again." },
    ],
  },
  {
    id: 108,
    category: "Body",
    tier: 1,
    title: "Clovers and Blue Moons",
    text: "What’s at the end of a rainbow?",
    answers: [
      { label: "A pot of gold",     answerClass: "TYPICAL",    explanation: "Didn't you say that last time, too? Folklore says a leprechaun’s treasure lies at the end." },
      { label: "Violet",            answerClass: "REVELATORY", explanation: "But is it the same violet for each of you? In physics, the visible spectrum ends at violet." },
      { label: "Rainbows aren’t real.", answerClass: "WRONG",  explanation: "Is anything? Are we?" },
    ],
  },
  {
    id: 109,
    category: "Soul",
    tier: 1,
    title: "What’s in It?",
    text: "What did Schrödinger do with his box?",
    answers: [
      { label: "Ended up inspiring the Many-Worlds interpretation.", answerClass: "TYPICAL",    explanation: "Causation or correlation? Either way, sure." },
      { label: "Tried to illustrate the problem with Quantum Mechanics.", answerClass: "REVELATORY", explanation: "Schrödinger's experiment was a critique of quantum mechanics, not an endorsement." },
      { label: "Killed a cat.",                                     answerClass: "WRONG",      explanation: "Don't believe the rumors. No cat was harmed in the making of this thought experiment." },
    ],
  },
  {
    id: 201,
    category: "Mind",
    tier: 2,
    title: "Payday",
    text: "If you’re told you’ll be paid biweekly, how often do you get paid?",
    answers: [
      { label: "Every two weeks.",                   answerClass: "TYPICAL",    explanation: "Just like at the office. Most workplaces use 'biweekly' to mean every two weeks." },
      { label: "Twice each week.",                   answerClass: "REVELATORY", explanation: "You say that every time. It has two official meanings." },
      { label: "Whenever.",                          answerClass: "WRONG",   explanation: "A cynical take, but not an answer." },
    ],
  },
  {
    id: 202,
    category: "Soul",
    tier: 2,
    title: "Styx and Stones",
    text: "What is needed when you meet Charon at the River Styx?",
    answers: [
      { label: "A coin",                       answerClass: "TYPICAL",    explanation: "You remembered the toll. Greek rites demand a coin for the ferryman." },
      { label: "Passage",                      answerClass: "REVELATORY", explanation: "You see the true need. The coin only buys the journey you require." },
      { label: "A heart as light as a feather",answerClass: "WRONG",      explanation: "Wrong mythology. That's an Egyptian trial, not a Greek one." },
    ],
  },
  {
    id: 203,
    category: "Body",
    tier: 2,
    title: "It’s Other People",
    text: "In order to leave a room, you must…?",
    answers: [
      { label: "Exit it.",  answerClass: "TYPICAL",    explanation: "You can try." },
      { label: "Enter it.", answerClass: "REVELATORY", explanation: "Ah, the prerequisite. You cannot leave a room you were never in to begin with." },
      { label: "Imagine it.", answerClass: "WRONG",    explanation: "But what then? What if you can’t… stop imagining it?" },
    ],
  },
  {
    id: 204,
    category: "Body",
    tier: 2,
    title: "The Great Divide",
    text: "What separates one meal from another?",
    answers: [
      { label: "Time",    answerClass: "TYPICAL",    explanation: "The clock rules all. Most people mark meals by time of day." },
      { label: "Space",   answerClass: "REVELATORY", explanation: "In a way, I suppose. Two meals cannot occupy the same space at the same time." },
      { label: "Gravity", answerClass: "WRONG",      explanation: "Incorrect. Gravity acts on all meals equally it does not separate them." },
    ],
  },
  {
    id: 205,
    category: "Body",
    tier: 2,
    title: "On Your Marx",
    text: "How do you prevent the working class from revolting?",
    answers: [
      { label: "Bread and circuses",              answerClass: "TYPICAL",    explanation: "The classic Roman solution. Pacify the masses with cheap comforts." },
      { label: "They can’t revolt if they’re dead", answerClass: "REVELATORY", explanation: "Well, you're not wrong. In terms of cold logic: an infallible solution." },
      { label: "Give them cake",                  answerClass: "WRONG",      explanation: "That's just a rumor. And famously bad advice. Incorrect." },
    ],
  },
  {
    id: 206,
    category: "Body",
    tier: 2,
    title: "A Nice Trip",
    text: "What is the shortest distance between two points?",
    answers: [
      { label: "A straight line.", answerClass: "TYPICAL",    explanation: "Thinking on a flat plane, are we? Correct, in Euclidean space." },
      { label: "A geodesic",       answerClass: "REVELATORY", explanation: "You think in curves. On a sphere like Earth, a geodesic is the true shortest path." },
      { label: "A circle",         answerClass: "WRONG",      explanation: "A circle is never the shortest path between two points." },
    ],
  },
  {
    id: 207,
    category: "Soul",
    tier: 2,
    title: "Imperial Memory",
    text: "Which of these was a Roman Emperor?",
    answers: [
      { label: "Marcus Aurelius", answerClass: "TYPICAL",    explanation: "The philosopher-king. He's the one we all like to remember." },
      { label: "Caligula",        answerClass: "REVELATORY", explanation: "The inconvenient truth. He was an emperor, even if we'd rather forget." },
      { label: "Julius Caesar",   answerClass: "WRONG",      explanation: "A common myth. Caesar was a dictator, but he never held the title of emperor." },
    ],
  },
  {
    id: 208,
    category: "Mind",
    tier: 2,
    title: "A Fast One",
    text: "The meeting scheduled **for Wednesday** is moved **forward two days**. Which day will it now be held?",
    answers: [
      { label: "Friday",         answerClass: "TYPICAL",    explanation: "You slid the calendar ahead—W + 2 days = Friday." },
      { label: "Monday",         answerClass: "REVELATORY", explanation: "You pulled the event *toward* the present—two days before Wednesday." },
      { label: "Still Wednesday",answerClass: "WRONG",      explanation: "Standing still isn’t moving; someone got left behind." },
    ],
  },
  {
    id: 209,
    category: "Mind",
    tier: 2,
    title: "Endgame",
    text: "How does this end?",
    answers: [
      { label: "With a '?'.",              answerClass: "TYPICAL",    explanation: "The statement does end with a question... It all ends with a question one way or another." },
      { label: "With an 's.'",             answerClass: "REVELATORY", explanation: "Yes, 'this' does terminate with an 's', how... clever..." },
      { label: "With everyone still sane.",answerClass: "WRONG",      explanation: "No, I'm sorry, that just isn't true." },
    ],
  },
{
  id: 301,
  category: "Body",
  tier: 3,
  title: "Behind You",
  text: "If it's pitch dark, and you're all alone, can you see what is standing behind you?",
  answers: [
    {
      label: "Yes",
      answerClass: "TYPICAL",
      explanation:
        "If you turn around, strike a light, maybe... But... you really shouldn’t."
    },
    {
      label: "No",
      answerClass: "REVELATORY",
      explanation:
        "Of course not. Unlike it, you don’t keep a spare pair of eyes in the back of your head."
    },
    {
      label: "What's behind me?",
      answerClass: "WRONG",
      explanation:
        "Don’t ask questions you don't want answered."
    }
  ]
},

];

export default questions;
