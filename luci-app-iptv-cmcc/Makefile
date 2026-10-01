#
# luci-app-iptv - bind one or more LAN ports to the operator IPTV VLANs
#
# This is free software, licensed under the Apache License, Version 2.0.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-iptv-cmcc
PKG_VERSION:=1.1.0
PKG_RELEASE:=2

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=

LUCI_TITLE:=LuCI support for operator IPTV VLAN bridge
LUCI_DESCRIPTION:=Bind one or more LAN ports to the operator IPTV service and \
	multicast VLANs, with bridge based isolation and a self-healing runtime fix.
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

define Package/luci-app-iptv/conffiles
/etc/config/iptv
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
