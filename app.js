// 固定使用北京时间；设备处于其他时区时也显示同一个日期。
const beijingDate = document.querySelector('#beijing-date');
const beijingDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric',
});
function updateBeijingDate() {
  beijingDate.textContent = `北京时间 ${beijingDateFormatter.format(new Date())}`;
}
updateBeijingDate();
// 页面跨午夜保持打开时，也会更新日期。
setInterval(updateBeijingDate, 60000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateBeijingDate();
});

// 1. 找到页面上需要操作的元素。
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const feedback = document.querySelector('#feedback');

// 第五课：记住当前筛选方式。let 表示这个值以后可以改变。
const filterButtons = document.querySelectorAll('[data-filter]');
const filterSummary = document.querySelector('#filter-summary');
const emptyTitle = document.querySelector('#empty-title');
const emptyDescription = document.querySelector('#empty-description');
let currentFilter = 'all';

function applyFilter() {
  let visibleCount = 0;
  // forEach 逐条检查；hidden 只是隐藏，任务仍留在列表里。
  Array.from(list.children).forEach((item) => {
    const completed = item.querySelector('.task-checkbox').checked;
    const show = currentFilter === 'all'
      || (currentFilter === 'active' && !completed)
      || (currentFilter === 'completed' && completed);
    item.hidden = !show;
    if (show) visibleCount += 1;
  });

  filterButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter));
  });
  list.hidden = visibleCount === 0;
  emptyState.hidden = visibleCount !== 0;
  filterSummary.textContent = `共 ${list.children.length} 条任务，当前显示 ${visibleCount} 条。`;

  if (list.children.length === 0) {
    emptyTitle.textContent = '清单，准备好了';
    emptyDescription.textContent = '写下第一件想做的小事，它就会出现在这里。';
  } else {
    emptyTitle.textContent = currentFilter === 'completed' ? '还没有已完成的任务' : '没有未完成的任务';
    emptyDescription.textContent = '任务没有被删除，点击“全部”可以查看所有任务。';
  }
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    applyFilter();
  });
});

// 第六课：localStorage 只能存文字，所以用 JSON 转换任务数据。
const STORAGE_KEY = 'learning-task-list.tasks.v1';
const storageStatus = document.querySelector('#storage-status');
let canSave = true;

function saveTasks() {
  if (!canSave) return;
  const tasks = getTasks();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageStatus.textContent = '已自动保存到当前浏览器；刷新后任务仍会保留。';
  } catch (error) {
    // 浏览器禁止保存或空间不足时，页面仍能使用，但明确提醒用户。
    storageStatus.textContent = '本次修改未能保存到浏览器，刷新可能丢失。请先保留重要任务文字。';
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return; // 第一次使用，还没有保存过任务。
    const tasks = JSON.parse(saved);
    if (!isValidTasks(tasks)) throw new Error('保存的任务格式不正确');
    tasks.forEach((task) => createTask(task.text, task.completed));
    storageStatus.textContent = `已从当前浏览器恢复 ${tasks.length} 条任务。`;
  } catch (error) {
    // 不覆盖读不懂的旧数据，避免将原内容误保存为空清单。
    canSave = false;
    storageStatus.textContent = '无法读取已保存任务，已暂停自动保存以保护原数据。当前页面仍可练习，请先保留重要内容并联系我排查。';
  }
}

// 新增和恢复都使用同一段创建任务的逻辑，避免重复写两套代码。
function createTask(text, completed = false) {
  // 3. 创建一个列表项，把输入当作纯文字显示。
  const item = document.createElement('li');
  //item.num = i +1
  item.className = 'task-item';
  // 第三课：用 label 把复选框和文字连在一起，点击文字也能勾选。
  const taskLabel = document.createElement('label');
  taskLabel.className = 'task-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = completed;
  item.classList.toggle('is-completed', completed);

  const taskText = document.createElement('span');
  taskText.className = 'task-text';
  taskText.textContent = text; // 仍然把输入当纯文字，不当 HTML 执行。

  // change 在勾选状态改变时触发。checked 是 true（勾选）或 false（未勾选）。
  checkbox.addEventListener('change', () => {
    // true 就加上这个 CSS 类名；false 就移除。外观交给 CSS 处理。
    item.classList.toggle('is-completed', checkbox.checked);
    applyFilter();
    if (item.hidden) input.focus(); // 当前任务被筛选隐藏时，保留可用的键盘焦点。
    feedback.textContent = checkbox.checked ? '已标记完成。' : '已恢复为未完成。';
    saveTasks();
  });

  taskLabel.append(checkbox, taskText);
  // 第四课：删除按钮放在 label 外面，点击删除不会误触勾选。
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button';
  deleteButton.textContent = '删除';
  deleteButton.setAttribute('aria-label', `删除任务：${text}`);

  deleteButton.addEventListener('click', () => {
    item.remove(); // 只移除这个按钮所在的任务项。
    const remaining = list.children.length;
    applyFilter();
    feedback.textContent = `已删除，目前有 ${remaining} 条任务。`;
    saveTasks();
    input.focus(); // 删除按钮随任务消失，让键盘焦点回到输入框。
  });

  item.append(taskLabel, deleteButton);
  list.append(item);
  applyFilter();

}

