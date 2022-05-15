---
title: 使用 GitHub Actions 部署 Hexo 博客
date: 2022-05-14 17:41:43
categories:
  - CI/CD
tags:
  - GitHub Actions
  - Hexo
---

毕设也差不多快完工了，大学生活已经进入了尾声。大学四年，多多少少还是学习了不少编程相关的知识，但是一直没有写一些都没有把它们记录下来，还是有些可惜的。 最近也下定决心开始写博客了，记录一下自己的学习历程，也希望能给大家分享一点自己所学的有意思的知识。那么这次就直接从*使用 GitHub Actions 部署 Hexo 博客*开始吧。

## 什么是 Hexo?

[Hexo](https://github.com/hexojs/hexo) 是一个基于 Node.js 的静态博客框架，Hexo 框架可以根据博文源码（Markdown, EJS 等）自动生成静态网页界面，可以直接被托管到 GitHub Pages 上面展示。对于个人而言来说，我觉得将 Markdown 格式的博文放到 Git 仓库中进行版本管理，还是一个非常炫酷的功能，因此这次的博客框架就选择它吧。

## 创建 Hexo 项目

Hexo 的使用方式也是非常简单的，使用 npm 全局安装完 hexo-cli 工具后，通过 `hexo init`，就能一键创建博客了，然后通过使用 `hexo server` 即可进行博客的预览。创建博文的话一般使用 `hexo new 'New Post'` 即可。

如果使用 pnpm 的话，依赖安装尽量使用扁平方式，可以省去不少麻烦，毕竟有些主题的 package.json 还是不太规范。

## 使用 GitHub Actions 自动部署 GitHub Pages

GitHub Actions 是 GitHub 提供的 CI/CD 工具，对于公开项目，它是免费的，对于博客来说也没有必要使用私有仓库，因此本次选用它来实现博客的自动部署。

### 启用 Actions 写权限

公开的 GitHub 仓库，Actions 是没有写权限的，首先需要对 Actions 的权限进行配置，详见：[GitHub Actions: Control permissions for GITHUB_TOKEN](https://github.blog/changelog/2021-04-20-github-actions-control-permissions-for-github_token/)

### 编写 Actions 脚本

GitHub 与我们约定，放置在 Git 仓库 `.github/workflows` 下的 `.yml` 文件都会被识别为 Actions 脚本。对于 Hexo 博客的部署，我们只需要编写一个 `deploy.yml` 文件即可。具体如何使用，网上有非常多的教程，就不再赘述了，下面直接放出代码：

```yaml
// .github/workflows/deploy.yml
name: Deploy Hexo

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout project
        uses: actions/checkout@v3

      - name: Set up pnpm
        uses: pnpm/action-setup@v2
        with:
          version: latest

      - name: Use Node.js 16
        uses: actions/setup-node@v3
        with:
          node-version: 16
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --shamefully-hoist --frozen-lockfile

      - name: Build Hexo
        run: pnpm build

      - name: Deploy Hexo
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

## 修复 Hexo 渲染问题（Workaround）

最近（2022-05-24）几个版本的 Hexo 项目，使用 `hexo init` 创建完后，在 Windows 下，不能正常地进行界面渲染（[hexojs/hexo#4968](https://github.com/hexojs/hexo/issues/4968)），经过排查发现是新版本地 `stylus` 无法正常地编译 `.styl` 文件导致的。

最简单的解决方式就是将 `stylus` 替换成老版的，但是 `package.json` 中其实并没有手动引入 `stylus` 依赖，而是通过 `hexo-renderer-stylus` 间接引入的。在 pnpm 下，可以通过编写 [pnpm Hooks](https://www.pnpm.cn/pnpmfile) 来修改间接引入的依赖版本。代码如下：

```javascript
// .pnpmfile.cjs
function readPackage(package, context) {
  if (package.name === 'hexo-renderer-stylus') {
    package.dependencies = {
      ...package.dependencies,
      stylus: '0.54.5',
    };
    context.log(
      'stylus@^0.54.8 => stylus@0.54.5 in dependencies of hexo-renderer-stylus@v2.0.0'
    );
  }

  return package;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
```
