---
title: Python Coroutine 之回调消除
date: 2022-10-29 14:34:08
categories:
  - Python
tags:
  - Python
  - Coroutine
  - callback
  - async
  - 异步
  - 协程
---

现如今， Coroutine 编程也已非常成熟，借助 Coroutine 我们可以编写同步的代码，轻松的实现异步程序，而不必使用回调式异步编程的形式。但在真实的工程化过程中，往往事与愿违，我们不得不面对使用回调编程的老式类库，如何将他们结合到使用 Coroutine 的程序中就变得尤为重要。

本文将阐述使用 asyncio 时，Python 脚本如何消除回调，来让使用回调编程更好的与 Coroutine 程序更好的结合。再此之前先让我们回顾一下这两种的编程手法。

## 回调式异步编程

回调式异步编程（又称事件回调编程？）与 Coroutine 都是为了解决使用传统阻塞 API 的并发编程中线程切换开销大的问题。查看下面的代码，我们通过传递一个 callback，让 callback 逻辑直接在 IO 线程内处理，减少一次线程的切换。（但是在执行 IO 操作时，需要将任务提交到 IO 线程，这次线程切换不可避免。）

> 当然这只是一个比较简单的例子，真实情况往往会有多次 IO 操作，每一次操作都依赖上次 IO 结果，而产生回调地狱。本文主要将回调消除，就不在此赘述了。

```python
def do_something(callback):
    client.send_with_callback({"data": "hello"}, callback)

def main():
    do_something(lambda result: print(result))
```

## Coroutine 编程

使用 Coroutine 后，异步编程的形式几乎与同步编程无异。但是编译器会将一个异步函数切分成多个代码片段（Routine），进行调度，所有的 Routine 都在同一个 EventLoop 中执行，对于原生的 Coroutine 类库，可以完全消除线程切换。

```python
async def do_something():
    result = await client.send_async({"data": "hello"})
    return result

async def main():
    result = await do_something()
    print(result)
```

## 将回调转换为 Coroutine

当我们想要在 async 函数中，调用回调编程的 API 时，会发现很难获取他们的结果。回调编程手法只能在 callback 函数中获取结果，而 Coroutine 一般要求我们直接将结果通过返回值传递。这时候我们就需要使用回调消除，来将操作进行同步。

```python
async def do_something():
    loop = asyncio.get_running_loop()
    future = loop.create_future()

    def callback(result):
        # set_result 操作一般时线程不安全的，
        # 需要让他在 event_loop 中执行，保证和其他 coroutine 操作无竞争
        loop.call_soon_threadsafe(future.set_result, result)

    client.send_with_callback({"data": "hello"}, callback)

    result = await feature
    return result

async def main():
    result = await do_something()
    print(result)
```

## 总结

在学习 Coroutine 的过程中教程很多，但多数教程似乎都只是浅尝辄止，只介绍了 Coroutine 的简单用法，如何与现有代码像结合却介绍的少之又少。而在工程实践的过程中，如何高效复用现有代码，才是提升工作效率的重中之重。
