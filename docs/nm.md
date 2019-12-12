# NetworkManager

Full DBus API description is provided:

https://developer.gnome.org/NetworkManager/unstable/spec.html

## The /org/freedesktop/NetworkManager object
- org.freedesktop.NetworkManager — Connection Manager
  * signals
    + CheckPermissions  ();
    + StateChanged      (u     state);
    + PropertiesChanged (a{sv} properties);
    + DeviceAdded       (o     device_path);
    + DeviceRemoved     (o     device_path);



## The /org/freedesktop/NetworkManager/DnsManager 
- org.freedesktop.NetworkManager.DnsManager — DNS Configuration State
    * signals (none)

## The /org/freedesktop/NetworkManager/Settings
- org.freedesktop.NetworkManager.Settings — Connection Settings Profile Manager
  * signals
    + PropertiesChanged (a{sv} properties);
    + NewConnection     (o     connection);
    + ConnectionRemoved (o     connection);

## The /org/freedesktop/NetworkManager/Settings/*
- org.freedesktop.NetworkManager.Settings.Connection — Connection Settings Profile
  * signals
    + Updated           ();
    + Removed           ();
    + PropertiesChanged (a{sv} properties);

## The /org/freedesktop/NetworkManager/Devices/*

### suppoted:
- org.freedesktop.NetworkManager.Device — Device
  * signals
    + StateChanged (u new_state, u old_state, u reason);
- org.freedesktop.NetworkManager.Device.Wired — Wired Ethernet Device
  * signals
    + PropertiesChanged (a{sv} properties);
- org.freedesktop.NetworkManager.Device.Wireless — Wi-Fi Device
  * signals
    + PropertiesChanged (a{sv} properties);
    + AccessPointAdded   (o     access_point);
    + AccessPointRemoved (o     access_point);    

### unsuppoted:
- org.freedesktop.NetworkManager.Device.Statistics — Device Statistic Counters
- org.freedesktop.NetworkManager.Device.Adsl — ADSL Device
- org.freedesktop.NetworkManager.Device.Bluetooth — Bluetooth Device
- org.freedesktop.NetworkManager.Device.Bond — Bonding Device
- org.freedesktop.NetworkManager.Device.Bridge — Bridging Device
- org.freedesktop.NetworkManager.Device.Dummy — Dummy Device
- org.freedesktop.NetworkManager.Device.Generic — Unrecognized Device
- org.freedesktop.NetworkManager.Device.IPTunnel — IP Tunneling Device
- org.freedesktop.NetworkManager.Device.Infiniband — Infiniband Device
- org.freedesktop.NetworkManager.Device.Lowpan — 6LoWPAN Device
- org.freedesktop.NetworkManager.Device.Macsec — MACSec Device
- org.freedesktop.NetworkManager.Device.Macvlan — MAC VLAN Device
- org.freedesktop.NetworkManager.Device.Modem — Modem Device
- org.freedesktop.NetworkManager.Device.OlpcMesh — OLPC Wireless Mesh Device
- org.freedesktop.NetworkManager.Device.OvsBridge — OvsBridge Device
- org.freedesktop.NetworkManager.Device.OvsInterface — OvsInterface Device
- org.freedesktop.NetworkManager.Device.OvsPort — OvsPort Device
- org.freedesktop.NetworkManager.Device.Ppp — PPP Device
- org.freedesktop.NetworkManager.Device.Team — Teaming Device
- org.freedesktop.NetworkManager.Device.Tun — Userspace Tunneling Device
- org.freedesktop.NetworkManager.Device.Veth — Virtual Ethernet Device
- org.freedesktop.NetworkManager.Device.Vlan — Virtual LAN Device
- org.freedesktop.NetworkManager.Device.Vxlan — VXLAN Device
- org.freedesktop.NetworkManager.Device.WifiP2P — Wi-Fi P2P Device
- org.freedesktop.NetworkManager.Device.WireGuard — WireGuard Device
- org.freedesktop.NetworkManager.Device.Wpan — IEEE 802.15.4 (WPAN) MAC Layer Device
- org.freedesktop.NetworkManager.PPP — Helper interface for a PPP plugin

## The /org/freedesktop/NetworkManager/ActiveConnection/*

supported:
- org.freedesktop.NetworkManager.Connection.Active — Active Connection
  * signals
    + StateChanged (u state, u reason);

unsupported:
- org.freedesktop.NetworkManager.VPN.Connection — Active VPN Connection

## The /org/freedesktop/NetworkManager/IP4Config/*
- org.freedesktop.NetworkManager.IP4Config — IPv4 Configuration Set
  * signals
    + PropertiesChanged (a{sv} properties);



## The /org/freedesktop/NetworkManager/DHCP4Config/* objects
- org.freedesktop.NetworkManager.DHCP4Config — IPv4 DHCP Client State
  * signals
    + PropertiesChanged (a{sv} properties);


## The /org/freedesktop/NetworkManager/AccessPoint/* objects
- org.freedesktop.NetworkManager.AccessPoint — Wi-Fi Access Point
  * signals
    + PropertiesChanged (a{sv} properties);

The /org/freedesktop/NetworkManager/IP6Config/* objects
- org.freedesktop.NetworkManager.IP6Config — IPv6 Configuration Set

The /org/freedesktop/NetworkManager/AgentManager (not used)
- org.freedesktop.NetworkManager.AgentManager — Secret Agent Manager

The /org/freedesktop/NetworkManager/DHCP6Config/* objects
- org.freedesktop.NetworkManager.DHCP6Config — IPv6 DHCP Client State

The /org.freedesktop.NetworkManager.WifiP2PPeer/* objects
- org.freedesktop.NetworkManager.WifiP2PPeer — Wi-Fi P2P Peer

The /org/freedesktop/NetworkManager/Checkpoint/* objects
- org.freedesktop.NetworkManager.Checkpoint — Configuration and State Snapshot
