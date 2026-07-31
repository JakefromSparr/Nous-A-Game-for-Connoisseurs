export const AXIS_PROFILES = Object.freeze({
  'X+': {
    title: 'The Door Left Ajar',
    portraits: [
      'You are most comfortable when an answer leaves room for another answer. You call this curiosity. It is also a refusal to let the first convincing person close the door.',
      'A finished explanation makes this group restless. You prefer an idea with one loose edge: enough structure to defend, enough space to turn it into something else.',
      'You do not reject the obvious. You make it earn the right to be final. That distinction lets the group feel cautious while still following its most inventive voice.',
    ],
    shadows: [
      'Possibility is generous, but it can become a way of postponing the moment when one answer must carry the weight.',
      'The open door is useful until everyone starts waiting for someone else to walk through it.',
    ],
  },
  'X-': {
    title: 'The Measured Doubt',
    portraits: [
      'You are not difficult to persuade. You are difficult to hurry. An answer becomes trustworthy only after the group has found where it might break.',
      'This group tests an idea by leaning against it. What survives earns loyalty; what merely sparkles is remembered, but not followed.',
      'You prefer a claim that can be defended over one that can merely be admired. Others may call that caution when they need your restraint, and stubbornness when they do not.',
    ],
    shadows: [
      'Careful judgment can resemble resistance long after the danger has passed.',
      'Proof protects the group, though sometimes the demand for proof protects it from having to choose.',
    ],
  },
  'Y+': {
    title: 'The Useful Heresy',
    portraits: [
      'An answer becomes attractive when it rearranges the terms of the question. This group is willing to sound unreasonable for a moment if the new frame proves useful.',
      'You notice the option the room is not supposed to prefer. Once someone gives it language, the rest of the group becomes braver in retrospect.',
      'Consensus does not begin with agreement here. It begins when one person makes the forbidden interpretation feel discussable.',
    ],
    shadows: [
      'Breaking the frame can reveal the truth. It can also become a habit performed after the truth is already visible.',
      'The group enjoys the relief of overturning an assumption, sometimes enough to mistake disruption for discovery.',
    ],
  },
  'Y-': {
    title: 'The Hand on the Knot',
    portraits: [
      'You notice the cost of being clever. Before the group follows a strange answer, someone quietly checks what the familiar answer was protecting.',
      'This group has a strong sense of the shape things are supposed to keep. You will bend that shape, but only after deciding what cannot be allowed to break.',
      'You call it common sense when the group needs reassurance and discipline when it needs courage. In either case, someone keeps a hand on the knot.',
    ],
    shadows: [
      'Preserving the shape of things can become loyalty to a rule nobody remembers choosing.',
      'Caution keeps the group intact, though it also gives the most familiar fear a permanent seat at the table.',
    ],
  },
  'Z+': {
    title: 'The Witness at the Scale',
    portraits: [
      'You trust what can be checked, counted, or made to happen twice. Even so, the group watches the person performing the test almost as closely as the result.',
      'A claim feels safer once it has edges. Names, facts, and observable consequences give this group somewhere firm to stand while it decides what the claim means.',
      'You reach for evidence before interpretation. This is not a lack of imagination; it is how the group decides which imagination deserves consequences.',
    ],
    shadows: [
      'Measurement settles an argument only when everyone agrees what was worth measuring.',
      'The group can verify a fact and still leave its meaning untouched, which is sometimes precisely the intention.',
    ],
  },
  'Z-': {
    title: 'The Question Beneath',
    portraits: [
      'You hear the question beneath the question, especially when nobody admits it is there. Meaning arrives before proof and often survives after proof has objected.',
      'This group treats language as a room with hidden doors. A literal answer may be correct, but correctness alone rarely makes it feel complete.',
      'You notice implication, tone, and the shape around a fact. What others call ambiguity often feels to this group like additional information.',
    ],
    shadows: [
      'The hidden meaning is not always the truer one. Sometimes it is simply the one most willing to resemble you.',
      'Reading beneath the surface creates insight, but it also gives expectation somewhere to disguise itself as discovery.',
    ],
  },
});

export const CONFIDENCE_LINES = Object.freeze({
  FAINT: [
    'The pattern is still faint. That usually makes people dismiss it too quickly.',
    'There is not enough evidence for certainty. There is enough for recognition.',
  ],
  FORMING: [
    'The pattern is incomplete. It is also no longer accidental.',
    'The shape did not appear all at once. It returned whenever the group believed it was choosing freely.',
  ],
  FIXED: [
    'The pattern repeated after it had every chance to disappear.',
    'By the end, the group was no longer producing isolated choices. It was producing a signature.',
  ],
});

export const SECONDARY_PRESSURES = Object.freeze({
  'X+': [
    'Beneath that habit sits a second appetite: the wish to leave one possibility unclaimed, just in case it becomes useful later.',
    'Yet the group also rewards whoever can turn a settled answer sideways without making the room feel foolish for missing it.',
  ],
  'X-': [
    'Beneath that habit sits a second restraint: the need to make an idea defensible before anyone is allowed to call it insight.',
    'Yet someone in the group keeps asking where the claim would fail. That voice slows the room down and quietly decides what survives.',
  ],
  'Y+': [
    'A contrary pressure runs through it: the group becomes more interested when an answer violates an assumption everyone had agreed not to notice.',
    'Yet the room is susceptible to the person who can make a forbidden interpretation sound inevitable after the fact.',
  ],
  'Y-': [
    'A contrary pressure runs through it: someone keeps returning the group to the answer that preserves the known shape of things.',
    'Yet the group wants permission before it wants surprise. The familiar answer often supplies that permission.',
  ],
  'Z+': [
    'The counterweight is practical: sooner or later, somebody asks what can actually be checked.',
    'Yet the room steadies itself with facts whenever interpretation begins to feel too personal.',
  ],
  'Z-': [
    'The counterweight is interpretive: the group keeps listening for what the question accidentally revealed about the person asking it.',
    'Yet implication often carries more authority here than anyone is willing to grant it aloud.',
  ],
});

