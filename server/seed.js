import fs from 'node:fs';
import path from 'node:path';
import { get, run } from './db.js';

function silenceWav(file, seconds = 2, rate = 8000) {
  const n = Math.floor(rate * seconds);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  fs.writeFileSync(file, buf);
}

const lecTx = `Hare Krishna. Ladies and gentlemen, today we begin our study of the First Canto of Srimad-Bhagavatam. This great literature is known as the spotless Purana because it directly describes the Supreme Personality of Godhead, Krishna, without the admixture of mundane speculation.

The purpose of this book is to give shelter to all conditioned souls who are bewildered by the threefold miseries of material existence. We do not come to administer to you any material benefit, but to give you the transcendental knowledge by which one can return back to Godhead, back to home.

Simply by hearing this message with faith and devotion, one's consciousness becomes purified. The hearing process is the beginning, and from hearing comes the possibility of rendering service to the Lord with devotion and love. That is the perfection of life.`;

const gitaTx = `Hare Krishna. We are reading from the Bhagavad-gita, Second Chapter, which describes the science of action in Krishna consciousness. Arjuna was placed in a most difficult situation, yet through the process of accepting Krishna as the spiritual master he was relieved of all anxiety.

The essence of this teaching is that one should perform one's prescribed duty without attachment to the results. That is true karma-yoga. By acting in this way, one never becomes entangled in the fruits of one's work, because everything is offered to the Supreme Lord.

When Lord Krishna spoke to Arjuna on the battlefield, He did not teach him to renounce the fight, but to fight with the right consciousness - for the pleasure of the Lord. In the same way, in this age we should perform our duties with a spirit of service and devotion.`;

const walkTx = `Morning walk conversation on the science of consciousness. The question of the origin of consciousness cannot be answered by simply observing matter, because matter is dull and inert. Consciousness is the symptom of the living soul, which is a particle of the Supreme Soul.

Just as fire is the source of light and heat, the Supreme Lord is the source of all consciousness. The living entity is eternally part and parcel of the Lord, and therefore his natural function is to serve Him, just as the hand serves the whole body.

Modern science tries to explain everything in terms of particles and chemicals, but it cannot produce even a blade of grass. When we see the wonderful arrangement of the universe, we must conclude that there is a supreme intelligence behind everything.`;

const ccTx = `Hare Krishna. We are reading from the Madhya-lila of Caitanya-caritamrta, text twenty, verse one hundred eight and onward. Lord Caitanya is explaining the characteristics of the jiva soul and the process of engaging in devotional service.

Here it is explained that every living being is the eternal servant of Krishna. This is the constitutional position of the soul, and when one revives that original consciousness, he is immediately filled with transcendental bliss.

Devotional service is neither dry nor mechanical, but is full of taste. The more one advances in Krishna consciousness, the more one experiences the nectar of service. This is the verdict of all the great acharyas.`;

const INSERT = `
  INSERT INTO lectures (title, speaker, type, location, date, duration, audio_file, excerpt, transcript)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

async function seed() {
  const count = await get('SELECT COUNT(*) AS c FROM lectures');
  if (count.c > 0) {
    console.log(`Database already has ${count.c} lectures; skipping seed.`);
    return;
  }

  const audioDir = path.resolve(import.meta.dirname, 'public', 'audio');
  fs.mkdirSync(audioDir, { recursive: true });
  const w1 = path.join(audioDir, 'seed-lecture-1.wav');
  const w2 = path.join(audioDir, 'seed-lecture-2.wav');
  silenceWav(w1);
  silenceWav(w2);

  const rows = [
    {
      title: 'Introduction to the First Canto of Srimad-Bhagavatam',
      speaker: 'Srila Prabhupada',
      type: 'Srimad-Bhagavatam',
      location: 'San Francisco',
      date: '1967-03-29',
      duration: '00:42:10',
      audio_file: 'seed-lecture-1.wav',
      excerpt: 'Opening talk on the purpose of Srimad-Bhagavatam and the science of devotional service.',
      transcript: lecTx,
    },
    {
      title: 'Karma-yoga: The Second Chapter of Bhagavad-gita',
      speaker: 'Srila Prabhupada',
      type: 'Bhagavad-gita',
      location: 'Vrindavan',
      date: '1971-08-15',
      duration: '00:38:04',
      audio_file: '',
      excerpt: 'On acting without attachment and the true meaning of karma-yoga.',
      transcript: gitaTx,
    },
    {
      title: 'Morning Walk: The Science of Consciousness',
      speaker: 'Srila Prabhupada',
      type: 'Walk',
      location: 'Mayapur',
      date: '1974-01-20',
      duration: '00:25:48',
      audio_file: 'seed-lecture-2.wav',
      excerpt: 'A morning walk discussion on the origin of consciousness and the limits of material science.',
      transcript: walkTx,
    },
    {
      title: 'Caitanya-caritamrta Madhya 20.108-109: The Position of the Jiva',
      speaker: 'Srila Prabhupada',
      type: 'Caitanya-caritamrta',
      location: 'New York',
      date: '1975-02-02',
      duration: '00:54:22',
      audio_file: '',
      excerpt: 'On the constitutional position of the living being as the eternal servant of Krishna.',
      transcript: ccTx,
    },
  ];

  for (const row of rows) {
    await run(
      INSERT,
      [row.title, row.speaker, row.type, row.location, row.date, row.duration, row.audio_file, row.excerpt, row.transcript]
    );
  }
  console.log(`Seeded ${rows.length} sample lectures${process.env.TURSO_DATABASE_URL ? ' into Turso' : ' locally'}.`);
}

seed().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});