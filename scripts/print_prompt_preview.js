const fs = require('fs');
const path = require('path');

// Load the chat page source to extract the prompt template exactly as it appears in the file.
const chatPagePath = path.join(__dirname, '..', 'app', 'chat', 'page.tsx');
const outPath = path.join(__dirname, 'prompt_preview.txt');

let src = fs.readFileSync(chatPagePath, 'utf8');

// Locate the 'const prompt = currentSessionContext' assignment and extract the two backtick branches
const marker = 'const prompt = currentSessionContext';
const idx = src.indexOf(marker);
if (idx === -1) {
  console.error('Could not find prompt marker in page.tsx');
  process.exit(1);
}

// From idx, find the first backtick (start of branch 1)
const firstBacktick = src.indexOf('`', idx);
if (firstBacktick === -1) {
  console.error('No backtick found after prompt marker');
  process.exit(1);
}

// Find the closing backtick for branch 1 which should be followed by a newline and spaces and a colon
// We'll search for the sequence '`\n  : `' or the pattern '`\n  : `' allowing for whitespace
let pos = firstBacktick + 1;
let branch1End = -1;
while (pos < src.length) {
  const bt = src.indexOf('`', pos);
  if (bt === -1) break;
  const following = src.slice(bt, bt + 10);
  // Check if following characters contain '\n' and ':' shortly after (heuristic)
  const look = src.slice(bt, bt + 50);
  if (/`\s*:\s*`/.test(look) || /`\s*:\s*\n/.test(look)) {
    branch1End = bt;
    break;
  }
  pos = bt + 1;
}

if (branch1End === -1) {
  // fallback: find the next backtick and treat that as end
  branch1End = src.indexOf('`', firstBacktick + 1);
  if (branch1End === -1) {
    console.error('Could not locate end of first template backtick');
    process.exit(1);
  }
}

const branch1 = src.slice(firstBacktick + 1, branch1End);

// Now find the start of branch 2: look for ':' after branch1End
const colonIdx = src.indexOf(':', branch1End);
if (colonIdx === -1) {
  console.error('Could not find ":" after first branch');
  process.exit(1);
}
const secondBacktick = src.indexOf('`', colonIdx);
if (secondBacktick === -1) {
  console.error('Could not find start of second branch backtick');
  process.exit(1);
}
const branch2End = src.indexOf('`', secondBacktick + 1);
if (branch2End === -1) {
  console.error('Could not find end of second branch backtick');
  process.exit(1);
}
const branch2 = src.slice(secondBacktick + 1, branch2End);

const branches = [branch1, branch2];

// Sample substitution values
const sample = {
  currentSessionContext: "User: I haven't been feeling well for the past 3 days.\nAI: Please tell me more about your symptoms.",
  userMessage: "I have a fever and sore throat. What should I do?",
  developerName: "Sujay",
};

function applyTemplate(tpl, vars) {
  return tpl
    .replace(/\${currentSessionContext}/g, vars.currentSessionContext)
    .replace(/\${userMessage}/g, vars.userMessage)
    .replace(/\${developerName}/g, vars.developerName);
}

const assembled = branches.map((b, idx) => {
  return `--- BRANCH ${idx + 1} ---\n\n` + applyTemplate(b, sample) + '\n\n';
}).join('\n');

fs.writeFileSync(outPath, assembled, 'utf8');
console.log('Written preview to', outPath);
console.log('\n----- Assembled Prompt Preview -----\n');
console.log(assembled);
