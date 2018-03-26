'use strict';
import * as vscode from 'vscode';
import TagInfo from './TagInfo';
import Singleton from './Singleton';

const fs = require('fs');
const path = require('path');

namespace FileUtility {
    function walkSync(dir:string):string[] {
        if (!fs.lstatSync(dir).isDirectory()) {
            if (dir.includes("node_modules")) {
                return [];
            }
            return [dir];
        }
        
        return (<string[]>fs.readdirSync(dir))
        .map(f => walkSync(path.join(dir, f)))
        .reduce((a, b) => a.concat(b), []);
    }

    export function filesThatDoNotContainTagInfo(tagInfo:TagInfo):string[]|undefined {
        let ws = vscode.workspace.workspaceFolders;
        if (ws) {
            const tagPaths = Singleton.getTags()
            .filter(tag => tag.tagInfo === tagInfo)
            .map(tag => tag.file);

            return ws
            .map(workspace => workspace.uri.fsPath)
            .map(folder => walkSync(folder)
                        .map(e => e.replace(folder, ''))
                        .filter(f => !tagPaths.includes(f)))
            .reduce((a, b) => a.concat(b), []);
        }
    }

    export function getProjectPath() {
        // this function returns a string of the current project's path on the user's computer
        if (typeof vscode.workspace.workspaceFolders !== 'undefined') { // check if the current workspace folder is defined
            return vscode.workspace.workspaceFolders[0].uri.fsPath; // return active project folder path
        } else {
            vscode.window.showErrorMessage('No workspace folder could be found!');
            return '';
        }
    }
    
    export function copyFile(source: string, target: string) {
        // this function overwrites the contents of the target file with the contents of the source file
        fs.writeFileSync(target, fs.readFileSync(source, 'utf8'));
    }
    
    export function checkSettingsFile() {
        // This function checks that the .vscode/settings.json file exists, and if not creates it
    
        // get current working directory and the path to the settings.json file
        let projDir = getProjectPath();
        let vscodeFolder = '';
        let settingsFile = '';
        if (projDir) {
            vscodeFolder = path.join(projDir, '.vscode'); // set .vscode folder path
            settingsFile = path.join(projDir, '.vscode', 'settings.json'); // set settings.json file path
        } else {
            return; // no workspace folder is open, nothing to initialize
        }
    
        if (!fs.existsSync(vscodeFolder)){
            fs.mkdirSync(vscodeFolder); // make .vscode directory if it doesn't already exist
        }
        
        if (!fs.existsSync(settingsFile)) {
            let data = '{\n    "files.exclude": {\n        "out": true\n    },\n    "search.exclude": {\n        "out": true\n    }\n}\n';
            fs.writeFileSync(settingsFile, data); // create settings.json file if it doesn't already exist
        }
    
        return;
    }
}
export default FileUtility;