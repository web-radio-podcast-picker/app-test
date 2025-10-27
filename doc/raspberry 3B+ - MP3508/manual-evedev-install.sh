./bin/sh

# install conf files

sudo cp -rf ./usr/99-calibration.conf-3508-0 /etc/X11/xorg.conf.d/99-calibration.conf

# install touch driver (evdev)

wget --spider -q -o /dev/null --tries=1 -T 10 http://mirrors.zju.edu.cn/raspbian/raspbian
sudo apt-get install xserver-xorg-input-evdev
##dpkg -l | grep xserver-xorg-input-evdev
# ii  xserver-xorg-input-evdev             1:2.10.6-2+b1                       arm64        X.Org X server -- evdev input driver
# 32b
# sudo dpkg -i -B ./xserver-xorg-input-evdev_1%3a2.10.6-1+b1_armhf.deb
# 64b
##sudo dpkg -i -B ./xserver-xorg-input-evdev_1%3a2.10.6-2_arm64.deb
sudo mv /usr/share/X11/xorg.conf.d/10-evdev.conf /usr/share/X11/xorg.conf.d/45-evdev.conf
sudo sync
sudo reboot
