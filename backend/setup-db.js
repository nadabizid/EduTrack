// run once: node setup-db.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'edutrack3',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log('🔧 Dropping old tables...');
    await client.query(`
      DROP TABLE IF EXISTS soutenance_slots, teacher_availability,
        group_members, groups, projects, notifications, users CASCADE
    `);

    console.log('🔧 Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id         SERIAL PRIMARY KEY,
        full_name  VARCHAR(120) NOT NULL,
        email      VARCHAR(120) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        role       VARCHAR(20)  NOT NULL DEFAULT 'student'
                     CHECK (role IN ('student','teacher','admin')),
        filiere    VARCHAR(20)  CHECK (filiere IN ('ING-A1','ING-A2','ING-A3')),
        avatar_url VARCHAR(255),
        created_at TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type       VARCHAR(50)  NOT NULL,
        title      VARCHAR(200) NOT NULL,
        body       TEXT,
        is_read    BOOLEAN      DEFAULT FALSE,
        ref_id     INTEGER,
        created_at TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE projects (
        id             SERIAL PRIMARY KEY,
        teacher_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title          VARCHAR(255) NOT NULL,
        description    TEXT,
        filiere        VARCHAR(20)  NOT NULL CHECK (filiere IN ('ING-A1','ING-A2','ING-A3')),
        type           VARCHAR(30)  DEFAULT 'mini_project'
                         CHECK (type IN ('mini_project','pfe')),
        deadline       TIMESTAMPTZ,
        max_group_size INTEGER      DEFAULT 3,
        allow_solo     BOOLEAN      DEFAULT FALSE,
        status         VARCHAR(20)  DEFAULT 'open'
                         CHECK (status IN ('open','closed','archived')),
        created_at     TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE groups (
        id           SERIAL PRIMARY KEY,
        project_id   INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        name         VARCHAR(100),
        created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        link_url     VARCHAR(500),
        link_type    VARCHAR(30),
        submitted_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE group_members (
        id        SERIAL PRIMARY KEY,
        group_id  INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE soutenance_slots (
        id          SERIAL PRIMARY KEY,
        project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        group_id    INTEGER REFERENCES groups(id)   ON DELETE SET NULL,
        slot_date   DATE    NOT NULL,
        start_time  TIME    NOT NULL,
        end_time    TIME    NOT NULL,
        format      VARCHAR(20) DEFAULT 'presentiel'
                      CHECK (format IN ('presentiel','meet')),
        room        VARCHAR(100),
        meet_link   VARCHAR(500),
        order_num   INTEGER,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE teacher_availability (
        id          SERIAL PRIMARY KEY,
        project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        avail_date  DATE NOT NULL,
        start_time  TIME NOT NULL,
        end_time    TIME NOT NULL
      )
    `);

    console.log('✅ Tables created');

    // ── Seed Users ──────────────────────────────────────────
    const hash = await bcrypt.hash('password123', 10);
    console.log('🔑 Hash generated for password123');

    const users = [
      ['Dr. Karim Mansour', 'karim@issat.tn',   'teacher', null],
      ['Dr. Leila Gharbi',  'leila@issat.tn',   'teacher', null],
      ['Ahmed Ben Salem',   'ahmed@issat.tn',   'student', 'ING-A1'],
      ['Mohamed Yassine',   'yassine@issat.tn', 'student', 'ING-A1'],
      ['Sara Boughanmi',    'sara@issat.tn',    'student', 'ING-A1'],
      ['Rania Trabelsi',    'rania@issat.tn',   'student', 'ING-A1'],
      ['Sami Hamdi',        'sami@issat.tn',    'student', 'ING-A1'],
      ['Nour Sfaxi',        'nour@issat.tn',    'student', 'ING-A2'],
      ['Tarek Jouini',      'tarek@issat.tn',   'student', 'ING-A2'],
      ['Ines Rekik',        'ines@issat.tn',    'student', 'ING-A2'],
      ['Mariem Chaabane',   'mariem@issat.tn',  'student', 'ING-A3'],
      ['Khalil Najjar',     'khalil@issat.tn',  'student', 'ING-A3'],
    ];

    const uid = {};
    for (const [full_name, email, role, filiere] of users) {
      const { rows:[u] } = await client.query(
        `INSERT INTO users (full_name,email,password,role,filiere)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email) DO UPDATE SET password=$3,role=$4,filiere=$5
         RETURNING id`,
        [full_name, email, hash, role, filiere]
      );
      uid[email] = u.id;
    }
    console.log('✅ Users seeded (12 users)');

    // ── Seed Projects ────────────────────────────────────────
    const projectDefs = [
      {
        teacher: 'karim@issat.tn',
        title: 'Application de Gestion du Cursus Universitaire',
        desc:  "Conception et réalisation d'une application web permettant de gérer le cursus (inscription, notes, suivi PFE). Stack libre.",
        filiere: 'ING-A1', type: 'mini_project', daysLeft: 28, maxSize: 3,
      },
      {
        teacher: 'karim@issat.tn',
        title: "Système de Détection d'Intrusion Réseau",
        desc:  "Développement d'un IDS basé sur le machine learning pour détecter les anomalies réseau en temps réel.",
        filiere: 'ING-A3', type: 'pfe', daysLeft: 60, maxSize: 2,
      },
      {
        teacher: 'leila@issat.tn',
        title: 'Plateforme E-Learning Adaptative',
        desc:  "Création d'une plateforme d'apprentissage avec recommandation de contenu personnalisée par IA.",
        filiere: 'ING-A2', type: 'mini_project', daysLeft: 35, maxSize: 3,
      },
      {
        teacher: 'leila@issat.tn',
        title: 'Application Mobile de Covoiturage Universitaire',
        desc:  "App mobile (React Native ou Flutter) permettant aux étudiants de l'ISSAT de partager des trajets.",
        filiere: 'ING-A1', type: 'mini_project', daysLeft: 21, maxSize: 3,
      },
    ];

    const projIds = {};
    for (const p of projectDefs) {
      const deadline = new Date(Date.now() + p.daysLeft * 86400000);
      const { rows:[proj] } = await client.query(`
        INSERT INTO projects (teacher_id,title,description,filiere,type,deadline,max_group_size,allow_solo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,false) RETURNING id`,
        [uid[p.teacher], p.title, p.desc, p.filiere, p.type, deadline, p.maxSize]
      );
      projIds[p.filiere] = projIds[p.filiere] || proj.id;

      // Notify students of this filiere
      const { rows: students } = await client.query(
        `SELECT id FROM users WHERE role='student' AND filiere=$1`, [p.filiere]
      );
      const tname = p.teacher === 'karim@issat.tn' ? 'Dr. Karim Mansour' : 'Dr. Leila Gharbi';
      for (const s of students) {
        await client.query(
          `INSERT INTO notifications (user_id,type,title,body,ref_id) VALUES ($1,'new_project',$2,$3,$4)`,
          [s.id, `Nouveau projet — ${p.filiere}`,
           `"${p.title}" a été publié par ${tname}. Inscrivez-vous avant la deadline !`, proj.id]
        );
      }

      // Add availability
      await client.query(`
        INSERT INTO teacher_availability (project_id,avail_date,start_time,end_time)
        VALUES
          ($1, CURRENT_DATE + $2, '08:30','12:00'),
          ($1, CURRENT_DATE + $3, '09:00','17:00'),
          ($1, CURRENT_DATE + $4, '08:00','12:30')`,
        [proj.id, p.daysLeft - 3, p.daysLeft - 2, p.daysLeft - 1]
      );
    }
    console.log('✅ Projects seeded (4 projects, notifications sent)');

    // ── Seed Groups for ING-A1 project ──────────────────────
    const p1id = projIds['ING-A1'];

    // Group Alpha: ahmed, yassine, sara
    const { rows:[gAlpha] } = await client.query(
      `INSERT INTO groups (project_id,name,created_by,link_url,link_type,submitted_at)
       VALUES ($1,'Groupe Alpha',$2,'https://github.com/ahmed-bs/gestion-cursus','github',NOW())
       RETURNING id`,
      [p1id, uid['ahmed@issat.tn']]
    );
    for (const em of ['ahmed@issat.tn','yassine@issat.tn','sara@issat.tn']) {
      await client.query(`INSERT INTO group_members (group_id,user_id) VALUES ($1,$2)`,
        [gAlpha.id, uid[em]]);
    }

    // Group Beta: rania, sami  (no link yet)
    const { rows:[gBeta] } = await client.query(
      `INSERT INTO groups (project_id,name,created_by) VALUES ($1,'Groupe Beta',$2) RETURNING id`,
      [p1id, uid['rania@issat.tn']]
    );
    for (const em of ['rania@issat.tn','sami@issat.tn']) {
      await client.query(`INSERT INTO group_members (group_id,user_id) VALUES ($1,$2)`,
        [gBeta.id, uid[em]]);
    }

    // Seed soutenance slots for both groups
    await client.query(`
      INSERT INTO soutenance_slots (project_id,group_id,slot_date,start_time,end_time,format,room,order_num)
      VALUES
        ($1,$2, CURRENT_DATE+25, '09:00','09:20','presentiel','B-12',1),
        ($1,$3, CURRENT_DATE+25, '09:20','09:40','presentiel','B-12',2)`,
      [p1id, gAlpha.id, gBeta.id]
    );

    // Notify Ahmed about his slot
    await client.query(
      `INSERT INTO notifications (user_id,type,title,body,ref_id) VALUES ($1,'slot_assigned',$2,$3,$4)`,
      [uid['ahmed@issat.tn'],
       'Créneau de soutenance confirmé !',
       'Groupe Alpha — Salle B-12, dans 25 jours de 09:00 à 09:20.',
       p1id]
    );

    console.log('✅ Demo groups + soutenance slots seeded');
    console.log('\n🚀 Setup complete!');
    console.log('   Password for all accounts: password123');
    console.log('   Run: npm run dev');

  } catch(err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
