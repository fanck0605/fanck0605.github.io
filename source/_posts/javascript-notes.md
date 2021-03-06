---
title: JavaScript 学习心得
date: 2022-05-14 21:07:08
categories:
  - 前端开发
tags:
  - JavaScript
---

第一次使用 JavaScript 编写代码大概是从大二开始的，当时主要是使用了 ECharts 做了一些简单地数据可视化。如今已经大四快毕业了，学习 JavaScript，断断续续，也有三年之久了，不能说对 JavaScript 十分熟悉，但是也算是小有心得。就简单地给大家分享一下如何去学习 JavaScript。

## 初出茅庐

对于 JavaScript 的初学者，还是首先要对 JavaScript 的整个语言体系由一定的了解，但是又不能去学习过于古老的 JavaScript 特性，因此一份现代化的 JavaScript 教程显得必不可少， https://zh.javascript.info/ 就是一不错的选择。

## 小有心得

如果你对 JavaScript 的基础知识已经有了一定的了解，那么就可以开始学习一些前端开发的框架了，前端开发目前比较流行的有 React 与 Vue，但是需要注意的是 React 应该着重学习函数式组件与 Hooks，学习 Vue 更应该去了解组合式 API，这些新的 API 通过技术性的手段将业务逻辑可以复用分离，让前端项目更加工程化，也是现在前端发展的大趋势。然后这一阶段如果遇到了不懂的 JS API 应该优先选择 [MDN Web Docs](https://developer.mozilla.org/zh-CN/) 进行查阅。

## 深入了解

JavaScript 语言因为它的特性，可以被运行在不同的浏览器上，不同浏览器的 JS 解释器也各不相同，JS 的运行效率也不尽相同。就拿 V8 引擎来说，一个简单的 JS 数组，在不同的状态下，它在内存中的结构都是不一样的，根据不同的存储数据，JS 的数组会在线性存储与哈希表之间转换。如果你对 JS 解释器内部的原理掌握的更加清楚，可以潜移默化的影响你编写出程序的运行效率。

## 总结

一门语言的学习无非就要是去学习它的语法规则，语言特性以及标准库。语法规则就比较简单，如果你已经掌握过了一到两编程语言，一般可以在很短的时间内就搞定了。编程语言的学习其实更注重的是它的语言特性以及标准库，这些才是衡量你是否真正掌握这门语言的标准。当然有时时也不能过度的沉迷于语言本身，我非常认同 Onion 同学的观点：学到什么，就应该直接把它们用起来。用起来了，再继续去了解它，你才会有更深入的体会。

与此同时，编程语言与人一样也是会成长的，不断的会有人提出新的标准，不断地迭代。新特性地出现往往切实地解决了一些技术上地难点，因此作为一个软件开发工程师，也更应该去不断去学习一门语言的新特性，这可以帮助你在今后的程序设计中少走很多弯路。

如今的 JavaScript 也不是 ES6 的时代了，ES11 也已经发布多时。async 函数、对象展开运算符，在一些比较现代的项目中也早已大规模使用。
