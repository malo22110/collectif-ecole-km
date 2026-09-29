const fs = require('fs');
let code = fs.readFileSync('app/components/cms/TimelineBlock.tsx', 'utf8');
code = code.replace(
  'export interface TimelineBlockProps {\n  data: {\n    items: any[];\n  };\n}',
  'export interface TimelineBlockProps {\n  data: {\n    items: any[];\n  };\n  context?: any;\n}'
);
fs.writeFileSync('app/components/cms/TimelineBlock.tsx', code);
