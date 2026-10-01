# luci-app-iptv-two-ports（双网口 IPTV）

在 `luci-app-iptv` 基础上制作的双网口版本：可以在 LuCI 页面上任意指定两个网口
作为 IPTV 出口，其余逻辑与运行时修复参考 `luci-app-iptv-cmcc`。

## 功能

- **任意两个网口**：`lan_port`（第一个）和 `lan_port2`（第二个，可留空）。
  两个口都会加入 `br-iptv`，同时承载业务 VLAN 和组播 VLAN 流量。
- **网桥隔离**：`/etc/iptv.nft` 只允许机顶盒口 ↔ 业务 VLAN 双向、
  组播 VLAN → 机顶盒口单向（IPv4 组播）以及 IGMP 上行；
  其余流量在 `br-iptv` 内被丢弃。
- **组播口关闭 MAC 学习**：运营商在组播 VLAN 上复用网关 MAC 发 IGMP，
  若学习开启，机顶盒单播会被误转发到组播口并被隔离规则丢弃
  （能拿 IP／收组播，但认证失败）。
- **运行时自愈 `iptv-ensure`**：netifd 冷启动/重载可能漏挂共用 pon0 父口的
  VLAN 设备，`iptv-ensure` 会按 `network.luci_iptv_bridge.ports` 补挂端口、
  确保组播口 `learning off` 并清理错误 FDB。

## 配置

`/etc/config/iptv`（四川移动 CM201-2 实测示例）：

```
config iptv 'config'
	option enabled '1'
	option lan_port 'lan4'
	option lan_port2 'lan3'
	option uplink 'pon0'
	option service_vlan '102'
	option multicast_vlan '3900'
```

- `lan_port`：第一个 IPTV 网口（必选，LuCI 下拉框）
- `lan_port2`：第二个 IPTV 网口（可选，留空则只用单口）
- 两个选项不能相同；所选口会从 `br-lan` 中移出，完全交给 IPTV 使用。

应用：`/etc/init.d/iptv reload`

会生成：

- `ct-iptv-svc`（pon0 vid 业务 VLAN）、`ct-iptv-mc`（pon0 vid 组播 VLAN）、
  必要时 `ct-iptv-igmp`（pon0 vid IGMP 上行 VLAN）
- 网桥 `br-iptv`（两个 IPTV 口 + 上述 VLAN 口）
- 接口 `luci_iptv`（proto none）
- `/etc/iptv.nft`（bridge 隔离规则，nft 接口集合
  `iifname { "lan3", "lan4" }`）+ firewall include

## 文件

```
luci-app-iptv-two-ports/
├── Makefile
├── htdocs/luci-static/resources/view/iptv/config.js
├── po/zh_Hans/iptv-two-ports.po
└── root/
    ├── etc/config/iptv
    ├── etc/hotplug.d/iface/99-iptv-ensure
    ├── etc/init.d/iptv
    ├── usr/libexec/iptv-apply
    ├── usr/libexec/iptv-ensure
    ├── usr/share/luci/menu.d/luci-app-iptv-two-ports.json
    └── usr/share/rpcd/acl.d/luci-app-iptv-two-ports.json
```

## 安装（源码树内）

把 `luci-app-iptv-two-ports/` 放入 OpenWrt 源码的 `package/` 或 feed 的
`luci/applications/`，然后：

```
make package/luci-app-iptv-two-ports/compile
```

## 注意

- 本包与 `luci-app-iptv`、`luci-app-iptv-cmcc` 共用 `/etc/config/iptv`、
  `/etc/init.d/iptv`、`/usr/libexec/iptv-apply` 等运行时文件，属于互相替代的
  变体，请只安装其中一个。
- 从原版升级时 `lan_port`、`uplink`、VLAN 选项会保留，只需再选择
  `lan_port2`（原 `extra_lan_ports` 列表不再使用）。
