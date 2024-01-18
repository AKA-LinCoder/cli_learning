// 找到要执行的核心文件
// 解析用户的参数
const program = require('commander');
const path = require('path');
const { version } = require('./constant');

const mapActions = {
  create: {
    alias: 'c',
    description: 'create a new project',
    examples: ['flutter_echo create <project-name>'],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: ['flutter_echo config set <key> <value>'],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};

Reflect.ownKeys(mapActions).forEach(
  (action) => {
    program
      .command(action)
      .alias(mapActions[action].alias)
      .description(mapActions[action].description)
      .action(() => {
        if (action === '*') {
          console.log(mapActions[action].description);
        } else {
          console.log(action);
          require(path.resolve(__dirname, action))(...process.argv.slice(3));
        }
      });
  },
);
// 监听帮助事件
program.on('--help', () => {
  console.log('\r\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(`  ${example}`);
    });
  });
});

// 解析用户传来的参数
program.version(version).parse(process.argv);
