const fs = require('fs-extra');
const execSync = require('child_process').execSync;

// Electron Builder strip off certain important keys from package.json, which we need, in particular build.appId
// so this script is used to preserve the keys that we need.

const packageInfo = require(`${__dirname}/package.json`);

let removeKeys = ['scripts', 'devDependencies', 'optionalDependencies', 'dependencies'];

for (let i = 0; i < removeKeys.length; i++) {
	delete packageInfo[removeKeys[i]];
}

const appId = packageInfo.build.appId;

delete packageInfo.build;
packageInfo.build = { appId: appId };

let branch;
let hash;
try {
	branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
	hash   = execSync('git log --pretty="%h" -1').toString().trim();
}
catch(err) {
	console.warn('Could not get git info', err);
}
if (typeof branch !== 'undefined' && typeof hash !== 'undefined') {
	packageInfo.git = { branch: branch, hash: hash };
}

let fileContent = `// Auto-generated by compile-package-info.js\n// Do not change directly\nconst packageInfo = ${JSON.stringify(packageInfo, null, 4)};`;
fileContent += '\n';
fileContent += 'module.exports = packageInfo;';

fs.writeFileSync(`${__dirname}/packageInfo.js`, fileContent);
