const fs = require('fs');
const path = 'app/components/Comments.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const grouped = comments.reduce((acc, c) => {',
  'const grouped = comments.reduce((acc: any, c: any) => {'
);
code = code.replace(
  '{groupComments.map(c => {',
  '{groupComments.map((c: any) => {'
);
code = code.replace(
  'return (topic ? [[topic, grouped[topic] || []]] : Object.entries(grouped)).map(([groupTopic, groupComments]) => {',
  'return (topic ? [[topic, grouped[topic] || []]] : Object.entries(grouped)).map(([groupTopic, groupComments]: [string, any]) => {'
);

fs.writeFileSync(path, code);
