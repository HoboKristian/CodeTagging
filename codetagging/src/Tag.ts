import TagInfo from "./TagInfo";
import {Type} from "serializer.ts/Decorators";
const bufferedSpawn = require('buffered-spawn');

export default class Tag {
    @Type(() => TagInfo)
    tagInfo: TagInfo;
    //id: string;
    author: string = '';
    file: string;
    timestamp: number;
    start: number;
    end: number;
    constructor(tagInfo: TagInfo, file: string, start: number, end: number) {
        this.tagInfo = tagInfo;
        this.timestamp = Date.now();
        this.file = file;
        this.start = start;
        this.end = end;
        this.getUsername();
    }
    overlaps(tag: Tag) {
        return ((tag.file === this.file) && (tag.tagInfo === this.tagInfo) &&
            (tag.start <= this.end && tag.start >= this.start
            || tag.end <= this.end && tag.end >= this.start));
    }
    //this method will get the git username of whom made the tag, falls back to computer user account name
    //utilizes shell commands and npm library cmd-spawn
    getUsername(){
        bufferedSpawn('git', ['config', 'user.name'], { cwd: '.' }, (err, stdout, stderr) => {
            if (err) {
                // Both stdout and stderr are also set on the error object
                return console.error(`Command failed with error code of #${err.status}`);
            }
            //let regexp = new RegExp('/[\n\r]+/g');
            let cleanedOutput = stdout.toString().replace("\n", "");
            //console.log(cleanedOutput);
            this.author = cleanedOutput;
            
        });
    }
}