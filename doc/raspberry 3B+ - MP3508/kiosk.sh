#!/bin/bash
xset s noblank
xset s off
xset -dpms
unclutter -idle 0.1 -root &

#set HOME=/home/franc/
#export HOME
#set USER=franc
#export USER

#su franc

export DISPLAY=:0.0
export XAUTHORITY=/home/franc/.Xauthority

sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences

/usr/bin/chromium-browser --autoplay-policy=no-user-gesture-required --noerrdialogs --disable-infobars --kiosk "https://franck-gaspoz.github.io
/web-radio-podcast-picker/?flags=kiosk-raspberry"