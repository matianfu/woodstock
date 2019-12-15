# Wireless NM

This module is not intended to cover all functions provided by NetworkManager.

The assumption is:

1. providing an easy-to-use and familiar interface to client, defined in the following section.
2. wnm controls networkmanager exclusively, at least for wireless interfaces

On Rockbian, it is planned to use NetworkManager without persistent storage. The connections are injected into NetworkManager during the first time winasd starts. If winasd restarts, it should sync the nm connection with local copy, rather than clear and re-injection, to avoid the network interruption.

winas should have its own copy of simplified connection definition.

Only WEP, WPA/WPA2 PSK networks, with or without password, are supported.

Each access points has:

+ Mode
+ Flags
+ WpaFlags
+ RsnFlags

TODO

## User Interface (android)

Main View:

0. Scanning animation, no button
1. Connected Network if any (nm active connection)
    + list information
    + disconnect and forget
2. List of available networks, saved first
    + click to connect, providing credentials if required
3. Add Network (for hidden ssid)
    + input ssid
    + select security（no, wep, wpa/wpa2 psk, 802.1x eap, wapi psk, wapi cert）
    + provide credentials
4. Saved network (all saved networks)
    + forget

## Analysis

| resources/states  | operation       | notification      | Interface           |
|-------------------|-----------------|-------------------|---------------------|
| General state     | none            | update            | NetworkManager      |
| Scanning state    | requestScan     | scanDone          | Wireless (unstable) |
| Active Connection | none            | update            | Connection.Active   |
| Accesspoints      | none            | add/remove/update | Accesspoints        |
| Saved Networks    | LIST/CREATE/DEL | no                | Settings.Connection |

General State is emitted
Scanning State is emitted
Active Connection is emitted
Accesspoints is emitted

```json
{
    "state": "nmstate",
    "active": {

    },
    "accesspoints": [

    ],
    "connections": [

    ]
}
```

message:

- state updated
- scan done
- activeConnection updated
- accesspoint added, removed, updated














# NetworkManager

Full DBus API description is provided here (version 1.8):

https://developer.gnome.org/NetworkManager/1.8/spec.html

## Objects

| Object Path | Description |
|-------------|-------------|
|/org/freedesktop/NetworkManager| Main interface, nmstate is provided here
|/org/freedesktop/NetworkManager/AgentManager| not used
|/org/freedesktop/NetworkManager/DnsManager| DNS info
|/org/freedesktop/NetworkManager/Settings| Connection management
|/org/freedesktop/NetworkManager/Settings/*| Connections
|/org/freedesktop/NetworkManager/Devices/*| Devices, for wireless device,  `org.freedesktop.NetworkManager.Device` is available for all devices; `org.freedesktop.NetworkManager.Device.Wired` is available for wired devices, such as ethernet; `org.freedesktop.NetworkManager.Device.Wireless` is available for wireless devices; |
|/org/freedesktop/NetworkManager/ActiveConnection/*| Active Connection, only available when connected
|/org/freedesktop/NetworkManager/IP4Config/*| IPv4 configurations
|/org/freedesktop/NetworkManager/IP6Config/*| IPv6 configurations (not used)
|/org/freedesktop/NetworkManager/DHCP4Config/*| DHCP configurations, dynamic
|/org/freedesktop/NetworkManager/DHCP6Config/*| DHCP configuratoins, dynamic
|/org/freedesktop/NetworkManager/AcccessPoint/*| wireless access points


## The /org/freedesktop/NetworkManager object
- org.freedesktop.NetworkManager — Connection Manager
  * properties
    + Devices                  readable   ao
    + AllDevices               readable   ao
    + NetworkingEnabled        readable   b
    + WirelessEnabled          readwrite  b
    + WirelessHardwareEnabled  readable   b
    + WwanEnabled              readwrite  b
    + WwanHardwareEnabled      readable   b
    + WimaxEnabled             readwrite  b
    + WimaxHardwareEnabled     readable   b
    + ActiveConnections        readable   ao
    + PrimaryConnection        readable   o
    + PrimaryConnectionType    readable   s
    + Metered                  readable   u
    + ActivatingConnection     readable   o
    + Startup                  readable   b
    + Version                  readable   s
    + Capabilities             readable   au
    + `State`                    readable   u
    + `Connectivity`             readable   u
    + GlobalDnsConfiguration   readwrite  a{sv}
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
