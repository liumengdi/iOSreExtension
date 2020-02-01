import * as vscode from 'vscode';
import { join } from 'path';
import { LKutils } from './Utils';
import { iDevices } from './UserEnv';
import { ApplicationItem } from './iDeviceApplications';

// tslint:disable-next-line: class-name
export class iDeviceItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly udid: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
        super(label, collapsibleState);
        this.tooltip = udid;
    }

    iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'ios.svg'));

    command = {
        title: this.label,
        command: 'iDeviceSelect',
        tooltip: this.udid,
        arguments: [
            this,
        ]
    };

}

// tslint:disable-next-line: class-name
export class iDeviceNodeProvider implements vscode.TreeDataProvider<iDeviceItem> {

    public deviceList: Array<string> = []; // 储存udid
    public static nodeProvider: iDeviceNodeProvider;

    public static init() {
        const np = new iDeviceNodeProvider();
        vscode.window.registerTreeDataProvider('iosreIDtabSectioniDevices', np);
        vscode.commands.registerCommand("iosreIDtabSectioniDevices.refreshEntry", () => np.refresh());
        this.nodeProvider = np;
    }

	private _onDidChangeTreeData: vscode.EventEmitter<iDeviceItem> = new vscode.EventEmitter<iDeviceItem>();
    readonly onDidChangeTreeData: vscode.Event<iDeviceItem | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: iDeviceItem): vscode.TreeItem {
        return element;
    }

    refresh() {
        iDeviceNodeProvider.nodeProvider._onDidChangeTreeData.fire();
    }

    async getChildren(element?: iDeviceItem): Promise<iDeviceItem[]> {

        let pyp = vscode.Uri.file(join(__filename,'..', '..' ,'src', 'bins', 'py3', 'lsdevs.py')).path;

        let read =await LKutils.shared.python(pyp, "");

        this.deviceList = [];
        read.split("\n").forEach(element => {
            if (element === "") {
                return;
            }
            var found = false;
            for(var i = 0; i < this.deviceList.length; i++) {
               if (this.deviceList[i] === element) {
                   found = true;
                   break;
               }
            }
            if (!found) {
                this.deviceList.push(element);
            }
        });

        console.log("[*] Reloading device lists...");
        for(var i = 0; i < this.deviceList.length; i++) {
            console.log("    -> %s", this.deviceList[i]);
        }
        let wasADevice = 0;
        let foundSelectedDevice = false;
        let privSelected = iDevices.shared.getDevice();
        let ret: Array<iDeviceItem> = [];
        this.deviceList.forEach(
            item => {
                let dev = new iDeviceItem(("ID: " + item.substring(0, 8).toUpperCase()), item, vscode.TreeItemCollapsibleState.None);
                ret.push(dev);
                wasADevice += 1;
                if (privSelected !== null && (privSelected as iDeviceItem).udid === item) {
                    foundSelectedDevice = true;
                }
            }
        );
        if (wasADevice === 0) {
            ret = [new iDeviceItem("No Device Connected", "", vscode.TreeItemCollapsibleState.None)];
            ret[0].iconPath = vscode.Uri.file(join(__filename,'..', '..' ,'res' ,'pig.svg'));
        } else if (wasADevice === 1) {
            iDevices.shared.setDevice(ret[0]);
        }
        if (!foundSelectedDevice && privSelected !== null) {
            iDevices.shared.setDevice(null);
        }
        return Promise.resolve(ret);
    }

}
