const path = `${window.location.pathname}`;
// バージョンを管理　スキルデータ更新時は変更する
const version = 'v1';
const storageKey = `scaleMapJson-${version}-${path}`;
// ローカルストレージからデータを取得
const scaleMapJson = localStorage.getItem(storageKey);
// キー：スキルID-コンテンツID、値：スケール評価値
const scaleMap = scaleMapJson ? new Map(JSON.parse(scaleMapJson)): new Map();

const skillMap = document.getElementById('skill-map');
const centerX = skillMap.offsetWidth / 2;
const centerY = skillMap.offsetHeight / 2;
const innerRadius = skillMap.offsetWidth / 2 - 70;
const outerRadius = skillMap.offsetWidth / 2 + 100;
const contentRadius = skillMap.offsetWidth / 2;

// スキルIDとコンテンツ数のマップ　平均スキル評価を算出するために使用
const skillContentCountMap = new Map();

// スキルファイルの読み込み
const langAndFw = fetch('./json/lang_and_fw.json')
  .then(response => response.json());
const otherSkill = fetch('./json/other_skill.json')
  .then(response => response.json());
var langAndFwObj;
var otherSkillObj;

Promise.allSettled([langAndFw, otherSkill])
  .then(results => {
    createSkillButton(results[0].value.skills, innerRadius);
    createSkillButton(results[1].value.skills, outerRadius);
    results[0].value.skills.concat(results[1].value.skills).forEach(skill => {
      skillContentCountMap.set(skill.id, skill.contents.length);
    })
    setSkillButtonColor();
    setContentButtonColor();
    // 初期画面表示
    showSkillButtonsByClassname('skill');
    langAndFwObj = results[0].value;
    otherSkillObj = results[1].value;
  });

// 中央の円をクリックしたときのイベント
const centerCircle = document.getElementById('center-circle');
centerCircle.addEventListener('click', () => {
  hideAllSkillButtons();
  showSkillButtonsByClassname('skill');
});

document.getElementById('download-button').addEventListener('click', downloadCsv);

// 使い方モーダル要素を取得
const helpButton = document.getElementById('help-button');
const helpModalOverlay = document.getElementById('helpModalOverlay');
const helpCloseModalButton = document.getElementById('helpCloseModal');

// 使い方モーダルを表示するイベント
helpButton.addEventListener('click', () => {
  helpModalOverlay.style.display = 'flex';
});

// 使い方モーダルを閉じるイベント
helpCloseModalButton.addEventListener('click', () => {
  helpModalOverlay.style.display = 'none';
});

// 背景クリックで使い方モーダルを閉じる
helpModalOverlay.addEventListener('click', (e) => {
  if (e.target === helpModalOverlay) {
    helpModalOverlay.style.display = 'none';
  }
});

// 一覧モーダル要素を取得
const listButton = document.getElementById('list-button');
const listModalOverlay = document.getElementById('listModalOverlay');
const listCloseModalButton = document.getElementById('listCloseModal');

// 一覧モーダルを表示するイベント
listButton.addEventListener('click', () => {
  const skillList = document.getElementById('skill-list');
  skillList.innerHTML = '';
  const skillArrayHtml = Array();
  langAndFwObj.skills.forEach(skill => {
    skillArrayHtml.push(`<p><b>${skill.name}</b></p>`);
    skill.contents.forEach(content => {
      const scaleValue = scaleMap.get(`${skill.id}-${content.id}`);
      skillArrayHtml.push(`<p><span>- ${content.title}：${scaleValue ? scaleValue: '_'}</span></p>`);
    });
  });
  otherSkillObj.skills.forEach(skill => {
    skillArrayHtml.push(`<p><b>${skill.name}</b></p>`);
    skill.contents.forEach(content => {
      const scaleValue = scaleMap.get(`${skill.id}-${content.id}`);
      skillArrayHtml.push(`<p><span>- ${content.title}：${scaleValue ? scaleValue: '_'}</span></p>`);
    });
  });
  skillList.innerHTML = skillArrayHtml.join('');
  listModalOverlay.style.display = 'flex';
});

