// eslint-disable-next-line import/no-import-module-exports
// import inquirer from 'inquirer';
// eslint-disable-next-line import/no-import-module-exports
// import ora from 'ora';

const ora = require('ora');
// eslint-disable-next-line import/no-import-module-exports
// import ora from 'ora';
// 遍历所有文件夹，找需不需要渲染
const MetalSmith = require('metalsmith');
// consolidate统一了所有的模板引擎
let { render } = require('consolidate').ejs;

render = promisify(render);

const axios = require('axios');
/// ora，inquirer高版本不支持require，想使用require就得降低ora的版本
const inquirer = require('inquirer');
/// downloadGitRepo 默认不支持Promiss，所以用util将其转化
const { promisify } = require('util');
let downloadGitRepo = require('download-git-repo');
// 可以把异步的api转换成promiss
downloadGitRepo = promisify(downloadGitRepo);
// const download = require('download-git-repo');
let ncp = require('ncp');
const path = require('path');
const { downloadDirectory } = require('./constant');

ncp = promisify(ncp);

const fs = require('fs');

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
  let api = `zhu-cli/${repo}`;
  if (tag) {
    api = `${repo}/${tag}`;
  }
  const dest = `${downloadDirectory}/${repo}`;
  await downloadGitRepo(api, dest);
  // 下载最终目录
  return dest;
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
  const result = await waitFn(downloadRepo, '下载中')(res, tag);
  console.log(result);
  // 拿到下载的目录，直接拷贝到当前执行的目录
  // 复杂的需要渲染模板，渲染后再拷贝
  // 把git上的模板下载下来。如果有ask文件就是一个复杂的模板，需要用户选择，选择后渲染
  if (!fs.existsSync(path.join(result, 'ask.ts'))) {
    await ncp(result, path.resolve(projectName));
  } else {
    console.log('复杂模板');
    // 1让用户填信息
    // 如果传入路径，会默认遍历当前路径下的src文件夹
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname).source(result).destination(path.resolve(projectName)).use(
        async (files, metal, done) => {
          const args = require(path.join(result, 'ask.js'));
          const obj = await inquirer.prompt(args);
          console.log(obj);
          const meta = metal.metadata();
          Object.assign(meta, obj);
          delete files['ask.js'];
          done();
        },
      )
        .use(
          (files, metal, done) => {
            // 根据用户的输入下载模板
            const obj = metal.metadata();
            console.log(metal.metadata());
            Reflect.ownKeys(files).forEach(async (file) => {
              // 这个是要处理的
              if (file.includes('js') || file.includes('json')) {
                let content = files[file].contents.toString();
                if (content.includes('<%')) {
                  content = await render(content, obj);
                  // 渲染
                  files[file].contents = Buffer.from(content);
                }
              }
            });
            done();
          },
        )
        .build((error) => {
          if (error) { reject(); } else { resolve(); }
        });
    });
    // 2用用户填的信息去渲染模板
  }
};
