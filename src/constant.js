// 存放用户所需要的常量
const { version } = require('../package.json');
// 存储模板的位置
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.templatte`;
module.exports = {
  version, downloadDirectory,
};