// 一覧モーダルを閉じるイベント
listCloseModalButton.addEventListener('click', () => {
  listModalOverlay.style.display = 'none';
});

// 背景クリックで一覧モーダルを閉じる
listModalOverlay.addEventListener('click', (e) => {
  if (e.target === listModalOverlay) {
    listModalOverlay.style.display = 'none';
  }
});


// スケール評価モーダルの要素を取得
const modalOverlay = document.getElementById('modalOverlay');
const scaleContainerInputs = document.querySelectorAll('.scale-container input[type="radio"]');
const booleanContainerInputs = document.querySelectorAll('.boolean-container input[type="radio"]');
const cancelModalButton = document.getElementById('cancelModal');
const completeModalButton = document.getElementById('completeModal');

// キャンセルボタンでスケール評価モーダルを閉じるイベント
cancelModalButton.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

// 完了ボタンでスケール評価モーダルを閉じるイベント
// スケールマップ、ローカルストレージにスケール評価を保存し、ボタンの色を更新する
completeModalButton.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
  const selectedScaleValue = Array.from(scaleContainerInputs).find(input => input.checked)?.value;
  const selectedBooleanValue = Array.from(booleanContainerInputs).find(input => input.checked)?.value;
  const skillContentId = document.getElementById('skill-content-id').value;
  const selectedValue = selectedScaleValue || selectedBooleanValue;
  scaleMap.set(skillContentId, selectedValue);
  localStorage.setItem(storageKey, JSON.stringify(Array.from(scaleMap)));
  setSkillButtonColor();
  setContentButtonColor();
});

// 背景クリックでスケール評価モーダルを閉じる
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.style.display = 'none';
  }
});

// ランク1~5のスキルボタンの色定義
const rankColors = {
  white: 'linear-gradient(to bottom, #ffffff, #f0f0f0)', // ランク1
  beginner: 'linear-gradient(to bottom, #add8e6, #87ceeb)', // ランク2
  lightGreen: 'linear-gradient(to bottom, #90ee90, #32cd32)', // ランク3
  lightOrange: 'linear-gradient(to bottom, #ffcc99, #ff9966)', // ランク4
  gold: 'linear-gradient(to bottom, #ffd700, #daa520)', // ランク5
};

// スキルコンテンツのボタンの色を設定する
function setContentButtonColor() {
  const contentButtons = document.querySelectorAll('.content');
  contentButtons.forEach(contentButton => {
    const skillContentId = contentButton.id;
    const rank = scaleMap.get(skillContentId);
    switch (rank) {
      case '1':
        contentButton.style.background = rankColors.white;
        break;
      case '2':
        contentButton.style.background = rankColors.beginner;
        break;
      case '3':
        contentButton.style.background = rankColors.lightGreen;
        break;
      case '4':
        contentButton.style.background = rankColors.lightOrange;
        break;
      case '5':
        contentButton.style.background = rankColors.gold;
        break;

      default:
        contentButton.style.background = rankColors.white;
        break;
    }
  });
}

// スキルボタンの色を設定する
function setSkillButtonColor() {

  // スキルIDごとのスキル評価値の合計を算出
  const skillRankCountMap = new Map();
  scaleMap.forEach((value, key) => {
    const skillId = key.split('-')[0];
    const rank = Number(value);
    if (skillRankCountMap.has(skillId)) {
      const sum = skillRankCountMap.get(skillId);
      skillRankCountMap.set(skillId, sum + rank);
    } else {
      skillRankCountMap.set(skillId, rank);
    }
  });

  // スキルIDごとのスキル評価値の平均を算出
  const skillAverageMap = new Map();
  skillRankCountMap.forEach((value, key) => {
    const count = skillContentCountMap.get(key);
    const average = value / count;
    skillAverageMap.set(key, average);
  });

  const skillButtons = document.querySelectorAll('.skill');
  skillButtons.forEach(skillButton => {
    const skillId = skillButton.id;
    const averageRank = skillAverageMap.get(skillId);

    switch (true) {
      case averageRank < 1.5:
        skillButton.style.background = rankColors.white;
        break;
      case averageRank < 2.5:
        skillButton.style.background = rankColors.beginner;
        break;
      case averageRank < 3.5:
        skillButton.style.background = rankColors.lightGreen;
        break;
      case averageRank < 4.5:
        skillButton.style.background = rankColors.lightOrange;
        break;
      case averageRank <= 5:
        skillButton.style.background = rankColors.gold;
        break;
    }
  });
}

