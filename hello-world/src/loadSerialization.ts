import * as fs from 'fs';
import {
	workspace,
	window,
	Uri
} from 'vscode';

// Generate a serialized file of our tag objects
export class LoadSerialization{

    //class properties
    filePath: string;


    //Constructor
    //takes the a string of the filepath for the serialized file
    //loads the file 
    //creates an array of objects from that
    constructor(filePath: string){
        this.filePath = filePath;


    }
    
	readFile() {

		let json = fs.readFile(this.filePath, err => {
			if (err) {
				window.showErrorMessage(err.message);
				return;
            }
            else{
                console.log('loaded fiel');
            }
        });
        
        console.log(json);
	}
}
