---
title: Python Module 加载原理与 Hack 技巧
date: 2026-01-25 20:00:00
categories:
  - Python
tags:
  - Python
  - Module
  - import
  - hack
---


最近在工作中需要使用 vLLM 加载自研的大模型，但是 vLLM 并不能完全满足我们需要的所有功能，需要对 vLLM 源码进行修改。一个比较好的方案就是通过拦截 Python 的模块加载器，并且通过 `.pth` 文件来让 vLLM 子进程自动加载 hack 的补丁包。这样子也可以相关代码做成 `.whl` 包，来分发给多个项目组使用。

同时为了更加方便在运行时修改源代码，我还专门实现了一个基于 AST 的源码修改器 [awepatch](https://github.com/fanck0605/awepatch)，欢迎大家使用。

由于对 vLLM 源码的改动涉及公司机密就不详细介绍了，本文主要介绍一下 Python 模块加载的原理以及如何利用这些原理来实现模块源码的动态修改（hack）。

## Python模块加载原理

### 一、模块加载流程

当执行 `import module_name` 时，Python 会按以下步骤处理：

#### 第一步：检查缓存

首先检查 `sys.modules` 字典，如果模块已经被加载过，直接返回缓存的模块对象。这就是为什么同一个模块多次 import 不会重复执行模块代码。

```python
import sys

# 第一次导入
import json
print('json' in sys.modules)  # True

# 再次导入，直接从缓存获取
import json  # 不会重新执行 json 模块的代码
```

#### 第二步：查找模块

如果缓存中没有，Python 会使用 import hooks 和 finders 来定位模块。查找顺序如下：

**1. sys.meta_path：元路径查找器列表**

这是 Python 导入系统的核心机制，包含一系列 Finder 对象：

- `BuiltinImporter`：查找内置模块（如 sys, builtins）
- `FrozenImporter`：查找冻结模块
- `PathFinder`：在 sys.path 中查找模块

```python
import sys
for finder in sys.meta_path:
    print(finder)
# <class '_frozen_importlib.BuiltinImporter'>
# <class '_frozen_importlib.FrozenImporter'>
# <class '_frozen_importlib_external.PathFinder'>
```

**2. sys.path：模块搜索路径列表**

当 PathFinder 被调用时，会遍历 sys.path 中的路径来查找模块：

- 当前脚本所在目录
- PYTHONPATH 环境变量指定的目录
- 标准库目录
- 第三方包目录（如 site-packages）

```python
import sys
print(sys.path)
# ['', '/usr/lib/python3.x', '/usr/lib/python3.x/site-packages', ...]
```

#### 第三步：加载模块

找到模块后，使用 Loader 执行加载：

1. 创建新的模块对象
2. 将模块添加到 `sys.modules`（在执行模块代码之前！）
3. 执行模块代码
4. 返回模块对象

这个顺序很重要：模块在执行前就被添加到 `sys.modules`，这样可以避免循环导入问题。

### 二、import hooks 机制

Python 的导入系统是可扩展的，我们可以通过实现自定义的 Finder 和 Loader 来控制模块加载行为。

#### Finder 接口

Finder 负责定位模块，需要实现 `find_spec()` 方法：

```python
class MyFinder(MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        """
        fullname: 模块的完全限定名（如 'package.module'）
        path: 父包的 __path__ 属性
        target: 正在导入的模块对象（用于重新加载）
        
        返回: ModuleSpec 对象或 None
        """
        if fullname == 'my_custom_module':
            spec = PathFinder.find_spec(fullname, path, target)
            if spec is not None:
                # 重写 Loader
                spec.loader = MyLoader()
                return spec
        # 交给下一个 finder 处理
        return None
```

#### Loader 接口

Loader 负责加载模块，需要实现 `exec_module()` 方法：

```python
class MyLoader(SourceLoader):
    def __init__(self, origin):
        self.origin = origin

    def get_filename(self, fullname):
        # 返回模块文件路径
        return self.origin

    def get_data(self, path):
        # 读取模块源码
        with open(path, 'r', encoding='utf-8') as f:
            source = f.read()
        source = source.replace('original_code', 'modified_code')
        return source
```

## 利用 sys.meta_path 实现模块源码动态修改

理解了模块加载原理后，我们可以利用 `sys.meta_path` 来实现强大的 Hack 功能。核心思路是：**在模块加载时拦截并修改源码**。

### 1. 基本实现

首先我们先定义一个普通的模块 hello.py，里面有一个 hello 函数

```python
# hello.py
def hello():
    print("Hello, original world!")
```

然后定义好我们的 Hack 代码：

```python
# hack.py
import sys
from importlib.abc import SourceLoader
import types

class HackFinder:
    """拦截模块加载并修改源码"""

    def find_spec(self, fullname, path, target=None):
        """查找模块规范"""
        if fullname != "hello":
            return None

        from importlib.machinery import PathFinder

        spec = PathFinder.find_spec(fullname, path, target)
        if spec and spec.origin:
            # 替换 loader 为我们的自定义 loader
            spec.loader = HackSourceLoader(spec.origin)
        return spec

class HackSourceLoader(SourceLoader):
    """自定义 Loader，加载并修改源码"""
    
    def __init__(self, origin):
        self.origin = origin
    
    def get_filename(self, fullname):
        return self.origin

    def get_data(self, path):
        with open(path, 'rb') as f:
            source_code = f.read()
        source_code = source_code.replace(b'original', b'modified')
        return source_code

def install():
    """安装 Hack"""
    sys.meta_path.insert(0, HackFinder())
```

现在导入的 hello 模块会被修改：

```python
import hack  # 安装 Hack

hack.install()

import hello

hello.hello()  # 输出: Hello, modified world!
```

## 多进程 Hack：利用 .pth 文件

上面的方法只对单进程应用程序生效，多进程应用程序如果使用了 `spawn` 启动进程根本不会按照预期执行代码，因为子进程不会继承父进程的 `sys.meta_path` 修改。于是我就思考有没有办法让所有子进程都能执行自定义代码。

### 1. Python 解释器启动流程

让我们先看一下 Python 解释器的启动流程：

```python
1. Python 解释器初始化
2. 设置初始 sys.path（脚本目录、PYTHONPATH、标准库路径）
3. 自动导入 site 模块（除非使用 -S 参数）
   ├─ 3.1 添加 site-packages 目录到 sys.path
   ├─ 3.2 处理所有 *.pth 文件（按字母顺序）
   ├─ 3.3 导入 sitecustomize.py（如果存在）
   └─ 3.4 导入 usercustomize.py（如果存在且启用了用户 site）
4. 执行主脚本
```

可以看到 Python 解释器在启动时会自动导入 `*.pth`、`sitecustomize.py` 和 `usercustomize.py`，这为我们提供了一个绝佳的机会来注入自定义逻辑。考虑到 `sitecustomize.py` 和 `usercustomize.py` 只能有一个文件，且可能会与其他库冲突，我选择使用 `.pth` 文件来实现多进程 Hack。

### 2. .pth 文件原理

`.pth` 文件是 Python 的路径配置文件，通常用于添加搜索路径，但它还有一个鲜为人知的特性：**可以执行 Python 代码**。

#### .pth 文件的两种用法

**用法 1：添加路径**

```python
# mypackage.pth
/another/path
```

**用法 2：执行代码**

如果某行以 `import` 开头，该行会被作为 Python 代码执行：

```python
# mypackage.pth
import sys; sys.path.append('/custom/path');
```

更强大的是，我们可以导入一个模块来执行复杂的初始化逻辑：

```python
# mypackage.pth
import hack; hack.install();
```

### 3. 添加到 site-packages

```shell
echo "import hack; hack.install()" > /path/to/site-packages/my-hack.pth
```

### 5. 验证多进程 Hack

创建测试脚本验证 Hack 在多进程环境中是否生效：

```python
# test_multiprocess.py
import multiprocessing as mp

def worker(name):
    """子进程工作函数"""
    print(f"Worker {name} started, PID: {mp.current_process().pid}")
    
    # 导入 hello，应该触发 Hack
    import hello

    hello.hello()  # 应该输出修改后的内容

if __name__ == '__main__':
    # 使用 spawn 模式（完全独立的进程）
    mp.set_start_method('spawn', force=True)
    
    print(f"Main process PID: {mp.current_process().pid}")
    
    # 创建多个子进程
    processes = []
    for i in range(3):
        p = mp.Process(target=worker, args=(f"Worker-{i}",))
        p.start()
        processes.append(p)
    
    # 等待所有进程完成
    for p in processes:
        p.join()
    
    print("All workers completed")
```

运行测试：

```bash
python test_multiprocess.py
```

输出示例：

```text
Main process PID: 12345
Worker Worker-0 started, PID: 12346
Hello, modified world!
Worker Worker-1 started, PID: 12347
Hello, modified world!
Worker Worker-2 started, PID: 12348
Hello, modified world!
All workers completed
```

可以看到，每个子进程都独立加载了我们的 Hack 代码！

## 总结

本文深入探讨了 Python 模块加载机制和 Hack 技巧：

1. **模块加载原理**：理解 `sys.modules` 缓存、`sys.meta_path` 查找器和 `sys.path` 搜索路径的工作机制

2. **sys.meta_path Hack**：通过自定义 Finder 和 Loader 实现模块源码的动态修改，可以在不修改原始文件的情况下改变模块行为

3. **多进程 Hack**：利用 `.pth` 文件的自动加载特性，确保 Hack 代码在所有进程（包括 `multiprocessing.spawn` 创建的子进程）中生效

这些技巧在需要对第三方库进行临时修改、添加调试功能或实现 AOP（面向切面编程）时特别有用。但请注意，这种 Hack 方式会增加代码的复杂性，应该谨慎使用，并在生产环境中充分测试。

## 参考资料

- [PEP 302 - New Import Hooks](https://www.python.org/dev/peps/pep-0302/)
- [PEP 451 - A ModuleSpec Type for the Import System](https://www.python.org/dev/peps/pep-0451/)
- [Python Import System Documentation](https://docs.python.org/3/reference/import.html)
- [site — Site-specific configuration hook](https://docs.python.org/3/library/site.html)
