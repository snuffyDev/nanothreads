import { Semaphore } from "./semaphore";

export class Mutex extends Semaphore {
    constructor(){
        super(1)
    }
}