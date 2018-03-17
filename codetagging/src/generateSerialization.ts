//imports to hanlde writing to the filesystem
import * as lodash from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import {
	workspace,
	window,
	Uri
} from 'vscode';

//import the Singleton class that already has the the class instantiated and we can just use it to get the array of tags
import Singleton from './Singleton';

//used for serializaing tag object array to json file (file created will be .serializedfile in project root)
import {serialize} from "serializer.ts/Serializer";

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
    serialize() {
        fs.stat(this.serializedFile, (err, stats) => {

            if (err) {
                if (err.code === 'ENOENT') {
                    //serialize the current array of Tag objects into a json string
                    let jsonStr = JSON.stringify(serialize(Singleton.getTags()));

                    console.log(jsonStr);
                    //write the json string to file
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
