# luci-app-iptv（增强版）

绑定一个或多个 LAN 口到运营商 IPTV 业务 VLAN / 组播 VLAN，供机顶盒使用。
本版本在原始 `luci-app-iptv` 基础上集成了多 LAN 口支持和两处运行时修复。

## 文件
```
luci-app-iptv/
├── Makefile
└── root/
    ├── etc/config/iptv
    ├── etc/hotplug.d/iface/99-iptv-ensure
    ├── etc/init.d/iptv
    ├── usr/libexec/iptv-apply
    ├── usr/libexec/iptv-ensure
    ├── usr/share/luci/menu.d/luci-app-iptv.json
    ├── usr/share/rpcd/acl.d/luci-app-iptv.json
    └── www/luci-static/resources/view/iptv/config.js
```

## 配置（本机 / 四川移动 实测可用）
`/etc/config/iptv`
```
config iptv 'config'
	option enabled '1'
	option lan_port 'lan4'
	list extra_lan_ports 'lan3'
	option uplink 'pon0'
	option service_vlan '102'
	option multicast_vlan '3900'
```
- `lan_port`：主 IPTV 口（LuCI 页面里的下拉框）
- `extra_lan_ports`：额外 IPTV 口列表（LuCI 页面里的多选框）
- 两个选项合并、去重后即为全部 IPTV 口
应用：`/etc/init.d/iptv reload`

会生成：
- `ct-iptv-svc`（pon0 vid 业务 VLAN）、`ct-iptv-mc`（pon0 vid 组播 VLAN）
- 网桥 `br-iptv`（全部 IPTV 口 + 两个 VLAN 口）
- 接口 `luci_iptv`（proto none）
- `/etc/iptv.nft`（bridge 隔离规则，多口用 `iifname { "lan3", "lan4" }` 集合）+ firewall include

## 相对原版的三处改动
1. **多 LAN 口支持**：原版只支持单口，nft 规则也只写单口，第二个口流量会被
   最后一条 `drop-other-iptv-bridge-traffic` 丢弃。现在 `lan_port` +
   `extra_lan_ports` 合并，nft 用接口集合覆盖所有口。
2. **组播口关闭 MAC 学习**：`/etc/config/network` 里为组播 VLAN 设备设置
   `option learning '0'`。运营商在组播 VLAN 上复用网关 MAC 发 IGMP，若学习开启，
   网桥会把网关 MAC 学到组播口，导致机顶盒单播被误转发到组播口并被隔离规则丢弃
   （能拿 IP / 收组播，但认证失败）。
3. **运行时自愈 `/usr/libexec/iptv-ensure`**：netifd 冷启动/重载会漏挂端口
   （两个 VLAN 设备共用 pon0 父口），`iptv-ensure` 会按
   `network.luci_iptv_bridge.ports` 补挂端口、再次确保组播口 `learning off`
   并清理错误 FDB。由 `/etc/init.d/iptv`（开机）与
   `/etc/hotplug.d/iface/99-iptv-ensure`（接口 up）以及 `iptv-apply` 的重载流程触发。

## 安装（源码树内）
把 `luci-app-iptv/` 放入 OpenWrt 源码的 `package/luci-app-iptv/` 或 feed 的
`luci/applications/luci-app-iptv/`，然后：
```
make package/luci-app-iptv/compile
```
或直接把 `root/` 树复制到设备根目录并执行 `/etc/init.d/iptv enable`。

## 注意
- 升级/重装原版 luci-app-iptv 会覆盖这些文件，需要重新部署本增强版。
- VLAN 3300 在本环境无用；只使用业务 VLAN 102 + 组播 VLAN 3900。
