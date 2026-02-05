/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const Mainloop = imports.mainloop;

let batteryLabel, timeout, batteryIcon, chargeStatus;
let lastPercent = 100;

function getBatteryIcon(batteryPercent){
    if (batteryPercent > 95){
        return 'battery-level-100-symbolic';
    }
    else {
        return 'battery-level-' + (((batteryPercent / 10) | 0) * 10) + '-symbolic'; // finding the next lowest multiple of 10
    }
}


function getBatteryIconCharging(batteryPercent){ // gets the name for charge level while charging
    if (batteryPercent > 95){
    return 'battery-level-100-charged-symbolic';
    }
    else {
        return 'battery-level-' + (((batteryPercent / 10) | 0 ) * 10) + '-charging-symbolic'; // finding next lowest multiple of 10
    }
}

function setBatteryIcon(batteryPercent, chargeStatus){
    if ((chargeStatus != 'Charging') && (chargeStatus != 'Charged')){  // if not plugged in, get not charging symbol
        batteryIcon.set_icon_name(getBatteryIcon(batteryPercent));
    }
    else {
        batteryIcon.set_icon_name((getBatteryIconCharging(batteryPercent))); // if plugged in
    }
}

function parseBatteryData(input){ // parses the returned output from the script. creates 2 values that we can send to other helper functions
    log(`Battery Data: ${input}`);
    const match = input.match(/^(\w+)\s(\d+)%$/);

    if (!match) {
        logError("Parse Failed");
        throw new Error ("Parse failed");
    }

    const chargeStatus = match[1];
    const batteryPercent = parseInt(match[2], 10);

    return { chargeStatus, batteryPercent};
}

function notifyIfNeeded(batteryPercent, chargeStatus){  // sends low battery notification every 5% at or below 20%, lastPercent prevents repeat notifications for the same percentage
    if ((batteryPercent <= 20) && ((batteryPercent % 5) == 0) && (batteryPercent != lastPercent) && (chargeStatus != 'Charging')){
        Main.notify('Low Battery', 'Battery ' + batteryPercent + '%')
    }
    lastPercent = batteryPercent;
}

function setBatteryPercent(batteryPercent){  
    batteryLabel.set_text(batteryPercent + "%"); // set the text on the label to the current percent
}

function setIconAndPercent(extensionPath) {
    const scriptPath = extensionPath + '/get-battery.sh'; // define where the script is
    var [ok, out, err, exit] = GLib.spawn_command_line_sync(scriptPath);  // run the script
    
    let output = new TextDecoder().decode(out).trim();  

    let lastLine = output.split("\n").pop().trim(); // select only the last line

    const { chargeStatus, batteryPercent } = parseBatteryData(lastLine); //send for parsing

    setBatteryPercent(batteryPercent);  
    setBatteryIcon(batteryPercent, chargeStatus);
    notifyIfNeeded(batteryPercent, chargeStatus);

    return true;
    
}

batteryLabel = new St.Label({ // initial icon says "checking" before the first call, not too noticeable at 2 second intervals but useful on first login if your interval is longer
    text: "Checking %",
    style_class: `system-status-icon`,
    x_align: Clutter.ActorAlign.END,
    y_align: Clutter.ActorAlign.CENTER
});


const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
_init(extension) {  // basic extension creation stuff. I don't know much about this, just followed the gnome guide
    super._init(0.0, _('Battery icon'));
    
    this._icon = new St.Icon({
        icon_name: `battery-missing-symbolic`,
        style_class: `system-status-icon`,
        y_align: Clutter.ActorAlign.CENTER,
        x_align: Clutter.ActorAlign.START
    });
    batteryIcon = this._icon; // allows us to change the icon later
    this._label = batteryLabel;
    
    let box = new St.BoxLayout({ vertical: false});
    box.add_child(this._label);
    box.add_child(this._icon);

    this.add_child(box);
}


});


export default class BatteryIndicatorExtension extends Extension {
    enable() {
        let extensionPath = this.metadata.path; // sets the extension path so that we can reference the script here later
        this._indicator = new Indicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        timeout = Mainloop.timeout_add_seconds(2.0, () => setIconAndPercent(extensionPath)); // call the checker (and subsequent setters) every 2 seconds, 
    }                                                                                        // can be changed, but lower number makes charging symbol more responsive when  plugging in

    disable() {
        Mainloop.source_remove(timeout);
        this._indicator.destroy();
        this._indicator = null;
    }
}
