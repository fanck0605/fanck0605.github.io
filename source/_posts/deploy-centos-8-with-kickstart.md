---
title: CentOS 无人值守安装
date: 2023-07-30 16:14:43
categories:
  - 运维
tags:
  - Linux
  - CentOS
  - Kickstart
---

最近接手了一个 Kubernetes 部署的工作，需要安装多台 CentOS 设备。安装系统虽然简单，但是耗时耗力，完全就是个体力活。考虑到之后还有装机需求，于是寻找了一下 CentOS 安装的无人值守方案，在这里记录一下。

## 原理简述

手动安装 CentOS 之后，会生成一个名为 `/root/anaconda-ks.cfg` 的 Kickstart 文件，通过此文件可以实现 CentOS 安装的无人托管。Redhat 有免费的全中文文档，且非常详细。本文就简述一下安装流程，不多做过多赘述了。

> 官方文档：https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/8/html/performing_an_advanced_rhel_8_installation/index

## 前置需求

- 一个可用的 CentOS 镜像源（内网镜像也可以）
- 一台可用的 HTTP 服务器

## 手动安装 CentOS

CentOS 安装完全图形化安装，根据自己的需求完成安装。服务器用途，软件包推荐选择 最小安装 -> 标准安装。这样可以保证环境纯净，且够用。

## Kickstart 文件

完成安装后，你将可以看到一个 `/root/anaconda-ks.cfg` 文件，根据需求对其进行简单调整。下面展示了一个 Kickstart 文件（千万不要照搬，网卡设备，磁盘设备都有差异，搬过去大概率无法启动），它的是为安装 Kubernetes 设计的，并做了一些无法在图形界面调整的配置。

- 安装完毕后自动重启
- 关闭 firewalld 和 selinux
- 安装时清空所有磁盘的所有分区（注意误删分区！！！）
- 不启用 home 和 swap 分区
- root 密码为 1

```kickstart
#version=RHEL8
# Reboot after installation
reboot
# Use graphical install
graphical

repo --name="AppStream" --baseurl=https://mirrors.tuna.tsinghua.edu.cn/centos/8-stream/AppStream/x86_64/os

%packages
@^minimal-environment
@standard

%end

# Keyboard layouts
keyboard --xlayouts='cn'
# System language
lang zh_CN.UTF-8

# Firewall configuration
firewall --disabled
# Network information
network  --bootproto=dhcp --device=ens160 --ipv6=auto --activate
network  --hostname=k8s-master

# Use network installation
url --url="https://mirrors.tuna.tsinghua.edu.cn/centos/8-stream/BaseOS/x86_64/os"

# SELinux configuration
selinux --permissive

# Run the Setup Agent on first boot
firstboot --enable

ignoredisk --only-use=nvme0n1
autopart --nohome --noswap
# Partition clearing information
clearpart --all --initlabel

# System timezone
timezone Asia/Shanghai --isUtc

# Root password
rootpw --iscrypted $6$VM67DM5siXC4Mzvp$HYAwui.f4902tvs8zRFFq21WuW5REVhuRGt2xaj1YMSC0a.yZQ5mczjtMcutFJPub6lORwfBXl9WQAh73hp9b1

%addon com_redhat_kdump --enable --reserve-mb='auto'

%end

%anaconda
pwpolicy root --minlen=6 --minquality=1 --notstrict --nochanges --notempty
pwpolicy user --minlen=6 --minquality=1 --notstrict --nochanges --emptyok
pwpolicy luks --minlen=6 --minquality=1 --notstrict --nochanges --notempty
%end
```

## Kickstart 服务器

再另一台服务器启动一个 HTTP 服务器，这里使用了 nginx

```shell
yum install nginx
systemctl enable --now nginx
```

复制 Kickstart 文件到 /usr/share/nginx/html

验证一下服务器可用

```shell
curl http://localhost/anaconda-ks.cfg
```

## 无人值守安装

安装镜像启动进入 grub 菜单后，根据提示按 Tab (BIOS) 或 e (EFI)

再启动命令中，添加 Kickstart 文件参数：

```
inst.ks=http://kickstart-server-ip/anaconda-ks.cfg
```

继续启动自动完成安装。

## cockpit 控制界面

最后再安利一波 CentOS 自带的 cockpit，非常好用的 Web 管理工具。

```shell
systemctl enable --now cockpit.socket
```
