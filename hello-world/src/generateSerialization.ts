//imports to hanlde writing to the filesystem
import * as lodash from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import {
	workspace,
	window,
	Uri
} from 'vscode';

// Generate a serialized file of our tag objects
export class GenerateSerialization{

    //class properties
    serializedFile: any;
    lookupPath: any;

    //Constructor
    constructor(uri: Uri){
        this.lookupPath = lodash.get(
		uri,
		'fsPath',
		lodash.get(workspace, 'workspaceFolders[0].uri.fsPath', '.'),
        );

        //create our file object
        this.serializedFile = path.join(this.lookupPath, '.serializedfile');

    }

	
    //attempt to write to the file object
    serialize(jsonStr: string) {
        fs.stat(this.serializedFile, (err, stats) => {

            if (err) {
                if (err.code === 'ENOENT') {
                    this.writeFile(jsonStr);
                } else {
                    window.showErrorMessage(err.message);
                }
                return;
            }

            if (stats.isFile()) {
                window.showErrorMessage(
                    'An .serializedfile file already exists in this workspace.'
                );
            }
        });
    };
    
	writeFile(jsonStr: string) {

		fs.writeFile(this.serializedFile, jsonStr, err => {
			if (err) {
				window.showErrorMessage(err.message);
				return;
			}
		});
	}
}
