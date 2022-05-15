---
title: Git Hooks 与 Husky
date: 2022-05-15 12:49:45
categories:
  - 前端开发
tags:
  - Git
  - Husky
---

前段时间学习 React 的时候其实已经用过 Husky 了，当时就只是知道它是一个 Git Hooks 工具，反正能跑就行吗，也没有纠结其原理。最近在创建 Ant Design Pro 项目的时候，使用了 pnpm 包管理工具，偶然发现它自带的 yorkie 却不能正常安装 Git Hooks，就想到了使用 Husky 代替了 yorkie，顺带学习了一下 Husky 的工作过程， Ant Design Pro 提交了 [Pull Request](https://github.com/ant-design/ant-design-pro/pull/9718)，并且被合并了 🎉。

## 什么是 Git Hooks?

Git Hooks 是运行在 git 指令各个阶段的 shell 脚本片段，可以用于代码风格检查，具体信息详见： [Git - Git 钩子](https://git-scm.com/book/zh/v2/自定义-Git-Git-钩子)。Git 在默认状态下会执行 `.git/hooks` 中的 Hooks，但是很显然，`.git` 中的文件是不会被加入到版本管理中，如果要需要团队协作，要求所有团队成员在提交 commit 时，统一执行一段用于语法检查或代码风格检查的代码，那显然是不合理的，毕竟不是所有的团队成员都会愿意或记得配置 Git Hooks 的。

### 使用 Husky 自动配置 Git Hooks

其实 Git 为我们提供了配置方式，通过 `git config core.hooksPath` 就可以将 hooks 文件的存放位置移动到 `.git` 文件夹之外， Husky 就是用来执行这一操作的，执行完 `husky install` 之后，我们就可以将 Git Hooks 编写在项目根目录下的 .husky 文件夹下了。然后我们可以将 `husky install` 添加到 package.json 的 prepare 生命周期中，这样我们每次执行 `pnpm install` 时，hooksPath 就能被自动配置了。

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^7.0.4"
  }
}
```
