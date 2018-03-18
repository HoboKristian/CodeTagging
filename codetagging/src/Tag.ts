import TagInfo from "./TagInfo";
import {Type} from "serializer.ts/Decorators";

export default class Tag {
    @Type(() => TagInfo)
    tagInfo: TagInfo;
    //id: string;
    //author: string;
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
    }
    overlaps(tag: Tag) {
        return ((tag.file === this.file) && (tag.tagInfo === this.tagInfo) &&
            (tag.start <= this.end && tag.start >= this.start
            || tag.end <= this.end && tag.end >= this.start));
    }
}