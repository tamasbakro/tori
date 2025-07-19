// app.js

// 1. Betöltjük a markdown-t (fetch) és feldolgozzuk
fetch('lesson/romania_history_full.md')
  .then(res => res.text())
  .then(md => {
    const structure = parseMarkdown(md);
    console.log('Fejezetek és leckék szerkezete:', structure);
    // A következő lépésben ebből generáljuk a menüt és a tartalmat
    window.lessonStructure = structure; // későbbi eléréshez
    buildMenu(structure);
    // Tartalom megjelenítés a következő lépésben
  });

// 2. Markdown feldolgozása fejezetekre és leckékre
function parseMarkdown(md) {
  const lines = md.split('\n');
  const chapters = [];
  let currentChapter = null;
  let currentLesson = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fejezet (##)
    const chapterMatch = line.match(/^##\s+(.+)/);
    if (chapterMatch) {
      // Előbb az aktuális leckét hozzáadjuk az előző fejezethez (ha van)
      if (currentLesson && currentChapter) {
        currentChapter.lessons.push(currentLesson);
        currentLesson = null;
      }
      // Az előző fejezetet is hozzáadjuk
      if (currentChapter) chapters.push(currentChapter);
      currentChapter = {
        title: chapterMatch[1],
        lessons: [],
      };
      continue;
    }

    // Lecke (###)
    const lessonMatch = line.match(/^###\s+(.+)/);
    if (lessonMatch && currentChapter) {
      if (currentLesson) currentChapter.lessons.push(currentLesson);
      currentLesson = {
        title: lessonMatch[1],
        content: '',
      };
      continue;
    }

    // Tartalom
    if (currentLesson) {
      currentLesson.content += line + '\n';
    } else if (currentChapter && currentChapter.title.includes('Összefoglalás')) {
      // Ha az Összefoglalás fejezetben vagyunk, de nincs lecke, akkor egyetlen leckeként kezeljük
      if (!currentChapter.lessons.length) {
        currentLesson = {
          title: 'Összefoglalás',
          content: '',
        };
      }
      if (currentLesson) {
        currentLesson.content += line + '\n';
      }
    }
  }
  // Utolsó lecke és fejezet hozzáadása
  if (currentLesson && currentChapter) currentChapter.lessons.push(currentLesson);
  if (currentChapter) chapters.push(currentChapter);

  return chapters;
}

// Menü generálása
function buildMenu(structure) {
  const menu = document.getElementById('menu');
  menu.innerHTML = '';
  structure.forEach((chapter, ci) => {
    const chapterDiv = document.createElement('div');
    chapterDiv.className = 'chapter';

    const chapterTitle = document.createElement('div');
    chapterTitle.className = 'chapter-title';
    chapterTitle.innerHTML = `${chapter.title} <span>▼</span>`;
    chapterTitle.onclick = () => {
      lessonList.classList.toggle('open');
    };

    const lessonList = document.createElement('ul');
    lessonList.className = 'lesson-list';

    chapter.lessons.forEach((lesson, li) => {
      const lessonItem = document.createElement('li');
      const lessonLink = document.createElement('div');
      lessonLink.className = 'lesson-link';
      lessonLink.textContent = lesson.title;
      lessonLink.onclick = () => {
        document.querySelectorAll('.lesson-link').forEach(l => l.classList.remove('active'));
        lessonLink.classList.add('active');
        showLesson(ci, li);
      };
      lessonItem.appendChild(lessonLink);
      lessonList.appendChild(lessonItem);
    });

    chapterDiv.appendChild(chapterTitle);
    chapterDiv.appendChild(lessonList);
    menu.appendChild(chapterDiv);
  });
}

// Lecke megjelenítése
function showLesson(chapterIdx, lessonIdx) {
  const chapter = window.lessonStructure[chapterIdx];
  const lesson = chapter.lessons[lessonIdx];
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="card">
      <h2>${lesson.title}</h2>
      <div class="lesson-body">${window.marked ? marked.parse(lesson.content) : lesson.content}</div>
    </div>
  `;
}

// --- Adminpanel titkos elérés: 5 gyors katt a címre ---
let adminClickCount = 0;
let adminClickTimer = null;
const ADMIN_PASSWORD = 'micimacko';

function isAdminAuthorized() {
  return localStorage.getItem('adminAuth') === 'true';
}
function setAdminAuthorized(val) {
  if (val) {
    localStorage.setItem('adminAuth', 'true');
  } else {
    localStorage.removeItem('adminAuth');
  }
}

function hideAdminMenu() {
  const adminMenu = document.getElementById('admin-menu');
  if (adminMenu) adminMenu.style.display = 'none';
}
function showAdminMenu() {
  const adminMenu = document.getElementById('admin-menu');
  if (adminMenu) adminMenu.style.display = '';
}

// Ellenőrzés oldal betöltésekor
window.addEventListener('DOMContentLoaded', () => {
  if (!isAdminAuthorized()) {
    hideAdminMenu();
  } else {
    showAdminMenu();
  }

  // Kvíz menüpont eseménykezelő
  const quizMenu = document.getElementById('quiz-menu');
  if (quizMenu) {
    const quizBtn = quizMenu.querySelector('.chapter-title');
    if (quizBtn) {
      quizBtn.addEventListener('click', () => { showQuizPage(); });
      quizBtn.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') showQuizPage();
      });
    } else {
      quizMenu.addEventListener('click', () => { showQuizPage(); });
    }
  }
});

const title = document.querySelector('#sidebar h1');
if (title) {
  title.addEventListener('click', () => {
    adminClickCount++;
    if (adminClickTimer) clearTimeout(adminClickTimer);
    adminClickTimer = setTimeout(() => { adminClickCount = 0; }, 1200);
    if (adminClickCount >= 5) {
      if (!isAdminAuthorized()) {
        const pw = prompt('Adminpanel eléréséhez jelszó szükséges:');
        if (pw === ADMIN_PASSWORD) {
          setAdminAuthorized(true);
          showAdminMenu();
        } else {
          alert('Hibás jelszó!');
        }
      } else {
        showAdminMenu();
      }
      adminClickCount = 0;
    }
  });
}

// --- Adminpanel menüpont kezelése ---
const adminMenu = document.getElementById('admin-menu');
if (adminMenu) {
  adminMenu.addEventListener('click', () => {
    if (!isAdminAuthorized()) {
      const pw = prompt('Adminpanel eléréséhez jelszó szükséges:');
      if (pw === ADMIN_PASSWORD) {
        setAdminAuthorized(true);
        showAdminPanel();
      } else {
        alert('Hibás jelszó!');
      }
    } else {
      showAdminPanel();
    }
  });
  adminMenu.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!isAdminAuthorized()) {
        const pw = prompt('Adminpanel eléréséhez jelszó szükséges:');
        if (pw === ADMIN_PASSWORD) {
          setAdminAuthorized(true);
          showAdminPanel();
        } else {
          alert('Hibás jelszó!');
        }
      } else {
        showAdminPanel();
      }
    }
  });
}

function generateQuizQuestionsFromLessons(structure) {
  const questions = [];
  structure.forEach(chapter => {
    chapter.lessons.forEach(lesson => {
      // Évszám alapú kérdés
      const yearMatch = lesson.content.match(/(1[5-9][0-9]{2}|20[0-2][0-9])/g);
      if (yearMatch && yearMatch.length > 0) {
        const questionText = lesson.title.replace(/\(.+\)/, '').replace(/\d+\./, '').trim();
        if (questionText.length >= 3 && yearMatch[0].length === 4) {
          const opts = shuffle([yearMatch[0], ...generateYearDistractors(yearMatch[0])]);
          if (opts.every(opt => opt.length === 4)) {
            questions.push({
              question: `Melyik évben történt: ${questionText}?`,
              options: opts,
              answer: yearMatch[0]
            });
            return;
          }
        }
      }
      // Név alapú kérdés (vastagított név vagy első név a címben)
      const nameMatch = lesson.content.match(/\*\*([A-ZÁÉÍÓÖŐÚÜŰ][^*\n]{2,40})\*\*/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (name.length >= 3 && name.length <= 40 && !name.includes('…') && !name.includes('?')) {
          const opts = shuffle([name, ...generateNameDistractors(name)]);
          if (opts.every(opt => opt.length >= 3 && opt.length <= 40)) {
            questions.push({
              question: `Ki volt: ${name}?`,
              options: opts,
              answer: name
            });
            return;
          }
        }
      }
      // Fogalom alapú kérdést nem generálunk!
    });
  });
  return questions;
}

function shuffle(arr) {
  return arr.map(v => [Math.random(), v]).sort().map(a => a[1]);
}

function generateYearDistractors(year) {
  // Egyszerű zavaró évszámok
  const y = parseInt(year);
  return [y + 1 + '', y - 1 + '', y + 10 + ''];
}

function generateNameDistractors(name) {
  // Egyszerű zavaró nevek
  const pool = ['Stefan cel Mare', 'Alexandru Ioan Cuza', 'Ion Antonescu', 'Nicolae Ceaușescu'];
  return shuffle(pool.filter(n => n !== name)).slice(0, 3);
}

// --- Kvíz kérdések betöltése markdownból ---
async function loadQuizFromMarkdown() {
  const res = await fetch('lesson/2971fe89.md');
  const md = await res.text();
  return parseQuizMarkdown(md);
}

function parseQuizMarkdown(md) {
  // Kérdések blokk
  const questionBlocks = md.split(/\n## \d+\./).slice(1); // fejezetek
  let questions = [];
  let answerKey = [];
  // Válaszkulcs
  const answerKeyMatch = md.match(/## Válaszkulcs\n([\s\S]+)/);
  if (answerKeyMatch) {
    answerKey = answerKeyMatch[1].replace(/\n/g, '').split(',').map(x => x.trim());
  }
  let allQuestions = [];
  for (const block of questionBlocks) {
    // Egy fejezeten belül: **1. ...**\n a) ...\n b) ... stb.
    const qMatches = [...block.matchAll(/\*\*(\d+)\. ([^*]+)\*\*[\s\S]*?(a\)) ([^\n]+)\n(b\)) ([^\n]+)\n(c\)) ([^\n]+)\n(d\)) ([^\n]+)/g)];
    for (const m of qMatches) {
      allQuestions.push({
        number: parseInt(m[1], 10),
        question: m[2].trim(),
        options: [m[4].trim(), m[6].trim(), m[8].trim(), m[10].trim()],
        answer: null // később kitöltjük
      });
    }
  }
  // Válaszkulcs hozzárendelése sorszám alapján
  if (answerKey.length) {
    for (const key of answerKey) {
      const [num, letter] = key.split('-');
      const idx = 'abcd'.indexOf(letter);
      const q = allQuestions.find(q => q.number === parseInt(num, 10));
      if (q && idx >= 0 && idx < 4) {
        q.answer = q.options[idx];
      }
    }
  }
  // Csak a kérdés, opciók, answer mezőket adjuk vissza
  return allQuestions.map(q => ({ question: q.question, options: q.options, answer: q.answer }));
}

// --- Kvíz oldal módosítása ---
async function showQuizPage() {
  // Kérdések betöltése a markdownból
  let questions = await loadQuizFromMarkdown();
  let current = 0;
  let score = 0;
  let reportedQuestions = [];
  let skippedQuestions = [];
  let answered = Array(questions.length).fill(false);

  const content = document.getElementById('content');
  content.innerHTML = '';

  function renderQuestion() {
    if (current >= questions.length) {
      showResult();
      return;
    }
    const q = questions[current];
    content.innerHTML = `
      <div class="card">
        <h2>Kvíz kérdés ${current + 1} / ${questions.length}</h2>
        <p style="font-size:1.2rem; margin-bottom:1.5rem;">${q.question}</p>
        <div id="quiz-options">
          ${q.options.map((opt, i) => `<button class="quiz-option" data-idx="${i}" ${answered[current] ? 'disabled' : ''}>${opt}</button>`).join('')}
        </div>
        <div id="quiz-feedback" style="margin-top:1.2rem; min-height:2em;"></div>
        <div style="margin-top:1.5rem; display:flex; gap:1em;">
          <button id="prev-question" ${current === 0 ? 'disabled' : ''}>Előző</button>
          <button id="skip-question">Későbbre teszem</button>
          <button id="next-question" ${current === questions.length - 1 ? 'disabled' : ''}>Következő</button>
        </div>
        <button id="report-question" class="quiz-report-btn" style="margin-top:1.5rem; background:#b71c1c; color:#fff; border:none; border-radius:8px; padding:0.5rem 1.2rem; cursor:pointer;">Jelentem (értelmetlen kérdés)</button>
      </div>
    `;
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.onclick = () => checkAnswer(btn.textContent);
    });
    document.getElementById('report-question').onclick = () => reportCurrentQuestion();
    document.getElementById('skip-question').onclick = () => skipCurrentQuestion();
    document.getElementById('prev-question').onclick = () => {
      if (current > 0) {
        current--;
        renderQuestion();
      }
    };
    document.getElementById('next-question').onclick = () => {
      if (current < questions.length - 1) {
        current++;
        renderQuestion();
      }
    };
  }

  function checkAnswer(selected) {
    const q = questions[current];
    const feedback = document.getElementById('quiz-feedback');
    if (selected === q.answer) {
      feedback.innerHTML = '<span style="color:#2e7d32;font-weight:bold;">✔️ Helyes!</span>';
      score++;
    } else {
      feedback.innerHTML = `<span style="color:#b71c1c;font-weight:bold;">❌ Helytelen!</span> Helyes válasz: <b>${q.answer}</b>`;
    }
    answered[current] = true;
    document.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);
    setTimeout(() => {
      if (current < questions.length - 1) {
        current++;
        renderQuestion();
      } else if (skippedQuestions.length > 0) {
        // Ha vannak elhalasztott kérdések, azokat a végére tesszük
        questions = questions.concat(skippedQuestions);
        answered = answered.concat(Array(skippedQuestions.length).fill(false));
        skippedQuestions = [];
        current++;
        renderQuestion();
      } else {
        showResult();
      }
    }, 1200);
  }

  function skipCurrentQuestion() {
    skippedQuestions.push(questions[current]);
    answered.push(false);
    questions.splice(current, 1);
    answered.splice(current, 1);
    if (current >= questions.length) {
      if (skippedQuestions.length > 0) {
        questions = questions.concat(skippedQuestions);
        answered = answered.concat(Array(skippedQuestions.length).fill(false));
        skippedQuestions = [];
        current = questions.length - skippedQuestions.length;
        renderQuestion();
      } else {
        showResult();
      }
    } else {
      renderQuestion();
    }
  }

  function reportCurrentQuestion() {
    reportedQuestions.push(current);
    questions.splice(current, 1);
    answered.splice(current, 1);
    if (current >= questions.length) {
      showResult();
    } else {
      renderQuestion();
    }
  }

  function showResult() {
    content.innerHTML = `
      <div class="card">
        <h2>Kvíz vége!</h2>
        <p>Eredményed: <b>${score} / ${questions.length + reportedQuestions.length}</b></p>
        <p style="margin-top:1rem; color:#b71c1c;">Kihagyott (jelentett) kérdések: <b>${reportedQuestions.length}</b></p>
        <button id="quiz-restart" style="margin-top:1.5rem;">Újra próbálom</button>
      </div>
    `;
    document.getElementById('quiz-restart').onclick = () => {
      current = 0;
      score = 0;
      reportedQuestions = [];
      skippedQuestions = [];
      answered = Array(questions.length).fill(false);
      renderQuestion();
    };
  }

  renderQuestion();
}

async function showAdminPanel() {
  // Kvízkérdések betöltése a markdownból
  let questions = await loadQuizFromMarkdown();
  // Lekciók szerkesztéséhez: mély másolat
  const structure = window.lessonStructure;
  let lessons = structure.flatMap((chapter, ci) =>
    chapter.lessons.map((lesson, li) => ({
      chapterIdx: ci,
      lessonIdx: li,
      chapterTitle: chapter.title,
      title: lesson.title,
      content: lesson.content
    }))
  );
  const content = document.getElementById('content');
  content.innerHTML = `<div class="card"><h2>⚙️ Adminpanel – Kvízkérdések szerkesztése</h2>
    <button id="admin-logout" style="float:right; background:#b71c1c; color:#fff; border:none; border-radius:6px; padding:0.3em 1em; margin-top:-2.5em;">Kijelentkezés</button>
    <div id="admin-questions"></div>
    <hr style="margin:2em 0;">
    <div id="admin-add">
      <h3>Új kvízkérdés hozzáadása</h3>
      <form id="admin-add-form">
        <label>Kérdés:<br><input type="text" id="add-q" style="width:100%;margin-bottom:0.7em;"></label><br>
        <label>Válasz 1:<br><input type="text" id="add-o1" style="width:100%;"></label><br>
        <label>Válasz 2:<br><input type="text" id="add-o2" style="width:100%;"></label><br>
        <label>Válasz 3:<br><input type="text" id="add-o3" style="width:100%;"></label><br>
        <label>Válasz 4:<br><input type="text" id="add-o4" style="width:100%;"></label><br>
        <label>Helyes válasz:
          <select id="add-answer">
            <option value="0">1</option>
            <option value="1">2</option>
            <option value="2">3</option>
            <option value="3">4</option>
          </select>
        </label><br>
        <button type="submit" style="margin-top:1em;">Hozzáadás</button>
      </form>
      <div id="admin-add-msg" style="margin-top:0.7em;"></div>
    </div>
    <hr style="margin:2em 0;">
    <div id="admin-lessons">
      <h3>Leckék szerkesztése</h3>
      <div id="admin-lessons-list"></div>
    </div>
    <button id="admin-hide" style="margin-top:2rem;">Adminpanel elrejtése</button>
  </div>`;
  renderAdminQuestions();
  renderAdminLessons();
  document.getElementById('admin-hide').onclick = () => {
    document.getElementById('admin-menu').style.display = 'none';
    document.getElementById('content').innerHTML = '<div class="welcome"><h2>Üdvözöllek!</h2><p>Válassz egy fejezetet vagy leckét a bal oldali menüből.</p></div>';
  };
  document.getElementById('admin-logout').onclick = () => {
    setAdminAuthorized(false);
    hideAdminMenu();
    document.getElementById('content').innerHTML = '<div class="welcome"><h2>Üdvözöllek!</h2><p>Válassz egy fejezetet vagy leckét a bal oldali menüből.</p></div>';
  };

  document.getElementById('admin-add-form').onsubmit = function(e) {
    e.preventDefault();
    const q = document.getElementById('add-q').value.trim();
    const o1 = document.getElementById('add-o1').value.trim();
    const o2 = document.getElementById('add-o2').value.trim();
    const o3 = document.getElementById('add-o3').value.trim();
    const o4 = document.getElementById('add-o4').value.trim();
    const answerIdx = parseInt(document.getElementById('add-answer').value);
    const opts = [o1, o2, o3, o4];
    if (!q || opts.some(opt => !opt)) {
      document.getElementById('admin-add-msg').textContent = 'Minden mező kitöltése kötelező!';
      return;
    }
    questions.push({
      question: q,
      options: opts,
      answer: opts[answerIdx]
    });
    document.getElementById('admin-add-msg').textContent = 'Kérdés hozzáadva!';
    document.getElementById('admin-add-form').reset();
    renderAdminQuestions();
  };

  function renderAdminQuestions() {
    const list = document.getElementById('admin-questions');
    if (!questions.length) {
      list.innerHTML = '<p>Nincs elérhető kvízkérdés.</p>';
      return;
    }
    list.innerHTML = `<ol>${questions.map((q, i) => `
      <li style="margin-bottom:1.2em;">
        <b>Kérdés:</b> ${q.question}<br>
        <b>Válaszok:</b> ${q.options.map(opt => `<span style='padding:0.2em 0.5em; background:#f1dabf; border-radius:5px; margin-right:0.3em;'>${opt}</span>`).join('')}<br>
        <b>Helyes:</b> <span style='color:#2e7d32;'>${q.answer}</span>
        <button class="admin-del-btn" data-idx="${i}" style="margin-left:1em; background:#b71c1c; color:#fff; border:none; border-radius:6px; padding:0.2em 0.8em; cursor:pointer;">Törlés</button>
      </li>`).join('')}</ol>`;
    document.querySelectorAll('.admin-del-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        questions.splice(idx, 1);
        renderAdminQuestions();
      };
    });
  }

  function renderAdminLessons() {
    const list = document.getElementById('admin-lessons-list');
    if (!lessons.length) {
      list.innerHTML = '<p>Nincs elérhető lecke.</p>';
      return;
    }
    list.innerHTML = `<ol>${lessons.map((l, i) => `
      <li style="margin-bottom:1.5em;">
        <b>Fejezet:</b> ${l.chapterTitle}<br>
        <label>Cím:<br><input type="text" value="${l.title.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-idx="${i}" class="admin-lesson-title" style="width:90%;"></label><br>
        <label>Tartalom:<br><textarea data-idx="${i}" class="admin-lesson-content" style="width:90%;height:5em;">${l.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea></label><br>
        <button class="admin-lesson-save" data-idx="${i}" style="margin-top:0.5em; background:#362417; color:#f1dabf; border:none; border-radius:6px; padding:0.2em 0.8em; cursor:pointer;">Mentés</button>
      </li>`).join('')}</ol>`;
    document.querySelectorAll('.admin-lesson-save').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const newTitle = document.querySelector(`.admin-lesson-title[data-idx='${idx}']`).value;
        const newContent = document.querySelector(`.admin-lesson-content[data-idx='${idx}']`).value;
        lessons[idx].title = newTitle;
        lessons[idx].content = newContent;
        btn.textContent = 'Mentve!';
        setTimeout(() => { btn.textContent = 'Mentés'; }, 1200);
      };
    });
  }
} 
