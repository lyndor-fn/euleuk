PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (1, 1, 'user', 'bonjour', '2026-03-12 21:21:57');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (2, 1, 'model', 'Bonjour ! Je suis ravi de vous rencontrer dans l''application Euleuk. Je suis votre conseiller d''orientation bienveillant aujourd''hui. Je suis impatient de vous aider à explorer vos objectifs et vos compétences.

Avant de commencer, pouvez-vous me dire un peu plus sur vos motivations et vos rêves ? Qu''est-ce qui vous pousse à vouloir devenir ingénieur ou gerer des bases de données ? Quels sont vos intérêts et vos passions ?

Et puis, pouvez-vous me dire un peu plus sur vos compétences en mathématiques, en PHP, en langage C et en programmation linéaire ? Qu''est-ce que vous aimez particulièrement dans ces domaines ?', '2026-03-12 21:21:57');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (3, 1, 'user', 'bonjour', '2026-03-12 21:22:48');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (4, 1, 'model', 'Bonjour ! Je suis ravi de vous rencontrer sur Euleuk. Je vais essayer de vous aider à explorer vos options et à atteindre vos objectifs.

Avant de commencer, pouvez-vous me dire ce qui vous inspire à devenir ingénieur ou à gérer des bases de données ? Qu''est-ce qui vous passionne dans ces domaines ?

Et si vous le permettez, pouvez-vous me donner un peu plus de détails sur vos compétences en mathématiques, PHP, langage C et programmation linéaire ? Qu''est-ce que vous avez déjà accompli dans ces domaines ?

Je suis là pour vous écouter et vous aider à prendre des décisions éclairées !', '2026-03-12 21:22:48');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (5, 1, 'user', 'bonjour', '2026-03-12 21:38:21');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (6, 1, 'model', 'Bonjour ! Je suis ravi de vous rencontrer sur Euleuk ! Je vois que vous avez déjà des compétences intéressantes comme la mathématique, le PHP, le langage C et la programmation linéaire. Et vous avez des objectifs clairs : devenir ingénieur ou gérer des bases de données.

Avant de commencer à explorer vos options, je voudrais savoir : qu''est-ce qui vous a motivé à choisir ces compétences et ces objectifs ? Avez-vous déjà une passion pour les maths, les technologies de l''information ou les sciences en général ?', '2026-03-12 21:38:21');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (7, 1, 'user', 'bonjour', '2026-03-12 21:41:58');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (8, 1, 'model', 'Bonjour ! Je suis ravi de vous rencontrer. Je vois que vous avez des compétences très intéressantes dans les domaines de la mathématique, du PHP, du langage C et de la programmation linéaire. Et vos objectifs sont très clairs : devenir ingénieur ou gérer des bases de données !

C''est super, tu as déjà un bon pied d''entrée dans la carrière. Mais je voudrais savoir, qu''est-ce qui t''a motivé à choisir ces objectifs spécifiques ? As-tu déjà une idée de ce type d''ingénieur ou de poste de gestionnaire de base de données que tu te sens attiré(e) ?

Et comment te sens-tu à l''écriture de code en langage C et au développement web avec PHP ? As-tu déjà travaillé sur des projets personnels ou scolaires qui te font ressentir une certaine satisfaction ?', '2026-03-12 21:41:58');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (9, 1, 'user', 'bonjour', '2026-03-12 21:46:03');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (10, 1, 'model', 'Bonjour ! Je suis ravi de vous rencontrer sur Euleuk. Je vais faire de mon mieux pour vous aider à explorer vos objectifs et à trouver un chemin qui vous convient.

Avant de commencer, pouvez-vous me dire ce qui vous a motivé à vous inscrire sur Euleuk et ce que vous espérez obtenir de cette expérience ?

Étant donné vos compétences en mathématiques, PHP, langage C et programmation linéaire, je suppose que vous êtes intéressé par les domaines techniques et informatiques. Mais pouvez-vous me dire si c''est bien cela ?', '2026-03-12 21:46:03');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (11, 1, 'user', 'bonjour', '2026-03-12 21:47:23');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (12, 1, 'model', 'Bonjour ! Je suis ravi de vous rencontrer. Comment allez-vous aujourd''hui ?

Vous avez des objectifs clairs en matière de carrière, vous souhaitez devenir ingénieur ou gérer des bases de données. C''est déjà un excellent début.

Avant de commencer, pouvez-vous me dire quel type de domaine vous vous intéressez le plus ? Par exemple, les technologies de l''information, les systèmes d''information, les sciences exactes, etc. ?', '2026-03-12 21:47:23');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (13, 1, 'user', 'qui est tu', '2026-03-12 21:47:35');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (14, 1, 'model', 'Je suis un conseiller d''orientation virtuel, spécialisé dans l''aide et le suivi des étudiants et des professionnels dans leur parcours de formation et de carrière.

Je suis conçu pour être un partenaire de confiance, qui vous écoute, vous conseille et vous guide dans vos choix et vos décisions. Mon objectif est de vous aider à atteindre vos objectifs et à trouver votre voie professionnelle idéale.

Je peux vous aider à :

* Explorer vos intérêts et vos compétences
* Définir vos objectifs et vos aspirations
* Choisissez une voie de formation ou de carrière adaptée à vos besoins et à vos ambitions
* Découvrir des opportunités de formation ou de travail qui vous conviennent

Je suis là pour vous aider et vous soutenir dans votre parcours.

Maintenant, je voudrais revenir à vos objectifs et compétences. Vous avez mentionné que vous avez des compétences en mathématiques, en PHP, en langage C et en programmation linéaire. C''est déjà un excellent fondement pour une carrière en ingénierie ou en gestion de bases de données.

Pouvez-vous me dire ce que vous aimez particulièrement dans ces domaines ?', '2026-03-12 21:47:35');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (15, 1, 'user', 'salut', '2026-03-19 23:43:13');
INSERT INTO "conversations" ("id", "user_id", "role", "content", "created_at") VALUES (16, 1, 'model', 'Salut ! Comment ça va ? J''ai vu que tu as des compétences en mathématiques, PHP, langage C et programmation linéaire. C''est déjà très impressionnant !

Tu as des objectifs de devenir ingénieur ou de gérer des bases de données. Ça me semble bien aligné avec tes compétences. Mais je voudrais en savoir un peu plus sur toi pour mieux comprendre tes besoins et t''aider à atteindre tes objectifs.

Pouvez-vous me dire :

- Quel type d''ingénieur t''intéresse le plus (ingénieur informatique, ingénieur civil, ingénieur mécanique, etc.) ?
- Quel est votre niveau d''études actuel (lycée, bac, licence, etc.) ?
- Avez-vous déjà une expérience professionnelle ou des projets personnels en lien avec la programmation et les bases de données ?

Je suis là pour t''aider et t''encourager !', '2026-03-19 23:43:13');
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );
CREATE TABLE profiles (
    user_id INTEGER PRIMARY KEY,
    skills TEXT,
    hobbies TEXT,
    personality TEXT,
    favorite_subjects TEXT,
    goals TEXT,
    strengths TEXT,
    weaknesses TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
INSERT INTO "profiles" ("user_id", "skills", "hobbies", "personality", "favorite_subjects", "goals", "strengths", "weaknesses") VALUES (1, 'mathématique, php, langage C, programmation lineaire', 'jeux video , voiture', 'travail en equipe', 'atelier créatif', 'devenir ingénieur ou gerer des bases de données', 'rapidité d''adaptation', 'patience');
CREATE TABLE recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_title TEXT,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
INSERT INTO "recommendations" ("id", "user_id", "job_title", "explanation", "created_at") VALUES (1, 1, 'Développeur Web', 'En tant que développeur web, vous utiliserez vos compétences en PHP pour créer des applications web interactives et dynamiques. Vous travaillerez en équipe pour concevoir et développer des solutions web efficaces, ce qui correspond à votre personnalité.', '2026-03-12 21:00:35');
INSERT INTO "recommendations" ("id", "user_id", "job_title", "explanation", "created_at") VALUES (2, 1, 'Ingénieur en Systèmes Embarkés', 'En tant qu''ingénieur en systèmes embarqués, vous utiliserez vos compétences en langage C pour concevoir et développer des systèmes de controle et de communication pour les véhicules. Votre intérêt pour les voitures correspond à ce rôle.', '2026-03-12 21:00:35');
INSERT INTO "recommendations" ("id", "user_id", "job_title", "explanation", "created_at") VALUES (3, 1, 'Data Analyst', 'En tant que data analyst, vous utiliserez vos compétences en programmation linéaire pour analyser et interpréter des données de bases de données. Vous serez chargé de tirer des conclusions et de recommander des actions pour améliorer la performance organisationnelle.', '2026-03-12 21:00:35');
INSERT INTO "recommendations" ("id", "user_id", "job_title", "explanation", "created_at") VALUES (4, 1, 'Conseiller en Technologies de l''Information', 'En tant que conseiller en technologies de l''information, vous utiliserez vos compétences en PHP et en programmation linéaire pour aider les organisations à concevoir et à mettre en œuvre des solutions de gestion de données efficaces.', '2026-03-12 21:00:35');
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('student', 'coach')),
    full_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  , username TEXT);
INSERT INTO "users" ("id", "email", "password", "role", "full_name", "created_at", "username") VALUES (1, 'fallpapelindor@gmail.com', 'ok', 'student', 'lindor', '2026-03-11 21:52:35', 'lindor');
INSERT INTO "users" ("id", "email", "password", "role", "full_name", "created_at", "username") VALUES (2, 'coach@gmail.com', 'coach', 'coach', 'fatoumata ', '2026-03-17 18:30:08', 'fatoumata');
COMMIT;
