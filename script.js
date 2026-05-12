const propertiesInput = document.querySelector('#propertiesInput');
const yamlInput = document.querySelector('#yamlInput');
const statusEl = document.querySelector('#status');

const sampleProperties = `server.port=8080
server.servlet.context-path=/api
spring.application.name=config-tools
spring.datasource.url=jdbc:mysql://localhost:3306/app
spring.datasource.username=root
spring.datasource.password=secret
logging.level.root=info`;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function parseScalar(value) {
  const trimmed = value.trim();

  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  return trimmed;
}

function stringifyScalar(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);

  const text = String(value);
  if (text === '') return '""';
  if (/[:#\n]|^\s|\s$/.test(text)) return JSON.stringify(text);

  return text;
}

function setNestedValue(target, path, value) {
  let cursor = target;

  path.forEach((key, index) => {
    if (!key) throw new Error('Properties key 不能为空');

    if (index === path.length - 1) {
      cursor[key] = value;
      return;
    }

    if (cursor[key] === undefined) cursor[key] = {};
    if (typeof cursor[key] !== 'object' || cursor[key] === null || Array.isArray(cursor[key])) {
      throw new Error(`Properties key 冲突：${path.slice(0, index + 1).join('.')}`);
    }

    cursor = cursor[key];
  });
}

function propertiesToObject(input) {
  const root = {};
  const lines = input.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) return;

    const separatorIndex = line.search(/[:=]/);
    if (separatorIndex === -1) throw new Error(`第 ${index + 1} 行缺少 = 或 : 分隔符`);

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    setNestedValue(root, key.split('.'), parseScalar(value));
  });

  return root;
}

function objectToYaml(value, depth = 0) {
  const indent = '  '.repeat(depth);

  return Object.entries(value).map(([key, item]) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const children = objectToYaml(item, depth + 1);
      return `${indent}${key}:\n${children}`;
    }

    return `${indent}${key}: ${stringifyScalar(item)}`;
  }).join('\n');
}

function parseYaml(input) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = input.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line.trim() || line.trimStart().startsWith('#')) return;

    const indent = line.match(/^ */)[0].length;
    if (indent % 2 !== 0) throw new Error(`第 ${index + 1} 行缩进必须使用 2 个空格`);

    const trimmed = line.trim();
    const match = trimmed.match(/^([^:]+):(.*)$/);
    if (!match) throw new Error(`第 ${index + 1} 行不是有效 YAML key: value`);

    const key = match[1].trim();
    const rawValue = match[2].trim();
    if (!key) throw new Error(`第 ${index + 1} 行 key 不能为空`);

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();

    const parent = stack[stack.length - 1].value;
    if (rawValue === '') {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
      return;
    }

    parent[key] = parseScalar(rawValue.replace(/^['"]|['"]$/g, ''));
  });

  return root;
}

function flattenObject(value, prefix = '') {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return flattenObject(item, path);
    }

    return `${path}=${item === null ? 'null' : item}`;
  });
}

function convertPropertiesToYaml() {
  try {
    yamlInput.value = objectToYaml(propertiesToObject(propertiesInput.value));
    setStatus('已转换为 YAML');
  } catch (error) {
    setStatus(error.message, true);
  }
}

function convertYamlToProperties() {
  try {
    propertiesInput.value = flattenObject(parseYaml(yamlInput.value)).join('\n');
    setStatus('已转换为 Properties');
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function copyText(text, label) {
  if (!text.trim()) {
    setStatus(`${label} 内容为空`, true);
    return;
  }

  await navigator.clipboard.writeText(text);
  setStatus(`已复制 ${label}`);
}

function clearField(field, label) {
  field.value = '';
  setStatus(`已清空 ${label}`);
}

document.querySelector('#toYaml').addEventListener('click', convertPropertiesToYaml);
document.querySelector('#toProperties').addEventListener('click', convertYamlToProperties);
document.querySelector('#loadSample').addEventListener('click', () => {
  propertiesInput.value = sampleProperties;
  convertPropertiesToYaml();
});
document.querySelector('#swapContent').addEventListener('click', () => {
  [propertiesInput.value, yamlInput.value] = [yamlInput.value, propertiesInput.value];
  setStatus('已交换左右内容');
});
document.querySelector('#copyProperties').addEventListener('click', () => copyText(propertiesInput.value, 'Properties'));
document.querySelector('#copyYaml').addEventListener('click', () => copyText(yamlInput.value, 'YAML'));
document.querySelector('#clearProperties').addEventListener('click', () => clearField(propertiesInput, 'Properties'));
document.querySelector('#clearYaml').addEventListener('click', () => clearField(yamlInput, 'YAML'));

propertiesInput.value = sampleProperties;
convertPropertiesToYaml();
