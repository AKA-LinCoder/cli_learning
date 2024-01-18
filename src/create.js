// eslint-disable-next-line import/no-import-module-exports
// import inquirer from 'inquirer';
// eslint-disable-next-line import/no-import-module-exports
// import ora from 'ora';

const ora = require('ora');
// eslint-disable-next-line import/no-import-module-exports
// import ora from 'ora';

const axios = require('axios');
/// ora，inquirer高版本不支持require，想使用require就得降低ora的版本
const inquirer = require('inquirer');
/// downloadGitRepo 默认不支持Promiss，所以用util将其转化
const { promisify } = require('util');
let downloadGitRepo = require('download-git-repo');
// 可以把异步的api转换成promiss
downloadGitRepo = promisify(downloadGitRepo);
const download = require('download-git-repo');
const { down } = require('./constant');
// create的所有逻辑
// 拉取所有的项目列出来，让用户选安装哪个项目
// 选完后，再显示所有的版本号
// 需要用户配置一些数据，来结合渲染我的项目
// https://api.github.com/orgs/zhu-cli/repos获取组织或者用户下的仓库

// 1.获取项目列表
const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/zhu-cli/repos');
  return data;
};

// 获取版本号
const fetchTagList = async (repo) => {
  // https://api.github.com/repos/zhu-cli/vue-template/tags
  const { data } = await axios.get(`https://api.github.com/repos/zhu-cli/${repo}/tags`);
  return data;
};

// 下载
const downloadRepo = async (repo, tag) => {

};

// 封装loading
const waitFn = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn(...args);
  spinner.succeed();
  return result;
};

module.exports = async (projectName) => {
  console.log(`Hello from the create method!${projectName}`);
  // 获取项目所有模板
  let repos = await waitFn(fetchRepoList, '正在加载中...')();

  repos = repos.map((item) => item.name);
  console.log(repos);
  // 在获取之前显示loading 关闭loading
  // 选择模板 inquirer
  const { res } = await inquirer.prompt({
    name: 'res', // 获取选择后的结果
    type: 'list', // 单选
    message: '请选择一个项目模板',
    choices: repos,
  });
  console.log(res);
  // 通过当前选择的项目，拉取对应的版本
  let tags = await waitFn(fetchTagList, '正在加载版本号...')(res);
  tags = tags.map((item) => item.name);
  console.log(tags);

  const { tag } = await inquirer.prompt({
    name: 'tag', // 获取选择后的结果
    type: 'list', // 单选
    message: '请选择一个版本号',
    choices: tags,
  });
  console.log(tag);
  // 下载模板
  // 把模板放到一个临时目录里 存好，以备使用
  await download(res, tag, projectName);
};
