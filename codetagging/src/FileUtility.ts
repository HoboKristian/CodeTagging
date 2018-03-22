import * as vscode from 'vscode';
import TagInfo from './TagInfo';
import Singleton from './Singleton';

const fs = require('fs');
const path = require('path');

namespace FileUtility {
    function walkSync(dir:string):string[] {
        if (!fs.lstatSync(dir).isDirectory()) {
            return [dir];
        }
        
        return (<string[]>fs.readdirSync(dir))
        .map(f => walkSync(path.join(dir, f)))
        .reduce((a, b) => a.concat(b), []);
    }

    export function filesThatDoNotContainTagInfo(tagInfo:TagInfo):string[]|undefined {
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            let ws = vscode.workspace.workspaceFolders;
            if (ws) {
                const tagPaths = Singleton.getTags()
                .filter(tag => tag.tagInfo === tagInfo)
                .map(tag => tag.file);

                console.log(tagPaths);

                return ws
                .map(workspace => workspace.uri.fsPath)
                .map(folder => walkSync(folder)
                            .map(e => e.replace(folder, ''))
                            .filter(f => !tagPaths.includes(f)))
                .reduce((a, b) => a.concat(b), []);
            }
        }
    }
}
export default FileUtility;