// 2. 监听表单提交：点击按钮和按回车，都走同一段逻辑。
form.addEventListener('submit', (event) => {
  event.preventDefault(); // 阻止表单提交导致页面刷新。
  const text = input.value.trim(); // 去掉文字两端的空格。

  if (text === '') {
    feedback.textContent = '没有内容输入哟。';
    input.focus();
    return; // 输入为空，到这里就停止，不往下添加。
  }

  createTask(text);
  saveTasks();

  // 4. 清空输入框，等待下一条任务。
  input.value = '';
  feedback.textContent = currentFilter === 'completed'
    ? '已添加未完成任务；切换到“全部”或“未完成”即可看到。'
    : `已添加，目前有 ${list.children.length} 条任务。`;
  input.focus();
});

// 页面启动时先恢复数据，再按默认的“全部”筛选显示。
loadTasks();
applyFilter();

// 第七课：保存到浏览器和导出文件，都复用同一份任务数据。
function getTasks() {
  return Array.from(list.children).map((item) => ({
    text: item.querySelector('.task-text').textContent,
    completed: item.querySelector('.task-checkbox').checked,
  }));
}

function isValidTasks(tasks) {
  return Array.isArray(tasks) && tasks.every((task) =>
    task !== null && typeof task === 'object'
    && typeof task.text === 'string' && task.text.trim() !== ''
    && task.text.length <= 100 && typeof task.completed === 'boolean');
}

const exportButton = document.querySelector('#export-button');
const importButton = document.querySelector('#import-button');
const importFile = document.querySelector('#import-file');
const confirmation = document.querySelector('#import-confirmation');
const importDescription = document.querySelector('#import-description');
const confirmImport = document.querySelector('#confirm-import');
const cancelImport = document.querySelector('#cancel-import');
let pendingImport = null;

exportButton.addEventListener('click', () => {
  // Blob 把 JSON 文字装成文件；临时链接让浏览器下载这个文件。
  const json = JSON.stringify(getTasks(), null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tasks-backup.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // 下载开始后释放临时链接。
  feedback.textContent = '已发起备份下载，请在浏览器下载记录中确认文件已保存。';
});

function closeImport() {
  pendingImport = null;
  confirmation.hidden = true;
  importFile.value = ''; // 允许下一次选择同一个文件。
}

importButton.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async () => {
  const file = importFile.files[0];
  if (!file) return;
  closeImport();
  importButton.disabled = true;
  try {
    // await 表示等文件读完，再解析；此时还没有替换任何任务。
    const tasks = JSON.parse(await file.text());
    if (!isValidTasks(tasks)) throw new Error('备份格式不正确');
    pendingImport = tasks.map((task) => ({ text: task.text, completed: task.completed }));
    importDescription.textContent = `将用备份中的 ${tasks.length} 条任务替换当前清单。当前任务不会自动合并，建议先导出备份；空备份会清空清单。`;
    confirmation.hidden = false;
    feedback.textContent = '备份格式已检查，请确认是否替换。';
    cancelImport.focus();
  } catch (error) {
    feedback.textContent = '无法导入：请选择本工具导出的有效 JSON 备份。当前任务保持不变。';
  } finally {
    importButton.disabled = false;
  }
});

cancelImport.addEventListener('click', () => {
  closeImport();
  feedback.textContent = '已取消导入，当前任务保持不变。';
  importButton.focus();
});

confirmImport.addEventListener('click', () => {
  if (pendingImport === null) return;
  const tasks = pendingImport;
  try {
    // 先确认新数据能够保存，再替换页面；保存失败就保留原清单。
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    feedback.textContent = '浏览器未能保存备份，未替换当前任务。请保留备份文件后联系我排查。';
    return;
  }
  canSave = true;
  currentFilter = 'all';
  list.replaceChildren();
  tasks.forEach((task) => createTask(task.text, task.completed));
  applyFilter();
  closeImport();
  storageStatus.textContent = '恢复结果已保存到当前浏览器。';
  feedback.textContent = `已从备份恢复 ${tasks.length} 条任务。`;
  importButton.focus();
});