export const ANSWER_PATTERNS = Object.freeze({
  FAMILIAR: [
    'Your safest answers were not signs of obedience. They were anchors. The group prefers to know where the ordinary world is before deciding how far to leave it.',
    'The familiar interpretation won often enough to matter. This group uses common sense as a meeting place, even when nobody intends to remain there.',
  ],
  LATERAL: [
    'Again and again, the stranger correct answer became acceptable after someone made it safe to say aloud. You do not chase novelty blindly; you wait for novelty to acquire an argument.',
    'The group repeatedly rewarded the answer that moved the frame. That looks like boldness from outside. Inside the room, it felt more like relief.',
  ],
  PLAUSIBLE: [
    'Several wrong answers survived long enough to become communal. Accuracy was not the weakness. Confidence was. A plausible idea gains weight quickly in this group when nobody wants to be the first to puncture it.',
    'The mistakes were not random. They were answers the group wanted to deserve another hearing. That is how a preference disguises itself as uncertainty.',
  ],
  DIVIDED: [
    'No single kind of answer controlled the night. The group alternated between safety and surprise, which is less indecision than a method for making every conclusion feel negotiated.',
    'You changed lenses often enough that no one habit could claim the room. The group does not seek one correct instinct; it seeks an instinct that can survive being passed around.',
  ],
});

export const CONSENSUS_PATTERNS = Object.freeze({
  VERIFICATION: [
    'This is how consensus forms here: an answer is proposed quickly, doubted socially, and accepted only after the most cautious voice stops objecting.',
    'The group reaches agreement by testing resistance. The deciding vote belongs to the person who objects last, even when somebody else speaks last.',
  ],
  REFRAMING: [
    'This is how consensus forms here: one person changes the meaning of the question, and the others decide they had been considering that meaning all along.',
    'The group reaches agreement through reframing. The winning answer is often the one that lets everyone revise their first instinct without admitting defeat.',
  ],
  MOMENTUM: [
    'This is how consensus forms here: plausibility gathers speed, hesitation becomes expensive, and the first confident explanation is mistaken for the group remembering together.',
    'The group reaches agreement through momentum. Once an answer begins to sound shared, contradicting it feels more disruptive than checking it.',
  ],
  NEGOTIATION: [
    'This is how consensus forms here: not by becoming one mind, but by deciding which doubt is permitted to speak for all of you.',
    'The group reaches agreement by trading certainty. Each person surrenders a different objection until the remaining answer feels unanimous.',
  ],
});

export const FATE_PATTERNS = Object.freeze({
  IMMEDIATE: [
    'When “{card}” offered a choice, you selected “{choice}”. You do not always prefer the safe reward. You prefer the risk whose cost can be counted immediately.',
    'At “{card}”, you chose “{choice}”. The group is comforted by consequences that arrive on schedule, even when the choice itself is reckless.',
  ],
  LEVERAGE: [
    'At “{card}”, you chose “{choice}”. The group will postpone certainty when delay can be converted into leverage. Waiting feels less passive when it has rules.',
    'When “{card}” appeared, you selected “{choice}”. You are willing to live inside a promise if the promise lets the group believe it has outwitted chance.',
  ],
  BURDEN: [
    'At “{card}”, you chose “{choice}”. A burden becomes attractive when it can be named, measured, and later presented as evidence that the group deserved its reward.',
    'When “{card}” asked what should be carried, you selected “{choice}”. Difficulty is easier for this group to accept when it can be mistaken for purpose.',
  ],
  PROTECTION: [
    'At “{card}”, you selected “{choice}”. The group accepts protection readily, but prefers to describe it as preparation.',
    'When “{card}” offered an advantage, you chose “{choice}”. Help is welcome here once it can be made to look like foresight.',
  ],
  REFUSAL: [
    'At “{card}”, you chose “{choice}”. Refusal is still a wager. It simply allows the group to call the risk restraint.',
    'When “{card}” made its offer, you selected “{choice}”. The group sometimes protects its freedom by declining to learn what the other choice would have cost.',
  ],
});

export const CLOSING_PREDICTIONS = Object.freeze({
  'X+': [
    'The next time an obvious answer feels complete, someone will ruin it. The others will be relieved.',
    'Soon, one of you will call an unnecessary possibility interesting. The decision will already have been made.',
  ],
  'X-': [
    'The next impossible claim will be rejected aloud and tested in private.',
    'When the next answer arrives too easily, the group will distrust the ease before it distrusts the answer.',
  ],
  'Y+': [
    'Sooner or later, the room will follow the person who first says the unacceptable option.',
    'The next boundary will hold until someone names it. After that, everyone will remember wanting to cross.',
  ],
  'Y-': [
    'When the rules change, this group will notice late and preserve more than those who rushed.',
    'The next warning will sound overly cautious. It will still decide what everyone does.',
  ],
  'Z+': [
    'The next omen will be measured. The measurement will not make it less true.',
    'When something impossible happens twice, the group will call the repetition evidence and avoid discussing the first occurrence.',
  ],
  'Z-': [
    'The next coincidence will be called a joke until everyone remembers it separately.',
    'Soon, someone will hear a second meaning that was not intended. Intention will not prevent it from being accurate.',
  ],
  BALANCED: [
    'The pattern has not chosen a name. That does not mean it has not chosen a direction.',
    'The next answer will feel like a fresh decision. It will resemble this one.',
  ],
});