// スキルジャンルと付属するスキルコンテンツのボタンを生成する
function createSkillButton(skills, radius) {

  skills.forEach((skill, index) => {
    const skillAngle = (index / skills.length) * (2 * Math.PI) - 90;
    const skillX = centerX + radius * Math.cos(skillAngle) - 50;
    const skillY = centerY + radius * Math.sin(skillAngle) - 50;

    const skillButton = document.createElement('div');
    skillButton.className = `skill-button skill`;
    skillButton.style.left = `${skillX}px`;
    skillButton.style.top = `${skillY}px`;
    skillButton.style.display = 'none';
    skillButton.textContent = skill.name;
    skillButton.id = `${skill.id}`;
    skillButton.addEventListener('click', () => {
      hideAllSkillButtons();
      showSkillButtonsByClassname(`skill-id${skill.id}`);
    });
    skillMap.appendChild(skillButton);

    skill.contents.forEach((content, index) => {
      const contentAngle = (index / skill.contents.length) * (2 * Math.PI) - 90;
      const contentX = centerX + contentRadius * Math.cos(contentAngle) - 50;
      const contentY = centerY + contentRadius * Math.sin(contentAngle) - 50;

      const contentButton = document.createElement('div');
      contentButton.className = `skill-button content skill-id${skill.id}`;
      contentButton.id = `${skill.id}-${content.id}`;
      contentButton.style.left = `${contentX}px`;
      contentButton.style.top = `${contentY}px`;
      contentButton.style.display = 'none';
      contentButton.textContent = content.title;
      contentButton.addEventListener('click', () => {
        document.getElementById('title').textContent = content.title;
        document.getElementById('description').textContent = content.description;
        document.getElementById('skill-content-id').value = `${skill.id}-${content.id}`;
        const scaleValue = scaleMap.get(`${skill.id}-${content.id}`);
        switch (content.checkstyle.type) {
          case 'boolean':
            document.getElementById('boolean-container').style.display = 'flex';
            document.getElementById('scale-container').style.display = 'none';
            booleanContainerInputs.forEach(input => {
              scaleValue === input.value ? input.checked = true : input.checked = false;
            });
            break;
          case 'scale':
            document.getElementById('boolean-container').style.display = 'none';
            document.getElementById('scale-container').style.display = 'flex';
            scaleContainerInputs.forEach(input => {
              scaleValue === input.value ? input.checked = true : input.checked = false;
            });
            break;
        }
        modalOverlay.style.display = 'flex';
      });

      skillMap.appendChild(contentButton);
    });
  });
}

// クラス名に一致するスキルボタンを表示する
// コンテンツのスキルボタンのクラス名はskill-id{スキルID}で指定される
function showSkillButtonsByClassname(classname) {
  document.querySelectorAll(`.${classname}`).forEach(button => {
    button.style.display = '';
  });
}

// 全てのスキルボタンを非表示にする
// 全てのスキルボタンにはskill-buttonクラスが付与されている
function hideAllSkillButtons() {
  document.querySelectorAll('.skill-button').forEach(skillButton => {
    skillButton.style.display = 'none';
  });
}

function downloadCsv() {
  const csvContent = createCsv();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'skill.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createCsv() {
  const csv = Array.from(scaleMap).map(([key, value]) => {
    // フォーマット： スキルID,スキル名,コンテンツID,コンテンツ名,スケール評価値
    const [skillId, contentId] = key.split('-');
    const skill = langAndFwObj.skills.find(skill => skill.id === skillId) || otherSkillObj.skills.find(skill => skill.id === skillId);
    const content = skill.contents.find(content => content.id === contentId);
    const type = content.checkstyle.type;
    return `${skillId},${skill.name},${contentId},${content.title},${type},${value}`;
  }).join('\n');
  return csv;
}
