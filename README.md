# Argon_OneUp_Gnome_Battery-Monitor
This is a simple extension that adds a battery monitor to the top bar in Gnome. 

IMPORTANT!!! You must have expect installed for this extension to work. Install with:

sudo apt install expect

You must also have argon-config installed, though you should have this already. If not, run the script from Argon40 at:

download.argon40.com/argononeup.sh

With that installed, simply drop the argononeupbattery@argonbattery.com folder into your gnome extensions and enable the extension. You may need to log out and back in before it shows up to be enabled. 

Please keep in mind: I am a student and I'm sure there's a better way to do this. The extension currently uses expect to run the regular argon-config command and then inputs 1, captures the output, and parses it to use for the extension. I would like to go to a lower level and pull the info from wherever argon-config is pulling it to eliminate the dependency and remove the recurring script call, but I'm still learning how to do that and this works for now. 

I am running this on Gnome 49, which I installed on top of raspberry pi os lite, based on Debian Trixie. I don't know if there will be problems with other distributions, but I know that it won't work on anything that isn't Debian-based because the argon-config commmand only runs on Debian to my knowledge. 
