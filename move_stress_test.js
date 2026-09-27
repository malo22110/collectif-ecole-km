const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

const conclusionStart = '<div className="bg-stone-800 text-stone-100 p-8 rounded-3xl text-sm md:text-base leading-relaxed shadow-lg">';
const conclusionEndText = 'et économe en chauffage.\n              </div>\n            </div>\n          </div>';

const startIndex = code.indexOf(conclusionStart);
const endIndex = code.indexOf(conclusionEndText) + conclusionEndText.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find Conclusion");
  process.exit(1);
}

const conclusionBlock = code.substring(startIndex, endIndex);

const stressTestStart = '{/* STRESS TEST */}';
const stressTestEndText = 'problème sanitaire du radon non résolu.\n              </p>\n            </div>\n          </div>';

const stressStartIndex = code.indexOf(stressTestStart);
const stressEndIndex = code.indexOf(stressTestEndText) + stressTestEndText.length;

if (stressStartIndex === -1 || stressEndIndex === -1) {
  console.log("Could not find Stress test");
  process.exit(1);
}

const stressTestBlock = code.substring(stressStartIndex, stressEndIndex);

// They are consecutive right now. The order is Options Grid -> Conclusion -> Stress Test
// We want Options Grid -> Stress Test -> Conclusion

// So we just find where they both are, and swap them.
let newCode = code.replace(conclusionBlock + '\n\n          ' + stressTestBlock, stressTestBlock + '\n\n          ' + conclusionBlock);
if (newCode === code) {
  // Try another replacement if exact spacing didn't match
  newCode = code.replace(conclusionBlock, '%%CONCLUSION%%');
  newCode = newCode.replace(stressTestBlock, conclusionBlock);
  newCode = newCode.replace('%%CONCLUSION%%', stressTestBlock);
}

fs.writeFileSync('app/historique/page.tsx', newCode);
console.log("Success swap");
