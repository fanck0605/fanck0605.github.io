---
title: CentOS 无人托管安装
date: 2023-07-30 16:14:43
categories:
  - 运维
tags:
  - Linux
  - CentOS
  - Kickstart
---

无人托管安装 CentOS

## Kickstart

Kickstart 文件内容如下：

```
#version=RHEL8
# Use graphical install
graphical

repo --name="AppStream" --baseurl=https://mirrors.tuna.tsinghua.edu.cn/centos/8-stream/AppStream/x86_64/os
repo --name="Docker CE Stable - x86_64" --baseurl=https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/8/x86_64/stable

%packages
@^minimal-environment
@standard
containerd.io

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

reboot

%addon com_redhat_kdump --enable --reserve-mb='auto'

%end

%anaconda
pwpolicy root --minlen=6 --minquality=1 --notstrict --nochanges --notempty
pwpolicy user --minlen=6 --minquality=1 --notstrict --nochanges --emptyok
pwpolicy luks --minlen=6 --minquality=1 --notstrict --nochanges --notempty
%end
```
