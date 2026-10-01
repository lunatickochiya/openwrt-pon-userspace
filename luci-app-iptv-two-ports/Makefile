# SPDX-License-Identifier: Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-iptv-two-ports
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=

LUCI_TITLE:=LuCI IPTV bridge configuration with two selectable LAN ports
LUCI_DESCRIPTION:=Bind one or two freely selectable LAN ports to the operator \
	IPTV service and multicast VLANs, with bridge based isolation and a \
	self-healing runtime fix.
LUCI_URL:=https://github.com/pbs05/openwrt-pon-userspace/tree/main/luci-app-iptv-two-ports
LUCI_DEPENDS:=+luci-base +firewall4 +kmod-nft-bridge
LUCI_PKGARCH:=all

define Package/luci-app-iptv-two-ports/conffiles
/etc/config/iptv
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage: feed scanner marker; luci.mk generates the package rules.
